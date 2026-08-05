/* Zusätzliche Spielmodi & Erweiterungen */
window.BH = window.BH || {};

/* ======================= KILL CONFIRMED ======================= */
class KillConfirmedMode extends TDMMode {
  constructor(game) {
    super(game);
    this.title = "KILL CONFIRMED";
    this.limit = 40;
    this.tags = [];
  }

  onKill(attacker, victim) {
    if (attacker && victim.position) {
      this.tags.push({
        pos: victim.position.clone(),
        team: victim.team,
        confirmTeam: attacker.team,
        life: 15,
      });
    }
    if (attacker) {
      if (attacker.isBot) attacker.kills++;
      this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
    }
  }

  onPlayerDeath() {
    const att = this.game.player.lastAttacker;
    if (att) {
      this.tags.push({
        pos: this.game.yaw.position.clone(),
        team: "A",
        confirmTeam: att.team,
        life: 15,
      });
      this.game.addKillfeed(att.name, this.game.playerEntity.name, false);
    }
    this.game.showMessage("ELIMINIERT", "Respawn in 3 Sekunden...", 2800);
    this.playerRespawnAt = this.game.time + 3;
  }

  update(dt) {
    super.update(dt);
    const g = this.game;
    const p = g.yaw.position;
    for (let i = this.tags.length - 1; i >= 0; i--) {
      const t = this.tags[i];
      t.life -= dt;
      if (t.life <= 0) { this.tags.splice(i, 1); continue; }
      if (p.distanceTo(t.pos) < 2.2) {
        if (t.confirmTeam === "A") this.scoreA++;
        else if (t.confirmTeam === "B") this.scoreB++;
        BH.audio.buy();
        g.showMessage("", "Dogtag bestätigt!", 900);
        this.tags.splice(i, 1);
        this.checkWin();
      }
    }
  }

  getHudInfo() {
    return `${this.title} · ${this.mapName || ""} · ${fmtTime(this.timeLeft)}<br>` +
      `<span class="mi-team-a">ALPHA ${this.scoreA}</span> : <span class="mi-team-b">${this.scoreB} BRAVO</span>` +
      `<br><span style="font-size:12px;color:#ffd24d">Dogtags einsammeln!</span>`;
  }
}

/* ======================= HARDCORE TDM ======================= */
class HardcoreMode extends TDMMode {
  constructor(game) {
    super(game);
    this.title = "HARDCORE TDM";
    this.limit = 30;
    this.timeLeft = 480;
  }

  setup() {
    super.setup();
    const g = this.game;
    g.hardcore = true;
    g.player.maxHealth = 45;
    g.player.health = 45;
    document.getElementById("minimap").classList.add("hidden");
    document.getElementById("killstreak-hud").textContent = "";
    g.showMessage("HARDCORE", "Kein HUD · Keine Regeneration · Weniger HP", 3500);
  }

  finish() {
    const g = this.game;
    const victory = this.scoreA > this.scoreB;
    const mult = BH.LTM.xpMult("hardcore");
    const base = g.player.kills * 120 + (victory ? 600 : 250);
    g.endGame({
      title: victory ? "🏆 HARDCORE SIEG" : "HARDCORE NIEDERLAGE",
      stats: [["ALPHA", this.scoreA], ["BRAVO", this.scoreB], ["Kills", g.player.kills], ["Tode", g.player.deaths]],
      xpBreakdown: [["Hardcore-Kills", g.player.kills * 120], [victory ? "Sieg" : "Teilnahme", victory ? 600 : 250], ["LTM-Bonus ×" + mult, Math.round(base * (mult - 1))]],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
    });
  }
}

/* ======================= INFIZIERT ======================= */
class InfectedMode extends TDMMode {
  constructor(game) {
    super(game);
    this.title = "INFIZIERT";
    this.alliesCount = 8;
    this.enemiesCount = 0;
    this.infectedCount = 1;
    this.humansLeft = 9;
  }

