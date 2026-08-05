/* Live-Ops: Ausrüstung, wöchentliche Operationen, Co-op Strikes, OPERATION-Hub */
window.BH = window.BH || {};

/* ===== AUSRÜSTUNG (Granaten / Gadgets) ===== */
BH.Equipment = {
  ALLOWED_MODES: [
    "tdm", "ffa", "dom", "snd", "conquest", "frontwar", "ranked", "clanmatch",
    "killconfirmed", "hardcore", "infected", "gungame", "operation", "coopstrike",
  ],
  TYPES: {
    frag: {
      id: "frag", name: "SPRENGRATE M41", icon: "💣",
      desc: "Flächenschaden · 95 HP im Kern",
      radius: 6.5, damage: 95, cooldown: 14, stock: 1,
    },
    smoke: {
      id: "smoke", name: "RAUCH M9", icon: "💨",
      desc: "Deckungswolke · 6 s · blockiert Sichtlinie der KI",
      radius: 7, duration: 6, cooldown: 20, stock: 1,
    },
    emp: {
      id: "emp", name: "EMP P47", icon: "⚡",
      desc: "Stört feindliche KI · Verlangsamung 4 s",
      radius: 8, duration: 4, cooldown: 28, stock: 1,
    },
  },
  list() {
    return Object.values(this.TYPES);
  },
  get(id) {
    return this.TYPES[id] || this.TYPES.frag;
  },
  isAllowed(modeId) {
    return this.ALLOWED_MODES.includes(modeId);
  },
  initGame(game) {
    const d = BH.Progress.data;
    const lo = game.loadout || d.loadout || {};
    const id = lo.equipmentId || "frag";
    const def = this.get(id);
    game.equipment = {
      id: def.id,
      def,
      stock: def.stock,
      maxStock: def.stock,
      cooldown: 0,
      smokes: [],
    };
  },
  throw(game) {
    if (!game.equipment || !game.player.alive || game.ending) return false;
    const eq = game.equipment;
    if (eq.stock <= 0) {
      game.showMessage("", "Keine Ausrüstung übrig", 1200);
      return false;
    }
    if (eq.cooldown > 0) {
      game.showMessage("", "Abklingzeit…", 900);
      return false;
    }
    const def = eq.def;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(game.yaw.quaternion);
    const land = game.yaw.position.clone().add(fwd.multiplyScalar(16));
    land.y = 0.5;
    eq.stock--;
    eq.cooldown = def.cooldown;
    if (def.id === "frag") {
      BH.audio.explosion();
      game._explode(land, { radius: def.radius, damage: def.damage }, null);
    } else if (def.id === "smoke") {
      BH.audio.click();
      game.spawnExplosion(land);
      const mesh = game.spawnSmokeVolume(land, def.radius, game.time + def.duration);
      eq.smokes.push({
        pos: land.clone(), until: game.time + def.duration, radius: def.radius, mesh,
      });
      game.showMessage("RAUCH", "Deckung aktiv", 1500);
    } else if (def.id === "emp") {
      BH.audio.objective();
      game.spawnExplosion(land);
      for (const e of game.entities) {
        if (!e.alive || e.isPlayer || e.team === "A") continue;
        const pos = e.group ? e.group.position : e.position;
        if (!pos || pos.distanceTo(land) > def.radius) continue;
        e.slowUntil = game.time + def.duration;
        e.slowFactor = 0.35;
      }
      game.showMessage("EMP", "Feindliche Systeme gestört", 1500);
    }
    return true;
  },
  update(game, dt) {
    const eq = game.equipment;
    if (!eq) return;
    if (eq.cooldown > 0) eq.cooldown = Math.max(0, eq.cooldown - dt);
    if (eq.smokes && eq.smokes.length) {
      eq.smokes = eq.smokes.filter(s => {
        if (s.until <= game.time) {
          if (s.mesh) game.removeSmokeVolume(s.mesh);
          return false;
        }
        return true;
      });
      for (const bot of game.entities) {
        if (!bot.alive || !bot.isBot || bot.team === "A") continue;
        const pos = bot.group ? bot.group.position : bot.position;
        if (!pos) continue;
        let inSmoke = false;
        for (const s of eq.smokes) {
          if (pos.distanceTo(s.pos) < s.radius) { inSmoke = true; break; }
        }
        bot.accuracyMult = inSmoke ? 0.45 : 1;
      }
    }
  },
  hudText(game) {
    const eq = game.equipment;
    if (!eq) return "";
    const cd = eq.cooldown > 0 ? Math.ceil(eq.cooldown) + "s" : "[G]";
    return eq.def.icon + " " + eq.stock + "/" + eq.maxStock + " · " + cd;
  },
};

