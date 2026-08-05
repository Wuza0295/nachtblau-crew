/* Spielmodi: Team Deathmatch, Frei-für-Alle, Zombies, Kampagne */
window.BH = window.BH || {};

function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

/* ============= ZONEN-SYSTEM (Herrschaft / Eroberung) ============= */
class ZoneSystem {
  constructor(game, defs, radius) {
    this.game = game;
    this.radius = radius || 7;
    this.zones = defs.map(d => {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x9aa0a6, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
      });
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(this.radius, this.radius, 0.5, 28, 1, true), ringMat);
      ring.position.set(d.pos.x, 0.25, d.pos.z);
      game.scene.add(ring);

      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x9aa0a6, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false,
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 30, 10, 1, true), beamMat);
      beam.position.set(d.pos.x, 15, d.pos.z);
      game.scene.add(beam);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.5, metalness: 0.45 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.6, 8), poleMat);
      pole.position.set(d.pos.x, 1.8, d.pos.z);
      game.scene.add(pole);
      const flagMat = new THREE.MeshStandardMaterial({
        color: 0x9aa0a6, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.05,
        transparent: true, opacity: 0.92,
      });
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.75), flagMat);
      flag.position.set(d.pos.x + 0.35, 3.15, d.pos.z);
      game.scene.add(flag);
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(this.radius * 0.92, this.radius * 0.92, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.9, metalness: 0.15 })
      );
      pad.position.set(d.pos.x, 0.04, d.pos.z);
      game.scene.add(pad);

      return {
        id: d.id, pos: d.pos, owner: null, capturer: null, progress: 0,
        ringMat, beamMat, flagMat, flag, pole,
      };
    });
  }

  colorFor(team) { return team === "A" ? 0x4da3ff : team === "B" ? 0xff5d52 : 0x9aa0a6; }

  update(dt, onCaptured) {
    for (const z of this.zones) {
      if (z.flag) {
        z.flag.rotation.y = Math.sin(this.game.time * 2.2 + z.pos.x * 0.1) * 0.12;
        z.flag.position.x = z.pos.x + 0.35 + Math.sin(this.game.time * 3 + z.pos.z) * 0.08;
      }
      let a = 0, b = 0;
      for (const c of this.game.combatants) {
        if (!c.alive) continue;
        const dx = c.position.x - z.pos.x, dz = c.position.z - z.pos.z;
        if (dx * dx + dz * dz < this.radius * this.radius) {
          if (c.team === "A") a++; else b++;
        }
      }
      let team = null;
      if (a > 0 && b === 0) team = "A";
      else if (b > 0 && a === 0) team = "B";

      if (team && z.owner !== team) {
        if (z.capturer !== team) { z.capturer = team; z.progress = 0; }
        z.progress += dt * 28 * Math.min(3, team === "A" ? a : b);
        if (z.progress >= 100) {
          z.owner = team;
          z.capturer = null;
          z.progress = 0;
          const col = this.colorFor(team);
          z.ringMat.color.setHex(col);
          z.beamMat.color.setHex(col);
          if (z.flagMat) z.flagMat.color.setHex(col);
          if (onCaptured) onCaptured(z, team);
        }
      } else if (!team) {
        z.progress = Math.max(0, z.progress - dt * 12);
      }
    }
  }

  count(team) { return this.zones.filter(z => z.owner === team).length; }

  hud() {
    return this.zones.map(z =>
      `<span style="color:#${this.colorFor(z.owner).toString(16).padStart(6, "0")};font-weight:800">${z.id}</span>`
    ).join(" ");
  }

  /** Zone, in der der Spieler gerade steht (oder null) */
  playerZone() {
    const p = this.game.yaw.position;
    for (const z of this.zones) {
      const dx = p.x - z.pos.x, dz = p.z - z.pos.z;
      if (dx * dx + dz * dz < this.radius * this.radius) return z;
    }
    return null;
  }
}

/* Hilfsfunktion: Bot-Anzahl nach Grafik-Preset */
function bhScaleBots(n) {
  return BH.Graphics ? BH.Graphics.scaleBots(n) : n;
}

/* Hilfsfunktion: rotierende Saison-1-Karte laden */
function loadRotatingMap(g) {
  const rot = BH.Maps.getActiveMap();
  const map = BH.Maps.buildMap ? BH.Maps.buildMap(g.scene, rot) : rot.build(g.scene);
  return { map, name: rot.name + (map.variantLabel || ""), emoji: rot.emoji };
}

function loadClanMatchMap(g) {
  const meta = BH.ClanMatches ? BH.ClanMatches.pickMap() : BH.Maps.getActiveMap();
  const rot = meta || BH.Maps.getActiveMap();
  const map = BH.Maps.buildMap ? BH.Maps.buildMap(g.scene, rot) : rot.build(g.scene);
  return {
    map,
    name: rot.name + (map.variantLabel || ""),
    emoji: rot.emoji,
    id: rot.id,
  };
}

class TDMMode {
  constructor(game) {
    this.game = game;
    this.title = "TEAM DEATHMATCH";
    this.scoreA = 0;
    this.scoreB = 0;
    this.limit = 50;
    this.timeLeft = 600;
    this.alliesCount = bhScaleBots(5);
    this.enemiesCount = bhScaleBots(6);
    this.mapName = "";
    this.playerRespawnAt = -1;
    this._namePool = [...BH.BOT_NAMES].sort(() => Math.random() - 0.5);
    this._nameIdx = 0;
  }