  setup() {
    const g = this.game;
    const rot = loadRotatingMap(g);
    this.map = rot.map;
    this.mapName = rot.emoji + " " + rot.name;
    g.mapId = BH.Maps.getActiveMap().id;
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 0));
    for (let i = 0; i < this.alliesCount; i++) this.spawnBot("A", i);
    const inf = this.spawnBot("B", 0, "[INFIZIERT] Patient-0");
    inf.isInfected = true;
    inf.speedMult = 1.18;
    inf.accuracy = Math.min(0.38, (inf.accuracy || 0.22) * 1.1);
    this.infectedCount = 1;
    this.humansLeft = this.alliesCount + 1;
    g.showMessage("INFIZIERT", "Überlebe oder infiziere alle!", 4000);
  }

  onKill(attacker, victim) {
    if (attacker) {
      if (attacker.isBot) attacker.kills++;
      this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
      if (attacker.isInfected && victim.isBot && !victim.isInfected) {
        victim.isInfected = true;
        victim.team = "B";
        victim.speedMult = Math.max(victim.speedMult || 1, 1.18);
        victim.accuracy = Math.min(0.42, (victim.accuracy || 0.22) * 1.08);
        if (!victim.name.includes("INFIZIERT")) {
          victim.name = "[INFIZIERT] " + victim.name.replace(/^\[(ALPHA|BRAVO)\]\s*/, "");
        }
        this.infectedCount++;
        this.humansLeft--;
        this.game.showMessage("", victim.name + " infiziert!", 1500);
      }
    }
    if (this.humansLeft <= 0) this.finishInfectedWin();
    else if (this.infectedCount >= this.alliesCount + 1) this.finishHumanLoss();
  }

  respawnBot(bot) {
    if (this.game.ending) return;
    setTimeout(() => {
      if (!this.game.active || this.game.ending) return;
      const team = bot.isInfected ? "B" : "A";
      const nb = this.spawnBot(team, bot.spawnIdx != null ? bot.spawnIdx : Math.floor(Math.random() * 6), bot.name);
      if (bot.isInfected) {
        nb.isInfected = true;
        nb.speedMult = bot.speedMult || 1.18;
        nb.accuracy = Math.min(0.42, bot.accuracy || 0.28);
      }
    }, 2500);
  }

  onPlayerDeath() {
    const att = this.game.player.lastAttacker;
    if (att && att.isInfected) {
      this.game.player.isInfected = true;
      this.game.playerEntity.team = "B";
      this.infectedCount++;
      this.humansLeft--;
      this.game.showMessage("INFIZIERT!", "Du kämpfst jetzt für die Infizierten.", 3000);
    } else {
      this.game.addKillfeed(att ? att.name : "?", this.game.playerEntity.name, false);
      this.humansLeft--;
    }
    this.game.showMessage("ELIMINIERT", "Respawn in 4 Sekunden...", 2800);
    this.playerRespawnAt = this.game.time + 4;
    if (this.humansLeft <= 0) this.finishInfectedWin();
  }

  finishInfectedWin() {
    const g = this.game;
    g.endGame({
      title: "🧟 INFIZIERT GEWINNEN",
      stats: [["Infizierte", this.infectedCount], ["Überlebende", this.humansLeft]],
      xpBreakdown: [["Infiziert-Sieg", 700], ["Kills", g.player.kills * 80]],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: g.player.isInfected ? 1 : 0 },
    });
  }

  finishHumanLoss() { this.finishInfectedWin(); }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      if (this.humansLeft > this.infectedCount) this.finishHumanSurvival();
      else this.finishInfectedWin();
      return;
    }
    this.updatePlayerRespawn();
  }

  finishHumanSurvival() {
    const g = this.game;
    g.endGame({
      title: "🏆 MENSCHEN ÜBERLEBEN",
      stats: [["Überlebende", this.humansLeft], ["Infizierte", this.infectedCount], ["Kills", g.player.kills]],
      xpBreakdown: [["Überlebens-Sieg", 800], ["Kills", g.player.kills * 90]],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: !g.player.isInfected ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `${this.title} · ${fmtTime(this.timeLeft)}<br>` +
      `<span style="color:#3ddc84">Menschen: ${this.humansLeft}</span> · ` +
      `<span style="color:#ff3b30">Infiziert: ${this.infectedCount}</span>`;
  }
}

/* ======================= SCHIEßSTAND ======================= */
class TrainingTarget {
  constructor(game, mode, x, z) {
    this.game = game;
    this.mode = mode;
    this.alive = true;
    this.isTarget = true;
    this.hp = 120;
    this.group = new THREE.Group();
    this.group.position.set(x, 0.9, z);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xff9500, emissive: 0x331100, emissiveIntensity: 0.5 }));
    this.group.add(mesh);
    this.group.userData.entity = this;
    game.enemiesGroup.add(this.group);
    game.entities.push(this);
  }
  get position() { return this.group.position; }
  takeDamage(dmg, isHead, attacker) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
      this.game.enemiesGroup.remove(this.group);
      this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
      this.removed = true;
      if (this.mode.onTargetHit) this.mode.onTargetHit();
      return true;
    }
    return false;
  }
  update() {}
}

class TrainingMode {
  constructor(game) {
    this.game = game;
    this.title = "SCHIEßSTAND";
    this.hits = 0;
    this.timeLeft = 120;
    this._targets = 0;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildCity(g.scene);
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.set(0, 0, 30);
    g.trainingMode = true;
    for (let i = 0; i < 6; i++) this._spawnTarget(-20 + i * 8, -25);
    g.showMessage("SCHIEßSTAND", "Triff die Ziele – unendlich Munition", 3500);
  }

  _spawnTarget(x, z) {
    new TrainingTarget(this.game, this, x, z);
    this._targets++;
  }

