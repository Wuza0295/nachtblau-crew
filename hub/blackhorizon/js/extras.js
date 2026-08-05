/* Schuss-Ping, Achievements, Ambient, Touch, Briefings */
window.BH = window.BH || {};

/* ===== SCHUSS-PING (nur Minimap, bei Feuer) ===== */
BH.ShotPing = {
  TTL: 2.8,
  MODES: ["tdm", "ffa", "dom", "snd", "conquest", "frontwar", "gungame", "ranked", "killconfirmed", "infected", "clanmatch"],
  enabledFor(modeId) { return this.MODES.includes(modeId); },
};

BH.CampaignBriefings = [
  { num: 1, name: "Schwarzer Morgen", objective: "Wüstenlager aufklären, Patrouille eliminieren, Evakuierung.", lore: "04:50 Uhr, Wüste Rotglut. Vanguard-Lager gesichtet." },
  { num: 2, name: "Schattenop", objective: "5 Offiziere lautlos eliminieren und extrahieren.", lore: "Anlage Sierra-7. Kein Alarm. Kein Fehler." },
  { num: 3, name: "Panzerfahrt", objective: "12 feindliche Fahrzeuge mit dem Geschütz zerstören.", lore: "Militärhafen Delta. Du bist die letzte Linie." },
  { num: 4, name: "Phönix-Fall", objective: "Den Vanguard-Panzer zerstören.", lore: "Der Panzer blockiert den Evakuierungspier." },
  { num: 5, name: "Eisiger Schatten", objective: "Außenposten Frostlinie säubern und Daten extrahieren.", lore: "Saison 2 · Vanguard-Prototyp-Daten in der Kälte." },
  { num: 6, name: "Horizonts-Ende", objective: "Kommandant Phönix auf Hochhaus Zero stoppen.", lore: "Finale. Der Schwarze Horizont endet hier – oder du." },
];