  /** Eindeutiger Bot-Name (wichtig für die Punktetafel) */
  nextBotName(team) {
    const base = this._namePool[this._nameIdx % this._namePool.length];
    const round = Math.floor(this._nameIdx / this._namePool.length);
    this._nameIdx++;
    return (team === "A" ? "[ALPHA] " : "[BRAVO] ") + base + (round > 0 ? "-" + (round + 1) : "");
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
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 2, 0));
    g.yaw.rotation.y = Math.atan2(g.yaw.position.x, g.yaw.position.z);

    for (let i = 0; i < this.alliesCount; i++) this.spawnBot("A", i);
    for (let i = 0; i < this.enemiesCount; i++) this.spawnBot("B", i);

    g.showMessage(this.title, this.mapName + " · Erstes Team mit " + this.limit + " Kills gewinnt", 3500);
  }

  spawnBot(team, idx, name) {
    const g = this.game;
    const spawns = team === "A" ? this.map.spawnsA : this.map.spawnsB;
    const pos = BH.Maps.pickSpawn(this.map, spawns, idx, 3);
    const bot = new BH.SoldierBot(g, pos, {
      team,
      color: team === "A" ? 0x2e4a6b : 0x6b2e2e,
      name: name || this.nextBotName(team),
      faction: BH.FactionWar ? BH.FactionWar.botFaction(team, idx) : null,
      accuracy: 0.20 + Math.random() * 0.1,
      aiRole: idx % 3,
    });
    bot.spawnIdx = idx;
    g.entities.push(bot);
    g.combatants.push(bot);
    return bot;
  }

  respawnBot(bot) {
    if (this.game.ending) return;
    setTimeout(() => {
      if (!this.game.active || this.game.ending) return;
      this.spawnBot(bot.team, bot.spawnIdx != null ? bot.spawnIdx : Math.floor(Math.random() * 6), bot.name);
    }, 2500);
  }

  /** Spieler-Respawn-Logik (von Untermodi wiederverwendet) */
  updatePlayerRespawn() {
    const g = this.game;
    if (!g.player.alive && this.playerRespawnAt > 0 && g.time >= this.playerRespawnAt) {
      this.playerRespawnAt = -1;
      const sp = BH.Maps.pickSpawn(this.map, this.map.spawnsA, Math.floor(Math.random() * this.map.spawnsA.length), 2);
      g.respawnPlayer(sp);
    }
  }

  onKill(attacker, victim) {
    if (attacker) {
      if (attacker.team === "A") this.scoreA++; else if (attacker.team === "B") this.scoreB++;
      if (attacker.isBot) attacker.kills++;
      this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
    }
    this.checkWin();
  }

  onPlayerDeath() {
    const att = this.game.player.lastAttacker;
    if (att) {
      if (att.team === "B") this.scoreB++;
      this.game.addKillfeed(att.name, this.game.playerEntity.name, false);
    }
    this.checkWin();
    this.game.showMessage("ELIMINIERT", "Respawn in 3 Sekunden...", 2800);
    this.playerRespawnAt = this.game.time + 3;
  }

  checkWin() {
    if (this.scoreA >= this.limit || this.scoreB >= this.limit) this.finish();
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(); return; }
    this.updatePlayerRespawn();
  }

  finish() {
    const g = this.game;
    const victory = this.scoreA > this.scoreB;
    const xp = [];
    xp.push(["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100]);
    xp.push(victory ? ["Sieg", 500] : ["Match beendet", 200]);
    g.endGame({
      title: victory ? "🏆 SIEG – TEAM ALPHA" : (this.scoreA === this.scoreB ? "UNENTSCHIEDEN" : "NIEDERLAGE"),
      stats: [
        ["ALPHA", this.scoreA], ["BRAVO", this.scoreB],
        ["Deine Kills", g.player.kills], ["Deine Tode", g.player.deaths],
      ],
      xpBreakdown: xp,
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `${this.title} · ${this.mapName || ""} · ${fmtTime(this.timeLeft)}<br>` +
      `<span class="mi-team-a">ALPHA ${this.scoreA}</span> : <span class="mi-team-b">${this.scoreB} BRAVO</span>` +
      `<br><span style="font-size:12px;color:#7a838c">Ziel: ${this.limit} Kills</span>`;
  }
}

/* ======================= FRONTKRIEG 2.0 (Großschlacht) ======================= */
class FrontWarMode extends TDMMode {
  constructor(game) {
    super(game);
    this.title = "FRONTKRIEG";
    this.limit = 150;
    this.timeLeft = 900;
    this.alliesCount = bhScaleBots(13);
    this.enemiesCount = bhScaleBots(14);
    this.waveTimer = 0;
    this.waveInterval = 8;
    this.frontCenter = null;
    this.tanksSpawned = false;
  }

  setup() {
    super.setup();
    const g = this.game;
    this.frontCenter = new THREE.Vector3(0, 0, 0);
    if (this.map && this.map.bounds) {
      const b = this.map.bounds;
      this.frontCenter.set((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
    }
    for (const bot of g.combatants) {
      if (!bot.isBot) continue;
      bot.objective = this.frontCenter.clone();
      if (bot.team === "A") bot.aiRole = bot.spawnIdx != null && bot.spawnIdx % 4 === 0 ? 2 : bot.spawnIdx % 3;
      else bot.aiRole = 0;
    }
    this._spawnTanks();
    g.showMessage("FRONTKRIEG 2.0", this.mapName + " · Wellen-Respawn · Frontlinie · Panzer", 4000);
  }

  spawnBot(team, idx, name) {
    const bot = super.spawnBot(team, idx, name);
    if (this.frontCenter) bot.objective = this.frontCenter.clone();
    if (team === "B") bot.aiRole = 0;
    return bot;
  }

  _spawnTanks() {
    if (this.tanksSpawned) return;
    const g = this.game;
    const mapId = g.mapId || "";
    if (mapId !== "harbor" && mapId !== "industrial") return;
    this.tanksSpawned = true;
    const spA = BH.Maps.pickSpawn(this.map, this.map.spawnsA, 4, 2);
    const spB = BH.Maps.pickSpawn(this.map, this.map.spawnsB, 4, 2);
    for (const [team, pos, label] of [
      ["A", spA, "Panzer-Alpha"],
      ["B", spB, "Panzer-Bravo"],
    ]) {
      const bot = new BH.SoldierBot(g, pos, {
        team,
        color: team === "A" ? 0x2e4a6b : 0x6b2e2e,
        name: "[PANZER] " + label,
        accuracy: 0.06,
        respawns: false,
        speed: 0.55,
        aiRole: 2,
      });
      bot.isVehicle = true;
      bot.group.scale.setScalar(1.7);
      if (BH.applyVehicleHull) BH.applyVehicleHull(bot);
      bot.objective = this.frontCenter.clone();
      g.entities.push(bot);
      g.combatants.push(bot);
    }
  }

  update(dt) {
    super.update(dt);
    this.waveTimer += dt;
    if (this.waveTimer >= this.waveInterval) {
      this.waveTimer = 0;
      this._waveRespawnAllies();
    }
  }

  _waveRespawnAllies() {
    const g = this.game;
    let dead = 0;
    for (const e of g.entities) {
      if (e.isBot && e.team === "A" && !e.alive && !e.isVehicle) dead++;
    }
    if (dead < 3) return;
    g.showMessage("", "VERBÜNDETEN-WELLE", 1600);
    for (const e of [...g.entities]) {
      if (e.isBot && e.team === "A" && !e.alive && !e.isVehicle) {
        e.removed = true;
        if (e.group && e.group.parent) e.group.parent.remove(e.group);
      }
    }
    const alive = g.combatants.filter(c => c.isBot && c.team === "A" && c.alive && !c.isVehicle).length;
    const need = Math.min(dead, Math.max(0, this.alliesCount - alive));
    for (let i = 0; i < need; i++) {
      this.spawnBot("A", this.alliesCount + i + Math.floor(Math.random() * 4));
    }
  }

  getHudInfo() {
    return `${this.title} · ${this.mapName || ""} · ${fmtTime(this.timeLeft)}<br>` +
      `<span class="mi-team-a">ALPHA ${this.scoreA}</span> : <span class="mi-team-b">${this.scoreB} BRAVO</span>` +
      `<br><span style="font-size:12px;color:#7a838c">Frontlinie · Welle alle ${this.waveInterval}s · Ziel: ${this.limit}</span>`;
  }
}

/* ======================= CLAN MATCH (S2 · alle Karten) ======================= */
class ClanMatchMode extends TDMMode {
  constructor(game) {
    super(game);
    const tag = BH.Progress.data.clan ? BH.Progress.data.clan.tag : "CLAN";
    this.title = "CLAN MATCH · [" + tag + "]";
    this.limit = 45;
    this.timeLeft = 540;
    this.alliesCount = bhScaleBots(6);
    this.enemiesCount = bhScaleBots(6);
    this._rivalLabel = (BH.ClanExt && BH.ClanExt.isLive() && BH.ClanMatches)
      ? BH.ClanMatches.rivalTeamLabel(BH.Progress.data) : "[RIVAL]";
  }

  nextBotName(team) {
    if (!(BH.ClanExt && BH.ClanExt.isLive())) {
      return super.nextBotName(team);
    }
    if (team === "B") {
      const base = this._namePool[this._nameIdx % this._namePool.length];
      const round = Math.floor(this._nameIdx / this._namePool.length);
      this._nameIdx++;
      return this._rivalLabel + " " + base + (round > 0 ? "-" + (round + 1) : "");
    }
    const tag = BH.Progress.data.clan ? BH.Progress.data.clan.tag : "CLAN";
    const base = this._namePool[this._nameIdx % this._namePool.length];
    const round = Math.floor(this._nameIdx / this._namePool.length);
    this._nameIdx++;
    return "[" + tag + "] " + base + (round > 0 ? "-" + (round + 1) : "");
  }

  setup() {
    const g = this.game;
    const rot = loadClanMatchMap(g);
    this.map = rot.map;
    this.mapName = rot.emoji + " " + rot.name;
    g.mapId = rot.id;
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 2, 0));
    g.yaw.rotation.y = Math.atan2(g.yaw.position.x, g.yaw.position.z);

    for (let i = 0; i < this.alliesCount; i++) this.spawnBot("A", i);
    for (let i = 0; i < this.enemiesCount; i++) this.spawnBot("B", i);

    g.showMessage(this.title, this.mapName + " · Zufällige Karte · " + this.limit + " Kills", 3500);
  }

  finish() {
    const g = this.game;
    const victory = this.scoreA > this.scoreB;
    const xp = [];
    xp.push(["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100]);
    xp.push(victory ? ["Clan-Match Sieg", 550] : ["Clan-Match", 220]);
    if (BH.ClanMatches && BH.ClanMatches.isActive()) {
      const cm = BH.ClanMatches.trackMatch(BH.Progress.data, {
        kills: g.player.kills,
        deaths: g.player.deaths,
        wins: victory ? 1 : 0,
        matches: 1,
      }, victory);
      if (cm && cm.bonusXp) xp.push(["Clan-Match Bonus", cm.bonusXp]);
      if (cm && cm.rewards && cm.rewards.length) {
        for (const rw of cm.rewards) {
          if (rw.type === "w5") xp.push(["CM-Belohnung · 5 Siege", 400]);
          if (rw.type === "w10") xp.push(["CM-Belohnung · 10 Siege", 0]);
        }
      }
    }
    g.endGame({
      title: victory ? "🏆 CLAN MATCH · SIEG" : (this.scoreA === this.scoreB ? "CLAN MATCH · REMIS" : "CLAN MATCH · NIEDERLAGE"),
      stats: [
        ["Karte", this.mapName],
        ["ALPHA", this.scoreA], ["BRAVO", this.scoreB],
        ["Deine Kills", g.player.kills], ["Deine Tode", g.player.deaths],
      ],
      xpBreakdown: xp.filter(x => x[1] > 0),
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `${this.title} · ${this.mapName || ""} · ${fmtTime(this.timeLeft)}<br>` +
      `<span class="mi-team-a">ALPHA ${this.scoreA}</span> : <span class="mi-team-b">${this.scoreB} BRAVO</span>` +
      `<br><span style="font-size:12px;color:#7a838c">Clan-Match · Ziel: ${this.limit} Kills</span>`;
  }
}

/* ======================= HERRSCHAFT (Domination) ======================= */
class DominationMode extends TDMMode {
  constructor(game) {
    super(game);
    this.title = "HERRSCHAFT";
    this.limit = 200;
    this.timeLeft = 600;
    this.scoreTimer = 1;
    this.objectiveTimer = 0;
  }

  setup() {
    super.setup();
    const g = this.game;
    this.zoneSys = new ZoneSystem(g, [
      { id: "A", pos: new THREE.Vector3(-40, 0, 0) },
      { id: "B", pos: new THREE.Vector3(0, 0, 0) },
      { id: "C", pos: new THREE.Vector3(40, 0, 0) },
    ]);
    this.assignObjectives();
    g.showMessage("HERRSCHAFT", "Erobere und halte die Zonen A, B und C – erstes Team mit " + this.limit + " Punkten", 4000);
    g.setObjective("Erobere und halte A, B und C");
  }

  assignObjectives() {
    for (const e of this.game.entities) {
      if (!e.isBot || !e.alive) continue;
      // bevorzugt Zonen, die dem eigenen Team nicht gehören
      const open = this.zoneSys.zones.filter(z => z.owner !== e.team);
      const pick = (open.length ? open : this.zoneSys.zones)[Math.floor(Math.random() * (open.length ? open.length : this.zoneSys.zones.length))];
      e.objective = pick.pos;
    }
  }

  spawnBot(team, idx, name) {
    const bot = super.spawnBot(team, idx, name);
    if (this.zoneSys) {
      const z = this.zoneSys.zones[Math.floor(Math.random() * this.zoneSys.zones.length)];
      bot.objective = z.pos;
    }
    return bot;
  }

  onKill(attacker, victim) {
    if (attacker) {
      if (attacker.isBot) attacker.kills++;
      this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
    }
  }

  onPlayerDeath() {
    const att = this.game.player.lastAttacker;
    if (att) this.game.addKillfeed(att.name, this.game.playerEntity.name, false);
    this.game.showMessage("ELIMINIERT", "Respawn in 3 Sekunden...", 2800);
    this.playerRespawnAt = this.game.time + 3;
  }

  update(dt) {
    const g = this.game;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(); return; }
    this.updatePlayerRespawn();

    this.zoneSys.update(dt, (zone, team) => {
      g.showMessage("", `Zone ${zone.id} ${team === "A" ? "von ALPHA erobert" : "an BRAVO verloren"}`, 1800);
      BH.audio.objective();
      this.assignObjectives();
    });

    // Punkte pro gehaltener Zone
    this.scoreTimer -= dt;
    if (this.scoreTimer <= 0) {
      this.scoreTimer = 1;
      this.scoreA += this.zoneSys.count("A");
      this.scoreB += this.zoneSys.count("B");
      if (this.scoreA >= this.limit || this.scoreB >= this.limit) { this.finish(); return; }
    }

    // Bots regelmäßig neu verteilen
    this.objectiveTimer -= dt;
    if (this.objectiveTimer <= 0) {
      this.objectiveTimer = 9;
      this.assignObjectives();
    }

    // Eroberungs-Feedback für den Spieler
    const pz = this.zoneSys.playerZone();
    if (pz && pz.owner !== "A") {
      g.setObjective(`Erobere Zone ${pz.id}… ${Math.round(pz.progress)}%`);
    } else {
      g.setObjective("Erobere und halte A, B und C");
    }
  }

  getHudInfo() {
    return `HERRSCHAFT · ${fmtTime(this.timeLeft)} · ${this.zoneSys ? this.zoneSys.hud() : ""}<br>` +
      `<span class="mi-team-a">ALPHA ${this.scoreA}</span> : <span class="mi-team-b">${this.scoreB} BRAVO</span>` +
      `<br><span style="font-size:12px;color:#7a838c">Ziel: ${this.limit} Punkte</span>`;
  }
}

/* ======================= EROBERUNG (Conquest) ======================= */
class ConquestMode extends TDMMode {
  constructor(game) {
    super(game);
    this.title = "EROBERUNG";
    this.timeLeft = 900;
    this.alliesCount = bhScaleBots(7);
    this.enemiesCount = bhScaleBots(8);
    this.ticketsA = 250;
    this.ticketsB = 250;
    this.bleedTimer = 1;
    this.objectiveTimer = 0;
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
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 2, 0));
    g.yaw.rotation.y = Math.atan2(g.yaw.position.x, g.yaw.position.z);

    for (let i = 0; i < this.alliesCount; i++) this.spawnBot("A", i);
    for (let i = 0; i < this.enemiesCount; i++) this.spawnBot("B", i);

    this.zoneSys = new ZoneSystem(g, [
      { id: "A", pos: new THREE.Vector3(-40, 0, 10) },
      { id: "B", pos: new THREE.Vector3(-20, 0, -25) },
      { id: "C", pos: new THREE.Vector3(0, 0, 15) },
      { id: "D", pos: new THREE.Vector3(25, 0, -20) },
      { id: "E", pos: new THREE.Vector3(42, 0, 8) },
    ], 8);
    this.assignObjectives();

    g.showMessage("EROBERUNG", rot.name + " · Halte die Mehrheit der Zonen", 4000);
    g.setObjective("Erobere die Zonen A–E");
  }

  assignObjectives() {
    for (const e of this.game.entities) {
      if (!e.isBot || !e.alive) continue;
      const open = this.zoneSys.zones.filter(z => z.owner !== e.team);
      const pool = open.length ? open : this.zoneSys.zones;
      e.objective = pool[Math.floor(Math.random() * pool.length)].pos;
    }
  }

  spawnBot(team, idx, name) {
    const bot = super.spawnBot(team, idx, name);
    if (this.zoneSys) {
      const z = this.zoneSys.zones[Math.floor(Math.random() * this.zoneSys.zones.length)];
      bot.objective = z.pos;
    }
    return bot;
  }

  onKill(attacker, victim) {
    if (attacker) {
      if (attacker.isBot) attacker.kills++;
      this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
      // Kills kosten das Opfer-Team ein Ticket
      if (victim.team === "A") this.ticketsA--; else this.ticketsB--;
    }
    this.checkTickets();
  }

  onPlayerDeath() {
    const att = this.game.player.lastAttacker;
    if (att) this.game.addKillfeed(att.name, this.game.playerEntity.name, false);
    this.ticketsA--;
    this.game.showMessage("ELIMINIERT", "Respawn in 3 Sekunden...", 2800);
    this.playerRespawnAt = this.game.time + 3;
    this.checkTickets();
  }

  checkTickets() {
    if (this.ticketsA <= 0 || this.ticketsB <= 0) this.finish();
  }

  update(dt) {
    const g = this.game;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(); return; }
    this.updatePlayerRespawn();

    this.zoneSys.update(dt, (zone, team) => {
      g.showMessage("", `Zone ${zone.id} ${team === "A" ? "von ALPHA erobert" : "an BRAVO verloren"}`, 1800);
      BH.audio.objective();
      this.assignObjectives();
    });

    // Ticket-Bleed bei Zonen-Mehrheit
    this.bleedTimer -= dt;
    if (this.bleedTimer <= 0) {
      this.bleedTimer = 1;
      const za = this.zoneSys.count("A"), zb = this.zoneSys.count("B");
      if (za > zb) this.ticketsB -= (za - zb);
      else if (zb > za) this.ticketsA -= (zb - za);
      this.checkTickets();
      if (this.game.ending) return;
    }

    this.objectiveTimer -= dt;
    if (this.objectiveTimer <= 0) {
      this.objectiveTimer = 9;
      this.assignObjectives();
    }

    const pz = this.zoneSys.playerZone();
    if (pz && pz.owner !== "A") {
      g.setObjective(`Erobere Zone ${pz.id}… ${Math.round(pz.progress)}%`);
    } else {
      g.setObjective("Erobere die Zonen A–E");
    }
  }

  finish() {
    const g = this.game;
    const victory = this.ticketsA > this.ticketsB;
    g.endGame({
      title: victory ? "🏆 SIEG – TEAM ALPHA" : (this.ticketsA === this.ticketsB ? "UNENTSCHIEDEN" : "NIEDERLAGE"),
      stats: [
        ["Tickets ALPHA", Math.max(0, this.ticketsA)], ["Tickets BRAVO", Math.max(0, this.ticketsB)],
        ["Deine Kills", g.player.kills], ["Deine Tode", g.player.deaths],
      ],
      xpBreakdown: [
        ["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100],
        victory ? ["Sieg", 500] : ["Match beendet", 200],
      ],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `EROBERUNG · ${fmtTime(this.timeLeft)} · ${this.zoneSys ? this.zoneSys.hud() : ""}<br>` +
      `<span class="mi-team-a">ALPHA ${Math.max(0, this.ticketsA)}</span> ⛶ <span class="mi-team-b">${Math.max(0, this.ticketsB)} BRAVO</span>` +
      `<br><span style="font-size:12px;color:#7a838c">Tickets des Gegners auf 0 bringen</span>`;
  }
}

/* ======================= FREI-FÜR-ALLE ======================= */
class FFAMode {
  constructor(game) {
    this.game = game;
    this.title = "FREI-FÜR-ALLE";
    this.limit = 25;
    this.timeLeft = 600;
    this.mapName = "";
    this.playerRespawnAt = -1;
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
    g.playerEntity.team = "P";
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsFFA, 0, 0));
    g.yaw.rotation.y = Math.atan2(g.yaw.position.x, g.yaw.position.z);

    this.bots = [];
    const colors = [0x5a3a6b, 0x6b5a2e, 0x2e6b5a, 0x6b2e4a, 0x3a5a6b, 0x556b2e, 0x6b462e];
    for (let i = 0; i < 7; i++) {
      const bot = this.spawnBot(i, colors[i], BH.BOT_NAMES[i + 8]);
      this.bots.push(bot);
    }
    g.showMessage("FREI-FÜR-ALLE", this.mapName + " · Erster mit " + this.limit + " Kills gewinnt", 3500);
  }

  spawnBot(i, color, name) {
    const g = this.game;
    const pos = BH.Maps.pickSpawn(this.map, this.map.spawnsFFA, i + 1, 3);
    const bot = new BH.SoldierBot(g, pos, {
      team: "F" + i, color, name,
      faction: BH.FactionWar ? BH.FactionWar.botFaction("F" + i, i) : null,
      accuracy: 0.18 + Math.random() * 0.12,
      aiRole: i % 3,
    });
    bot.ffaIdx = i;
    bot.ffaColor = color;
    g.entities.push(bot);
    g.combatants.push(bot);
    return bot;
  }

  respawnBot(bot) {
    if (this.game.ending) return;
    setTimeout(() => {
      if (!this.game.active || this.game.ending) return;
      const nb = this.spawnBot(bot.ffaIdx, bot.ffaColor, bot.name);
      nb.kills = bot.kills;
      this.bots[bot.ffaIdx] = nb;
    }, 2500);
  }

  onKill(attacker, victim) {
    if (attacker) {
      if (attacker.isBot) attacker.kills++;
      this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
    }
    this.checkWin();
  }

  onPlayerDeath() {
    const att = this.game.player.lastAttacker;
    if (att) this.game.addKillfeed(att.name, this.game.playerEntity.name, false);
    this.game.showMessage("ELIMINIERT", "Respawn in 3 Sekunden...", 2800);
    this.playerRespawnAt = this.game.time + 3;
    this.checkWin();
  }

  topBotKills() {
    let top = 0;
    for (const b of this.bots) top = Math.max(top, b.kills);
    return top;
  }

  checkWin() {
    if (this.game.player.kills >= this.limit || this.topBotKills() >= this.limit) this.finish();
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(); return; }
    const g = this.game;
    if (!g.player.alive && this.playerRespawnAt > 0 && g.time >= this.playerRespawnAt) {
      this.playerRespawnAt = -1;
      // Spawn möglichst weit weg von Gegnern wählen
      let best = null, bestD = -1;
      for (const sp of this.map.spawnsFFA) {
        let minD = Infinity;
        for (const c of g.combatants) if (c.alive && !c.isPlayer) minD = Math.min(minD, sp.distanceTo(c.position));
        if (minD > bestD) { bestD = minD; best = sp; }
      }
      g.respawnPlayer(best ? BH.Maps.pickSpawn(this.map, [best], 0, 2) : BH.Maps.pickSpawn(this.map, this.map.spawnsFFA, 0, 0));
    }
  }

  finish() {
    const g = this.game;
    const victory = g.player.kills >= this.topBotKills();
    g.endGame({
      title: victory ? "🏆 PLATZ 1" : "MATCH BEENDET",
      stats: [
        ["Deine Kills", g.player.kills], ["Beste(r) Bot", this.topBotKills()],
        ["Kopftreffer", g.player.headshots], ["Tode", g.player.deaths],
      ],
      xpBreakdown: [
        ["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100],
        victory ? ["Sieg", 500] : ["Match beendet", 200],
      ],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `FREI-FÜR-ALLE · ${this.mapName || ""} · ${fmtTime(this.timeLeft)}<br>` +
      `<span class="mi-strong">DU: ${this.game.player.kills}</span> · Bester Bot: ${this.topBotKills()}` +
      `<br><span style="font-size:12px;color:#7a838c">Ziel: ${this.limit} Kills</span>`;
  }
}

/* ======================= SUCHEN & ZERSTÖREN ======================= */
class SearchDestroyMode {
  constructor(game) {
    this.game = game;
    this.title = "SUCHEN & ZERSTÖREN";
    this.roundsToWin = 3;
    this.winsA = 0;
    this.winsB = 0;
    this.roundNum = 0;
    this.state = "idle";        // live | ended
    this.stateTimer = 0;
    this.roundTime = 120;
    this.planting = null;       // { site, t }
    this.bomb = null;           // { site, fuse, beam }
    this.siteRadius = 6;
    this.mapName = "";
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

    // Feste Bot-Namen über alle Runden (für die Punktetafel)
    const pool = [...BH.BOT_NAMES].sort(() => Math.random() - 0.5);
    this.namesA = pool.slice(0, 3).map(n => "[ALPHA] " + n);
    this.namesB = pool.slice(3, 7).map(n => "[BRAVO] " + n);

    this.sites = [
      { id: "A", pos: new THREE.Vector3(-20, 0, 20) },
      { id: "B", pos: new THREE.Vector3(20, 0, -20) },
    ];
    for (const s of this.sites) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false,
      });
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(this.siteRadius, this.siteRadius, 0.5, 24, 1, true), ringMat);
      ring.position.set(s.pos.x, 0.25, s.pos.z);
      g.scene.add(ring);

      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xff8800, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false,
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 28, 10, 1, true), beamMat);
      beam.position.set(s.pos.x, 14, s.pos.z);
      g.scene.add(beam);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.5, metalness: 0.45 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.2, 8), poleMat);
      pole.position.set(s.pos.x, 2.1, s.pos.z);
      g.scene.add(pole);

      const orbMat = new THREE.MeshStandardMaterial({
        color: 0xffaa22, emissive: 0xff8800, emissiveIntensity: 0.85, roughness: 0.35, metalness: 0.2,
      });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), orbMat);
      orb.position.set(s.pos.x, 4.5, s.pos.z);
      g.scene.add(orb);

      const plaqueMat = new THREE.MeshStandardMaterial({
        color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.25,
      });
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.1), plaqueMat);
      plaque.position.set(s.pos.x, 2.9, s.pos.z + 0.42);
      g.scene.add(plaque);

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(this.siteRadius * 0.88, this.siteRadius * 0.88, 0.1, 24),
        new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.9, metalness: 0.15 })
      );
      pad.position.set(s.pos.x, 0.05, s.pos.z);
      g.scene.add(pad);

      s.beacon = { ringMat, beamMat, orb, orbMat, plaque };

      g.interactables.push({
        pos: s.pos, radius: this.siteRadius,
        label: () => this.bomb ? "Bombe tickt..." : (this.planting ? "Platzierung läuft..." : `Bombe an Spot ${s.id} platzieren (3s)`),
        action: () => {
          if (this.state !== "live" || this.bomb || this.planting) return;
          this.planting = { site: s, t: 3 };
          g.showMessage("", "Bombe wird platziert – bleib im Bereich!", 1500);
        },
      });
    }

    g.showMessage("SUCHEN & ZERSTÖREN", this.mapName + " · Keine Respawns! Best of 5", 4500);
    this.startRound();
  }

  startRound() {
    this.roundNum++;
    this.state = "live";
    this.roundTime = 120;
    this.planting = null;
    this.clearBomb();

    const g = this.game;
    g.refillAmmo();
    g.respawnPlayer(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 2, 0));
    g.yaw.rotation.y = Math.atan2(g.yaw.position.x, g.yaw.position.z);

    // 3 Verbündete, 4 Verteidiger – ohne Respawns
    for (let i = 0; i < 3; i++) this.spawnBot("A", i);
    for (let i = 0; i < 4; i++) this.spawnBot("B", i);

    g.setObjective(`Platziere die Bombe an Spot A oder B (${this.roundsToWin} Rundensiege nötig)`);
    g.showMessage("RUNDE " + this.roundNum, `ALPHA ${this.winsA} : ${this.winsB} BRAVO`, 2500);
    BH.audio.round();
  }

  spawnBot(team, idx) {
    const g = this.game;
    const spawns = team === "A" ? this.map.spawnsA : this.map.spawnsB;
    const pos = BH.Maps.pickSpawn(this.map, spawns, idx, 2);
    const names = team === "A" ? this.namesA : this.namesB;
    const bot = new BH.SoldierBot(g, pos, {
      team,
      color: team === "A" ? 0x2e4a6b : 0x6b2e2e,
      name: names[idx % names.length],
      faction: BH.FactionWar ? BH.FactionWar.botFaction(team, idx) : null,
      accuracy: 0.20 + Math.random() * 0.1,
      respawns: false,
      aiRole: idx % 3,
    });
    // Beide Teams orientieren sich an den Bombenspots
    bot.objective = this.sites[Math.floor(Math.random() * this.sites.length)].pos;
    g.entities.push(bot);
    g.combatants.push(bot);
    return bot;
  }

  clearBots() {
    for (const e of this.game.entities) {
      if (e.isBot) {
        e.alive = false;
        e.removed = true;
        if (e.group.parent) e.group.parent.remove(e.group);
      }
    }
  }

  clearBomb() {
    if (this.bomb && this.bomb.beam) {
      this.game.scene.remove(this.bomb.beam);
      this.bomb.beam.geometry.dispose();
      this.bomb.beam.material.dispose();
    }
    this.bomb = null;
  }

  aliveCount(team) {
    let n = 0;
    for (const c of this.game.combatants) {
      if (c.alive && c.team === team) n++;
    }
    return n;
  }

  onKill(attacker, victim) {
    if (attacker) {
      if (attacker.isBot) attacker.kills++;
      this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
    }
    if (this.state !== "live") return;
    if (this.aliveCount("B") === 0) this.endRound("A", "BRAVO eliminiert");
    else if (this.aliveCount("A") === 0) this.endRound("B", "ALPHA eliminiert");
  }

  onPlayerDeath() {
    const att = this.game.player.lastAttacker;
    if (att) this.game.addKillfeed(att.name, this.game.playerEntity.name, false);
    if (this.state !== "live") return;
    this.planting = null;
    // Ohne den Spieler ist die Runde verloren
    this.endRound("B", "Du bist gefallen");
  }

  endRound(team, reason) {
    if (this.state !== "live") return;
    this.state = "ended";
    this.stateTimer = 3.5;
    this.planting = null;
    if (team === "A") this.winsA++; else this.winsB++;
    this.game.showMessage(
      team === "A" ? "RUNDE GEWONNEN" : "RUNDE VERLOREN",
      `${reason} · ALPHA ${this.winsA} : ${this.winsB} BRAVO`, 3000);
    BH.audio.objective();
  }

  update(dt) {
    const g = this.game;

    if (this.state === "ended") {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.clearBots();
        this.clearBomb();
        if (this.winsA >= this.roundsToWin || this.winsB >= this.roundsToWin) this.finish();
        else this.startRound();
      }
      return;
    }
    if (this.state !== "live") return;

    // Bomben-Spot-Beacons pulsieren
    const pulse = 0.75 + Math.sin(g.time * 3.2) * 0.25;
    for (const s of this.sites) {
      if (!s.beacon) continue;
      if (s.beacon.orbMat) s.beacon.orbMat.emissiveIntensity = 0.55 + pulse * 0.45;
      if (s.beacon.beamMat) s.beacon.beamMat.opacity = 0.08 + pulse * 0.1;
      if (s.beacon.plaque) s.beacon.plaque.rotation.y = Math.sin(g.time * 1.8 + s.pos.x) * 0.08;
    }

    // Rundentimer (pausiert, sobald die Bombe liegt)
    if (!this.bomb) {
      this.roundTime -= dt;
      if (this.roundTime <= 0) { this.endRound("B", "Zeit abgelaufen"); return; }
    }

    // Bombe platzieren
    if (this.planting && g.player.alive) {
      const d = g.yaw.position.distanceTo(this.planting.site.pos);
      if (d > this.siteRadius) {
        this.planting = null;
        g.showMessage("", "Platzierung abgebrochen", 1200);
      } else {
        this.planting.t -= dt;
        g.setObjective(`Bombe wird platziert… ${Math.ceil(this.planting.t)}s`);
        if (this.planting.t <= 0) {
          const site = this.planting.site;
          this.planting = null;
          const mat = new THREE.MeshBasicMaterial({
            color: 0xff2200, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false,
          });
          const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 35, 10, 1, true), mat);
          beam.position.set(site.pos.x, 17, site.pos.z);
          g.scene.add(beam);
          this.bomb = { site, fuse: 10, beam };
          g.showMessage("💣 BOMBE PLATZIERT", "Verteidige sie 10 Sekunden!", 2500);
          BH.audio.objective();
          // Verteidiger stürmen den Spot
          for (const e of g.entities) {
            if (e.isBot && e.alive && e.team === "B") e.objective = site.pos;
          }
        }
      }
    }

    // Zündschnur
    if (this.bomb) {
      this.bomb.fuse -= dt;
      this.bomb.beam.material.opacity = 0.25 + Math.sin(g.time * 8) * 0.15;
      g.setObjective(`💣 Detonation in ${Math.ceil(this.bomb.fuse)}s`);
      if (this.bomb.fuse <= 0) {
        const pos = this.bomb.site.pos.clone();
        pos.y = 1;
        g.spawnExplosion(pos);
        BH.audio.explosion();
        for (const e of [...g.entities]) {
          if (e.alive && e.group.position.distanceTo(pos) < 14) {
            e.takeDamage(999, false, g.playerEntity);
          }
        }
        this.clearBomb();
        this.endRound("A", "Ziel zerstört");
        return;
      }
    } else if (!this.planting) {
      g.setObjective(`Platziere die Bombe an Spot A oder B · ${fmtTime(this.roundTime)}`);
    }
  }

  finish() {
    const g = this.game;
    const victory = this.winsA > this.winsB;
    g.endGame({
      title: victory ? "🏆 SIEG – TEAM ALPHA" : "NIEDERLAGE",
      stats: [
        ["Runden ALPHA", this.winsA], ["Runden BRAVO", this.winsB],
        ["Deine Kills", g.player.kills], ["Deine Tode", g.player.deaths],
      ],
      xpBreakdown: [
        ["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100],
        ["Rundensiege (" + this.winsA + " × 150 XP)", this.winsA * 150],
        victory ? ["Sieg", 500] : ["Match beendet", 200],
      ],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `SUCHEN & ZERSTÖREN · ${this.mapName || ""} · RUNDE ${this.roundNum}<br>` +
      `<span class="mi-team-a">ALPHA ${this.winsA}</span> : <span class="mi-team-b">${this.winsB} BRAVO</span>` +
      `<br><span style="font-size:12px;color:#7a838c">` +
      (this.bomb ? `💣 ${Math.ceil(this.bomb.fuse)}s` : `Gegner: ${this.aliveCount("B")} · ${fmtTime(Math.max(0, this.roundTime))}`) +
      `</span>`;
  }
}

/* ======================= ZOMBIES: OPERATION OUTBREAK ======================= */
class ZombiesMode {
  constructor(game) {
    this.game = game;
    this.title = "OPERATION: OUTBREAK";
    this.round = 0;
    this.toSpawn = 0;
    this.spawnTimer = 0;
    this.betweenTimer = 3;
    this.inRound = false;
    this.points = 500;
    this.totalKills = 0;
    this.gameOverAt = -1;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildBunker(g.scene);
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(this.map.playerSpawn);

    document.getElementById("points-display").classList.remove("hidden");

    g.interactables.push({
      pos: this.map.ammoStation.pos, radius: 3.2,
      label: () => "Munition auffüllen – 500 Punkte",
      action: () => {
        if (this.points < 500) { g.showMessage("", "Nicht genug Punkte!", 1200); return; }
        this.points -= 500;
        g.refillAmmo();
        BH.audio.buy();
        g.showMessage("", "Munition aufgefüllt", 1200);
      },
    });
    g.interactables.push({
      pos: this.map.mysteryStation.pos, radius: 3.2,
      label: () => "Mystery-Box – 950 Punkte",
      action: () => {
        if (this.points < 950) { g.showMessage("", "Nicht genug Punkte!", 1200); return; }
        this.points -= 950;
        const w = BH.randomWeapon(g.weapons[0].camo.id);
        g.replacePrimary(w);
        g.weaponIndex = 0;
        g._buildViewmodel();
        g._applyWeaponHud();
        BH.audio.buy();
        g.showMessage("", "🎁 " + w.def.name, 2000);
      },
    });

    g.showMessage("OPERATION: OUTBREAK", "Überlebe so lange wie möglich – [E] an Stationen kaufen", 4000);

    if (this.map.easterEgg) {
      g.interactables.push({
        pos: this.map.easterEgg, radius: 2.5,
        label: () => "??? Geheimnis untersuchen",
        action: () => {
          if (this.easterFound) return;
          this.easterFound = true;
          this.eggStep = Math.max(this.eggStep || 0, 1);
          if (BH.Progress && BH.Progress.data) BH.Progress.data.zombieEasterEgg = true;
          this.points += 2000;
          g.refillAmmo();
          BH.audio.objective();
          g.showMessage("🥚 EASTER EGG", "Projekt BLACK HORIZON – Prototyp freigeschaltet!", 4000);
          g.replacePrimary(BH.buildWeapon("rail", {}, g.weapons[0].camo.id));
          g.weaponIndex = 0;
          g._buildViewmodel();
          g._applyWeaponHud();
        },
      });
    }
  }

  startRound() {
    this.round++;
    this.inRound = true;
    this.toSpawn = Math.min(45, 5 + this.round * 4);
    this.spawnTimer = 0.5;
    BH.audio.round();
    this.game.showMessage("RUNDE " + this.round, this.toSpawn + " Zombies nähern sich...", 2800);
  }

  aliveZombies() {
    let n = 0;
    for (const e of this.game.entities) if (e.isZombie && e.alive) n++;
    return n;
  }

  spawnZombie() {
    const g = this.game;
    const gate = this.map.zombieGates[Math.floor(Math.random() * this.map.zombieGates.length)];
    const pos = gate.clone();
    pos.x += (Math.random() - 0.5) * 3;
    pos.z += (Math.random() - 0.5) * 3;

    const runner = this.round >= 10 && Math.random() < 0.35;
    const tank = this.round >= 10 && Math.random() < 0.12;
    const exploder = this.round >= 10 && Math.random() < 0.15;
    const special = this.round >= 4 && !tank && !exploder && Math.random() < 0.08;
    let zType = "normal";
    if (tank) zType = "tank";
    else if (exploder) zType = "exploder";
    else if (runner) zType = "runner";
    else if (special) zType = "brute";

    const z = new BH.Zombie(g, pos, {
      health: (60 + this.round * 14) * (zType === "tank" ? 4 : zType === "brute" ? 3 : 1),
      speed: zType === "runner" ? 4.2 : zType === "tank" ? 1.4 : zType === "exploder" ? 2.8 : (special ? 2.0 : 1.6 + Math.random() * 0.8),
      damage: zType === "tank" ? 28 : zType === "exploder" ? 8 : (special ? 22 : 12),
      special: zType === "brute",
      zType,
    });
    g.entities.push(z);
    this.toSpawn--;
  }

  onZombieHit() { this.points += 10; }

  onZombieKilled(z, isHead) {
    this.points += isHead ? 100 : 60;
    this.totalKills++;
  }

  onPlayerDeath() {
    this.game.showMessage("DU BIST GEFALLEN", "Runde " + this.round, 3000);
    this.gameOverAt = this.game.time + 2.5;
  }

  update(dt) {
    const g = this.game;
    if (this.gameOverAt > 0 && g.time >= this.gameOverAt) { this.finish(); return; }
    if (!g.player.alive) return;

    document.getElementById("points-value").textContent = this.points;

    // Flackernde Lichter
    if (this.map.flicker) {
      for (const l of this.map.flicker) {
        l.intensity = Math.max(0.2, l.intensity + (Math.random() - 0.5) * 0.25);
        l.intensity = Math.min(1.3, l.intensity);
      }
    }

    if (!this.inRound) {
      this.betweenTimer -= dt;
      if (this.betweenTimer <= 0) this.startRound();
      return;
    }

    // Spawnen
    if (this.toSpawn > 0) {
      this.spawnTimer -= dt;
      const maxAlive = Math.min(14, 6 + this.round);
      if (this.spawnTimer <= 0 && this.aliveZombies() < maxAlive) {
        this.spawnZombie();
        this.spawnTimer = Math.max(0.4, 1.4 - this.round * 0.08);
      }
    } else if (this.aliveZombies() === 0) {
      // Runde geschafft
      this.inRound = false;
      this.betweenTimer = 6;
      this.points += 100;
      g.showMessage("RUNDE " + this.round + " ÜBERSTANDEN", "+100 Punkte · Nächste Runde in 6 Sekunden", 3500);
      BH.audio.objective();
    }
  }

  finish() {
    const g = this.game;
    g.endGame({
      title: "🧟 ÜBERRANNT IN RUNDE " + this.round,
      stats: [
        ["Erreichte Runde", this.round], ["Zombie-Kills", this.totalKills],
        ["Kopftreffer", g.player.headshots], ["Punkte gesamt", this.points],
      ],
      xpBreakdown: [
        ["Zombie-Kills (" + this.totalKills + " × 40 XP)", this.totalKills * 40],
        ["Überlebte Runden (" + (this.round - 1) + " × 150 XP)", Math.max(0, this.round - 1) * 150],
      ],
      deltas: { zombieKills: this.totalKills, matches: 1, bestZombieRound: this.round },
    });
  }

  getHudInfo() {
    const remaining = this.toSpawn + this.aliveZombies();
    return `<span class="mi-strong" style="color:#ff3b30">RUNDE ${this.round}</span><br>` +
      (this.inRound ? `Zombies: ${remaining}` : `Nächste Runde in ${Math.ceil(this.betweenTimer)}s`) +
      `<br><span style="font-size:12px;color:#7a838c">Kills: ${this.totalKills}</span>`;
  }
}

/* ======================= KAMPAGNE: MISSION 1 ======================= */
class CampaignMode {
  constructor(game) {
    this.game = game;
    this.title = "KAMPAGNE · SCHWARZER MORGEN";
    this.phase = -1;
    this.killsNeeded = 8;
    this.killsDone = 0;
    this.defendTime = 45;
    this.waveTimer = 0;
    this.beacon = null;
    this.failAt = -1;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildDesert(g.scene);
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(this.map.playerSpawn);
    g.yaw.rotation.y = Math.atan2(g.yaw.position.x, g.yaw.position.z);

    g.showMessage("MISSION 1: SCHWARZER MORGEN", "Wüste Rotglut, 04:50 Uhr – Vanguard-Lager aufklären", 4500);
    setTimeout(() => { if (g.active && !g.ending) this.nextPhase(); }, 4000);
  }

  setBeacon(pos) {
    this.clearBeacon();
    const geo = new THREE.CylinderGeometry(1.2, 1.2, 40, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, transparent: true, opacity: 0.28,
      side: THREE.DoubleSide, depthWrite: false,
    });
    this.beacon = new THREE.Mesh(geo, mat);
    this.beacon.position.set(pos.x, 20, pos.z);
    this.game.scene.add(this.beacon);
    this.beaconPos = pos.clone();
  }

  clearBeacon() {
    if (this.beacon) {
      this.game.scene.remove(this.beacon);
      this.beacon.geometry.dispose();
      this.beacon.material.dispose();
      this.beacon = null;
    }
  }

  spawnEnemy(pos, accuracy) {
    const g = this.game;
    const p = pos.clone();
    p.x += (Math.random() - 0.5) * 5;
    p.z += (Math.random() - 0.5) * 5;
    const bot = new BH.SoldierBot(g, p, {
      team: "E",
      color: 0x7a3520,
      name: "Vanguard " + BH.BOT_NAMES[Math.floor(Math.random() * BH.BOT_NAMES.length)],
      accuracy: accuracy || 0.16,
      respawns: false,
      speed: 3.8,
    });
    g.entities.push(bot);
    g.combatants.push(bot);
    return bot;
  }

  nextPhase() {
    const g = this.game;
    this.phase++;
    BH.audio.objective();
    switch (this.phase) {
      case 0:
        g.setObjective("Erreiche den Aussichtspunkt");
        g.showMessage("NEUES ZIEL", "Folge der Markierung zum Aussichtspunkt", 3000);
        this.setBeacon(this.map.lookout);
        break;
      case 1:
        g.setObjective(`Eliminiere die Patrouille (0/${this.killsNeeded})`);
        g.showMessage("FEINDKONTAKT", "Vanguard-Patrouille im Lager gesichtet", 3000);
        this.clearBeacon();
        for (let i = 0; i < this.killsNeeded; i++) {
          this.spawnEnemy(this.map.campSpawns[i % this.map.campSpawns.length]);
        }
        break;
      case 2:
        g.setObjective("Verteidige die Position (45s)");
        g.showMessage("VERSTÄRKUNG IM ANMARSCH", "Halte das Lager, bis die Evakuierung bereit ist", 3500);
        this.defendTime = 45;
        this.waveTimer = 2;
        break;
      case 3:
        g.setObjective("Erreiche die Evakuierungszone");
        g.showMessage("EVAC BEREIT", "Beweg dich zur Markierung – sofort!", 3000);
        this.setBeacon(this.map.evacPoint);
        break;
      case 4:
        this.finish(true);
        break;
    }
  }

  onKill(attacker, victim) {
    if (attacker && attacker.isPlayer) {
      this.game.addKillfeed(this.game.playerEntity.name, victim.name, true);
      if (this.phase === 1) {
        this.killsDone++;
        this.game.setObjective(`Eliminiere die Patrouille (${this.killsDone}/${this.killsNeeded})`);
        if (this.killsDone >= this.killsNeeded) this.nextPhase();
      }
    }
  }

  onPlayerDeath() {
    this.game.showMessage("MISSION GESCHEITERT", "Du wurdest gefallen gemeldet", 3000);
    this.failAt = this.game.time + 2.5;
  }

  update(dt) {
    const g = this.game;
    if (this.failAt > 0 && g.time >= this.failAt) { this.finish(false); return; }
    if (!g.player.alive) return;

    if (this.beacon) {
      this.beacon.rotation.y += dt * 0.8;
      this.beacon.material.opacity = 0.2 + Math.sin(g.time * 3) * 0.1;
      const dx = g.yaw.position.x - this.beaconPos.x;
      const dz = g.yaw.position.z - this.beaconPos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 6.5) {
        this.clearBeacon();
        this.nextPhase();
      }
    }

    if (this.phase === 2) {
      this.defendTime -= dt;
      g.setObjective(`Verteidige die Position (${Math.max(0, Math.ceil(this.defendTime))}s)`);
      this.waveTimer -= dt;
      const alive = g.entities.filter(e => e.isBot && e.alive).length;
      if (this.waveTimer <= 0 && alive < 6 && this.defendTime > 4) {
        const sp = this.map.reinforceSpawns[Math.floor(Math.random() * this.map.reinforceSpawns.length)];
        this.spawnEnemy(sp, 0.2);
        this.spawnEnemy(sp, 0.16);
        this.waveTimer = 6;
      }
      if (this.defendTime <= 0) this.nextPhase();
    }
  }

  finish(victory) {
    const g = this.game;
    if (g.mode.handleMissionFinish) {
      g.mode.handleMissionFinish(victory, this);
      return;
    }
    g.endGame({
      title: victory ? "✅ MISSION ERFÜLLT" : "❌ MISSION GESCHEITERT",
      stats: [
        ["Kills", g.player.kills], ["Kopftreffer", g.player.headshots],
        ["Genauigkeit", "–"], ["Status", victory ? "Evakuiert" : "Gefallen"],
      ],
      xpBreakdown: victory
        ? [["Mission abgeschlossen", 1000], ["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100]]
        : [["Einsatzversuch", 150], ["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100]],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, missionsCompleted: victory ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `KAMPAGNE · SCHWARZER MORGEN<br>` +
      `<span style="font-size:12px;color:#7a838c">Kills: ${this.game.player.kills}</span>`;
  }
}

/* ======================= KAMPAGNE MISSION 2: SCHATTENOP ===== */
class Campaign2Mode {
  constructor(game) {
    this.game = game;
    this.title = "KAMPAGNE · SCHATTENOP";
    this.phase = -1;
    this.targetsLeft = 5;
    this.stealthBroken = false;
    this.beacon = null;
    this.failAt = -1;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildIndustrial(g.scene);
    BH.Maps.sanitizeMapSpawns(this.map);
    g.mapId = "industrial";
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 0));
    g.yaw.rotation.y = 0;
    g.showMessage("MISSION 2: SCHATTENOP", "Anlage Sierra-7 – eliminiere 5 Offiziere unentdeckt", 4500);
    setTimeout(() => { if (g.active && !g.ending) this.nextPhase(); }, 4000);
  }

  setBeacon(pos) {
    const g = this.game;
    if (this.beacon) { g.scene.remove(this.beacon); this.beacon = null; }
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 35, 12, 1, true), mat);
    this.beacon.position.set(pos.x, 17, pos.z);
    this.game.scene.add(this.beacon);
    this.beaconPos = pos.clone();
  }

  spawnTarget(i) {
    const g = this.game;
    const pos = BH.Maps.pickSpawn(this.map, this.map.spawnsB, i, 2);
    const bot = new BH.SoldierBot(g, pos, {
      team: "E", color: 0x5a4030, name: "Offizier-" + (i + 1), accuracy: 0.12, respawns: false, speed: 2.5,
    });
    bot.isTarget = true;
    g.entities.push(bot);
    g.combatants.push(bot);
  }

  nextPhase() {
    this.phase++;
    const g = this.game;
    if (this.phase === 0) {
      g.setObjective("Infiltriere die Anlage – eliminiere 5 Offiziere");
      for (let i = 0; i < 5; i++) this.spawnTarget(i);
    } else if (this.phase === 1) {
      g.setObjective("Extraktion – erreiche den Ausgang");
      this.setBeacon(this.map.spawnsA[3]);
    } else this.finish(true);
  }

  onKill(attacker, victim) {
    if (attacker && attacker.isPlayer && victim.isTarget) {
      this.targetsLeft--;
      const g = this.game;
      g.addKillfeed(this.game.playerEntity.name, victim.name, true);
      g.setObjective(`Offiziere übrig: ${this.targetsLeft}` + (this.stealthBroken ? " (Alarm!)" : " (Schleich)"));
      if (this.targetsLeft <= 0) this.nextPhase();
    }
  }

  onPlayerDeath() {
    this.game.showMessage("MISSION GESCHEITERT", "Du wurdest entdeckt", 3000);
    this.failAt = this.game.time + 2.5;
  }

  damagePlayerHook() {
    if (!this.stealthBroken) {
      this.stealthBroken = true;
      this.game.showMessage("ALARM", "Feind weiß von deiner Anwesenheit!", 2500);
    }
  }

  update(dt) {
    const g = this.game;
    if (this.failAt > 0 && g.time >= this.failAt) { this.finish(false); return; }
    if (this.beacon && this.beaconPos) {
      const dx = g.yaw.position.x - this.beaconPos.x, dz = g.yaw.position.z - this.beaconPos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 7) this.nextPhase();
    }
  }

  finish(victory) {
    const g = this.game;
    if (g.mode.handleMissionFinish) {
      g.mode.handleMissionFinish(victory, this);
      return;
    }
    g.endGame({
      title: victory ? "✅ MISSION 2 ERFÜLLT" : "❌ MISSION GESCHEITERT",
      stats: [["Kills", g.player.kills], ["Schleichbonus", this.stealthBroken ? "Nein" : "Ja"], ["Status", victory ? "Extrahiert" : "Gefallen"]],
      xpBreakdown: victory ? [["Mission 2", 1200], ["Kills", g.player.kills * 100]] : [["Versuch", 200]],
      deltas: { kills: g.player.kills, matches: 1, missionsCompleted: victory ? 1 : 0 },
    });
  }

  getHudInfo() { return `KAMPAGNE · SCHATTENOP<br><span style="font-size:12px;color:#7a838c">Ziele: ${this.targetsLeft}</span>`; }
}

/* ======================= KAMPAGNE MISSION 3: PANZERFAHRT ===== */
class Campaign3Mode {
  constructor(game) {
    this.game = game;
    this.title = "KAMPAGNE · PANZERFAHRT";
    this.phase = 0;
    this.turretKills = 0;
    this.turretNeeded = 12;
    this.vehicleT = 0;
    this.failAt = -1;
  }

  setup() {
    const g = this.game;
    this.map = BH.Maps.buildHarbor(g.scene);
    BH.Maps.sanitizeMapSpawns(this.map);
    g.mapId = "harbor";
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.player.alive = true;
    g.yaw.position.set(0, 2.5, 0);
    g.showMessage("MISSION 3: PANZERFAHRT", "Besetze das Fahrzeuggeschütz – schieße feindliche Ziele ab", 4500);
    g.setObjective("Eliminiere feindliche Fahrzeuge: 0/" + this.turretNeeded);
    for (let i = 0; i < 8; i++) this.spawnTarget(i);
  }

  spawnTarget(i) {
    const g = this.game;
    const pos = BH.Maps.pickSpawn(this.map, this.map.spawnsFFA, i, 2);
    const bot = new BH.SoldierBot(g, pos, { team: "E", color: 0x4a3020, name: "Panzer-" + (i + 1), accuracy: 0.08, respawns: false, speed: 0.5 });
    bot.isVehicle = true;
    bot.group.scale.setScalar(1.6);
    g.entities.push(bot);
    g.combatants.push(bot);
  }

  onKill(attacker, victim) {
    if (attacker && attacker.isPlayer) {
      this.turretKills++;
      this.game.setObjective(`Eliminiere feindliche Fahrzeuge: ${this.turretKills}/${this.turretNeeded}`);
      if (this.turretKills >= this.turretNeeded) this.finish(true);
      if (this.turretKills % 3 === 0 && this.turretKills < this.turretNeeded) this.spawnTarget(this.turretKills + 5);
    }
  }

  onPlayerDeath() {
    this.failAt = this.game.time + 2;
  }

  update(dt) {
    const g = this.game;
    if (this.failAt > 0 && g.time >= this.failAt) { this.finish(false); return; }
    this.vehicleT += dt;
    g.yaw.position.x = Math.sin(this.vehicleT * 0.15) * 35;
    g.yaw.position.z = Math.cos(this.vehicleT * 0.12) * 25;
    g.yaw.position.y = 2.5;
    g.player.health = Math.min(g.player.maxHealth, g.player.health + 15 * dt);
  }

  finish(victory) {
    const g = this.game;
    if (g.mode.handleMissionFinish) {
      g.mode.handleMissionFinish(victory, this);
      return;
    }
    g.endGame({
      title: victory ? "✅ MISSION 3 ERFÜLLT" : "❌ FAHRZEUG ZERSTÖRT",
      stats: [["Abschüsse", this.turretKills], ["Kills", g.player.kills]],
      xpBreakdown: victory ? [["Fahrzeugmission", 1500], ["Abschüsse", this.turretKills * 80]] : [["Versuch", 250]],
      deltas: { kills: g.player.kills, matches: 1, missionsCompleted: victory ? 1 : 0 },
    });
  }

  getHudInfo() { return `KAMPAGNE · PANZERFAHRT · ${this.turretKills}/${this.turretNeeded}`; }
}

/* ======================= GUN GAME (Limited-Time) ======================= */
class GunGameMode {
  constructor(game) {
    this.game = game;
    this.title = "GUN GAME · SAISON";
    this.weaponOrder = ["pistol", "smg", "ar", "ak", "shotgun", "dmr", "sniper", "lmg", "viper", "plasma", "kryo", "rail"];
    this.level = 0;
    this.limit = this.weaponOrder.length;
    this.playerRespawnAt = -1;
    this.mapName = "";
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
    g.playerEntity.team = "P";
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsFFA, 0, 0));
    g.weapons[0] = BH.buildWeapon(this.weaponOrder[0], {}, g.weapons[0].camo.id);
    g.weaponIndex = 0;
    g._buildViewmodel();
    g._applyWeaponHud();
    for (let i = 0; i < 6; i++) {
      const pos = BH.Maps.pickSpawn(this.map, this.map.spawnsFFA, i + 1, 3);
      const bot = new BH.SoldierBot(g, pos, {
        team: "F" + i, color: 0x5a3a6b, name: "[GG] " + BH.BOT_NAMES[i], accuracy: 0.2,
        faction: BH.FactionWar ? BH.FactionWar.botFaction("F" + i, i) : null,
        aiRole: i % 3,
      });
      bot.ggLevel = Math.floor(Math.random() * 4);
      g.entities.push(bot);
      g.combatants.push(bot);
    }
    g.showMessage("GUN GAME", "Jeder Kill = nächste Waffe – durch alle 12 zum Sieg!", 4000);
  }

  onKill(attacker, victim) {
    if (attacker && attacker.isPlayer) {
      this.level = Math.min(this.limit, this.level + 1);
      const wid = this.weaponOrder[Math.min(this.level, this.weaponOrder.length - 1)];
      this.game.weapons[0] = BH.buildWeapon(wid, {}, this.game.weapons[0].camo.id);
      this.game._buildViewmodel();
      this.game._applyWeaponHud();
      this.game.addKillfeed(this.game.playerEntity.name, victim.name, true);
      if (this.level >= this.weaponOrder.length) this.finish(true);
    } else if (attacker && attacker.isBot) {
      attacker.ggLevel = (attacker.ggLevel || 0) + 1;
      this.game.addKillfeed(attacker.name, victim.name, false);
      if (attacker.ggLevel >= this.limit - 1) this.finish(false);
    }
  }

  onPlayerDeath() {
    this.game.showMessage("ELIMINIERT", "Respawn...", 2000);
    this.playerRespawnAt = this.game.time + 2;
  }

  update(dt) {
    const g = this.game;
    if (!g.player.alive && this.playerRespawnAt > 0 && g.time >= this.playerRespawnAt) {
      this.playerRespawnAt = -1;
      g.respawnPlayer(BH.Maps.pickSpawn(this.map, this.map.spawnsFFA, 0, 2));
    }
  }

  finish(victory) {
    const g = this.game;
    g.endGame({
      title: victory ? "🏆 GUN GAME SIEG" : "GUN GAME VERLOREN",
      stats: [["Waffen-Stufe", this.level + 1], ["Kills", g.player.kills]],
      xpBreakdown: [["Gun Game", victory ? 600 : 200], ["Kills", g.player.kills * 100]],
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
    });
  }

  getHudInfo() {
    const w = this.weaponOrder[Math.min(this.level, this.weaponOrder.length - 1)];
    const def = BH.WEAPONS[w];
    return `GUN GAME · ${this.mapName}<br>Stufe ${this.level + 1}/${this.limit}: ${def ? def.name : w}`;
  }
}