  onTargetHit() {
    this.hits++;
    if (this.hits % 2 === 0) {
      this._spawnTarget(-20 + Math.random() * 40, -22 - Math.random() * 8);
    }
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) this.finish();
  }

  finish() {
    const g = this.game;
    const shots = Math.max(1, this.hits + 5);
    const acc = Math.round(this.hits / shots * 100);
    g.endGame({
      title: "🎯 SCHIEßSTAND BEENDET",
      stats: [["Treffer", this.hits], ["Genauigkeit", acc + " %"], ["Kopftreffer", g.player.headshots]],
      xpBreakdown: [["Training", 150], ["Treffer", this.hits * 5]],
      deltas: { matches: 1, headshots: g.player.headshots },
    });
  }

  getHudInfo() { return `${this.title} · ${fmtTime(this.timeLeft)}<br>Treffer: ${this.hits}`; }
  onKill() {}
  onPlayerDeath() { this.game.respawnPlayer(this.game.yaw.position); }
}

/* ======================= SPEC-OPS ======================= */
class SpecOpsMode {
  constructor(game) {
    this.game = game;
    this.title = "SPEC-OPS";
    this.phase = 0;
    const tut = BH.Tutorial && BH.Tutorial.specOpsConfig(BH.Progress.data);
    this.killsNeeded = tut ? tut.killsNeeded : 12;
    this.killsDone = 0;
    this.timeLeft = tut ? tut.timeLeft : 180;
    this.tutorialHint = tut ? tut.hint : null;
  }

  setup() {
    const g = this.game;
    const rot = loadRotatingMap(g);
    this.map = rot.map;
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 0));
    const botCount = BH.Tutorial && BH.Tutorial.isActive(BH.Progress.data) ? 6 : 8;
    for (let i = 0; i < botCount; i++) {
      const bot = new BH.SoldierBot(g, BH.Maps.pickSpawn(this.map, this.map.spawnsB, i, 2), {
        team: "B", color: 0x6b2e2e, name: "[ZIEL] " + BH.BOT_NAMES[i % BH.BOT_NAMES.length], accuracy: 0.15,
      });
      g.entities.push(bot);
      g.combatants.push(bot);
    }
    const sub = this.tutorialHint || "Eliminiere " + this.killsNeeded + " feindliche Ziele";
    g.showMessage("SPEC-OPS", sub, 4000);
    g.setObjective(this.killsNeeded + " Ziele eliminieren");
  }

  onKill(attacker, victim) {
    if (attacker && attacker.isPlayer) {
      this.killsDone++;
      this.game.addKillfeed(attacker.name, victim.name, true);
      if (this.killsDone >= this.killsNeeded) this.finish(true);
    }
  }

  onPlayerDeath() {
    this.game.showMessage("OPERATOR DOWN", "Respawn – Mission läuft weiter", 2000);
    this.game.respawnPlayer(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 2));
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) this.finish(false);
  }

  finish(success) {
    const g = this.game;
    if (success && BH.Tutorial && BH.Tutorial.isActive(BH.Progress.data)) {
      BH.Tutorial.complete(BH.Progress.data);
    }
    g.endGame({
      title: success ? "✅ SPEC-OPS ERFOLG" : "❌ SPEC-OPS GESCHEITERT",
      stats: [["Ziele", this.killsDone + "/" + this.killsNeeded], ["Kopftreffer", g.player.headshots], ["Zeit", success ? "OK" : "Abgelaufen"]],
      xpBreakdown: success ? [["Mission", 900], ["Kills", g.player.kills * 70]] : [["Teilnahme", 100]],
      deltas: { kills: g.player.kills, matches: 1, missionsCompleted: success ? 1 : 0, wins: success ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `${this.title} · ${fmtTime(this.timeLeft)}<br>Ziele: ${this.killsDone}/${this.killsNeeded}`;
  }
}

/* ======================= KAMPAGNE M4 – BOSS ======================= */
class BossTank {
  constructor(game, mode, pos) {
    this.game = game;
    this.mode = mode;
    this.alive = true;
    this.health = 1200;
    this.maxHealth = 1200;
    this.team = "B";
    this.name = "VANGUARD-PANZER";
    this.isBoss = true;
    this.group = new THREE.Group();
    this.group.position.copy(pos);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x7a1020, metalness: 0.7, roughness: 0.3 }));
    mesh.position.y = 1.75;
    this.group.add(mesh);
    this.group.userData.entity = this;
    game.enemiesGroup.add(this.group);
    game.entities.push(this);
    game.combatants.push(this);
  }
  get position() { return this.group.position; }
  takeDamage(dmg, isHead, attacker) {
    if (!this.alive) return false;
    this.health -= dmg;
    if (attacker && attacker.isPlayer) this.mode.onBossHit();
    if (this.health <= 0) {
      this.alive = false;
      this.removed = true;
      this.game.enemiesGroup.remove(this.group);
      this.game.showMessage("🎖 SIEG", "Vanguard-Panzer zerstört!", 3000);
      setTimeout(() => this.mode.finish(true), 1800);
      return true;
    }
    return false;
  }
  update(dt) {
    if (!this.alive) return;
    const p = this.game.yaw.position;
    const dx = p.x - this.group.position.x, dz = p.z - this.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 8) {
      this.group.position.x += (dx / dist) * dt * 2.8;
      this.group.position.z += (dz / dist) * dt * 2.8;
    }
    if (Math.random() < dt * 0.12) this.game.damagePlayer(10, this.group.position, this);
  }
}

