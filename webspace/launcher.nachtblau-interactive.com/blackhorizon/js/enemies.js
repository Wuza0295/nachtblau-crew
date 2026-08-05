/* Gegner: humanoide Modelle, Zombie-KI, Soldaten-Bot-KI */
window.BH = window.BH || {};

BH.BOT_NAMES = [
  "Viper", "Falke", "Wolf-3", "Habicht", "Kondor", "Stahl", "Brecher", "Geist-7",
  "Nordwind", "Jäger-2", "Raptor", "Funke", "Düne", "Schatten", "Krait", "Bussard",
  "Mamba", "Granit", "Zerber", "Phantom-9", "Luchs", "Sturm-4",
];

/* Bewegung mit Achsen-getrennter Kollisionsauflösung gegen Box3-Hindernisse */
BH.moveWithCollisions = function (pos, dx, dz, radius, height, obstacles, bounds) {
  pos.x += dx;
  for (const b of obstacles) {
    if (pos.y < b.max.y && pos.y + height > b.min.y &&
        pos.x + radius > b.min.x && pos.x - radius < b.max.x &&
        pos.z + radius > b.min.z && pos.z - radius < b.max.z) {
      pos.x = dx > 0 ? b.min.x - radius : b.max.x + radius;
    }
  }
  pos.z += dz;
  for (const b of obstacles) {
    if (pos.y < b.max.y && pos.y + height > b.min.y &&
        pos.x + radius > b.min.x && pos.x - radius < b.max.x &&
        pos.z + radius > b.min.z && pos.z - radius < b.max.z) {
      pos.z = dz > 0 ? b.min.z - radius : b.max.z + radius;
    }
  }
  if (bounds) {
    pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x));
    pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z));
  }
};

/* Humanoides Modell — verbesserte Silhouette, Ursprung an den Füßen */
BH.createHumanoid = function (bodyColor, headColor, opts) {
  opts = opts || {};
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.78, metalness: 0.1 });
  const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.72, metalness: 0.06 });
  const gearMat = new THREE.MeshStandardMaterial({
    color: opts.gearColor || 0x2a3238, roughness: 0.55, metalness: 0.35,
  });

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.26), bodyMat);
  pelvis.position.y = 0.88;
  group.add(pelvis);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.3), bodyMat);
  torso.position.y = 1.28;
  group.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.34), gearMat);
  vest.position.y = 1.32;
  group.add(vest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.26), headMat);
  head.position.y = 1.62;
  head.name = "head";
  group.add(head);

  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.3), gearMat);
  helm.position.y = 1.74;
  group.add(helm);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.06, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.2, metalness: 0.65, emissive: 0x224466, emissiveIntensity: 0.12 })
  );
  visor.position.set(0, 1.62, 0.14);
  group.add(visor);

  function pad(x, y) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.22), gearMat);
    m.position.set(x, y, 0);
    group.add(m);
    return m;
  }
  pad(-0.34, 1.48);
  pad(0.34, 1.48);

  function limb(w, len, depth, x, y, mat) {
    const geo = new THREE.BoxGeometry(w, len, depth || w);
    geo.translate(0, -len / 2, 0);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    group.add(m);
    return m;
  }
  const lLeg = limb(0.16, 0.82, 0.18, -0.14, 0.82, bodyMat);
  const rLeg = limb(0.16, 0.82, 0.18, 0.14, 0.82, bodyMat);
  const lArm = limb(0.13, 0.64, 0.14, -0.36, 1.42, bodyMat);
  const rArm = limb(0.13, 0.64, 0.14, 0.36, 1.42, bodyMat);

  return { group, head, torso, lLeg, rLeg, lArm, rArm, bodyMat, headMat, helm, visor };
};