/* ===== ACHIEVEMENTS ===== */
BH.Achievements = {
  defs: [
    { id: "first_blood", name: "Erstes Blut", desc: "1 Kill im Match", icon: "🩸", reward: 100,
      check: (d, ev) => (d.kills || 0) >= 1 },
    { id: "head_hunter", name: "Kopfjäger", desc: "50 Kopftreffer gesamt", icon: "🎯", reward: 400,
      check: d => (d.totalHeadshots || 0) >= 50 },
    { id: "campaign_done", name: "Schwarzer Horizont", desc: "Kampagne abschließen", icon: "📖", reward: 800,
      check: d => d.campaignComplete },
    { id: "zombie_15", name: "Überlebender", desc: "Zombie-Runde 15 erreichen", icon: "🧟", reward: 500,
      check: d => (d.bestZombieRound || 0) >= 15 },
    { id: "zombie_25", name: "Outbreak-Veteran", desc: "Zombie-Runde 25 erreichen", icon: "☣", reward: 1200,
      check: d => (d.bestZombieRound || 0) >= 25 },
    { id: "prestige_1", name: "Aufgestiegen", desc: "Prestige 1 erreichen", icon: "✪", reward: 600,
      check: d => (d.prestige || 0) >= 1 },
    { id: "dom_wins", name: "Zonen-König", desc: "10 Siege gesamt", icon: "🏴", reward: 350,
      check: d => (d.wins || 0) >= 10 },
    { id: "easter_egg", name: "Geheimnis", desc: "Zombie-Easter-Egg finden", icon: "🥚", reward: 300,
      check: d => d.zombieEasterEgg },
    { id: "m6_boss", name: "Phönix-Fall", desc: "Mission 6 abgeschlossen", icon: "🔥", reward: 1000,
      check: d => (d.campaignMission || 0) >= 6 },
    { id: "login_streak_7", name: "Treue-Bonus", desc: "7-Tage-Login-Streak", icon: "📅", reward: 500,
      check: d => d.dailyLogin && d.dailyLogin.streak >= 7 },
    { id: "snd_5", name: "Bombenleger", desc: "5 Siege in Suchen & Zerstören", icon: "💣", reward: 450,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "snd") >= 5 },
    { id: "dom_10", name: "Zonenmeister", desc: "10 Siege in Herrschaft", icon: "🏴", reward: 500,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "dom") >= 10 },
    { id: "conquest_5", name: "Eroberer", desc: "5 Siege in Eroberung", icon: "🚩", reward: 450,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "conquest") >= 5 },
    { id: "frontwar_3", name: "Frontheld", desc: "3 Siege in Frontkrieg", icon: "⚔", reward: 400,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "frontwar") >= 3 },
    { id: "ffa_win", name: "Top-Killer", desc: "1 Sieg in Frei-für-Alle", icon: "🎯", reward: 300,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "ffa") >= 1 },
    { id: "ranked_win", name: "Ranked-Sieger", desc: "3 Ranked-Siege", icon: "🏆", reward: 600,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "ranked") >= 3 },
    { id: "kc_win", name: "Dogtag-Jäger", desc: "5 Siege in Kill Confirmed", icon: "🏷", reward: 400,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "killconfirmed") >= 5 },
    { id: "hardcore_win", name: "Hardcore", desc: "3 Siege in Hardcore TDM", icon: "💀", reward: 400,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "hardcore") >= 3 },
    { id: "infected_win", name: "Überlebender Alpha", desc: "3 Siege in Infiziert", icon: "🧟", reward: 400,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "infected") >= 3 },
    { id: "specops_win", name: "Spec-Op", desc: "5 Spec-Ops-Siege", icon: "🎯", reward: 450,
      check: d => BH.ModeStats && BH.ModeStats.wins(d, "specops") >= 5 },
    { id: "matches_50", name: "Veteran", desc: "50 Matches gespielt", icon: "🎖", reward: 350,
      check: d => (d.matches || 0) >= 50 },
    { id: "matches_100", name: "Dauergast", desc: "100 Matches gespielt", icon: "⭐", reward: 700,
      check: d => (d.matches || 0) >= 100 },
    { id: "zombie_30", name: "Outbreak-Legende", desc: "Zombie-Runde 30", icon: "☣", reward: 2000,
      check: d => (d.bestZombieRound || 0) >= 30 },
    { id: "bp_s2_t10", name: "Saison 2 · Stufe 10", desc: "Battle Pass S2 Stufe 10", icon: "🎫", reward: 500,
      check: d => (d.bpSeason || 1) >= 2 && BH.Progress.getBpTier() >= 10 },
    { id: "bp_s2_complete", name: "Horizont-Meister", desc: "Battle Pass Saison 2 abgeschlossen", icon: "🌑", reward: 1500,
      check: d => (d.bpSeason || 1) >= 2 && BH.Progress.getBpTier() >= 20 },
    { id: "friend_1", name: "Kamerad", desc: "1 Freund auf der Liste", icon: "🤝", reward: 150,
      check: d => d.friends && d.friends.length >= 1 },
    { id: "friend_5", name: "Trupp", desc: "5 Freunde auf der Liste", icon: "👥", reward: 400,
      check: d => d.friends && d.friends.length >= 5 },
    { id: "clan_join", name: "Clan-Mitglied", desc: "Einem Clan beitreten oder gründen", icon: "⚔", reward: 300,
      check: d => !!d.clan },
    { id: "clan_lvl5", name: "Clan-Veteran", desc: "Clan Level 5 erreichen", icon: "🏰", reward: 600,
      check: d => d.clan && BH.Social && BH.Social.clanLevel(d.clan) >= 5 },
    { id: "clan_cm_first", name: "Clan-Stürmer", desc: "Erstes Clan-Match gespielt", icon: "⚔", reward: 250,
      check: d => BH.ClanExt && BH.ClanExt.isLive() && d.clan && (d.clan.clanMatchStats?.played || 0) >= 1 },
    { id: "clan_cm_10", name: "Clan-Match-Veteran", desc: "10 Clan-Match-Siege gesamt", icon: "🌑", reward: 800,
      check: d => BH.ClanExt && BH.ClanExt.isLive() && d.clan && BH.ClanExt.totalCmWins(d) >= 10 },
    { id: "clan_treasury_max", name: "Schatzkammer-Meister", desc: "Schatzkammer 20 Stufen gesamt", icon: "🏦", reward: 1000,
      check: d => BH.ClanExt && BH.ClanExt.isLive() && d.clan && BH.Social && BH.Social.treasuryTotalLevels(d) >= 20 },
    { id: "clan_rival_win", name: "Rivalen-Bezwinger", desc: "Rivalen-Woche: mehr XP als Start", icon: "🎯", reward: 400,
      check: d => { if (!BH.ClanExt || !BH.ClanExt.isLive()) return false; const r = BH.ClanExt.rivalWeekStatus(d); return r && r.gainedXp >= 200; } },
    { id: "clan_lvl10", name: "Legendärer Clan", desc: "Clan Level 10 erreichen", icon: "👑", reward: 1200,
      check: d => d.clan && BH.Social && BH.Social.clanLevel(d.clan) >= 10 },
    { id: "fw_pledge", name: "Frontsoldat", desc: "Fraktion schwören", icon: "⚔", reward: 100,
      check: d => d.factionWar && d.factionWar.pledged },
    { id: "fw_veteran", name: "Fraktions-Veteran", desc: "120 FWP in einer Woche", icon: "🎖", reward: 350,
      check: d => d.factionWar && d.factionWar.contrib >= 120 },
    { id: "fw_week_win", name: "Siegerfraktion", desc: "Wochenbelohnung abholen", icon: "🏆", reward: 500,
      check: d => d.factionWar && (d.factionWar.totalFwp || 0) >= 200 },
  ],

  ensure(d) {
    if (!d.achievements) d.achievements = [];
    if (typeof d.totalHeadshots !== "number") d.totalHeadshots = 0;
    if (typeof d.zombieEasterEgg !== "boolean") d.zombieEasterEgg = false;
    if (BH.Social) BH.Social.ensure(d);
    if (BH.FactionWar) BH.FactionWar.ensure(d);
  },

  evaluate(d, ev) {
    this.ensure(d);
    const unlocked = [];
    for (const def of this.defs) {
      if (d.achievements.includes(def.id)) continue;
      if (def.check(d, ev)) {
        d.achievements.push(def.id);
        d.credits = (d.credits || 0) + def.reward;
        unlocked.push(def);
      }
    }
    return unlocked;
  },

  progress(d, def) {
    if (d.achievements.includes(def.id)) return { current: 1, target: 1, done: true };
    if (def.id === "head_hunter") return { current: d.totalHeadshots || 0, target: 50, done: false };
    if (def.id === "zombie_15") return { current: d.bestZombieRound || 0, target: 15, done: false };
    if (def.id === "zombie_25") return { current: d.bestZombieRound || 0, target: 25, done: false };
    if (def.id === "zombie_30") return { current: d.bestZombieRound || 0, target: 30, done: false };
    if (def.id === "prestige_1") return { current: d.prestige || 0, target: 1, done: false };
    if (def.id === "dom_wins") return { current: d.wins || 0, target: 10, done: false };
    if (def.id === "matches_50") return { current: d.matches || 0, target: 50, done: false };
    if (def.id === "matches_100") return { current: d.matches || 0, target: 100, done: false };
    if (def.id === "first_blood") return { current: Math.min(1, d.kills || 0), target: 1, done: false };
    if (def.id === "friend_1") return { current: (d.friends || []).length, target: 1, done: false };
    if (def.id === "friend_5") return { current: (d.friends || []).length, target: 5, done: false };
    if (def.id === "fw_veteran") return { current: (d.factionWar && d.factionWar.contrib) || 0, target: 120, done: false };
    if (def.id === "fw_week_win") return { current: (d.factionWar && d.factionWar.totalFwp) || 0, target: 200, done: false };
    if (def.id === "bp_s2_t10") return { current: BH.Progress.getBpTier(), target: 10, done: false };
    if (def.id === "bp_s2_complete") return { current: BH.Progress.getBpTier(), target: 20, done: false };
    if (def.id === "clan_lvl5") return { current: d.clan && BH.Social ? BH.Social.clanLevel(d.clan) : 0, target: 5, done: false };
    if (def.id === "clan_lvl10") return { current: d.clan && BH.Social ? BH.Social.clanLevel(d.clan) : 0, target: 10, done: false };
    if (def.id === "clan_cm_first") return { current: (d.clan && d.clan.clanMatchStats && d.clan.clanMatchStats.played) || 0, target: 1, done: false };
    if (def.id === "clan_cm_10") return { current: BH.ClanExt ? BH.ClanExt.totalCmWins(d) : 0, target: 10, done: false };
    if (def.id === "clan_treasury_max") return { current: d.clan && BH.Social ? BH.Social.treasuryTotalLevels(d) : 0, target: 20, done: false };
    if (def.id === "clan_rival_win") {
      const r = BH.ClanExt && BH.ClanExt.rivalWeekStatus(d);
      return { current: r ? r.gainedXp : 0, target: 200, done: false };
    }
    if (def.id === "login_streak_7") return { current: (d.dailyLogin && d.dailyLogin.streak) || 0, target: 7, done: false };
    if (def.id.startsWith("snd_")) return { current: BH.ModeStats ? BH.ModeStats.wins(d, "snd") : 0, target: 5, done: false };
    if (def.id.startsWith("dom_")) return { current: BH.ModeStats ? BH.ModeStats.wins(d, "dom") : 0, target: def.id === "dom_10" ? 10 : 5, done: false };
    if (def.id.startsWith("conquest_")) return { current: BH.ModeStats ? BH.ModeStats.wins(d, "conquest") : 0, target: 5, done: false };
    if (def.id.startsWith("frontwar_")) return { current: BH.ModeStats ? BH.ModeStats.wins(d, "frontwar") : 0, target: 3, done: false };
    if (def.id === "ffa_win") return { current: BH.ModeStats ? BH.ModeStats.wins(d, "ffa") : 0, target: 1, done: false };
    if (def.id === "ranked_win") return { current: BH.ModeStats ? BH.ModeStats.wins(d, "ranked") : 0, target: 3, done: false };
    if (def.id === "kc_win") return { current: BH.ModeStats ? BH.ModeStats.wins(d, "killconfirmed") : 0, target: 5, done: false };
    if (def.id === "hardcore_win") return { current: BH.ModeStats ? BH.ModeStats.wins(d, "hardcore") : 0, target: 3, done: false };
    if (def.id === "infected_win") return { current: BH.ModeStats ? BH.ModeStats.wins(d, "infected") : 0, target: 3, done: false };
    if (def.id === "specops_win") return { current: BH.ModeStats ? BH.ModeStats.wins(d, "specops") : 0, target: 5, done: false };
    if (def.id === "campaign_done") return { current: d.campaignComplete ? 1 : 0, target: 1, done: false };
    if (def.id === "m6_boss") return { current: d.campaignMission || 0, target: 6, done: false };
    if (def.id === "easter_egg") return { current: d.zombieEasterEgg ? 1 : 0, target: 1, done: false };
    if (def.id === "clan_join") return { current: d.clan ? 1 : 0, target: 1, done: false };
    if (def.id === "fw_pledge") return { current: d.factionWar && d.factionWar.pledged ? 1 : 0, target: 1, done: false };
    return null;
  },

  render(container) {
    const d = BH.Progress.data;
    this.ensure(d);
    if (!container) return;
    container.innerHTML = this.defs.map(def => {
      const done = d.achievements.includes(def.id);
      const prog = this.progress(d, def);
      let progHtml = "";
      if (!done && prog && prog.target > 1) {
        const pct = Math.min(100, (prog.current / prog.target) * 100);
        progHtml =
          `<div class="ach-prog-bar"><div style="width:${pct}%"></div></div>` +
          `<div class="ach-prog-text">${Math.min(prog.current, prog.target)} / ${prog.target}</div>`;
      }
      return `<div class="ach-row${done ? " ach-done" : ""}">` +
        `<span class="ach-icon">${def.icon}</span>` +
        `<div class="ach-body"><div class="ach-name">${def.name}</div>` +
        `<div class="ach-desc">${def.desc}${done ? " ✔" : ` · +${def.reward} ⛁`}</div>` +
        progHtml +
        `</div></div>`;
    }).join("");
  },
};