class Campaign4Mode {
  constructor(game) {
    this.game = game;
    this.title = "KAMPAGNE M4 · PHÖNIX-FALL";
    this.phase = 0;
    this.boss = null;
    this.done = false;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildHarbor(g.scene);
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.set(0, 0, 40);
    this.boss = new BossTank(g, this, new THREE.Vector3(0, 0, -20));
    g.showMessage("KAMPAGNE M4", "Phönix-Fall – Zerstöre den Vanguard-Panzer!", 4500);
    g.setObjective("Boss eliminieren");
  }

  onBossHit() {
    if (!this.boss || this.phase > 0) return;
    if (this.boss.health < this.boss.maxHealth * 0.5) {
      this.phase = 1;
      this.game.showMessage("⚠ PHASE 2", "Panzer ruft Verstärkung!", 2500);
      for (let i = 0; i < 6; i++) {
        const pos = new THREE.Vector3((Math.random() - 0.5) * 30, 0, -10 - Math.random() * 15);
        const bot = new BH.SoldierBot(this.game, pos, { team: "B", color: 0x6b2e2e, name: "[ELITE] Wache", accuracy: 0.22 });
        this.game.entities.push(bot);
        this.game.combatants.push(bot);
      }
    }
  }

  onKill() {}
  onPlayerDeath() {
    this.game.showMessage("OPERATOR DOWN", "Respawn – der Panzer wartet", 2500);
    this.game.respawnPlayer(new THREE.Vector3(0, 0, 35));
  }
  update() {}

  finish(success) {
    if (this.done) return;
    this.done = true;
    const g = this.game;
    if (g.mode.handleMissionFinish) {
      g.mode.handleMissionFinish(success, this);
      return;
    }
    g.endGame({
      title: success ? "🏆 KAMPAGNE M4 ABGESCHLOSSEN" : "MISSION FEHLGESCHLAGEN",
      stats: [["Boss-HP", this.boss ? Math.max(0, this.boss.health) : 0], ["Kills", g.player.kills]],
      xpBreakdown: [["Kampagne M4", 1500], ["Boss", success ? 1000 : 0]],
      deltas: { kills: g.player.kills, matches: 1, missionsCompleted: success ? 1 : 0, wins: success ? 1 : 0 },
    });
  }

  getHudInfo() {
    const pct = this.boss ? Math.max(0, Math.round(this.boss.health / this.boss.maxHealth * 100)) : 0;
    return `${this.title}<br>Boss: ${pct} % HP`;
  }
}

/* ======================= KAMPAGNE M5: EISIGER SCHATTEN ======================= */
class Campaign5Mode {
  constructor(game) {
    this.game = game;
    this.title = "KAMPAGNE M5 · EISIGER SCHATTEN";
    this.phase = 0;
    this.killsNeeded = 10;
    this.killsDone = 0;
    this.beacon = null;
    this.failAt = -1;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildArctic(g.scene);
    BH.Maps.sanitizeMapSpawns(this.map);
    g.mapId = "arctic";
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 0));
    g.setObjective("Eliminiere feindliche Kräfte: 0/" + this.killsNeeded);
    for (let i = 0; i < 6; i++) this._spawn(i);
  }

  _spawn(i) {
    const g = this.game;
    const pos = BH.Maps.pickSpawn(this.map, this.map.spawnsB, i, 2);
    const bot = new BH.SoldierBot(g, pos, { team: "E", color: 0x4a6070, name: "Frost-" + (i + 1), accuracy: 0.18, respawns: false });
    g.entities.push(bot);
    g.combatants.push(bot);
  }

  setBeacon(pos) {
    if (this.beacon) { this.game.scene.remove(this.beacon); this.beacon = null; }
    const mat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 30, 10, 1, true), mat);
    this.beacon.position.set(pos.x, 15, pos.z);
    this.game.scene.add(this.beacon);
    this.beaconPos = pos.clone();
  }

  onKill(attacker, victim) {
    if (!attacker || !attacker.isPlayer || this.phase !== 0) return;
    this.killsDone++;
    this.game.setObjective(`Eliminiere feindliche Kräfte: ${this.killsDone}/${this.killsNeeded}`);
    if (this.killsDone >= this.killsNeeded) {
      this.phase = 1;
      this.game.showMessage("DATEN-CHIP", "Extraktion am Nordtor!", 3000);
      this.setBeacon(this.map.spawnsA[2]);
      this.game.setObjective("Erreiche das Extraktions-Beacon");
    }
  }

  onPlayerDeath() {
    this.failAt = this.game.time + 2.5;
    this.game.showMessage("MISSION GESCHEITERT", "Operator down in der Kälte", 2500);
  }

  update(dt) {
    const g = this.game;
    if (this.failAt > 0 && g.time >= this.failAt) { this.finish(false); return; }
    if (this.phase === 1 && this.beaconPos) {
      const dx = g.yaw.position.x - this.beaconPos.x, dz = g.yaw.position.z - this.beaconPos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 7) this.finish(true);
    }
  }

  finish(victory) {
    const g = this.game;
    if (g.mode.handleMissionFinish) { g.mode.handleMissionFinish(victory, this); return; }
    g.endGame({ title: victory ? "✅ MISSION 5 ERFÜLLT" : "❌ GEFROREN", stats: [["Kills", g.player.kills]], deltas: { kills: g.player.kills, matches: 1, missionsCompleted: victory ? 1 : 0 } });
  }

  getHudInfo() { return `${this.title}<br>${this.killsDone}/${this.killsNeeded}`; }
}

