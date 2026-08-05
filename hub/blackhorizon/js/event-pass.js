/* Event Pass — kostenlos · Countdown bis Saison 2 · tägliche Aufgaben */
window.BH = window.BH || {};

BH.EventPass = {
  EVENT_ID: "countdown_s2_2026",
  START_AT: "2026-06-13T00:00:00.000Z",
  TIERS: 50,
  ACCENT: "#f59e0b",

  _registerExclusive() {
    const addCamo = (c) => {
      if (!BH.CAMOS) BH.CAMOS = [];
      if (!BH.CAMOS.some(x => x.id === c.id)) BH.CAMOS.push({ ...c, eventOnly: true, price: 0 });
    };
    const addSpray = (s) => {
      if (!BH.SHOP) return;
      if (!(BH.SHOP.sprays || []).some(x => x.id === s.id)) {
        if (!BH.SHOP.sprays) BH.SHOP.sprays = [];
        BH.SHOP.sprays.push({ ...s, eventOnly: true, price: 0 });
      }
    };
    const addEmblem = (e) => {
      if (!BH.SHOP || !BH.SHOP.emblems) return;
      if (!BH.SHOP.emblems.some(x => x.id === e.id)) {
        BH.SHOP.emblems.push({ ...e, eventOnly: true, price: 0 });
      }
    };
    const addTitle = (t) => {
      if (!BH.SHOP || !BH.SHOP.titles) return;
      if (!BH.SHOP.titles.some(x => x.id === t.id)) {
        BH.SHOP.titles.push({ ...t, eventOnly: true, price: 0 });
      }
    };
    addCamo({ id: "ep_amber_dawn", name: "Bernstein-Dämmerung", color: 0xf59e0b });
    addCamo({ id: "ep_horizon_ember", name: "Horizont-Glut", color: 0xff6b35 });
    addSpray({ id: "ep_countdown", name: "Countdown", icon: "⏳" });
    addSpray({ id: "ep_gate", name: "Tor zum Horizont", icon: "🌌" });
    addEmblem({ id: "ep_horizon_gate", name: "Horizont-Tor", icon: "🌌" });
    addEmblem({ id: "ep_flame_day", name: "Flammentag", icon: "🔥" });
    addTitle({ id: "ep_countdown_ops", name: "Countdown-Ops" });
    addTitle({ id: "ep_horizon_watcher", name: "Horizont-Wächter" });
  },

  _buildMissions() {
    const templates = [
      { track: "matches", target: 2, icon: "⚔", label: "Einsatz", desc: "Spiele %n Matches" },
      { track: "kills", target: 18, icon: "💀", label: "Abschüsse", desc: "Eliminiere %n Gegner" },
      { track: "wins", target: 1, icon: "🏆", label: "Sieg", desc: "Gewinne %n Match(es)" },
      { track: "headshots", target: 6, icon: "🎯", label: "Präzision", desc: "Lande %n Headshots" },
      { track: "mode", modeId: "tdm", target: 1, icon: "🔫", label: "TDM", desc: "Spiele %n Team Deathmatch" },
      { track: "mode", modeId: "dom", target: 1, icon: "🏴", label: "Herrschaft", desc: "Spiele %n Herrschaft" },
      { track: "zombie_kills", target: 12, icon: "🧟", label: "Outbreak", desc: "Eliminiere %n Zombies" },
      { track: "matches", target: 3, icon: "⚔", label: "Frontlinie", desc: "Spiele %n Matches" },
      { track: "kills", target: 28, icon: "💀", label: "Jagd", desc: "Eliminiere %n Gegner" },
      { track: "login", target: 1, icon: "📡", label: "Briefing", desc: "Command Center öffnen (heute)" },
      { track: "mode", modeId: "frontwar", target: 1, icon: "⚔", label: "Frontkrieg", desc: "Spiele %n Frontkrieg" },
      { track: "wins", target: 2, icon: "🏆", label: "Doppelsieg", desc: "Gewinne %n Matches" },
      { track: "mode", modeId: "specops", target: 1, icon: "🎯", label: "Spec-Ops", desc: "Spiele %n Spec-Ops" },
      { track: "matches", target: 4, icon: "⚔", label: "Marathon", desc: "Spiele %n Matches" },
    ];
    const out = [];
    const totalDays = this.totalDays();
    for (let day = 1; day <= totalDays; day++) {
      const tpl = templates[(day - 1) % templates.length];
      const scale = 1 + Math.floor((day - 1) / 12) * 0.15;
      const target = tpl.track === "login"
        ? 1
        : Math.max(1, Math.round(tpl.target * scale));
      const desc = tpl.desc.replace("%n", String(target));
      out.push({
        day,
        id: "ep_d" + day + "_" + tpl.track + (tpl.modeId ? "_" + tpl.modeId : ""),
        track: tpl.track,
        modeId: tpl.modeId || null,
        target,
        icon: tpl.icon,
        label: "Tag " + day + " · " + tpl.label,
        desc,
        xp: 110 + Math.min(90, day * 2),
      });
    }
    return out;
  },

  _rewardHelpers() {
    if (!BH.BattlePass || !BH.BattlePass._R) return null;
    const R = BH.BattlePass._R;
    return {
      cr: R.cr.bind(R),
      dia: R.dia.bind(R),
      camo: R.camo.bind(R),
      emblem: R.emblem.bind(R),
      title: R.title.bind(R),
      spray: R.spray.bind(R),
      charm: R.charm.bind(R),
      cross: R.cross.bind(R),
      color: R.color.bind(R),
      crate: R.crate.bind(R),
      token: R.token.bind(R),
      prem(days) {
        const d = Math.max(1, days || 1);
        return {
          type: "premiumDays",
          days: d,
          name: d + (d === 1 ? " Tag Premium" : " Tage Premium"),
          icon: "⭐",
        };
      },
    };
  },

  grantReward(d, reward) {
    if (!reward || !d) return null;
    if (reward.type === "bundle" && reward.rewards) {
      let last = null;
      for (const sub of reward.rewards) {
        const res = this.grantReward(d, sub);
        if (res) last = res;
      }
      return last || reward;
    }
    if (reward.type === "premiumDays") {
      if (BH.PremiumPlaytime) BH.PremiumPlaytime.grantDays(d, reward.days || 1);
      return reward;
    }
    if (BH.BattlePass) return BH.BattlePass.grant(d, reward);
    return reward;
  },

  _buildTiers() {
    const H = this._rewardHelpers();
    if (!H) return [];
    const tiers = [];

    /** Meilensteine — überschreiben die Rotation */
    const milestone = {
      5: H.prem(1),
      10: H.spray("ep_countdown", "Countdown", "⏳"),
      15: H.emblem("ep_flame_day", "Flammentag", "🔥"),
      20: { type: "bundle", name: "Front-Paket", icon: "📦", rewards: [H.crate("front", 2, "2× Front-Kiste"), H.dia(8)] },
      25: { type: "bundle", name: "Gold-Set", icon: "🎨", rewards: [H.color("gold", "Gold"), H.cr(350)] },
      30: H.camo("ep_amber_dawn", "Bernstein-Dämmerung"),
      35: H.title("ep_countdown_ops", "Countdown-Ops"),
      40: { type: "bundle", name: "Premium-Boost", icon: "⭐", rewards: [H.prem(3), H.crate("front", 2, "2× Front-Kiste")] },
      45: H.spray("ep_gate", "Tor zum Horizont", "🌌"),
      48: H.emblem("ep_horizon_gate", "Horizont-Tor", "🌌"),
      50: {
        type: "bundle",
        name: "Finale · Horizont-Wächter",
        icon: "👑",
        rewards: [
          H.title("ep_horizon_watcher", "Horizont-Wächter"),
          H.camo("ep_horizon_ember", "Horizont-Glut"),
          H.prem(7),
          H.dia(25),
          H.crate("front", 5, "5× Front-Kiste"),
          H.cr(1000),
        ],
      },
    };

    for (let t = 1; t <= this.TIERS; t++) {
      if (milestone[t]) {
        tiers.push(milestone[t]);
        continue;
      }
      const mod = t % 7;
      let reward;
      switch (mod) {
        case 1:
          reward = H.cr(55 + t * 9);
          break;
        case 2:
          reward = H.dia(2 + Math.floor(t / 12));
          break;
        case 3:
          reward = H.crate("front", 1, "Front-Kiste");
          break;
        case 4:
          reward = H.cr(70 + t * 8);
          break;
        case 5:
          reward = H.dia(3 + Math.floor(t / 10));
          break;
        case 6:
          if ([13, 27, 41].includes(t)) reward = H.prem(1);
          else if (t % 14 === 0) reward = H.token("15", 1, "BP-Boost · 15 Min");
          else reward = H.dia(4 + Math.floor(t / 15));
          break;
        case 0:
          reward = t % 21 === 0
            ? H.charm("star_ch", "Stern")
            : (t % 3 === 0 ? H.cross("dot", "Punkt") : H.color(
              ["green", "cyan", "red", "yellow", "pink", "purple", "lime"][Math.floor(t / 7) % 7],
              ["Grün", "Cyan", "Rot", "Gelb", "Pink", "Violett", "Limette"][Math.floor(t / 7) % 7]
            ));
          break;
        default:
          reward = H.cr(60 + t * 7);
      }
      tiers.push(reward);
    }
    return tiers;
  },

  _init() {
    if (this._ready) return;
    this._registerExclusive();
    this.MISSIONS = this._buildMissions();
    this.TIER_REWARDS = this._buildTiers();
    this._ready = true;
  },

  endAt() {
    return BH.SeasonRelease ? BH.SeasonRelease.getS2LaunchAt() : new Date("2026-08-01T20:00:00.000Z");
  },

  startAt() {
    return new Date(this.START_AT);
  },

  totalDays() {
    const ms = this.endAt().getTime() - this.startAt().getTime();
    return Math.max(1, Math.ceil(ms / 86400000));
  },

  isActive() {
    this._init();
    const now = Date.now();
    return now >= this.startAt().getTime() && now < this.endAt().getTime();
  },

  isEnded() {
    return Date.now() >= this.endAt().getTime();
  },

  currentDay() {
    if (!this.isActive()) return this.isEnded() ? this.totalDays() : 0;
    const elapsed = Date.now() - this.startAt().getTime();
    return Math.min(this.totalDays(), Math.floor(elapsed / 86400000) + 1);
  },

  countdown() {
    const end = this.endAt().getTime();
    const now = Date.now();
    if (now >= end) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, live: false };
    }
    let rem = Math.max(0, end - now);
    const days = Math.floor(rem / 86400000);
    rem -= days * 86400000;
    const hours = Math.floor(rem / 3600000);
    rem -= hours * 3600000;
    const minutes = Math.floor(rem / 60000);
    rem -= minutes * 60000;
    const seconds = Math.floor(rem / 1000);
    return { expired: false, days, hours, minutes, seconds, live: true };
  },

  formatCountdown(cd) {
    if (!cd || cd.expired) return "Event beendet";
    const pad = n => String(n).padStart(2, "0");
    if (cd.days > 0) {
      return cd.days + "T " + pad(cd.hours) + ":" + pad(cd.minutes) + ":" + pad(cd.seconds);
    }
    return pad(cd.hours) + ":" + pad(cd.minutes) + ":" + pad(cd.seconds);
  },

  ensure(d) {
    this._init();
    if (!d) return;
    if (!d.eventPass || d.eventPass.eventId !== this.EVENT_ID) {
      d.eventPass = {
        eventId: this.EVENT_ID,
        xp: 0,
        claimedTiers: [],
        claimedMissions: [],
        prog: {},
      };
    }
    if (!d.eventPass.claimedTiers) d.eventPass.claimedTiers = [];
    if (!d.eventPass.claimedMissions) d.eventPass.claimedMissions = [];
    if (!d.eventPass.prog) d.eventPass.prog = {};
    this.touchLogin(d);
  },

  touchLogin(d) {
    if (!this.isActive()) return;
    const day = this.currentDay();
    const m = this.MISSIONS.find(x => x.day === day && x.track === "login");
    if (!m || this.isMissionClaimed(d, m.id)) return;
    if (this.missionProgress(d, m) < 1) {
      d.eventPass.prog[m.id] = 1;
      BH.Progress.save();
    }
  },

  tierThreshold(tier) {
    return tier * 135;
  },

  getTier(d) {
    this.ensure(d);
    const xp = d.eventPass.xp || 0;
    let tier = 0;
    for (let t = 1; t <= this.TIERS; t++) {
      if (xp >= this.tierThreshold(t)) tier = t;
      else break;
    }
    return tier;
  },

  xpInTier(d) {
    this.ensure(d);
    const xp = d.eventPass.xp || 0;
    const tier = this.getTier(d);
    if (tier >= this.TIERS) {
      return { current: xp - this.tierThreshold(this.TIERS), need: 0, done: true };
    }
    const prev = tier > 0 ? this.tierThreshold(tier) : 0;
    const need = this.tierThreshold(tier + 1) - prev;
    const current = xp - prev;
    return { current, need, done: false, nextTier: tier + 1 };
  },

  getReward(tier) {
    this._init();
    return this.TIER_REWARDS[tier - 1] || null;
  },

  tierState(d, tier) {
    if (tier < 1 || tier > this.TIERS) return "locked";
    if (this.getTier(d) < tier) return "locked";
    const reward = this.getReward(tier);
    if (!reward) return "empty";
    if ((d.eventPass.claimedTiers || []).includes(tier)) return "claimed";
    return "claimable";
  },

  isMissionUnlocked(m) {
    if (this.isEnded()) return m.day <= this.totalDays();
    if (!this.isActive()) return false;
    return m.day <= this.currentDay();
  },

  isMissionClaimed(d, id) {
    return (d.eventPass.claimedMissions || []).includes(id);
  },

  missionProgress(d, m) {
    return Math.min(m.target, (d.eventPass.prog || {})[m.id] || 0);
  },

  missionStatus(d, m) {
    this.ensure(d);
    const unlocked = this.isMissionUnlocked(m);
    const prog = this.missionProgress(d, m);
    const done = prog >= m.target;
    const claimed = this.isMissionClaimed(d, m.id);
    const claimable = unlocked && done && !claimed && (this.isActive() || this.isEnded());
    const daysUntil = Math.max(0, m.day - this.currentDay());
    return { prog, target: m.target, done, claimed, claimable, unlocked, daysUntil };
  },

  pendingCount(d) {
    this.ensure(d);
    let n = 0;
    for (let t = 1; t <= this.TIERS; t++) {
      if (this.tierState(d, t) === "claimable") n++;
    }
    for (const m of this.MISSIONS) {
      if (this.missionStatus(d, m).claimable) n++;
    }
    return n;
  },

  claimTier(d, tier) {
    this.ensure(d);
    if (this.tierState(d, tier) !== "claimable") return { ok: false, reason: "locked" };
    const reward = this.getReward(tier);
    if (!reward) return { ok: false, reason: "empty" };
    const granted = this.grantReward(d, reward);
    d.eventPass.claimedTiers.push(tier);
    BH.Progress.save();
    return { ok: true, tier, reward: granted || reward, duplicate: !!(granted && granted.duplicate) };
  },

  claimAllTiers(d) {
    this.ensure(d);
    const granted = [];
    for (let t = 1; t <= this.TIERS; t++) {
      const res = this.claimTier(d, t);
      if (res.ok) granted.push(res);
    }
    return { ok: true, count: granted.length, granted };
  },

  claimMission(d, missionId) {
    this.ensure(d);
    if (!this.isActive() && !this.isEnded()) return { ok: false, reason: "inactive" };
    const m = this.MISSIONS.find(x => x.id === missionId);
    if (!m) return { ok: false, reason: "missing" };
    const st = this.missionStatus(d, m);
    if (!st.claimable) return { ok: false, reason: st.claimed ? "claimed" : "progress" };
    d.eventPass.xp = (d.eventPass.xp || 0) + (m.xp || 0);
    d.eventPass.claimedMissions.push(missionId);
    BH.Progress.save();
    return { ok: true, mission: m, xp: m.xp };
  },

  onMatchEnd(d, stats, won, modeId) {
    if (!this.isActive()) return;
    this.ensure(d);
    let dirty = false;
    for (const m of this.MISSIONS) {
      if (!this.isMissionUnlocked(m)) continue;
      if (this.isMissionClaimed(d, m.id)) continue;
      const cur = this.missionProgress(d, m);
      if (cur >= m.target) continue;
      let add = 0;
      switch (m.track) {
        case "matches": add = 1; break;
        case "kills": add = stats.kills || 0; break;
        case "wins": add = won ? 1 : 0; break;
        case "headshots": add = stats.headshots || 0; break;
        case "zombie_kills": add = stats.zombieKills || stats.zombie_kills || 0; break;
        case "mode": add = modeId === m.modeId ? 1 : 0; break;
        default: break;
      }
      if (add > 0) {
        d.eventPass.prog[m.id] = Math.min(m.target, cur + add);
        dirty = true;
      }
    }
    if (dirty) BH.Progress.save();
  },
};

/* Lazy init — erst wenn Battle Pass & SHOP geladen sind */