/* Waffe für Bot-Soldaten (an rechtem Arm) */
BH.attachBotWeapon = function (arm, team, scale) {
  scale = scale || 1;
  const group = new THREE.Group();
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x25282c, roughness: 0.42, metalness: 0.62 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x3a3025, roughness: 0.86, metalness: 0.08 });
  const bandColor = team === "A" ? 0x4da3ff : team === "B" ? 0xff5d52 : 0x8899aa;
  const bandMat = new THREE.MeshStandardMaterial({
    color: bandColor, emissive: bandColor, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.54), gunMat);
  body.position.set(0, -0.44, 0.18);
  group.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.42, 6), gunMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.44, 0.5);
  group.add(barrel);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.2), gripMat);
  stock.position.set(0, -0.44, -0.06);
  group.add(stock);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.08), gunMat);
  mag.position.set(0, -0.52, 0.1);
  group.add(mag);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.14), bandMat);
  band.position.set(0, -0.38, 0.12);
  group.add(band);

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * scale, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffcc66, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  flash.position.set(0, -0.44, 0.72);
  flash.name = "muzzleFlash";
  group.add(flash);

  group.scale.setScalar(scale);
  group.rotation.x = -0.55;
  arm.add(group);

  return {
    group,
    flash,
    muzzleLocal: new THREE.Vector3(0, -0.44, 0.72 * scale),
  };
};

/* Panzer-Hülle für FrontWar-Fahrzeuge */
BH.applyVehicleHull = function (bot) {
  if (!bot.group || bot.vehicleHull) return;
  bot.vehicleHull = true;
  bot.group.children.forEach(ch => { ch.visible = false; });

  const col = bot.team === "A" ? 0x3a5068 : 0x684040;
  const hullMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.62, metalness: 0.48 });
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.9, metalness: 0.25 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.5, 1.7), hullMat);
  hull.position.y = 0.85;
  bot.group.add(hull);

  const trackL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 1.75), trackMat);
  trackL.position.set(-0.68, 0.38, 0);
  bot.group.add(trackL);
  const trackR = trackL.clone();
  trackR.position.x = 0.68;
  bot.group.add(trackR);

  const turret = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.82), hullMat);
  turret.position.y = 1.22;
  bot.turretMesh = turret;
  bot.group.add(turret);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.35, 8), hullMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 1.22, 1.0);
  bot.barrelMesh = barrel;
  bot.group.add(barrel);

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffcc66, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  flash.position.set(0, 0, 0.78);
  barrel.add(flash);
  bot.weaponFx = { flash };
};

/* ============================ ZOMBIE ============================ */
BH.Zombie = class {
  constructor(game, pos, opts) {
    opts = opts || {};
    this.game = game;
    this.isZombie = true;
    this.alive = true;
    this.removed = false;
    this.health = opts.health || 80;
    this.maxHealth = this.health;
    this.speed = opts.speed || 2.2;
    this.damage = opts.damage || 12;
    this.special = opts.special || false;
    this.name = this.special ? "Brutalo-Zombie"
      : opts.zType === "tank" ? "Panzer-Zombie"
      : opts.zType === "exploder" ? "Sprenzer"
      : opts.zType === "runner" ? "Runner"
      : "Zombie";
    this.zType = opts.zType || (opts.special ? "brute" : "normal");

    const tones = this.special ? [0x6a1f1f, 0x3a4a2a] : [0x4a5d3a, 0x5a6a4a, 0x3d4d33];
    const bodyColor = tones[Math.floor(Math.random() * tones.length)];
    const m = BH.createHumanoid(bodyColor, 0x7a8a6a);
    this.model = m;
    this.group = m.group;
    if (this.special) this.group.scale.setScalar(1.25);
    if (this.zType === "tank") this.group.scale.setScalar(1.45);
    if (this.zType === "exploder") {
      this.model.bodyMat.emissive = new THREE.Color(0x442200);
      this.model.bodyMat.emissiveIntensity = 0.4;
    }
    this.group.position.copy(pos);
    this.group.userData.entity = this;
    game.enemiesGroup.add(this.group);

    // Zombiehaltung: Arme nach vorn
    m.lArm.rotation.x = -Math.PI / 2.2;
    m.rArm.rotation.x = -Math.PI / 2.2;

    this.attackTimer = 0;
    this.animT = Math.random() * 10;
    this.deadT = 0;
    this.growlTimer = 1 + Math.random() * 5;
    this.hitFlash = 0;
    this.slowUntil = 0;
    this.slowFactor = 1;
  }

  applySlow(factor, duration) {
    this.slowFactor = factor;
    this.slowUntil = this.game.time + duration;
  }

  takeDamage(dmg, isHead) {
    if (!this.alive) return false;
    this.health -= dmg;
    this.hitFlash = 0.1;
    this.model.bodyMat.emissive = new THREE.Color(0x660000);
    if (this.health <= 0) { this.die(); return true; }
    return false;
  }

  die() {
    this.alive = false;
    this.deadT = 0;
    BH.audio.kill();
    if (this.zType === "exploder" && this.game._explode) {
      this.game._explode(this.group.position.clone(), { radius: 6, damage: 45 }, null);
    }
  }

  update(dt) {
    if (!this.alive) {
      this.deadT += dt;
      this.group.rotation.x = -Math.min(1, this.deadT / 0.35) * Math.PI / 2;
      this.group.position.y = Math.min(1, this.deadT / 0.35) * 0.3;
      if (this.deadT > 1.6) {
        this.group.parent && this.group.parent.remove(this.group);
        this.removed = true;
      }
      return;
    }
    const slowed = this.game.time < this.slowUntil;
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      if (this.hitFlash <= 0) {
        this.model.bodyMat.emissive = new THREE.Color(slowed ? 0x114466 : 0x000000);
      }
    } else {
      this.model.bodyMat.emissive = new THREE.Color(slowed ? 0x114466 : 0x000000);
    }

    const player = this.game.playerEntity;
    if (!player.alive) return;

    const pos = this.group.position;
    const toPlayer = new THREE.Vector3().subVectors(player.position, pos);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    this.growlTimer -= dt;
    if (this.growlTimer <= 0 && dist < 30) {
      BH.audio.zombie();
      this.growlTimer = 3 + Math.random() * 6;
    }

    this.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

    if (dist > 1.5) {
      toPlayer.normalize();
      const sp = this.speed * (this.special ? 1.1 : 1) * (slowed ? this.slowFactor : 1);
      BH.moveWithCollisions(pos, toPlayer.x * sp * dt, toPlayer.z * sp * dt,
        0.35, 1.7, this.game.obstacles, this.game.bounds);
      this.animT += dt * sp * 2.4;
      const swing = Math.sin(this.animT) * 0.55;
      this.model.lLeg.rotation.x = swing;
      this.model.rLeg.rotation.x = -swing;
      this.attackTimer = 0.4;
    } else {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = 0.85;
        this.game.damagePlayer(this.damage + Math.random() * 6, pos, this);
        // Schlag-Animation
        this.model.rArm.rotation.x = -Math.PI / 1.4;
        setTimeout(() => { if (this.alive) this.model.rArm.rotation.x = -Math.PI / 2.2; }, 180);
      }
    }
  }
};