class BossPhoenix {
  constructor(game, mode, pos) {
    this.game = game;
    this.mode = mode;
    this.alive = true;
    this.health = 900;
    this.maxHealth = 900;
    this.team = "B";
    this.name = "KOMMANDANT PHÖNIX";
    this.isBoss = true;
    this.teleTimer = 4;
    this.group = new THREE.Group();
    this.group.position.copy(pos);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.8), new THREE.MeshStandardMaterial({ color: 0xff5a00, emissive: 0x441100, metalness: 0.4 }));
    body.position.y = 1.1;
    this.group.add(body);
    this.group.userData.entity = this;
    game.enemiesGroup.add(this.group);
    game.entities.push(this);
    game.combatants.push(this);
  }
  get position() { return this.group.position; }
  takeDamage(dmg, isHead, attacker) {
    if (!this.alive) return false;
    this.health -= isHead ? dmg * 1.4 : dmg;
    if (attacker && attacker.isPlayer) this.mode.onBossHit();
    if (this.health <= 0) {
      this.alive = false;
      this.removed = true;
      this.game.enemiesGroup.remove(this.group);
      this.game.showMessage("🏆 SIEG", "Kommandant Phönix eliminiert!", 3500);
      setTimeout(() => this.mode.finish(true), 2000);
      return true;
    }
    return false;
  }
  update(dt) {
    if (!this.alive) return;
    const p = this.game.yaw.position;
    const dx = p.x - this.group.position.x, dz = p.z - this.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 6) {
      this.group.position.x += (dx / dist) * dt * 3.5;
      this.group.position.z += (dz / dist) * dt * 3.5;
    }
    this.teleTimer -= dt;
    if (this.teleTimer <= 0) {
      this.teleTimer = 5 + Math.random() * 3;
      this.group.position.x = p.x + (Math.random() - 0.5) * 24;
      this.group.position.z = p.z + (Math.random() - 0.5) * 24;
    }
    if (Math.random() < dt * 0.15) this.game.damagePlayer(12, this.group.position, this);
  }
}

class Campaign6Mode {
  constructor(game) {
    this.game = game;
    this.title = "KAMPAGNE M6 · HORIZONTS ENDE";
    this.phase = 0;
    this.boss = null;
    this.done = false;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildTower(g.scene);
    g.mapId = "tower";
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.set(0, 0, 35);
    this.boss = new BossPhoenix(g, this, new THREE.Vector3(0, 0, -8));
    g.setObjective("Eliminiere Kommandant Phönix");
  }

  onBossHit() {
    if (this.phase > 0 || !this.boss || this.boss.health > this.boss.maxHealth * 0.4) return;
    this.phase = 1;
    this.game.showMessage("⚠ FINALE PHASE", "Phönix-Garde greift an!", 2800);
    for (let i = 0; i < 5; i++) {
      const pos = new THREE.Vector3((Math.random() - 0.5) * 28, 0, (Math.random() - 0.5) * 28);
      const bot = new BH.SoldierBot(this.game, pos, { team: "B", color: 0xff5a00, name: "[PHÖNIX] Garde", accuracy: 0.24, respawns: false });
      this.game.entities.push(bot);
      this.game.combatants.push(bot);
    }
  }

  onKill() {}
  onPlayerDeath() {
    this.game.respawnPlayer(new THREE.Vector3(0, 0, 30));
    this.game.showMessage("OPERATOR DOWN", "Der Kommandant wartet…", 2200);
  }
  update() {}

  finish(success) {
    if (this.done) return;
    this.done = true;
    const g = this.game;
    if (g.mode.handleMissionFinish) { g.mode.handleMissionFinish(success, this); return; }
    g.endGame({ title: success ? "🏆 KAMPAGNE KOMPLETT" : "MISSION FEHLGESCHLAGEN", stats: [["Kills", g.player.kills]], deltas: { kills: g.player.kills, matches: 1, missionsCompleted: success ? 1 : 0, wins: success ? 1 : 0 } });
  }