/* ===== WÖCHENTLICHE OPERATIONEN ===== */
BH.WeeklyOperations = {
  MISSIONS: [
    {
      id: "op_sierra_sweep",
      name: "OPERATION: SIERRA-SÄUBERUNG",
      mapId: "industrial",
      objective: "Eliminiere 18 feindliche Kräfte in Anlage Sierra-7",
      lore: "Geheimdienst meldet feindliche Präsenz in der Anlage — säubere das Gelände.",
      killsNeeded: 18,
      timeLimit: 720,
      rewardCredits: 450,
      rewardXp: 900,
    },
    {
      id: "op_harbor_raid",
      name: "OPERATION: KAI-RAZZIA",
      mapId: "harbor",
      objective: "22 Kills am Militärhafen Delta",
      lore: "Frachtcontainer als Waffendepot — TF Nachtfalke verlangt eine harte Razzia.",
      killsNeeded: 22,
      timeLimit: 780,
      rewardCredits: 500,
      rewardXp: 950,
    },
    {
      id: "op_frost_extract",
      name: "OPERATION: FROST-EXTRAKTION",
      mapId: "arctic",
      objective: "20 Kills & überlebe bis zur Extraktion",
      lore: "Daten-Relais an der Frostlinie — halte die Angreifer auf Abstand.",
      killsNeeded: 20,
      timeLimit: 660,
      rewardCredits: 480,
      rewardXp: 920,
    },
    {
      id: "op_zero_breach",
      name: "OPERATION: ZERO-DURCHBRUCH",
      mapId: "ruins",
      objective: "25 Kills in Vorort Zero",
      lore: "Vanguard-Spuren in den Ruinen — Durchbruch zur Sammelstelle.",
      killsNeeded: 25,
      timeLimit: 840,
      rewardCredits: 550,
      rewardXp: 1000,
    },
    {
      id: "op_tower_assault",
      name: "OPERATION: TOWER-STURM",
      mapId: "tower",
      objective: "24 Kills im Hochhaus Zero",
      lore: "Vertikaler Angriff — Feuerkontrolle auf allen Etagen sichern.",
      killsNeeded: 24,
      timeLimit: 780,
      rewardCredits: 520,
      rewardXp: 980,
    },
  ],

  weekKey() {
    return BH.FactionWar ? BH.FactionWar._weekKey() : "1970-W1";
  },

  current(d) {
    d = d || BH.Progress.data;
    const wk = this.weekKey();
    let hash = 0;
    for (let i = 0; i < wk.length; i++) hash = ((hash << 5) - hash) + wk.charCodeAt(i);
    const idx = Math.abs(hash) % this.MISSIONS.length;
    const mission = this.MISSIONS[idx];
    if (!d.weeklyOp) d.weeklyOp = {};
    if (d.weeklyOp.weekKey !== wk) {
      d.weeklyOp = { weekKey: wk, completed: false, missionId: mission.id };
      BH.Progress.save();
    }
    return { mission, weekKey: wk, completed: !!d.weeklyOp.completed };
  },

  complete(d, success) {
    if (!success) return { ok: false };
    const cur = this.current(d);
    if (cur.completed) return { ok: false, reason: "done" };
    d.weeklyOp.completed = true;
    const m = cur.mission;
    d.credits = (d.credits || 0) + (m.rewardCredits || 400);
    BH.Progress.save();
    return { ok: true, credits: m.rewardCredits, xp: m.rewardXp, mission: m };
  },
};