/* ===== AMBIENT-MUSIK (WebAudio) ===== */
BH.Ambient = {
  _nodes: null,
  _mode: null,

  start(modeId, mapId) {
    this.stop();
    BH.audio.unlock();
    if (!BH.audio.ctx) return;
    const vol = (BH.Settings && BH.Settings.get().volume) || 0.7;
    if (vol <= 0) return;
    const ctx = BH.audio.ctx;
    const dest = BH.audio.master || ctx.destination;
    const t = ctx.currentTime;
    const base = modeId === "zombies" ? 55 : modeId === "campaign" ? 72 : 88;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "sine"; o2.type = "triangle";
    o1.frequency.value = base;
    o2.frequency.value = base * 1.5;
    const g = ctx.createGain();
    g.gain.value = 0.018 * vol;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = mapId === "tower" ? 400 : 280;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(dest);
    o1.start(t); o2.start(t);
    this._nodes = { o1, o2, g };
    this._mode = modeId;
  },

  stop() {
    if (!this._nodes) return;
    try {
      this._nodes.o1.stop(); this._nodes.o2.stop();
    } catch (e) { /* already stopped */ }
    this._nodes = null;
  },
};

/* ===== TOUCH-STEUERUNG ===== */
BH.TouchControls = {
  init(game) {
    const wrap = document.getElementById("touch-controls");
    if (!wrap) return;
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    wrap.classList.toggle("hidden", !touch);
    if (!touch) return;

    const joy = document.getElementById("touch-joy");
    const knob = document.getElementById("touch-knob");
    const fireBtn = document.getElementById("touch-fire");
    if (!joy || !knob || !fireBtn) return;

    game.touchMove = { x: 0, y: 0 };
    game.touchLook = { x: 0, y: 0 };
    let joyId = null, joyCenter = { x: 0, y: 0 };
    let lookId = null, lookLast = { x: 0, y: 0 };

    const joyRect = () => joy.getBoundingClientRect();

    joy.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      joyId = t.identifier;
      const r = joyRect();
      joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, { passive: false });

    fireBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      game.firing = true;
      game.fireQueued = true;
    }, { passive: false });
    fireBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      game.firing = false;
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          e.preventDefault();
          const dx = t.clientX - joyCenter.x, dy = t.clientY - joyCenter.y;
          const dist = Math.min(42, Math.sqrt(dx * dx + dy * dy));
          const ang = Math.atan2(dy, dx);
          const kx = Math.cos(ang) * dist, ky = Math.sin(ang) * dist;
          knob.style.transform = `translate(${kx}px, ${ky}px)`;
          game.touchMove.x = kx / 42;
          game.touchMove.y = ky / 42;
        } else if (t.identifier === lookId) {
          e.preventDefault();
          const sens = 0.004 * ((BH.Settings && BH.Settings.get().sensitivity) || 1);
          game.touchLook.x += (t.clientX - lookLast.x) * sens;
          game.touchLook.y += (t.clientY - lookLast.y) * sens;
          lookLast = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: false });

    document.addEventListener("touchend", (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          joyId = null;
          knob.style.transform = "";
          game.touchMove.x = 0;
          game.touchMove.y = 0;
        }
        if (t.identifier === lookId) lookId = null;
      }
    });

    game.canvas.addEventListener("touchstart", (e) => {
      if (joyId !== null) return;
      const t = e.changedTouches[0];
      if (t.clientX > window.innerWidth * 0.45) {
        lookId = t.identifier;
        lookLast = { x: t.clientX, y: t.clientY };
      }
    }, { passive: true });
  },

  applyMove(game, dt) {
    if (!game.touchMove) return;
    const tm = game.touchMove;
    if (Math.abs(tm.x) < 0.08 && Math.abs(tm.y) < 0.08) return;
    const speed = (game.player.sprinting ? 11 : 7) * dt;
    const yaw = game.yaw.rotation.y;
    game.yaw.position.x += (Math.sin(yaw) * tm.y + Math.cos(yaw) * tm.x) * speed;
    game.yaw.position.z += (Math.cos(yaw) * tm.y - Math.sin(yaw) * tm.x) * speed;
  },

  applyLook(game) {
    if (!game.touchLook) return;
    if (game.touchLook.x) {
      game.yaw.rotation.y -= game.touchLook.x;
      game.touchLook.x = 0;
    }
    if (game.touchLook.y) {
      game.aimPitch = THREE.MathUtils.clamp(game.aimPitch - game.touchLook.y, -1.45, 1.45);
      if (game._syncAimPitch) game._syncAimPitch();
      game.touchLook.y = 0;
    }
  },
};
