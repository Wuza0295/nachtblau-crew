/* Spiel-Engine: Renderer, Spielersteuerung, Waffen, HUD, Effekte */
window.BH = window.BH || {};

BH.Game = class {
  constructor(opts) {
    this.modeId = opts.modeId;
    this.onEnd = opts.onEnd;
    this.active = false;
    this.ending = false;
    this.paused = false;

    // ---------- Renderer / Szene ----------
    this.canvas = document.getElementById("game-canvas");
    // Renderer wird zwischen Matches wiederverwendet (ein WebGL-Kontext pro Canvas)
    if (!BH.Game._renderer) {
      BH.Game._renderer = new THREE.WebGLRenderer({
        canvas: this.canvas, antialias: true, powerPreference: "high-performance",
      });
      if (BH.Graphics) BH.Graphics.setupRenderer(BH.Game._renderer);
      else BH.Game._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    this.renderer = BH.Game._renderer;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.08, 600);
    const settings = BH.Settings ? BH.Settings.get() : { fov: 75, sensitivity: 1, crosshairScale: 1 };
    this.baseFov = settings.fov;
    this.camera.fov = settings.fov;
    this.mapId = null;
    this.killstreakMgr = new BH.KillstreakMgr(this);
    this.factionBonus = BH.FactionBonus
      ? BH.FactionBonus.get(BH.Progress.data.operator, null) : null;
    this.opSkillBonus = BH.OperatorSkills
      ? BH.OperatorSkills.bonuses(BH.Progress.data, BH.Progress.data.operator)
      : null;
    this._matchOperatorId = BH.Progress.data.operator;

    // Spieler-Rig: yaw (Position+Drehung) -> pitch -> Kamera
    this.yaw = new THREE.Object3D();
    this.pitchObj = new THREE.Object3D();
    this.pitchObj.position.y = 1.6;
    this.pitchObj.add(this.camera);
    this.yaw.add(this.pitchObj);
    this.scene.add(this.yaw);

    this.enemiesGroup = new THREE.Group();
    this.scene.add(this.enemiesGroup);

    // ---------- Spielerzustand ----------
    this.player = {
      health: 100, maxHealth: 100, alive: true,
      velY: 0, onGround: true,
      lastDamageTime: -99,
      kills: 0, deaths: 0, headshots: 0, score: 0, points: 0,
      weaponKills: {},
      bestStreak: 0,
      sprinting: false,
      isInfected: false,
    };
    // Operator-Codename als Spielername (Killfeed & Punktetafel)
    const op = BH.OperatorCatalog
      ? BH.OperatorCatalog.find(BH.Progress.data.operator, BH.Progress.data)
      : (BH.OPERATORS || []).find(o => o.id === BH.Progress.data.operator);
    this.playerName = BH.Cosmetics
      ? BH.Cosmetics.displayName(BH.Progress.data)
      : (op ? op.name : "DU");

    const self = this;
    this.playerEntity = {
      isPlayer: true, team: "A", name: this.playerName,
      faction: BH.FactionWar ? BH.FactionWar.matchFaction(this.playerName, true) : null,
      get alive() { return self.player.alive; },
      get position() { return self.yaw.position; },
      get isInfected() { return !!self.player.isInfected; },
      takeDamage(d, isHead, attacker) { self.damagePlayer(d, attacker ? attacker.position : null, attacker); },
    };

    // ---------- Waffen ----------
    const lo = opts.loadout;
    this.weapons = [
      BH.buildWeapon(lo.weaponId, lo.attachments, lo.camo),
      BH.buildWeapon(
        lo.secondaryWeaponId || "pistol",
        lo.secondaryAttachments || {},
        lo.camo
      ),
    ];
    this.loadout = lo;
    this.equipment = null;
    if (BH.Equipment && BH.Equipment.isAllowed(this.modeId)) {
      BH.Equipment.initGame(this);
    }
    this.weaponIndex = 0;
    if (this.opSkillBonus) {
      if (this.opSkillBonus.maxHp > 0) {
        this.player.maxHealth += this.opSkillBonus.maxHp;
        this.player.health = this.player.maxHealth;
      }
      for (const w of this.weapons) {
        if (this.opSkillBonus.reloadMult !== 1) {
          w.def.reloadTime = Math.max(0.5, w.def.reloadTime * this.opSkillBonus.reloadMult);
        }
        if (this.opSkillBonus.adsTimeMult !== 1) {
          w.def.adsTime = Math.max(0.06, w.def.adsTime * this.opSkillBonus.adsTimeMult);
        }
      }
    }
    this.adsAmount = 0;
    this.adsHeld = false;
    this.firing = false;
    this.fireQueued = false;
    this.viewKick = 0;
    this.aimPitch = 0;
    this.recoilPitch = 0;

    // ---------- Sammlungen ----------
    this.entities = [];     // Zombies + Bots (Update-Liste)
    this.combatants = [this.playerEntity]; // Ziele für Bots
    this.tracers = [];
    this.effects = [];
    this.weatherFx = null;
    this.interactables = [];
    this.obstacles = [];
    this.bounds = null;
    this.mapSolids = null;
    this._minimapReady = false;
    this._minimapObstacles = null;
    this._minimapObstacleSrc = null;
    this.shotPings = [];
    this._briefingCb = null;

    this.keys = {};
    this.time = 0;
    this.msgTimeout = null;

    // Punktetafel-Registry (bleibt über Respawns/Runden hinweg erhalten)
    this.scoreboard = new Map();
    this.sbEntry(this.playerName, "A", true);

    this._bindInput();
    this._applyCrosshair();

    // ---------- Modus ----------
    this.mode = new BH.Modes[this.modeId](this);
    this.mode.setup();
    if (this.mode.mapId) {
      this.mapId = this.mode.mapId;
      this.factionBonus = BH.FactionBonus.get(BH.Progress.data.operator, this.mapId);
    }
    this._buildViewmodel();
    this._applyWeaponHud();
    this._initWorldFx();
    if (BH.Graphics) {
      BH.Graphics.applyRenderer(this.renderer);
      BH.Graphics.applyScene(this.scene);
      BH.Graphics.applySceneLighting(this.scene);
      BH.Graphics.applySceneMeshes(this.scene);
    }

    this.clock = new THREE.Clock();
    this.active = true;
    if (BH.TouchControls) BH.TouchControls.init(this);
    if (BH.Ambient) BH.Ambient.start(this.modeId, this.mapId);
    if (BH.OperatorVoices) BH.OperatorVoices.onSpawn(this);
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  /* ================== INPUT ================== */
  _bindInput() {
    this._onKeyDown = (e) => {
      if (!this.active) return;
      this.keys[e.code] = true;
      if (e.code === "KeyR") this.startReload();
      if (e.code === "Digit1") this.switchWeapon(0);
      if (e.code === "Digit2") this.switchWeapon(1);
      if (e.code === "KeyQ") this.switchWeapon(this.weaponIndex === 0 ? 1 : 0);
      if (e.code === "KeyG") this.useEquipment();
      if (e.code === "KeyE") this.tryInteract();
      if (e.code === "Tab") { e.preventDefault(); this.showScoreboard(true); }
    };
    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
      if (e.code === "Tab") this.showScoreboard(false);
    };
    this._onMouseMove = (e) => {
      if (!this.isLocked() || this.paused) return;
      const sens = 0.0021 * (BH.Settings ? BH.Settings.get().sensitivity : 1);
      this.yaw.rotation.y -= e.movementX * sens;
      this.aimPitch -= e.movementY * sens;
      this.aimPitch = Math.max(-1.45, Math.min(1.45, this.aimPitch));
      this._syncAimPitch();
    };
    this._onMouseDown = (e) => {
      if (!this.active || this.paused) return;
      if (BH.audio) BH.audio.unlock();
      if (!this.isLocked()) { this.lock(); return; }
      if (e.button === 0) { this.firing = true; this.fireQueued = true; }
      if (e.button === 2) this.adsHeld = true;
    };
    this._onMouseUp = (e) => {
      if (e.button === 0) this.firing = false;
      if (e.button === 2) this.adsHeld = false;
    };
    this._onContext = (e) => e.preventDefault();
    this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    this._onLockChange = () => {
      if (!this.isLocked() && this.active && !this.ending) this.setPaused(true);
    };

    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mousedown", this._onMouseDown);
    document.addEventListener("mouseup", this._onMouseUp);
    document.addEventListener("contextmenu", this._onContext);
    window.addEventListener("resize", this._onResize);
    document.addEventListener("pointerlockchange", this._onLockChange);
  }

  _unbindInput() {
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("mousedown", this._onMouseDown);
    document.removeEventListener("mouseup", this._onMouseUp);
    document.removeEventListener("contextmenu", this._onContext);
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("pointerlockchange", this._onLockChange);
  }

  isLocked() { return document.pointerLockElement === this.canvas; }
  lock() { this.canvas.requestPointerLock(); }

  setPaused(p) {
    this.paused = p;
    document.getElementById("screen-pause").classList.toggle("hidden", !p);
    if (!p) this.lock();
  }

  /* ================== VIEWMODEL (Waffe in der Hand) ================== */
  _buildViewmodel() {
    if (this.viewmodel) this.camera.remove(this.viewmodel);
    const w = this.currentWeapon();
    const g = new THREE.Group();
    let matColor = w.camo.color;
    let emissive = 0x000000;
    let emissiveIntensity = 0;
    let roughness = 0.46;
    let metalness = 0.42;
    const neonCamo = BH.CamoStyle && BH.CamoStyle.isNeon(w.camo);
    if (neonCamo) {
      const cm = BH.CamoStyle.materialOpts(w.camo);
      matColor = cm.color;
      emissive = cm.emissive;
      emissiveIntensity = cm.emissiveIntensity;
      roughness = cm.roughness;
      metalness = cm.metalness;
      if (w.def.glow) {
        emissiveIntensity = Math.min(1, emissiveIntensity + 0.2);
      }
    } else if (w.def.glow) {
      emissive = w.def.glow;
      emissiveIntensity = 0.55;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: matColor, roughness, metalness, emissive, emissiveIntensity,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 0.52, metalness: 0.38 });

    const id = w.def.id;
    const len = id === "sniper" ? 0.78 : id === "shotgun" ? 0.6 : id === "pistol" ? 0.26 : id === "smg" ? 0.42 : 0.56;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, len), mat);
    body.position.z = -len / 2;
    g.add(body);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.2), dark);
    barrel.position.z = -len - 0.08;
    g.add(barrel);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.05), dark);
    grip.position.set(0, -0.09, -0.08);
    g.add(grip);
    const magBox = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.06), dark);
    magBox.position.set(0, -0.1, -len * 0.55);
    g.add(magBox);
    if (id !== "pistol") {
      const sight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.07), dark);
      sight.position.set(0, 0.06, -0.18);
      g.add(sight);
    }

    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffdd99, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    flash.position.z = -len - 0.14;
    flash.scale.setScalar(0.55);
    g.add(flash);
    this.vmFlash = flash;
    this.vmFlashT = 0;

    this.vmHip = new THREE.Vector3(0.22, -0.2, -0.42);
    this.vmAds = new THREE.Vector3(0, -0.115, -0.34);
    g.position.copy(this.vmHip);
    this.viewmodel = g;
    this.camera.add(g);
  }

  /* ================== WAFFEN ================== */
  currentWeapon() { return this.weapons[this.weaponIndex]; }

  switchWeapon(idx) {
    if (idx === this.weaponIndex || idx >= this.weapons.length) return;
    const w = this.currentWeapon();
    w.reloading = false;
    this.weaponIndex = idx;
    this._buildViewmodel();
    this._applyWeaponHud();
    BH.audio.click();
  }

  useEquipment() {
    if (BH.Equipment) BH.Equipment.throw(this);
  }

  /** Ersetzt die Primärwaffe (Mystery-Box) */
  replacePrimary(weapon) {
    this.weapons[0] = weapon;
    if (this.weaponIndex === 0) { this._buildViewmodel(); this._applyWeaponHud(); }
  }

  startReload() {
    const w = this.currentWeapon();
    if (w.reloading || w.magAmmo >= w.def.mag || !this.player.alive) return;
    if (!w.def.infiniteAmmo && w.reserveAmmo <= 0) return;
    w.reloading = true;
    w.reloadEnd = this.time + w.def.reloadTime;
    BH.audio.reload();
  }

  _finishReload(w) {
    w.reloading = false;
    if (w.def.infiniteAmmo) {
      w.magAmmo = w.def.mag;
      return;
    }
    const need = w.def.mag - w.magAmmo;
    const take = Math.min(need, w.reserveAmmo);
    w.magAmmo += take;
    w.reserveAmmo -= take;
  }

  refillAmmo() {
    for (const w of this.weapons) {
      w.reserveAmmo = w.def.reserve;
      w.magAmmo = w.def.mag;
      w.reloading = false;
    }
  }

  _syncAimPitch() {
    this.pitchObj.rotation.x = Math.max(-1.45, Math.min(1.45, this.aimPitch + this.recoilPitch));
  }

  tryFire() {
    const w = this.currentWeapon();
    if (!this.player.alive || this.paused || w.reloading) return;
    if (BH.audio) BH.audio.unlock();
    const rpmMult = (this.mode && this.mode.perkTap) ? 1.35 : 1;
    const interval = 60 / (w.def.rpm * rpmMult);
    if (this.time - w.lastShot < interval) return;

    if (w.magAmmo <= 0) {
      if (this.fireQueued) { BH.audio.empty(); this.startReload(); }
      this.fireQueued = false;
      return;
    }
    if (!w.def.auto && !this.fireQueued) return;
    this.fireQueued = false;

    w.magAmmo--;
    w.lastShot = this.time;
    BH.audio.shot(w.def.sound);

    const pellets = w.def.pellets || 1;
    let spreadMult = 1;
    if (this.factionBonus && this.factionBonus.accuracy) spreadMult /= this.factionBonus.accuracy;
    if (this.opSkillBonus && this.opSkillBonus.spreadMult !== 1) {
      spreadMult *= this.opSkillBonus.spreadMult;
    }
    const spread = THREE.MathUtils.lerp(w.def.spread, w.def.adsSpread, this.adsAmount)
      * (this.player.sprinting ? 1.8 : 1) * spreadMult;

    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const baseDir = new THREE.Vector3();
    this.camera.getWorldDirection(baseDir);

    for (let p = 0; p < pellets; p++) {
      const dir = baseDir.clone();
      dir.x += (Math.random() - 0.5) * 2 * spread;
      dir.y += (Math.random() - 0.5) * 2 * spread;
      dir.z += (Math.random() - 0.5) * 2 * spread;
      dir.normalize();
      this._fireRay(origin, dir, w);
    }

    // Rückstoß — kickt nach oben, erholt sich automatisch; ADS reduziert Kick
    const recoil = w.def.recoil;
    const adsRecoilMult = THREE.MathUtils.lerp(1, 0.55, this.adsAmount);
    const kick = recoil * adsRecoilMult * (0.8 + Math.random() * 0.4);
    this.recoilPitch = Math.min(0.32, this.recoilPitch + kick);
    this.yaw.rotation.y += (Math.random() - 0.5) * recoil * 0.45 * adsRecoilMult;
    this.viewKick = Math.min(0.12, this.viewKick + 0.05);
    this._syncAimPitch();
    this._flashViewmodel(0.065);
  }

  _flashViewmodel(duration) {
    this.vmFlashT = duration;
    if (this.vmFlash && this.vmFlash.material) this.vmFlash.material.opacity = 0.92;
  }

  _updateViewmodelFlash(dt) {
    if (!this.vmFlash || this.vmFlashT <= 0) return;
    this.vmFlashT -= dt;
    const t = Math.max(0, this.vmFlashT);
    this.vmFlash.material.opacity = Math.min(0.95, t * 14);
    this.vmFlash.scale.setScalar(0.55 + (0.065 - t) * 6);
  }

  _fireRay(origin, dir, w) {
    const ray = new THREE.Raycaster(origin, dir, 0, 300);
    const hits = ray.intersectObjects([this.mapSolids, this.enemiesGroup], true);

    let endPoint = origin.clone().add(dir.clone().multiplyScalar(300));
    let wallNormal = null;
    const victims = [];

    for (const h of hits) {
      let obj = h.object, ent = null;
      while (obj) {
        if (obj.userData && obj.userData.entity) { ent = obj.userData.entity; break; }
        obj = obj.parent;
      }
      if (ent) {
        if (!ent.alive) continue;
        if (victims.some(v => v.ent === ent)) continue;
        victims.push({ ent, isHead: h.object.name === "head", point: h.point });
        endPoint = h.point;
        if (!w.def.pierce) break; // Railgun durchschlägt Gegner
      } else {
        endPoint = h.point;
        if (h.face && h.face.normal) {
          wallNormal = h.face.normal.clone();
          if (h.object.matrixWorld) wallNormal.transformDirection(h.object.matrixWorld).normalize();
        }
        break;
      }
    }

    // Tracer + Einschlag
    const muzzle = new THREE.Vector3(0.18, -0.12, -0.6).applyMatrix4(this.camera.matrixWorld);
    this.spawnTracer(muzzle, endPoint, w.def.tracerColor || 0xffe0a0);
    if (victims.length === 0) {
      this.spawnImpact(endPoint, 0xccc5b5);
      if (wallNormal) this.spawnBulletDecal(endPoint, wallNormal);
    }

    for (const v of victims) {
      this.spawnImpact(v.point, 0xaa2222);
      let dmg = w.def.damage;
      if (this.factionBonus && this.factionBonus.damage) dmg *= this.factionBonus.damage;
      const dist = origin.distanceTo(v.point);
      if (dist > w.def.range) dmg *= (w.def.pellets ? 0.25 : 0.6);
      if (v.isHead) dmg *= w.def.headMult;
      this._damageEntity(v.ent, dmg, v.isHead);
      if (w.def.chain) this._chainLightning(v.point, w.def.chain, v.ent);
      if (w.def.slow && v.ent.applySlow) v.ent.applySlow(w.def.slow.factor, w.def.slow.duration);
    }

    if (w.def.splash) this._explode(endPoint, w.def.splash, victims.length ? victims[0].ent : null);
    this.addShotPing(endPoint.x, endPoint.z, "A");
  }

  /** Schuss-Markierung auf der Minimap (nur bei Feuer sichtbar) */
  addShotPing(x, z, team) {
    if (!BH.ShotPing || !BH.ShotPing.enabledFor(this.modeId)) return;
    this.shotPings.push({ x, z, team: team || "B", until: this.time + BH.ShotPing.TTL });
  }

  /** Schaden inkl. Punkte-, Kill- und Hitmarker-Buchhaltung */
  _damageEntity(entity, dmg, isHead) {
    if (entity.isZombie && this.mode.onZombieHit) this.mode.onZombieHit(dmg);
    const killed = entity.takeDamage(dmg, isHead, this.playerEntity);
    this.showHitmarker(isHead);
    if (isHead) BH.audio.headshot(); else BH.audio.hit();
    if (killed) {
      this.player.kills++;
      if (isHead) this.player.headshots++;
      const wType = this.currentWeapon().def.type;
      this.player.weaponKills[wType] = (this.player.weaponKills[wType] || 0) + 1;
      if (this.killstreakMgr) this.killstreakMgr.onKill();
      if (this.killstreakMgr && this.killstreakMgr.streak > this.player.bestStreak) {
        this.player.bestStreak = this.killstreakMgr.streak;
      }
      if (BH.Mastery) {
        const mas = BH.Mastery.addKill(this.currentWeapon().def.id, isHead);
        if (mas && mas.leveled) {
          const title = BH.Mastery.titleForLevel
            ? BH.Mastery.titleForLevel(mas.level)
            : ("Stufe " + mas.level);
          if (mas.unlocks && mas.unlocks.length) {
            this.showMessage(
              "MEISTERSCHAFT M" + mas.level + " · " + title,
              "Neuer Aufsatz: " + mas.unlocks.map(u => u.name).join(", "),
              4200
            );
          } else {
            this.showMessage("MEISTERSCHAFT M" + mas.level, title, 2800);
          }
        }
      }
      if (BH.OperatorVoices && entity.isBot !== false && !entity.isZombie && !entity.isTarget && !entity.isBoss) {
        BH.OperatorVoices.onKill(this, isHead);
        BH.OperatorVoices.onStreak(this, this.player.kills);
      }
      if (entity.isTarget && this.mode.onTargetHit) this.mode.onTargetHit();
      if (entity.isZombie) {
        // Zombie-Kills direkt verbuchen (Bots laufen über SoldierBot.die)
        this.sbKill(this.playerEntity);
        if (this.mode.onZombieKilled) this.mode.onZombieKilled(entity, isHead);
        if (BH.OperatorVoices && Math.random() < 0.28) {
          BH.OperatorVoices.onKill(this, isHead);
        }
      }
    }
    return killed;
  }

  /** Kettenblitz (Blitz-Stab) */
  _chainLightning(point, chain, skipEnt) {
    const nearby = [];
    for (const e of this.entities) {
      if (!e.alive || e === skipEnt || e.isPlayer) continue;
      const pos = e.group ? e.group.position : e.position;
      if (!pos) continue;
      if (pos.distanceTo(point) < chain.radius) nearby.push({ e, d: pos.distanceTo(point) });
    }
    nearby.sort((a, b) => a.d - b.d);
    for (let i = 0; i < Math.min(chain.targets, nearby.length); i++) {
      const dmg = this.currentWeapon().def.damage * chain.damage;
      this._damageEntity(nearby[i].e, dmg, false);
    }
  }

  /** Flächenschaden (Drachenfaust) */
  _explode(point, splash, directHitEnt) {
    BH.audio.explosion();
    this.spawnExplosion(point);
    for (const e of [...this.entities]) {
      if (!e.alive || e === directHitEnt) continue;
      const d = e.group.position.distanceTo(point);
      if (d < splash.radius) {
        const dmg = splash.damage * (1 - 0.6 * (d / splash.radius));
        this._damageEntity(e, dmg, false);
      }
    }
    // Vorsicht bei Eigenbeschuss!
    const pd = this.yaw.position.distanceTo(point);
    if (pd < splash.radius) {
      this.damagePlayer(splash.damage * 0.5 * (1 - pd / splash.radius), point);
    }
  }

  /* ================== SCHADEN AM SPIELER ================== */
  damagePlayer(amount, fromPos, attacker) {
    if (!this.player.alive || this.ending) return;
    this.player.health -= amount;
    this.player.lastDamageTime = this.time;
    if (this.mode.damagePlayerHook) this.mode.damagePlayerHook();
    if (attacker) this.player.lastAttacker = attacker;
    BH.audio.damage();
    if (this.player.health <= 0) {
      this.player.health = 0;
      this.player.alive = false;
      this.player.deaths++;
      this.sbDeath(this.playerEntity);
      if (this.killstreakMgr) this.killstreakMgr.onDeath();
      if (BH.OperatorVoices) BH.OperatorVoices.onDeath(this);
      if (attacker && !attacker.isZombie) this.sbKill(attacker);
      BH.audio.death();
      this.mode.onPlayerDeath();
    }
  }

  respawnPlayer(pos) {
    this.yaw.position.copy(pos);
    this.player.health = this.player.maxHealth;
    if (BH.OperatorVoices) BH.OperatorVoices._hurtBarked = false;
    this.player.alive = true;
    this.player.velY = 0;
    for (const w of this.weapons) { w.reloading = false; }
  }

  _initWorldFx() {
    if (this.scene.userData.weather === "rain") this._initRainFx();
    else if (this.mapId === "arctic") this._initSnowFx();
    this._initPlayerShadow();
  }

  _initPlayerShadow() {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false,
    });
    this.playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.52, 16), mat);
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.y = 0.02;
    this.playerShadow.renderOrder = -2;
    this.scene.add(this.playerShadow);
  }

  _initSnowFx() {
    const q = (BH.Settings && BH.Settings.get().quality) || "medium";
    const low = q === "low";
    const count = low ? 700 : 1600;
    const half = 68;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const pPos = this.yaw.position;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = pPos.x + (Math.random() - 0.5) * half * 2;
      pos[i * 3 + 1] = Math.random() * 28;
      pos[i * 3 + 2] = pPos.z + (Math.random() - 0.5) * half * 2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: low ? 0.14 : 0.2, transparent: true, opacity: 0.78,
      depthWrite: false, sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 5;
    this.scene.add(points);
    this.weatherFx = { kind: "snow", points, count, half };
  }

  _updateSnowFx(dt) {
    const fx = this.weatherFx;
    if (!fx || fx.kind !== "snow") return;
    const arr = fx.points.geometry.attributes.position.array;
    const pPos = this.yaw.position;
    for (let i = 0; i < fx.count; i++) {
      const idx = i * 3;
      arr[idx + 1] -= dt * (3.5 + (i % 5) * 0.8);
      arr[idx] += Math.sin(this.time * 0.6 + i * 0.17) * dt * 0.35;
      if (arr[idx + 1] < 0) {
        arr[idx] = pPos.x + (Math.random() - 0.5) * fx.half * 2;
        arr[idx + 1] = 18 + Math.random() * 12;
        arr[idx + 2] = pPos.z + (Math.random() - 0.5) * fx.half * 2;
      }
    }
    fx.points.geometry.attributes.position.needsUpdate = true;
  }

  _initRainFx() {
    const q = (BH.Settings && BH.Settings.get().quality) || "medium";
    const low = q === "low";
    const count = low ? 900 : 2000;
    const half = 72;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const pPos = this.yaw.position;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = pPos.x + (Math.random() - 0.5) * half * 2;
      pos[i * 3 + 1] = Math.random() * 36;
      pos[i * 3 + 2] = pPos.z + (Math.random() - 0.5) * half * 2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xb8d4ee, size: low ? 0.1 : 0.14, transparent: true, opacity: 0.62,
      depthWrite: false, sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 5;
    this.scene.add(points);
    this.weatherFx = { kind: "rain", points, count, half };
  }

  _updateRainFx(dt) {
    const fx = this.weatherFx;
    if (!fx || fx.kind !== "rain") return;
    const arr = fx.points.geometry.attributes.position.array;
    const pPos = this.yaw.position;
    for (let i = 0; i < fx.count; i++) {
      const idx = i * 3;
      arr[idx + 1] -= dt * (22 + (i % 7) * 2.5);
      if (arr[idx + 1] < 0) {
        arr[idx] = pPos.x + (Math.random() - 0.5) * fx.half * 2;
        arr[idx + 1] = 24 + Math.random() * 14;
        arr[idx + 2] = pPos.z + (Math.random() - 0.5) * fx.half * 2;
      }
    }
    fx.points.geometry.attributes.position.needsUpdate = true;
  }

  spawnSmokeVolume(pos, radius, until) {
    const group = new THREE.Group();
    group.position.copy(pos);
    const puffs = [];
    for (let i = 0; i < 6; i++) {
      const s = radius * (0.38 + i * 0.11);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8a9aaa, transparent: true, opacity: 0.28 - i * 0.028,
        roughness: 1, metalness: 0, depthWrite: false, side: THREE.DoubleSide,
      });
      const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), mat);
      puff.position.y = 0.6 + i * 0.5;
      group.add(puff);
      puffs.push(puff);
    }
    this.scene.add(group);
    return { group, puffs, until, radius, birth: this.time };
  }

  removeSmokeVolume(vol) {
    if (!vol || !vol.group) return;
    vol.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.scene.remove(vol.group);
  }

  _updateSmokeVolumes(dt) {
    const eq = this.equipment;
    if (!eq || !eq.smokes || !eq.smokes.length) return;
    for (const s of eq.smokes) {
      if (!s.mesh) continue;
      const t = this.time - (s.mesh.birth || 0);
      s.mesh.group.rotation.y += dt * 0.4;
      s.mesh.puffs.forEach((p, i) => {
        p.position.y = 0.6 + i * 0.5 + Math.sin(t * 1.4 + i * 0.8) * 0.18;
        if (p.material) {
          const base = 0.28 - i * 0.028;
          p.material.opacity = Math.max(0.06, base * (0.65 + 0.35 * Math.sin(t * 0.9 + i)));
        }
      });
    }
  }

  /* ================== EFFEKTE ================== */
  spawnTracer(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.92,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    const glowGeo = geo.clone();
    const glowMat = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const glow = new THREE.Line(glowGeo, glowMat);
    this.scene.add(glow);
    this.tracers.push({ obj: line, glow, life: 0.08 });
  }

  spawnSparkBurst(point, color, count) {
    count = count || 5;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), mat);
      m.position.copy(point);
      this.scene.add(m);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        2 + Math.random() * 5,
        (Math.random() - 0.5) * 7
      );
      this.effects.push({
        obj: m, life: 0.16 + Math.random() * 0.14, vel, gravity: -16,
        spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      });
    }
  }

  spawnImpact(point, color) {
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(point);
    this.scene.add(m);
    this.effects.push({ obj: m, life: 0.14, grow: 3 });
    this.spawnSparkBurst(point, color, 4);
  }

  spawnBulletDecal(point, normal) {
    if (!this.bulletDecals) this.bulletDecals = [];
    if (this.bulletDecals.length > 48) {
      const old = this.bulletDecals.shift();
      this.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mesh.material.dispose();
    }
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1a1814, transparent: true, opacity: 0.82, depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.07 + Math.random() * 0.05, 8), mat);
    const n = normal.clone().normalize();
    mesh.position.copy(point).add(n.clone().multiplyScalar(0.03));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    this.scene.add(mesh);
    this.bulletDecals.push({ mesh, life: 28 });
  }

  _updateBulletDecals(dt) {
    if (!this.bulletDecals) return;
    for (let i = this.bulletDecals.length - 1; i >= 0; i--) {
      const d = this.bulletDecals[i];
      d.life -= dt;
      if (d.life < 4 && d.mesh.material) d.mesh.material.opacity = Math.max(0, d.life / 4) * 0.82;
      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        this.bulletDecals.splice(i, 1);
      }
    }
  }

  _spawnFootDust(pos) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x9a9080, transparent: true, opacity: 0.35, depthWrite: false,
    });
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.22, 8), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(pos.x + (Math.random() - 0.5) * 0.3, 0.04, pos.z + (Math.random() - 0.5) * 0.3);
    this.scene.add(m);
    this.effects.push({ obj: m, life: 0.35, grow: 2.2, dust: true });
  }

  spawnExplosion(point) {
    const geo = new THREE.SphereGeometry(0.45, 14, 14);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff7722, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(point);
    this.scene.add(m);
    this.effects.push({ obj: m, life: 0.38, grow: 18 });

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffeeaa, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    core.position.copy(point);
    this.scene.add(core);
    this.effects.push({ obj: core, life: 0.2, grow: 6 });

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.75, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffaa44, transparent: true, opacity: 0.75,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(point);
    ring.position.y += 0.08;
    this.scene.add(ring);
    this.effects.push({ obj: ring, life: 0.42, shockwave: true, growRate: 24 });

    for (let i = 0; i < 8; i++) {
      const chunkMat = new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x3a3530 : 0xff6622, roughness: 0.85, metalness: 0.1,
        emissive: i % 2 ? 0x000000 : 0xff4400, emissiveIntensity: i % 2 ? 0 : 0.35,
      });
      const chunk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), chunkMat);
      chunk.position.copy(point);
      this.scene.add(chunk);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        5 + Math.random() * 9,
        (Math.random() - 0.5) * 16
      );
      this.effects.push({
        obj: chunk, life: 0.5 + Math.random() * 0.3, vel, gravity: -18,
        spin: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      });
    }

    this.spawnSparkBurst(point, 0xffcc66, 10);

    const light = new THREE.PointLight(0xff8833, 3.5, 20);
    light.position.copy(point);
    this.scene.add(light);
    this.effects.push({ obj: light, life: 0.22 });
  }

  _updateEffects(dt) {
    for (const list of [this.tracers, this.effects]) {
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        e.life -= dt;
        const fade = Math.max(0, Math.min(1, e.life * (e.grow || e.shockwave ? 4 : 10)));
        if (e.obj.material) {
          if (e.dust) e.obj.material.opacity = fade * 0.35;
          else e.obj.material.opacity = fade * (e.shockwave ? 0.75 : 1);
        }
        if (e.glow && e.glow.material) e.glow.material.opacity = fade * 0.35;
        if (e.grow && !e.shockwave) e.obj.scale.addScalar(e.grow * dt);
        if (e.shockwave) {
          const t = 1 - e.life / 0.42;
          const s = 1 + t * e.growRate * 0.12;
          e.obj.scale.set(s, s, s);
        }
        if (e.vel) {
          e.obj.position.addScaledVector(e.vel, dt);
          if (e.gravity) e.vel.y += e.gravity * dt;
        }
        if (e.spin) {
          e.obj.rotation.x += e.spin.x * dt;
          e.obj.rotation.y += e.spin.y * dt;
          e.obj.rotation.z += e.spin.z * dt;
        }
        if (e.obj.isLight) e.obj.intensity = Math.max(0, e.life * 14);
        if (e.life <= 0) {
          this.scene.remove(e.obj);
          if (e.glow) {
            this.scene.remove(e.glow);
            if (e.glow.geometry) e.glow.geometry.dispose();
            if (e.glow.material) e.glow.material.dispose();
          }
          if (e.obj.geometry) e.obj.geometry.dispose();
          if (e.obj.material) e.obj.material.dispose();
          list.splice(i, 1);
        }
      }
    }
  }

  /* ================== PUNKTETAFEL (Tab) ================== */
  sbEntry(name, team, isPlayer, faction) {
    let e = this.scoreboard.get(name);
    if (!e) {
      e = {
        name, team, kills: 0, deaths: 0, isPlayer: !!isPlayer,
        faction: faction || (BH.FactionWar ? BH.FactionWar.matchFaction(name, !!isPlayer) : null),
      };
      this.scoreboard.set(name, e);
    }
    if (team) e.team = team;
    if (faction) e.faction = faction;
    return e;
  }

  sbKill(ent) {
    this.sbEntry(ent.name, ent.team, !!ent.isPlayer, ent.faction).kills++;
  }
  sbDeath(ent) { this.sbEntry(ent.name, ent.team, ent.isPlayer).deaths++; }

  showScoreboard(show) {
    const el = document.getElementById("scoreboard");
    el.classList.toggle("hidden", !show);
    if (!show) {
      el.classList.remove("sb-open");
      return;
    }
    el.classList.remove("sb-open");
    void el.offsetWidth;
    el.classList.add("sb-open");

    this.sbEntry(this.playerName, this.playerEntity.team, true);
    document.getElementById("sb-title").textContent = this.mode.title || "PUNKTETAFEL";

    const entries = [...this.scoreboard.values()]
      .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    const teamColor = t => t === "A" ? "#4da3ff" : t === "B" ? "#ff5d52" : "#d8dde2";

    let html = `<div class="sb-row sb-head"><span>SPIELER</span><span>KILLS</span><span>TODE</span></div>`;
    for (const e of entries) {
      let factionHtml = "";
      if (e.faction && BH.FactionWar) {
        const fm = BH.FactionWar._factionMeta(e.faction);
        factionHtml = `<span class="sb-faction" style="color:${fm.color}">${fm.shortName || fm.name}</span>`;
      }
      html += `<div class="sb-row${e.isPlayer ? " me" : ""}">` +
        `<span class="sb-name-cell">` +
          `<span class="sb-name" style="color:${e.isPlayer ? "var(--accent)" : teamColor(e.team)}">${e.name}</span>` +
          factionHtml +
        `</span>` +
        `<span>${e.kills}</span><span>${e.deaths}</span></div>`;
    }
    document.getElementById("sb-body").innerHTML = html;
  }

  /* ================== HUD ================== */
  _applyCrosshair() {
    const cfg = (BH.Progress.data && BH.Progress.data.crosshair) || { style: "classic", color: "#ffffff" };
    const ch = document.getElementById("crosshair");
    ch.className = "ch-style-" + cfg.style;
    ch.style.color = cfg.color;
  }

  _applyWeaponHud() {
    const w = this.currentWeapon();
    document.getElementById("weapon-name").textContent = w.def.name;
  }

  showHitmarker(head) {
    const hm = document.getElementById("hitmarker");
    hm.classList.toggle("head", head);
    hm.classList.remove("show", "hm-pop");
    void hm.offsetWidth;
    hm.classList.add("show", "hm-pop");
    clearTimeout(this._hmT);
    this._hmT = setTimeout(() => hm.classList.remove("show", "hm-pop"), head ? 120 : 90);
  }

  showMessage(big, sub, duration) {
    const b = document.getElementById("message-big");
    const s = document.getElementById("message-sub");
    b.textContent = big || "";
    s.textContent = sub || "";
    b.classList.add("show");
    s.classList.add("show");
    clearTimeout(this.msgTimeout);
    this.msgTimeout = setTimeout(() => {
      b.classList.remove("show");
      s.classList.remove("show");
    }, duration || 2600);
  }

  showBriefing(brief, onDone) {
    const el = document.getElementById("mission-briefing");
    if (!el || !brief) { if (onDone) onDone(); return; }
    document.getElementById("brief-num").textContent = "MISSION " + brief.num;
    document.getElementById("brief-name").textContent = brief.name;
    document.getElementById("brief-objective").textContent = brief.objective;
    document.getElementById("brief-lore").textContent = brief.lore;
    el.classList.remove("hidden");
    clearTimeout(this._briefT);
    this._briefT = setTimeout(() => {
      el.classList.add("hidden");
      if (onDone) onDone();
    }, 4800);
  }

  fadeTransition(ms, onMid) {
    const el = document.getElementById("screen-fade");
    if (!el) { if (onMid) onMid(); return; }
    el.classList.add("fade-in");
    setTimeout(() => {
      if (onMid) onMid();
      el.classList.remove("fade-in");
    }, ms || 600);
  }

  setObjective(text) {
    const bar = document.getElementById("objective-bar");
    if (!text) { bar.classList.add("hidden"); return; }
    bar.classList.remove("hidden");
    document.getElementById("objective-text").textContent = text;
  }

  addKillfeed(killer, victim, isMe) {
    const feed = document.getElementById("killfeed");
    const entry = document.createElement("div");
    entry.className = "kf-entry" + (isMe ? " me" : "");
    let sprayHtml = "";
    if (isMe && BH.Cosmetics) {
      const sp = BH.Cosmetics.spray(BH.Progress.data);
      if (sp) sprayHtml = ` <span class="kf-spray">${sp.icon}</span>`;
    }
    const d = BH.Progress.data;
    let kName = killer;
    let vName = victim;
    if (isMe && BH.ClanExt && d && d.clan) {
      kName = BH.ClanExt.killfeedName(d, killer);
    }
    entry.innerHTML = `<span class="kf-killer"></span> 🔫 <span class="kf-victim"></span>${sprayHtml}`;
    entry.querySelector(".kf-killer").textContent = kName;
    entry.querySelector(".kf-victim").textContent = vName;
    feed.prepend(entry);
    requestAnimationFrame(() => entry.classList.add("kf-enter"));
    while (feed.children.length > 5) feed.removeChild(feed.lastChild);
    setTimeout(() => { if (entry.parentNode) entry.parentNode.removeChild(entry); }, 4500);
  }

  _updateHud() {
    const p = this.player;
    const hp = Math.max(0, Math.round(p.health));
    const fill = document.getElementById("health-fill");
    fill.style.width = (hp / p.maxHealth * 100) + "%";
    fill.classList.toggle("low", hp < 35);
    document.getElementById("health-text").textContent = hp;

    const wrap = document.getElementById("health-wrap");
    if (wrap && typeof this._lastHudHp === "number" && hp < this._lastHudHp) {
      wrap.classList.remove("hp-damage");
      void wrap.offsetWidth;
      wrap.classList.add("hp-damage");
    }
    this._lastHudHp = hp;

    const w = this.currentWeapon();
    const magEl = document.getElementById("ammo-mag");
    magEl.textContent = w.magAmmo;
    magEl.classList.toggle("empty", w.magAmmo === 0);
    document.getElementById("ammo-reserve").textContent = w.def.infiniteAmmo ? "∞" : w.reserveAmmo;
    document.getElementById("reload-hint").textContent =
      w.reloading ? "NACHLADEN..." : (w.magAmmo === 0 ? "[R] NACHLADEN" : "");

    const eqEl = document.getElementById("equipment-hud");
    if (eqEl) {
      if (this.equipment && BH.Equipment) {
        eqEl.textContent = BH.Equipment.hudText(this);
        eqEl.classList.remove("hidden");
      } else {
        eqEl.classList.add("hidden");
      }
    }

    // Schadens-Vignette
    const sinceDmg = this.time - p.lastDamageTime;
    const intensity = Math.max(0, 1 - sinceDmg / 0.8) * 0.85 + (hp < 30 ? 0.35 : 0);
    document.getElementById("vignette").style.boxShadow =
      `inset 0 0 ${120 + intensity * 80}px rgba(255,0,0,${intensity.toFixed(2)})`;

    // Modus-Info
    document.getElementById("mode-info").innerHTML = this.hardcore ? "" : this.mode.getHudInfo();

    // Zielfernrohr
    const scoped = w.def.scope && this.adsAmount > 0.75;
    document.getElementById("scope-overlay").classList.toggle("hidden", !scoped);
    this.viewmodel.visible = !scoped;
    const ch = document.getElementById("crosshair");
    ch.classList.toggle("ads", this.adsAmount > 0.4 || scoped);

    // Dynamische Fadenkreuz-Spreizung
    const spreadNow = THREE.MathUtils.lerp(w.def.spread, w.def.adsSpread, this.adsAmount)
      * (p.sprinting ? 1.8 : 1);
    ch.style.setProperty("--gap", (4 + spreadNow * 420).toFixed(1) + "px");
    const chScale = BH.Settings ? BH.Settings.get().crosshairScale : 1;
    ch.style.transform = `scale(${chScale})`;

    this._updateMinimap();
    this._updateKillstreakHud();
  }

  _updateKillstreakHud() {
    const ks = document.getElementById("killstreak-hud");
    if (ks && this.killstreakMgr) {
      ks.textContent = this.killstreakMgr.enabled && this.killstreakMgr.streak > 0
        ? "🔥 " + this.killstreakMgr.streak + "er-Serie" : "";
    }
  }

  _ensureMinimapCanvas() {
    if (this._minimapReady) return;
    const canvas = document.getElementById("minimap-canvas");
    if (!canvas) return;
    const size = 160;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._minimapCanvas = canvas;
    this._minimapCtx = ctx;
    this._minimapSize = size;
    this._minimapReady = true;
  }

  _getMinimapObstacles() {
    if (this._minimapObstacleSrc === this.obstacles && this._minimapObstacles) {
      return this._minimapObstacles;
    }
    this._minimapObstacleSrc = this.obstacles;
    this._minimapObstacles = BH.Maps && BH.Maps.buildMinimapObstacles
      ? BH.Maps.buildMinimapObstacles(this.obstacles) : [];
    return this._minimapObstacles;
  }

  _updateMinimap() {
    const wrap = document.getElementById("minimap");
    if (!wrap || wrap.classList.contains("hidden")) return;
    if (!this.bounds) return;
    this._ensureMinimapCanvas();
    const canvas = this._minimapCanvas;
    const ctx = this._minimapCtx;
    if (!canvas || !ctx) return;

    const w = this._minimapSize;
    const h = this._minimapSize;
    const b = this.bounds;
    const sx = (x) => ((x - b.minX) / (b.maxX - b.minX)) * w;
    const sy = (z) => ((z - b.minZ) / (b.maxZ - b.minZ)) * h;
    const uav = this.killstreakMgr && this.killstreakMgr.uavActive();

    ctx.clearRect(0, 0, w, h);

    // Hintergrund + Raster
    ctx.fillStyle = "rgba(6,9,14,0.92)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const gx = (w / 4) * i;
      const gz = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, gz); ctx.lineTo(w, gz); ctx.stroke();
    }

    // Wasser (Hafen Delta)
    if (this.mapId === "harbor") {
      ctx.fillStyle = "rgba(26,53,72,0.55)";
      ctx.fillRect(0, 0, w, sy(-18));
    }

    // Karten-Umriss
    ctx.strokeStyle = "rgba(255,122,0,0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Hindernisse / Gebäude
    const obs = this._getMinimapObstacles();
    for (const o of obs) {
      const alpha = o.h >= 8 ? 0.42 : 0.28;
      ctx.fillStyle = `rgba(72,82,92,${alpha})`;
      const ox = sx(o.x - o.w / 2);
      const oz = sy(o.z - o.d / 2);
      const ow = Math.max(1, sx(o.x + o.w / 2) - ox);
      const od = Math.max(1, sy(o.z + o.d / 2) - oz);
      ctx.fillRect(ox, oz, ow, od);
    }

    // Eroberungs-Zonen
    if (this.mode.zoneSys) {
      const labels = ["A", "B", "C", "D", "E"];
      let zi = 0;
      for (const z of this.mode.zoneSys.zones) {
        const zx = sx(z.pos.x);
        const zz = sy(z.pos.z);
        ctx.fillStyle = z.owner === "A"
          ? "rgba(77,163,255,0.55)" : z.owner === "B"
            ? "rgba(255,93,82,0.55)" : "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.arc(zx, zz, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 8px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[zi] || "?", zx, zz);
        zi++;
      }
    }

    // Einheiten
    for (const e of this.entities) {
      if (!e.alive || !e.group) continue;
      if (!uav && e.isBot && e.team === "A") continue;
      let color = e.isZombie ? "#66ff88" : (e.team === "A" ? "#4da3ff" : "#ff5d52");
      if (e.faction && BH.FactionWar) {
        const fm = BH.FactionWar._factionMeta(e.faction);
        if (fm && fm.color) color = fm.color;
      }
      const ex = sx(e.group.position.x);
      const ez = sy(e.group.position.z);
      const r = e.isZombie ? 2.5 : 3.5;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.arc(ex + 0.6, ez + 0.6, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ex, ez, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spieler (drehendes Dreieck)
    const px = sx(this.yaw.position.x);
    const py = sy(this.yaw.position.z);
    const ang = -this.yaw.rotation.y;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.fillStyle = "#ffd24d";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(-5, 5);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Schuss-Pings
    const pingT = this.time;
    this.shotPings = this.shotPings.filter(p => p.until > pingT);
    for (const p of this.shotPings) {
      const life = (p.until - pingT) / (BH.ShotPing ? BH.ShotPing.TTL : 2.8);
      const r = 2.5 + (1 - life) * 6;
      ctx.strokeStyle = p.team === "A"
        ? `rgba(255,210,77,${life * 0.9})` : `rgba(255,120,90,${life * 0.85})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.z), r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* ================== INTERAKTION ================== */
  tryInteract() {
    if (!this.player.alive || this.paused) return;
    for (const it of this.interactables) {
      if (this.yaw.position.distanceTo(it.pos) < (it.radius || 2.6)) { it.action(); return; }
    }
  }

  _updateInteractPrompt() {
    const prompt = document.getElementById("interact-prompt");
    let found = null;
    for (const it of this.interactables) {
      if (this.yaw.position.distanceTo(it.pos) < (it.radius || 2.6)) { found = it; break; }
    }
    if (found) {
      prompt.innerHTML = `<b>[E]</b> ${found.label()}`;
      prompt.classList.remove("hidden");
    } else {
      prompt.classList.add("hidden");
    }
  }

  /* ================== SPIELER-BEWEGUNG ================== */
  _updatePlayer(dt) {
    const p = this.player;
    if (!p.alive) return;

    // Lebensregeneration — etwas langsamer, damit Treffer mehr zählen
    if (!this.hardcore && this.time - p.lastDamageTime > 6 && p.health < p.maxHealth) {
      p.health = Math.min(p.maxHealth, p.health + 14 * dt);
    }

    const w = this.currentWeapon();

    // Rückstoß-Recovery
    if (this.time - w.lastShot > 0.07) {
      const recovery = 1.8 + this.adsAmount * 0.9;
      this.recoilPitch = Math.max(0, this.recoilPitch - dt * recovery * Math.max(0.008, w.def.recoil) * 10);
      if (this.recoilPitch > 0) this._syncAimPitch();
    }

    // ADS
    const adsTarget = (this.adsHeld && p.alive) ? 1 : 0;
    const adsSpeed = 1 / Math.max(0.06, w.def.adsTime);
    this.adsAmount += (adsTarget - this.adsAmount) * Math.min(1, adsSpeed * dt * 3);
    this.adsAmount = Math.max(0, Math.min(1, this.adsAmount));

    // FOV + Viewmodel-Position
    const targetFov = THREE.MathUtils.lerp(this.baseFov, w.def.adsFov, this.adsAmount);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, 14 * dt);
    this.camera.updateProjectionMatrix();
    this.viewmodel.position.lerpVectors(this.vmHip, this.vmAds, this.adsAmount);
    this.viewKick = Math.max(0, this.viewKick - dt * 0.6);
    this.viewmodel.position.z += this.viewKick;

    // Bewegungsrichtung
    let fwd = 0, strafe = 0;
    if (this.keys["KeyW"]) fwd += 1;
    if (this.keys["KeyS"]) fwd -= 1;
    if (this.keys["KeyD"]) strafe += 1;
    if (this.keys["KeyA"]) strafe -= 1;

    p.sprinting = this.keys["ShiftLeft"] && fwd > 0 && this.adsAmount < 0.3;
    let speed = 5.0 * w.def.moveSpeed;
    if (this.opSkillBonus && this.opSkillBonus.moveSpeed > 0) {
      speed *= (1 + this.opSkillBonus.moveSpeed);
    }
    if (p.sprinting && this.factionBonus && this.factionBonus.sprint) speed *= this.factionBonus.sprint;
    if (p.sprinting) speed *= 1.5;
    if (this.adsAmount > 0.5) speed *= 0.55;
    if (p.isInfected) speed *= 1.12;

    const dir = new THREE.Vector3(strafe, 0, -fwd);
    if (dir.lengthSq() > 0) {
      dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw.rotation.y);
    }

    // Springen / Schwerkraft
    if (this.keys["Space"] && p.onGround) { p.velY = 7.2; p.onGround = false; }
    p.velY -= 20 * dt;
    this.yaw.position.y += p.velY * dt;
    if (this.yaw.position.y <= 0) { this.yaw.position.y = 0; p.velY = 0; p.onGround = true; }

    BH.moveWithCollisions(this.yaw.position, dir.x * speed * dt, dir.z * speed * dt,
      0.4, 1.7, this.obstacles, this.bounds);

    if (this.playerShadow) {
      this.playerShadow.position.x = this.yaw.position.x;
      this.playerShadow.position.z = this.yaw.position.z;
      this.playerShadow.visible = p.alive && p.onGround;
    }
    if (p.sprinting && p.onGround && dir.lengthSq() > 0) {
      this._footDustT = (this._footDustT || 0) - dt;
      if (this._footDustT <= 0) {
        this._footDustT = 0.11;
        this._spawnFootDust(this.yaw.position);
      }
    }

    if (BH.TouchControls) {
      BH.TouchControls.applyMove(this, dt);
      BH.TouchControls.applyLook(this);
    }

    // Kopfwippen
    if (dir.lengthSq() > 0 && p.onGround) {
      this.bobT = (this.bobT || 0) + dt * (p.sprinting ? 13 : 9);
      this.pitchObj.position.y = 1.6 + Math.sin(this.bobT) * 0.025 * (1 - this.adsAmount);
    }

    // Feuern
    if (this.firing || this.fireQueued) this.tryFire();
  }

  /* ================== HAUPTSCHLEIFE ================== */
  _loop() {
    if (!this.active) return;
    requestAnimationFrame(this._loop);

    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.paused) { this.renderer.render(this.scene, this.camera); return; }
    this.time += dt;

    this._updatePlayer(dt);

    // Reload abschließen
    for (const w of this.weapons) {
      if (w.reloading && this.time >= w.reloadEnd) this._finishReload(w);
    }

    // Entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.update(dt);
      if (e.removed) {
        this.entities.splice(i, 1);
        const ci = this.combatants.indexOf(e);
        if (ci >= 0) this.combatants.splice(ci, 1);
      }
    }

    this.mode.update(dt);
    if (BH.Equipment) BH.Equipment.update(this, dt);
    if (BH.OperatorVoices) BH.OperatorVoices.update(this, dt);
    if (!this.active) return;
    this._updateEffects(dt);
    this._updateRainFx(dt);
    this._updateSnowFx(dt);
    this._updateBulletDecals(dt);
    this._updateViewmodelFlash(dt);
    this._updateSmokeVolumes(dt);
    this._updateInteractPrompt();
    this._updateHud();

    this.renderer.render(this.scene, this.camera);
  }

  /* ================== ENDE ================== */
  endGame(result) {
    if (this.ending) return;
    this.ending = true;
    this.active = false;
    if (BH.Ambient) BH.Ambient.stop();
    this.setPausedSilent();
    if (document.pointerLockElement) document.exitPointerLock();
    this._unbindInput();

    // Szene aufräumen
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });

    document.getElementById("hud").classList.add("hidden");
    document.getElementById("minimap").classList.add("hidden");
    document.getElementById("screen-pause").classList.add("hidden");
    if (this.canvas) this.canvas.classList.remove("bh-active");
    this.setObjective(null);

    if (!result.deltas) result.deltas = {};
    result.deltas.headshots = this.player.headshots;
    result.matchStats = {
      kills: this.player.kills, deaths: this.player.deaths, headshots: this.player.headshots,
      weaponKills: { ...this.player.weaponKills }, mode: this.modeId,
      zombieRound: this.mode.round || 0,
      bestStreak: this.player.bestStreak || (this.killstreakMgr ? this.killstreakMgr.streak : 0),
    };

    this.onEnd(result);
  }

  setPausedSilent() {
    this.paused = true;
    document.getElementById("screen-pause").classList.add("hidden");
  }
};