/* ===== LIVE-OPS HUB (OPERATION-Screen) ===== */
BH.LiveOps = {
  entries(d) {
    d = d || BH.Progress.data;
    const out = [];
    const wop = BH.WeeklyOperations.current(d);
    out.push({
      id: "weekly_op",
      icon: "📋",
      title: wop.completed ? "WÖCHENTLICHE OPERATION · ERLEDIGT" : wop.mission.name,
      desc: wop.completed
        ? "Belohnung diese Woche eingesammelt — nächste Operation Montag."
        : wop.mission.objective + " · ⛁ " + wop.mission.rewardCredits + " · +" + wop.mission.rewardXp + " XP",
      cta: wop.completed ? "ABGESCHLOSSEN" : "OPERATION STARTEN",
      modeId: "operation",
      active: !wop.completed,
      bonus: wop.completed ? null : "+25 % BP-XP",
    });

    if (BH.LTM && BH.LTM.current) {
      const ltm = BH.LTM.current();
      out.push({
        id: "ltm",
        icon: "🔥",
        title: "LTM · " + ltm.name,
        desc: "Limitierter Modus der Woche · +" + Math.round((ltm.bonus - 1) * 100) + " % Saison-XP",
        cta: "LTM SPIELEN",
        modeId: ltm.id,
        active: true,
        bonus: "+" + Math.round((ltm.bonus - 1) * 100) + " % Saison-XP",
      });
    }

    if (BH.FactionWar && d.factionWar && d.factionWar.pledged) {
      const cs = BH.FactionWar.contractStatus(d);
      out.push({
        id: "faction_contract",
        icon: "⚔",
        title: "FRAKTIONS-AUFTRAG",
        desc: cs && cs.def
          ? cs.def.label + " · " + cs.prog + "/" + cs.def.target
          : "Wöchentlicher Auftrag deiner Fraktion",
        cta: "FRAKTION ÖFFNEN",
        screen: "factionwar",
        active: true,
      });
    } else if (BH.FactionWar) {
      out.push({
        id: "faction_join",
        icon: "⚔",
        title: "FRAKTIONSKRIEG",
        desc: "Wähle eine Fraktion — jeder Kill zählt für die Kriegslage.",
        cta: "FRAKTION WÄHLEN",
        screen: "factionwar",
        active: true,
      });
    }

    out.push({
      id: "coop_strike",
      icon: "👥",
      title: "CO-OP STRIKE",
      desc: "Spec-Ops mit 2 Verbündeten-Bots · Auto-Respawn · härtere Ziele",
      cta: "STRIKE STARTEN",
      modeId: "coopstrike",
      active: true,
      bonus: "+15 % XP",
    });

    if (BH.ClanMatches && BH.ClanMatches.isActive && BH.ClanMatches.isActive()) {
      out.push({
        id: "clan_match",
        icon: "🏴",
        title: "CLAN-MATCH",
        desc: "2-Wochen-Event · Clan-TDM · Bonus-Clan-XP",
        cta: "CLAN-MATCH",
        screen: "clan",
        active: true,
      });
    }

    const dl = BH.DailyLogin && BH.DailyLogin.status ? BH.DailyLogin.status(d) : null;
    if (dl && !dl.claimedToday) {
      out.push({
        id: "daily",
        icon: "🎁",
        title: "TÄGLICHE BELOHNUNG",
        desc: "Login-Bonus auf der Startseite einsammeln",
        cta: "ZUR STARTSEITE",
        screen: "home",
        active: true,
      });
    }

    return out;
  },
};

/* ===== MODUS: WÖCHENTLICHE OPERATION ===== */
class OperationMode {
  constructor(game) {
    this.game = game;
    const cur = BH.WeeklyOperations.current(BH.Progress.data);
    this.mission = cur.mission;
    this.title = this.mission.name;
    this.killsNeeded = this.mission.killsNeeded;
    this.killsDone = 0;
    this.timeLeft = this.mission.timeLimit;
    this.finished = false;
    this._nextReinforce = 0;
  }