  getHudInfo() {
    const pct = this.boss ? Math.max(0, Math.round(this.boss.health / this.boss.maxHealth * 100)) : 0;
    return `${this.title}<br>Phönix: ${pct} % HP`;
  }
}

/* ======================= KAMPAGNE (Story-Modus) ======================= */
class CampaignStoryMode {
  constructor(game) {
    this.game = game;
    this.title = "KAMPAGNE · BLACK HORIZON";
    this.delegate = null;
    this.missionIdx = 0;
    this.missionStartIdx = 0;
    this.missionsDoneThisSession = 0;
    this.singleChapter = false;
    this.MISSIONS = (BH.CampaignBriefings || []).map(b => ({ name: b.name }));
    if (!this.MISSIONS.length) {
      this.MISSIONS = [
        { name: "Schwarzer Morgen" }, { name: "Schattenop" }, { name: "Panzerfahrt" },
        { name: "Phönix-Fall" }, { name: "Eisiger Schatten" }, { name: "Horizonts-Ende" },
      ];
    }
  }

  setup() {
    const g = this.game;
    const prog = BH.Progress.data;
    const maxM = BH.SeasonRelease ? BH.SeasonRelease.maxCampaignMissions() : 6;
    if (prog._campaignChapterStart != null) {
      const ch = prog._campaignChapterStart;
      if (BH.SeasonRelease && BH.SeasonRelease.isCampaignChapterSeasonLocked(ch)) {
        delete prog._campaignChapterStart;
        g.showMessage("GESPERRT", "Missionen 5 & 6 ab " + (BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026") + ".", 3500);
        setTimeout(() => g.endGame({ title: "❌ ABGEBROCHEN", stats: [] }), 3600);
        return;
      }
      this.missionIdx = ch;
      this.singleChapter = true;
      delete prog._campaignChapterStart;
    } else {
      const saved = prog.campaignMission || 0;
      this.missionIdx = saved >= maxM ? 0 : Math.min(saved, maxM - 1);
      this.singleChapter = false;
    }
    this.missionStartIdx = this.missionIdx;
    this.missionsDoneThisSession = 0;
    if (!this.singleChapter) {
      const start = this.MISSIONS[this.missionIdx];
      if (this.missionIdx > 0 && (prog.campaignMission || 0) < maxM) {
        g.showMessage("KAMPAGNE FORTGESETZT", `Mission ${this.missionIdx + 1}: ${start.name}`, 4000);
      } else {
        const s2 = BH.SeasonRelease && BH.SeasonRelease.isS2Feature("campaign");
        g.showMessage("KAMPAGNE", s2
          ? "Sechs Missionen – Saison 1 & 2. Schwarzer Horizont beginnt."
          : "Vier Missionen – Saison 1. Saison 2 ab " + (BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026") + ".", 4500);
      }
    }
    this._loadMission(this.missionIdx);
  }

  _loadMission(idx) {
    const g = this.game;
    if (BH.SeasonRelease && BH.SeasonRelease.isCampaignChapterSeasonLocked(idx)) {
      g.showMessage("SAISON 2", "Diese Mission startet am " + (BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026") + ".", 3500);
      setTimeout(() => g.endGame({ title: "❌ GESPERRT", stats: [] }), 3600);
      return;
    }
    const classes = [CampaignMode, Campaign2Mode, Campaign3Mode, Campaign4Mode, Campaign5Mode, Campaign6Mode];
    const brief = BH.CampaignBriefings && BH.CampaignBriefings[idx];
    const startDelegate = () => {
      this.delegate = new classes[idx](g);
      this.missionIdx = idx;
      this.title = `KAMPAGNE · ${this.MISSIONS[idx].name.toUpperCase()}`;
      this.delegate.setup();
      if (this.delegate.mapId) {
        g.mapId = this.delegate.mapId;
        g.factionBonus = BH.FactionBonus.get(BH.Progress.data.operator, g.mapId);
        if (BH.Ambient) BH.Ambient.start(g.modeId, g.mapId);
      }
    };
    if (brief && g.showBriefing) g.showBriefing(brief, startDelegate);
    else startDelegate();
  }

  _cleanupMission() {
    const g = this.game;
    const d = this.delegate;
    if (d) {
      if (d.clearBeacon) d.clearBeacon();
      else if (d.beacon) {
        g.scene.remove(d.beacon);
        if (d.beacon.geometry) d.beacon.geometry.dispose();
        if (d.beacon.material) d.beacon.material.dispose();
        d.beacon = null;
      }
    }
    while (g.enemiesGroup.children.length) g.enemiesGroup.remove(g.enemiesGroup.children[0]);
    g.entities = [];
    g.combatants = [g.playerEntity];
    g.interactables = [];
    if (g.mapSolids && g.mapSolids.parent) g.scene.remove(g.mapSolids);
    g.mapSolids = null;
    g.obstacles = [];
    g.setObjective(null);
    g.player.alive = true;
    g.player.health = g.player.maxHealth;
    this.delegate = null;
  }

  handleMissionFinish(victory) {
    const g = this.game;
    if (!victory) {
      this._finishCampaign(false);
      return;
    }
    this.missionsDoneThisSession++;
    const prog = BH.Progress.data;
    const maxM = BH.SeasonRelease ? BH.SeasonRelease.maxCampaignMissions() : 6;
    prog.campaignMission = Math.max(prog.campaignMission || 0, this.missionIdx + 1);
    if (prog.campaignMission >= 6) prog.campaignComplete = true;
    BH.Progress.save();

    if (this.singleChapter) {
      g.showMessage(`✅ KAPITEL ${this.missionIdx + 1} ERFÜLLT`, this.MISSIONS[this.missionIdx].name, 3000);
      setTimeout(() => { if (g.active && !g.ending) this._finishCampaign(true); }, 3200);
      return;
    }

    if (this.missionIdx >= maxM - 1) {
      if (maxM < 6 && !this.singleChapter) {
        g.showMessage("✅ SAISON 1 ABGESCHLOSSEN", "M5 & M6 ab " + (BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026") + " · Schwarzer Horizont.", 4000);
      }
      this._finishCampaign(true);
      return;
    }

    const next = this.MISSIONS[this.missionIdx + 1];
    g.showMessage(`✅ MISSION ${this.missionIdx + 1} ERFÜLLT`, `${next.name} – Übergang…`, 2800);
    setTimeout(() => {
      if (g.active && !g.ending) {
        if (g.fadeTransition) {
          g.fadeTransition(700, () => {
            this._cleanupMission();
            this._loadMission(this.missionIdx + 1);
          });
        } else {
          this._cleanupMission();
          this._loadMission(this.missionIdx + 1);
        }
      }
    }, 3000);
  }

  _finishCampaign(victory) {
    const g = this.game;
    const maxM = BH.SeasonRelease ? BH.SeasonRelease.maxCampaignMissions() : 6;
    const remaining = this.singleChapter ? 1 : maxM - this.missionStartIdx;
    const fullDone = victory && !this.singleChapter && BH.Progress.data.campaignComplete;
    g.endGame({
      title: victory ? (fullDone ? "🏆 KAMPAGNE ABGESCHLOSSEN" : "✅ MISSION ERFÜLLT") : "❌ KAMPAGNE GESCHEITERT",
      stats: [
        ["Missionen", `${victory ? (this.singleChapter ? 1 : remaining) : this.missionsDoneThisSession}/${this.singleChapter ? 1 : remaining}`],
        ["Kills gesamt", g.player.kills],
        ["Tode", g.player.deaths],
        ["Status", victory ? "Einsatz erfolgreich" : "Abgebrochen"],
      ],
      xpBreakdown: victory
        ? [["Kampagne", this.singleChapter ? 800 : 3500], ["Missionen", this.missionsDoneThisSession * 450], ["Kills", g.player.kills * 100]]
        : [["Versuch", 250 + this.missionsDoneThisSession * 300], ["Kills", g.player.kills * 100]],
      deltas: {
        kills: g.player.kills,
        deaths: g.player.deaths,
        matches: 1,
        missionsCompleted: victory ? (this.singleChapter ? 1 : remaining) : this.missionsDoneThisSession,
        wins: victory ? 1 : 0,
      },
    });
  }

  update(dt) { if (this.delegate && this.delegate.update) this.delegate.update(dt); }
  onKill(a, v) { if (this.delegate && this.delegate.onKill) this.delegate.onKill(a, v); }
  onPlayerDeath() { if (this.delegate && this.delegate.onPlayerDeath) this.delegate.onPlayerDeath(); }
  damagePlayerHook() { if (this.delegate && this.delegate.damagePlayerHook) this.delegate.damagePlayerHook(); }

  getHudInfo() {
    const m = this.MISSIONS[this.missionIdx];
    const inner = this.delegate && this.delegate.getHudInfo ? this.delegate.getHudInfo() : "";
    return `KAMPAGNE · Mission ${this.missionIdx + 1}/6: ${m.name}<br>${inner}`;
  }
}

Object.assign(BH.Modes, {
  campaign: CampaignStoryMode,
  killconfirmed: KillConfirmedMode,
  hardcore: HardcoreMode,
  infected: InfectedMode,
  training: TrainingMode,
  specops: SpecOpsMode,
});

if (!BH.ROTATING_MODES.includes("killconfirmed")) {
  BH.ROTATING_MODES.push("killconfirmed", "hardcore", "infected");
}

/* Zombies: Pack-a-Punch & Blitz-Wunderwaffe */
(function patchZombies() {
  const Z = BH.Modes.zombies;
  if (!Z || Z._patched) return;
  Z._patched = true;
  const origSetup = Z.prototype.setup;
  Z.prototype.setup = function() {
    origSetup.call(this);
    const g = this.game;
    const papPos = new THREE.Vector3(8, 0, -8);
    g.interactables.push({
      pos: papPos, radius: 2.8,
      label: () => this.papUsed ? "Pack-a-Punch (benutzt)" : "Pack-a-Punch – 2500 Punkte (ab R5)",
      action: () => {
        if (this.papUsed) return;
        if (this.round < 5) { g.showMessage("", "Ab Runde 5 verfügbar!", 1500); return; }
        if (this.points < 2500) { g.showMessage("", "Nicht genug Punkte!", 1200); return; }
        this.points -= 2500;
        this.papUsed = true;
        const w = g.weapons[0];
        w.def = Object.assign({}, w.def, { damage: Math.round(w.def.damage * 2), name: "PACKED · " + w.def.name });
        w.packed = true;
        BH.audio.objective();
        g.showMessage("⚙ PACK-A-PUNCH", w.def.name + " – doppelter Schaden!", 3000);
        g._applyWeaponHud();
      },
    });
    g.interactables.push({
      pos: new THREE.Vector3(-10, 0, 5), radius: 2.5,
      label: () => "Blitz-Stab – 1500 Punkte (ab R12)",
      action: () => {
        if (this.round < 12) { g.showMessage("", "Ab Runde 12!", 1500); return; }
        if (this.points < 1500) { g.showMessage("", "Nicht genug Punkte!", 1200); return; }
        if (this.blitzBought) return;
        this.points -= 1500;
        this.blitzBought = true;
        g.replacePrimary(BH.buildWeapon("blitz", {}, g.weapons[0].camo.id));
        g.weaponIndex = 0;
        g._buildViewmodel();
        g._applyWeaponHud();
        BH.audio.objective();
        g.showMessage("⚡ WUNDERWAFFE", "Blitz-Stab freigeschaltet!", 3000);
      },
    });

    const perks = [
      { id: "jugg", name: "Juggernog", cost: 500, pos: new THREE.Vector3(-6, 0, -12),
        apply: () => { g.player.maxHealth = 200; g.player.health = 200; } },
      { id: "speed", name: "Speed Cola", cost: 400, pos: new THREE.Vector3(6, 0, 12),
        apply: () => { this.perkSpeed = true; } },
      { id: "tap", name: "Double Tap", cost: 600, pos: new THREE.Vector3(0, 0, 14),
        apply: () => { this.perkTap = true; } },
    ];
    if (!this.perksBought) this.perksBought = {};
    for (const pk of perks) {
      g.interactables.push({
        pos: pk.pos, radius: 2.4, _perk: pk.id,
        label: () => this.perksBought[pk.id] ? pk.name + " (aktiv)" : pk.name + " – " + pk.cost + " Punkte",
        action: () => {
          if (this.perksBought[pk.id]) return;
          if (this.points < pk.cost) { g.showMessage("", "Nicht genug Punkte!", 1200); return; }
          this.points -= pk.cost;
          this.perksBought[pk.id] = true;
          pk.apply();
          BH.audio.buy();
          g.showMessage("🥤 PERK", pk.name + " aktiviert!", 2500);
        },
      });
    }

    if (this.map.easterEgg && !this._eggPatched) {
      this._eggPatched = true;
      const eggStep = this.eggStep || 0;
      g.interactables.push({
        pos: new THREE.Vector3(0, 0, -14), radius: 2.2, _egg2: true,
        label: () => eggStep >= 1 ? "Terminal (Schritt 2/3)" : "Terminal gesperrt",
        action: () => {
          if (this.round < 10) { g.showMessage("", "Ab Runde 10!", 1500); return; }
          if (this.eggStep < 1) { g.showMessage("", "Finde zuerst das Geheimnis im Bunker!", 2000); return; }
          this.eggStep = 2;
          this.points += 1000;
          g.showMessage("🥚 EASTER EGG", "Schritt 2: Protokoll BLACK HORIZON entschlüsselt", 3500);
        },
      });
    }
  };

  const origUpdate = Z.prototype.update;
  Z.prototype.update = function(dt) {
    if (this.perkSpeed && this.game.weapons) {
      for (const w of this.game.weapons) {
        if (w.def && !w._speedPatched) {
          w.def = Object.assign({}, w.def, { reloadTime: w.def.reloadTime * 0.65 });
          w._speedPatched = true;
        }
      }
    }
    origUpdate.call(this, dt);
  };

  const origOnZombieKilled = Z.prototype.onZombieKilled;
  Z.prototype.onZombieKilled = function(z, isHead) {
    origOnZombieKilled.call(this, z, isHead);
    if (this.eggStep === 0 && this.round >= 8 && Math.random() < 0.02) {
      this.eggStep = 1;
      this.game.showMessage("🥚 HINWEIS", "Ein Terminal im Ostflügel reagiert…", 3000);
    }
  };
})();