/* ======================= RANKED ======================= */
class RankedMode extends TDMMode {
  constructor(game) {
    super(game);
    this.title = "RANKED · TEAM DEATHMATCH";
    this.limit = 40;
    this.timeLeft = 480;
  }

  finish() {
    const g = this.game;
    const victory = this.scoreA > this.scoreB;
    const ranked = BH.Ranked.update(BH.Progress.data, victory, g.player.kills);
    const xp = [];
    xp.push(["Kills (" + g.player.kills + " × 100 XP)", g.player.kills * 100]);
    xp.push(victory ? ["Ranked-Sieg", 600] : ["Ranked-Niederlage", 150]);
    xp.push(["LP " + (ranked.delta >= 0 ? "+" : "") + ranked.delta, 0]);
    g.endGame({
      title: victory ? "🏆 RANKED SIEG" : "RANKED NIEDERLAGE",
      stats: [
        ["LP", BH.Progress.data.ranked.lp + " (" + ranked.tier.name + ")"],
        ["LP Änderung", (ranked.delta >= 0 ? "+" : "") + ranked.delta],
        ["ALPHA", this.scoreA], ["BRAVO", this.scoreB],
        ["Deine Kills", g.player.kills],
      ],
      xpBreakdown: xp.filter(x => x[1] > 0),
      deltas: { kills: g.player.kills, deaths: g.player.deaths, matches: 1, wins: victory ? 1 : 0 },
      ranked: true,
    });
  }
}

BH.Modes = {
  tdm: TDMMode,
  ffa: FFAMode,
  zombies: ZombiesMode,
  campaign: CampaignMode,
  gungame: GunGameMode,
  ranked: RankedMode,
  dom: DominationMode,
  snd: SearchDestroyMode,
  conquest: ConquestMode,
  frontwar: FrontWarMode,
  clanmatch: ClanMatchMode,
};