  setup() {
    const g = this.game;
    const rot = BH.Maps.getMapById
      ? BH.Maps.getMapById(this.mission.mapId)
      : (BH.Maps.MAP_POOL.find(m => m.id === this.mission.mapId) || BH.Maps.getActiveMap());
    this.map = BH.Maps.buildMap ? BH.Maps.buildMap(g.scene, rot) : rot.build(g.scene);
    BH.Maps.sanitizeMapSpawns(this.map);
    g.mapId = rot.id;
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 0));
    const count = Math.min(10, Math.ceil(this.killsNeeded / 2));
    for (let i = 0; i < count; i++) this._spawnEnemy(i);
    g.showMessage(this.title, this.mission.lore, 4500);
    g.setObjective(this.mission.objective + " · 0/" + this.killsNeeded);
  }

  _spawnEnemy(i) {
    const g = this.game;
    const bot = new BH.SoldierBot(g, BH.Maps.pickSpawn(this.map, this.map.spawnsB, i, 3), {
      team: "B", color: 0x6b2e2e, name: "[ZIEL] " + BH.BOT_NAMES[i % BH.BOT_NAMES.length],
      accuracy: 0.18, respawns: false, aiRole: i % 3,
      faction: BH.FactionWar ? BH.FactionWar.botFaction("B", i) : null,
    });
    g.entities.push(bot);
    g.combatants.push(bot);
  }

  onKill(attacker, victim) {
    if (!attacker || !attacker.isPlayer) return;
    this.killsDone++;
    this.game.setObjective(this.mission.objective + " · " + this.killsDone + "/" + this.killsNeeded);
    if (this.killsDone >= this.killsNeeded) this.finish(true);
  }

  onPlayerDeath() {
    this.game.showMessage("OPERATOR DOWN", "Respawn — Mission läuft", 2200);
    this.game.respawnPlayer(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 2));
  }

  respawnBot(bot) {
    /* Verstärkung läuft über update() — kein Extra-Spawn pro Kill */
  }

  update(dt) {
    if (this.finished) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(false); return; }
    const alive = this.game.combatants.filter(c => c.isBot && c.team === "B" && c.alive).length;
    if (alive < 3 && this.killsDone < this.killsNeeded && this.game.time >= this._nextReinforce) {
      this._spawnEnemy(this.killsDone + alive + 10);
      this._nextReinforce = this.game.time + 3.5;
    }
  }

  finish(success) {
    if (this.finished) return;
    this.finished = true;
    const g = this.game;
    let reward = null;
    if (success) reward = BH.WeeklyOperations.complete(BH.Progress.data, true);
    const xp = [];
    if (success) {
      if (!reward || reward.ok) {
        xp.push(["Operation", this.mission.rewardXp]);
        xp.push(["Kills", g.player.kills * 80]);
      } else {
        xp.push(["Wiederholung", Math.round(this.mission.rewardXp * 0.25)]);
        xp.push(["Kills", g.player.kills * 80]);
      }
    } else {
      xp.push(["Versuch", 150]);
    }
    const rewardLabel = success
      ? (reward && reward.ok ? "⛁ " + this.mission.rewardCredits : "Bereits abgeschlossen diese Woche")
      : "—";
    g.endGame({
      title: success ? "✅ " + this.mission.name + " ERFOLG" : "❌ OPERATION GESCHEITERT",
      stats: [
        ["Ziele", this.killsDone + "/" + this.killsNeeded],
        ["Kills", g.player.kills],
        ["Belohnung", rewardLabel],
      ],
      xpBreakdown: xp,
      deltas: {
        kills: g.player.kills,
        matches: 1,
        missionsCompleted: success ? 1 : 0,
        wins: success ? 1 : 0,
      },
    });
  }

  getHudInfo() {
    return `${this.title}<br>${fmtTime(this.timeLeft)} · ${this.killsDone}/${this.killsNeeded}`;
  }
}

/* ===== MODUS: CO-OP STRIKE ===== */
class CoOpStrikeMode {
  constructor(game) {
    this.game = game;
    this.title = "CO-OP STRIKE";
    this.killsNeeded = 16;
    this.killsDone = 0;
    this.timeLeft = 480;
    this.allyNames = ["[ALPHA] Striker", "[ALPHA] Flux"];
    this.playerRespawnAt = -1;
    this.finished = false;
    this._nextReinforce = 0;
  }