/* ========================= SOLDATEN-BOT ========================= */
BH.SoldierBot = class {
  constructor(game, pos, opts) {
    opts = opts || {};
    this.game = game;
    this.isBot = true;
    this.alive = true;
    this.removed = false;
    this.team = opts.team;
    this.name = opts.name || BH.BOT_NAMES[Math.floor(Math.random() * BH.BOT_NAMES.length)];
    this.faction = opts.faction || (BH.FactionWar ? BH.FactionWar.matchFaction(this.name, false) : null);
    this.health = opts.health || 100;
    this.accuracy = opts.accuracy || 0.22;
    this.damage = opts.damage || 11;
    this.speed = opts.speed || 4.2;
    this.speedMult = opts.speedMult || 1;
    this.respawns = opts.respawns !== undefined ? opts.respawns : true;
    this.kills = 0;
    this.bodyColor = opts.color || 0x666666;
    this.spawnIdx = opts.spawnIdx != null ? opts.spawnIdx : null;
    this.accuracyMult = 1;
    this.isInfected = !!opts.isInfected;

    const m = BH.createHumanoid(this.bodyColor, 0x8a7a66, {
      gearColor: this.team === "A" ? 0x2a3a52 : 0x4a2a28,
    });
    this.model = m;
    this.group = m.group;
    this.group.position.copy(pos);
    this.group.userData.entity = this;
    game.enemiesGroup.add(this.group);
    this.weaponFx = BH.attachBotWeapon(m.rArm, this.team, 1);
    this.muzzleFlashT = 0;
    game.sbEntry(this.name, this.team, false, this.faction);

    this.target = null;
    this.objective = null;
    this.aiRole = opts.aiRole != null ? opts.aiRole : 0;
    this.retargetTimer = 0;
    this.losCache = false;
    this.losTimer = 0;
    this.waypoint = null;
    this.repathTimer = 0;
    this.stuckTimer = 0;
    this.reactTimer = 0;
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.strafeTimer = 2;
    this.burstLeft = 0;
    this.fireTimer = 0.5 + Math.random();
    this.animT = Math.random() * 10;
    this.deadT = 0;
    this.hitFlash = 0;
    this.slowUntil = 0;
    this.slowFactor = 1;
  }

  applySlow(factor, duration) {
    this.slowFactor = factor;
    this.slowUntil = this.game.time + duration;
  }

  get position() { return this.group.position; }

  eyePos() {
    return new THREE.Vector3(this.group.position.x, this.group.position.y + 1.55, this.group.position.z);
  }

  takeDamage(dmg, isHead, attacker) {
    if (!this.alive) return false;
    this.health -= dmg;
    this.hitFlash = 0.1;
    this.model.bodyMat.emissive = new THREE.Color(0x661111);
    // Bei Beschuss: Angreifer ins Visier nehmen
    if (attacker && this._isHostile(attacker)) { this.target = attacker; }
    if (this.health <= 0) { this.die(attacker); return true; }
    return false;
  }

  die(attacker) {
    this.alive = false;
    this.deadT = 0;
    this.game.sbDeath(this);
    if (attacker) this.game.sbKill(attacker);
    if (this.game.mode && this.game.mode.onKill) this.game.mode.onKill(attacker, this);
    const burst = this.group.position.clone();
    burst.y += this.vehicleHull ? 1.2 : 1;
    const col = this.team === "A" ? 0x4da3ff : 0xff5d52;
    if (this.game.spawnSparkBurst) this.game.spawnSparkBurst(burst, col, this.vehicleHull ? 10 : 6);
  }

  hasLOS(targetPos) {
    if (!this.game.mapSolids) return true;
    const eye = this.eyePos();
    const dir = new THREE.Vector3().subVectors(targetPos, eye);
    const dist = dir.length();
    if (dist < 0.5) return true;
    dir.normalize();
    const ray = new THREE.Raycaster(eye, dir, 0, dist - 0.4);
    return ray.intersectObject(this.game.mapSolids, true).length === 0;
  }

  _isHostile(c) {
    if (!c || c === this || !c.alive) return false;
    if (this.isInfected) return !c.isInfected;
    if (c.isInfected) return true;
    return c.team !== this.team;
  }

  _combatantHealth(c) {
    if (c.isPlayer) return this.game.player.health;
    return c.health != null ? c.health : 100;
  }

  pickTarget() {
    let best = null, bestScore = -Infinity;
    const myPos = this.group.position;
    for (const c of this.game.combatants) {
      if (!this._isHostile(c)) continue;
      const tPos = c.position;
      const dist = myPos.distanceTo(tPos);
      const targetEye = new THREE.Vector3(tPos.x, tPos.y + 1.5, tPos.z);

      let score = 900 / (dist + 4);
      if (c.isPlayer) score *= 1.35;
      const hp = this._combatantHealth(c);
      if (hp < 40) score *= 1.25;
      if (this.target === c) score *= 1.2;
      if (dist < 65 && this.hasLOS(targetEye)) score *= 1.6;
      else if (dist > 55) score *= 0.5;

      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (best !== this.target) {
      this.target = best;
      this.reactTimer = 0.25 + Math.random() * 0.35;
    }
  }

  _roleAdvanceDist() {
    if (this.aiRole === 1) return 22;
    if (this.aiRole === 2) return 10;
    return 16;
  }

  _pickWaypoint(anchor, tPos, los, dist) {
    const pos = this.group.position;
    const role = this.aiRole || 0;
    const obj = this.objective;

    // Anker-Rolle: Zone/Front halten, aber nahe Gegner trotzdem anvisieren
    if (obj && role === 2 && dist > 36) {
      const dObj = pos.distanceTo(obj);
      if (dObj > 10 || !this.target) {
        const jitter = 8;
        return obj.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * jitter, 0, (Math.random() - 0.5) * jitter
        ));
      }
    }

    if (!los && dist > 14) {
      const fwd = new THREE.Vector3().subVectors(tPos, pos).setY(0).normalize();
      const flank = role === 1 ? 1.4 : role === 2 ? 0.6 : 1;
      const side = new THREE.Vector3(-fwd.z * this.strafeDir * flank, 0, fwd.x * this.strafeDir * flank);
      const advance = role === 2 ? 0.35 : 1;
      return pos.clone().add(fwd.clone().multiplyScalar(this._roleAdvanceDist() * advance))
        .add(side.multiplyScalar(10 + role * 4));
    }

    const jitter = role === 1 ? 16 : 12;
    const moveAnchor = tPos || anchor || pos;
    return moveAnchor.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * jitter, 0, (Math.random() - 0.5) * jitter
    ));
  }

  _updateEscortObjective() {
    const g = this.game;
    if (!g.player.alive) return;
    const pPos = g.yaw.position;
    const pos = this.group.position;
    const dPlayer = pos.distanceTo(pPos);
    if (dPlayer > 18) {
      const lead = new THREE.Vector3().subVectors(pPos, pos).setY(0);
      if (lead.lengthSq() > 0.01) lead.normalize().multiplyScalar(6);
      this.objective = pPos.clone().add(lead);
    } else if (!this.target || pos.distanceTo(this.target.position) > 40) {
      this.objective = null;
    }
  }

  update(dt) {
    if (!this.alive) {
      this.deadT += dt;
      this.group.rotation.x = -Math.min(1, this.deadT / 0.3) * Math.PI / 2;
      this.group.position.y = Math.min(1, this.deadT / 0.3) * 0.25;
      if (this.deadT > 2.2) {
        this.group.parent && this.group.parent.remove(this.group);
        this.removed = true;
        if (this.respawns && this.game.mode && this.game.mode.respawnBot) {
          this.game.mode.respawnBot(this);
        }
      }
      return;
    }
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      if (this.hitFlash <= 0) this.model.bodyMat.emissive = new THREE.Color(0x000000);
    }

    this.retargetTimer -= dt;
    if (this.retargetTimer <= 0 || !this.target || !this.target.alive) {
      this.pickTarget();
      this.retargetTimer = 1.4 + Math.random() * 0.8;
    }
    if (!this.target) return;

    if (this.isAllyEscort) this._updateEscortObjective();

    if (this.reactTimer > 0) this.reactTimer -= dt;

    const pos = this.group.position;
    const tPos = this.target.position;
    const targetEye = new THREE.Vector3(tPos.x, tPos.y + 1.5, tPos.z);
    const dist = pos.distanceTo(tPos);
    // Sichtlinie nur alle ~0,15s prüfen (wichtig für Großschlachten)
    this.losTimer -= dt;
    if (this.losTimer <= 0) {
      this.losCache = dist < 70 && this.hasLOS(targetEye);
      this.losTimer = 0.12 + Math.random() * 0.08;
    }
    const los = this.losCache;

    // ---- Bewegung ----
    let moveDir = null;
    const lowHp = this.health < 35;
    if (lowHp && los && dist < 26) {
      const fwd = new THREE.Vector3().subVectors(tPos, pos).setY(0).normalize();
      moveDir = fwd.clone().multiplyScalar(-1);
    } else if (los && dist < 32) {
      // strafen in Schussdistanz
      this.strafeTimer -= dt;
      if (this.strafeTimer <= 0) {
        this.strafeDir *= -1;
        this.strafeTimer = 1 + Math.random() * 2;
      }
      const fwd = new THREE.Vector3().subVectors(tPos, pos).setY(0).normalize();
      moveDir = new THREE.Vector3(-fwd.z * this.strafeDir, 0, fwd.x * this.strafeDir);
      if (dist < 8) moveDir.add(fwd.clone().multiplyScalar(-0.8)); // Abstand halten
      if (moveDir.lengthSq() > 0.001) moveDir.normalize();
    } else {
      this.repathTimer -= dt;
      if (!this.waypoint || this.repathTimer <= 0 || pos.distanceTo(this.waypoint) < 2.5) {
        const anchor = this.objective || tPos;
        this.waypoint = this._pickWaypoint(anchor, tPos, los, dist);
        this.repathTimer = 2.2 + Math.random() * 2.5;
      }
      moveDir = new THREE.Vector3().subVectors(this.waypoint, pos).setY(0);
      if (moveDir.lengthSq() > 0.01) moveDir.normalize();
    }

    let isMoving = false;
    if (moveDir && moveDir.lengthSq() > 0.001) {
      const before = pos.clone();
      const slow = this.game.time < this.slowUntil ? this.slowFactor : 1;
      const sp = this.speed * (this.speedMult || 1) * slow;
      BH.moveWithCollisions(pos, moveDir.x * sp * dt, moveDir.z * sp * dt,
        0.35, 1.7, this.game.obstacles, this.game.bounds);
      const moved = pos.distanceTo(before);
      isMoving = moved > sp * dt * 0.25;
      if (moved < sp * dt * 0.18) {
        this.stuckTimer += dt;
        if (this.stuckTimer > 0.35) {
          this.repathTimer = 0;
          this.strafeDir *= -1;
          this.waypoint = null;
          if (this.target) {
            const nudge = new THREE.Vector3(
              (Math.random() - 0.5) * 6,
              0,
              (Math.random() - 0.5) * 6
            );
            this.waypoint = this.target.position.clone().add(nudge);
          }
          this.stuckTimer = 0;
        }
      } else {
        this.stuckTimer = 0;
      }
      this.animT += dt * sp * 2.2;
      const swing = Math.sin(this.animT) * 0.5;
      if (!this.vehicleHull) {
        this.model.lLeg.rotation.x = swing;
        this.model.rLeg.rotation.x = -swing;
        this.model.lArm.rotation.x = -swing * 0.5;
        this.model.rArm.rotation.x = swing * 0.5;
      }
    }

    // Blick zum Ziel
    const look = new THREE.Vector3().subVectors(tPos, pos);
    this.group.rotation.y = Math.atan2(look.x, look.z);

    if (this.vehicleHull && this.turretMesh && this.target && this.target.alive) {
      const aimX = Math.atan2(
        targetEye.y - (pos.y + 1.22),
        Math.sqrt(look.x * look.x + look.z * look.z)
      );
      this.turretMesh.rotation.x = THREE.MathUtils.clamp(-aimX * 0.3, -0.4, 0.35);
      if (this.barrelMesh) this.barrelMesh.rotation.x = Math.PI / 2 - aimX * 0.5;
    } else if (this.weaponFx && this.target && this.target.alive) {
      const aimX = Math.atan2(
        targetEye.y - (pos.y + 1.42),
        Math.sqrt(look.x * look.x + look.z * look.z)
      );
      this.model.rArm.rotation.x = THREE.MathUtils.clamp(-aimX - 0.55, -1.35, 0.15);
      this.model.lArm.rotation.x = this.model.rArm.rotation.x * 0.35;
    }
    if (this.muzzleFlashT > 0 && this.weaponFx.flash) {
      this.muzzleFlashT -= dt;
      this.weaponFx.flash.material.opacity = Math.max(0, this.muzzleFlashT / 0.07) * 0.95;
    }

    // ---- Schießen ----
    this.fireTimer -= dt;
    if (this.reactTimer <= 0 && los && this.fireTimer <= 0) {
      if (this.burstLeft <= 0) {
        this.burstLeft = 2 + Math.floor(Math.random() * 4);
      }
      this.burstLeft--;
      this.fireTimer = this.burstLeft > 0 ? 0.11 + Math.random() * 0.05 : 0.65 + Math.random() * 0.85;
      this.shootAt(this.target, dist, isMoving);
    }
  }

  shootAt(target, dist, moving) {
    const eye = this.eyePos();
    BH.audio.enemyShot();

    if (this.weaponFx) {
      this.muzzleFlashT = 0.07;
      if (this.weaponFx.flash) this.weaponFx.flash.material.opacity = 0.95;
    }

    const distFactor = Math.max(0.1, 1 - dist / 85);
    let acc = this.accuracy;
    if (this.accuracyMult) acc *= this.accuracyMult;
    if (this.isInfected) acc *= 1.12;
    if (target.isPlayer && dist < 22) acc *= 1.08;
    if (moving) acc *= 0.82;
    if (dist > 45) acc *= 0.88;
    const hit = Math.random() < acc * distFactor;

    const aim = new THREE.Vector3(target.position.x, target.position.y + 1.4, target.position.z);
    if (!hit) {
      aim.add(new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3));
    }
    this.game.spawnTracer(eye, aim, 0xffaa55);
    this.game.addShotPing(this.group.position.x, this.group.position.z, this.team || "B");

    if (hit) {
      const dmg = this.damage + Math.random() * 5;
      if (target.isPlayer) this.game.damagePlayer(dmg, eye, this);
      else target.takeDamage(dmg, false, this);
    }
  }
};