  setup() {
    const g = this.game;
    const rot = loadRotatingMap(g);
    this.map = rot.map;
    g.mapId = BH.Maps.getActiveMap().id;
    g.mapSolids = this.map.solids;
    g.obstacles = this.map.obstacles;
    g.bounds = this.map.bounds;
    g.yaw.position.copy(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 0));
    for (let i = 0; i < 2; i++) {
      const ally = new BH.SoldierBot(g, BH.Maps.pickSpawn(this.map, this.map.spawnsA, i + 1, 2), {
        team: "A", color: 0x2e4a6b, name: this.allyNames[i],
        accuracy: 0.28, respawns: true, aiRole: i === 0 ? 0 : 1,
        faction: BH.FactionWar ? BH.FactionWar.botFaction("A", i) : null,
      });
      ally.isAllyEscort = true;
      ally.spawnIdx = i;
      g.entities.push(ally);
      g.combatants.push(ally);
    }
    for (let i = 0; i < 8; i++) this._spawnEnemy(i);
    g.showMessage("CO-OP STRIKE", "2 Verbündete unterstützen dich — halte die Formation", 4000);
    g.setObjective("Eliminiere " + this.killsNeeded + " feindliche Ziele · 0/" + this.killsNeeded);
  }

  _spawnEnemy(i) {
    const g = this.game;
    const bot = new BH.SoldierBot(g, BH.Maps.pickSpawn(this.map, this.map.spawnsB, i, 3), {
      team: "B", color: 0x6b2e2e, name: "[FEIND] " + BH.BOT_NAMES[i % BH.BOT_NAMES.length],
      accuracy: 0.17, respawns: false, aiRole: i % 3,
      faction: BH.FactionWar ? BH.FactionWar.botFaction("B", i) : null,
    });
    g.entities.push(bot);
    g.combatants.push(bot);
  }

  onKill(attacker, victim) {
    if (victim && victim.team === "B" && victim.isBot) {
      this.killsDone++;
      this.game.setObjective("Eliminiere " + this.killsNeeded + " Ziele · " + this.killsDone + "/" + this.killsNeeded);
      if (attacker) {
        this.game.addKillfeed(attacker.name, victim.name, !!attacker.isPlayer);
      }
      if (this.killsDone >= this.killsNeeded) this.finish(true);
    }
    if (victim && victim.isAllyEscort) {
      this.game.showMessage("VERBÜNDETER DOWN", victim.name + " — Respawn in 6 s", 2500);
    }
  }

  onPlayerDeath() {
    this.game.showMessage("OPERATOR DOWN", "Respawn in 5 s — Squad hält die Linie", 2800);
    this.playerRespawnAt = this.game.time + 5;
  }

  respawnBot(bot) {
    if (this.game.ending) return;
    const delay = bot.isAllyEscort ? 6000 : 3500;
    setTimeout(() => {
      if (!this.game.active || this.game.ending) return;
      if (bot.team === "B" && this.killsDone >= this.killsNeeded) return;
      const spawns = bot.team === "A" ? this.map.spawnsA : this.map.spawnsB;
      const pos = BH.Maps.pickSpawn(this.map, spawns, Math.floor(Math.random() * spawns.length), 3);
      const nb = new BH.SoldierBot(this.game, pos, {
        team: bot.team,
        color: bot.bodyColor,
        name: bot.name,
        accuracy: bot.accuracy || 0.2,
        respawns: true,
        aiRole: bot.aiRole || 0,
        speed: bot.speed,
        spawnIdx: bot.spawnIdx,
        faction: bot.faction || (BH.FactionWar ? BH.FactionWar.botFaction(bot.team, bot.spawnIdx || 0) : null),
      });
      if (bot.isAllyEscort) nb.isAllyEscort = true;
      if (bot.isVehicle) {
        nb.isVehicle = true;
        nb.group.scale.setScalar(1.7);
      }
      this.game.entities.push(nb);
      this.game.combatants.push(nb);
    }, delay);
  }

  update(dt) {
    if (this.finished) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(false); return; }
    const g = this.game;
    if (!g.player.alive && this.playerRespawnAt > 0 && g.time >= this.playerRespawnAt) {
      this.playerRespawnAt = -1;
      g.respawnPlayer(BH.Maps.pickSpawn(this.map, this.map.spawnsA, 0, 2));
    }
    const enemies = g.combatants.filter(c => c.isBot && c.team === "B" && c.alive).length;
    if (enemies < 2 && this.killsDone < this.killsNeeded && g.time >= this._nextReinforce) {
      this._spawnEnemy(this.killsDone + enemies + 20);
      this._nextReinforce = g.time + 4;
    }
  }

  finish(success) {
    if (this.finished) return;
    this.finished = true;
    const g = this.game;
    g.endGame({
      title: success ? "✅ CO-OP STRIKE ERFOLG" : "❌ STRIKE GESCHEITERT",
      stats: [["Ziele", this.killsDone + "/" + this.killsNeeded], ["Kills", g.player.kills]],
      xpBreakdown: success
        ? [["Co-op Strike", 850], ["Kills", g.player.kills * 90]]
        : [["Versuch", 180]],
      deltas: { kills: g.player.kills, matches: 1, missionsCompleted: success ? 1 : 0, wins: success ? 1 : 0 },
    });
  }

  getHudInfo() {
    return `${this.title} · ${fmtTime(this.timeLeft)}<br>Ziele: ${this.killsDone}/${this.killsNeeded}`;
  }
}

Object.assign(BH.Modes, {
  operation: OperationMode,
  coopstrike: CoOpStrikeMode,
});
