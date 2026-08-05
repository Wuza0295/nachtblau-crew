/* Battle Pass — Belohnungen, Einsammeln, Wochen-Aufgaben */
window.BH = window.BH || {};

BH.BattlePass = {
  WEEKLY: [
    {
      id: "matches", icon: "⚔", label: "Frontlinie", desc: "Spiele 8 Matches", track: "matches", target: 8,
      xp: 900, credits: 280,
    },
    {
      id: "kills", icon: "💀", label: "Abschüsse", desc: "Eliminiere 45 Gegner", track: "kills", target: 45,
      xp: 800, credits: 230,
    },
    {
      id: "wins", icon: "🏆", label: "Siege", desc: "Gewinne 4 Matches", track: "wins", target: 4,
      xp: 1300, credits: 420,
    },
    {
      id: "w_headshots", icon: "🎯", label: "Präzision", desc: "Lande 18 Headshots", track: "headshots", target: 18,
      xp: 700, credits: 210,
    },
    {
      id: "w_tdm", icon: "🔫", label: "TDM-Woche", desc: "Spiele 4 Team Deathmatch", track: "mode", modeId: "tdm", target: 4,
      xp: 650, credits: 190,
    },
    {
      id: "w_dom", icon: "🏴", label: "Herrschaft", desc: "Spiele 3 Herrschaft", track: "mode", modeId: "dom", target: 3,
      xp: 650, credits: 190,
    },
    {
      id: "w_streak", icon: "🔥", label: "Killserie", desc: "Erreiche eine Killserie von 10 in einem Match", track: "streak", target: 10,
      xp: 850, credits: 260,
    },
    {
      id: "w_frontwar", icon: "⚔", label: "Frontkrieg", desc: "Spiele 2 Frontkrieg", track: "mode", modeId: "frontwar", target: 2,
      xp: 750, credits: 220,
    },
  ],

  SEASON_MISSIONS: {
    1: [
      {
        id: "s1_matches_50", icon: "⚔", label: "Saison-Einsatz I", desc: "Spiele 50 Matches in Saison 1",
        track: "matches", target: 50, xp: 2500, credits: 800,
      },
      {
        id: "s1_matches_120", icon: "⚔", label: "Saison-Einsatz II", desc: "Spiele 120 Matches in Saison 1",
        track: "matches", target: 120, xp: 4500, credits: 1400,
      },
      {
        id: "s1_kills_300", icon: "💀", label: "Saison-Jagd", desc: "Eliminiere 300 Gegner in Saison 1",
        track: "kills", target: 300, xp: 3200, credits: 950,
      },
      {
        id: "s1_wins_25", icon: "🏆", label: "Saison-Sieger", desc: "Gewinne 25 Matches in Saison 1",
        track: "wins", target: 25, xp: 3800, credits: 1100,
      },
      {
        id: "s1_headshots_100", icon: "🎯", label: "Saison-Präzision", desc: "Lande 100 Headshots in Saison 1",
        track: "headshots", target: 100, xp: 3000, credits: 900,
      },
      {
        id: "s1_tier_25", icon: "🎖", label: "Halbzeit", desc: "Erreiche Battle-Pass Stufe 25",
        track: "tier", target: 25, xp: 2200, credits: 650,
      },
      {
        id: "s1_tier_50", icon: "👑", label: "Saison-Vollendung", desc: "Erreiche Battle-Pass Stufe 50",
        track: "tier", target: 50, xp: 5500, credits: 1800,
        token: { tier: "30", count: 1, label: "BP-Boost · 30 Min" },
      },
    ],
    2: [
      {
        id: "s2_matches_60", icon: "⚔", label: "Horizont-Einsatz I", desc: "Spiele 60 Matches in Saison 2",
        track: "matches", target: 60, xp: 2800, credits: 900,
      },
      {
        id: "s2_matches_140", icon: "⚔", label: "Horizont-Einsatz II", desc: "Spiele 140 Matches in Saison 2",
        track: "matches", target: 140, xp: 5000, credits: 1600,
      },
      {
        id: "s2_kills_350", icon: "💀", label: "Horizont-Jagd", desc: "Eliminiere 350 Gegner in Saison 2",
        track: "kills", target: 350, xp: 3600, credits: 1050,
      },
      {
        id: "s2_wins_30", icon: "🏆", label: "Horizont-Sieger", desc: "Gewinne 30 Matches in Saison 2",
        track: "wins", target: 30, xp: 4200, credits: 1250,
      },
      {
        id: "s2_specops_15", icon: "🎯", label: "Spec-Ops-Veteran", desc: "Spiele 15 Spec-Ops in Saison 2",
        track: "mode", modeId: "specops", target: 15, xp: 3400, credits: 1000,
      },
      {
        id: "s2_tier_25", icon: "🎖", label: "Horizont-Halbzeit", desc: "Erreiche Battle-Pass Stufe 25",
        track: "tier", target: 25, xp: 2500, credits: 750,
      },
      {
        id: "s2_tier_50", icon: "👑", label: "Schwarzer Horizont", desc: "Erreiche Battle-Pass Stufe 50",
        track: "tier", target: 50, xp: 6000, credits: 2000,
        token: { tier: "60", count: 1, label: "BP-Boost · 1 Std" },
        crate: { type: "front", count: 2, label: "2× Front-Kiste" },
      },
    ],
  },

  DAILY_TEMPLATES: [
    { track: "login", target: 1, icon: "📡", label: "Briefing", descTpl: "Battle Pass öffnen (heute)", xp: 80, credits: 50 },
    { track: "matches", target: 2, icon: "⚔", label: "Kurzeinsatz", descTpl: "Spiele %n Matches", xp: 120, credits: 75 },
    { track: "kills", target: 10, icon: "💀", label: "Jäger", descTpl: "Eliminiere %n Gegner", xp: 100, credits: 60 },
    { track: "wins", target: 1, icon: "🏆", label: "Sieg", descTpl: "Gewinne %n Match(es)", xp: 150, credits: 90 },
    { track: "headshots", target: 4, icon: "🎯", label: "Präzision", descTpl: "Lande %n Headshots", xp: 110, credits: 70 },
    { track: "mode", modeId: "tdm", target: 1, icon: "🔫", label: "TDM", descTpl: "Spiele %n Team Deathmatch", xp: 95, credits: 55 },
    { track: "mode", modeId: "dom", target: 1, icon: "🏴", label: "Herrschaft", descTpl: "Spiele %n Herrschaft", xp: 95, credits: 55 },
    { track: "matches", target: 3, icon: "⚔", label: "Marathon", descTpl: "Spiele %n Matches", xp: 140, credits: 85 },
    { track: "kills", target: 18, icon: "💀", label: "Frontlinie", descTpl: "Eliminiere %n Gegner", xp: 130, credits: 80 },
  ],

  _weekKey() {
    const n = new Date();
    const jan1 = new Date(n.getFullYear(), 0, 1);
    const week = Math.ceil(((n - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${n.getFullYear()}-W${week}`;
  },

  _dayKey() {
    const n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
  },

  getDailyMissions(dayKey) {
    dayKey = dayKey || this._dayKey();
    const templates = this.DAILY_TEMPLATES || [];
    const dayNum = Math.floor(new Date(dayKey + "T12:00:00").getTime() / 86400000);
    const used = new Set();
    const picked = [];
    for (let i = 0; i < 3; i++) {
      let idx = (dayNum + i * 3) % templates.length;
      while (used.has(idx)) idx = (idx + 1) % templates.length;
      used.add(idx);
      const tpl = templates[idx];
      const desc = (tpl.descTpl || tpl.desc || "").replace("%n", String(tpl.target));
      picked.push({
        id: "bpd_" + dayKey.replace(/-/g, "") + "_" + tpl.track + (tpl.modeId || ""),
        track: tpl.track,
        modeId: tpl.modeId || null,
        target: tpl.target,
        icon: tpl.icon,
        label: tpl.label,
        desc,
        xp: tpl.xp,
        credits: tpl.credits || 0,
        daily: true,
      });
    }
    return picked;
  },

  missionRewards(m) {
    const out = [];
    if (!m) return out;
    if (m.xp) out.push({ icon: "🎖", text: "+" + m.xp.toLocaleString("de-DE") + " Saison-XP" });
    if (m.credits) out.push({ icon: "⛁", text: m.credits.toLocaleString("de-DE") });
    if (m.token) out.push({ icon: "⚡", text: m.token.label || "BP-Boost" });
    if (m.crate) out.push({ icon: "📦", text: m.crate.label || "Kiste" });
    return out;
  },

  dailyResetLabel() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = midnight - now;
    const h = Math.floor(ms / 3600000);
    const min = Math.floor((ms % 3600000) / 60000);
    return "Reset in " + h + " Std " + min + " Min";
  },

  weeklyResetLabel() {
    const now = new Date();
    const day = now.getDay();
    const daysUntil = day === 0 ? 1 : (8 - day) % 7 || 7;
    return "Reset Mo · " + (daysUntil === 1 ? "morgen" : "in " + daysUntil + " Tagen");
  },

  seasonResetLabel(d) {
    const season = d ? this.effectiveSeason(d) : 1;
    return "Saison " + season + " · bis Saison-Ende";
  },

  getSeasonMissions(d) {
    const season = this.effectiveSeason(d);
    return (this.SEASON_MISSIONS && this.SEASON_MISSIONS[season])
      || (this.SEASON_MISSIONS && this.SEASON_MISSIONS[1])
      || [];
  },

  _R: {
    cr(n) { return { type: "credits", amount: n, name: n.toLocaleString("de-DE") + " ⛁", icon: "⛁" }; },
    camo(id, name) { return { type: "camo", id, name: "Tarnung „" + name + "“", icon: "🎨" }; },
    emblem(id, name, icon) { return { type: "emblem", id, name: "Emblem „" + name + "“", icon: icon || "🎖" }; },
    title(id, name) { return { type: "title", id, name: "Titel „" + name + "“", icon: "🏷" }; },
    spray(id, name, icon) { return { type: "spray", id, name: "Spray „" + name + "“", icon: icon || "🎨" }; },
    charm(id, name) { return { type: "charm", id, name: "Anhänger „" + name + "“", icon: "📿" }; },
    cross(id, name) { return { type: "crosshair", id, name: "Fadenkreuz „" + name + "“", icon: "✛" }; },
    color(id, name) { return { type: "color", id, name: "Farbe „" + name + "“", icon: "🎨" }; },
    crate(type, n, name) { return { type: "crate", crateType: type, count: n || 1, name: name || "Front-Kiste", icon: "📦" }; },
    token(tier, n, name) {
      const def = BH.BpXpTokens ? BH.BpXpTokens.tierDef(tier) : null;
      const label = def ? def.label : tier + " Min.";
      return { type: "bpToken", area: "bp", tier: String(tier), count: n || 1, name: name || ("BP-Boost · " + label), icon: "🎖" };
    },
    dia(n) { return { type: "diamonds", amount: n, name: n + " 💎", icon: "💎" }; },
    op(id, name) { return { type: "operator", id, name: "Operator „" + name + "“", icon: "👤" }; },
    fin(id, name) { return { type: "finisher", id, name: "Finisher „" + name + "“", icon: "⚔" }; },
  },

  _SEASON_VERSION: 4,

  _buildRewards(capstones, freePool, premPool, tiers) {
    const R = this._R;
    const freeLine = this._buildFreeTrack(tiers, capstones, freePool, R);
    const premLine = this._buildPremiumTrack(tiers, capstones, premPool, R);
    const out = [];
    for (let t = 1; t <= tiers; t++) {
      out.push({ free: freeLine[t - 1], premium: premLine[t - 1] });
    }
    return out;
  },

  /** Gratis: Meilensteine (5/10) + kleine Credits gerade Stufen + Capstones */
  _buildFreeTrack(tiers, capstones, pool, R) {
    const line = [];
    for (let t = 1; t <= tiers; t++) {
      if (capstones[t] && capstones[t].free) {
        line.push(capstones[t].free);
      } else if (t % 5 === 0) {
        if (t % 10 === 0 && pool.length) {
          line.push(pool[(t / 10 - 1) % pool.length]);
        } else {
          line.push(R.cr(80 + t * 5));
        }
      } else if (t % 2 === 0) {
        line.push(R.cr(45 + t * 3));
      } else {
        line.push(null);
      }
    }
    return line;
  },

  /** Premium 1–50: klassische Spur (Pool + Capstones) — 💎 nur ab Stufe 51 */
  _buildPremiumTrack(tiers, capstones, pool, R) {
    const line = [];
    for (let t = 1; t <= tiers; t++) {
      if (capstones[t] && capstones[t].premium) {
        line.push(capstones[t].premium);
      } else if (pool.length) {
        line.push(pool[(t - 1) % pool.length]);
      } else {
        line.push(R.cr(150 + Math.round(t * 6)));
      }
    }
    return line;
  },

  overflowPending(d) {
    const tier = this.getTier(d);
    const bp = this.getDef(this.effectiveSeason(d));
    let n = 0;
    for (let t = bp.tiers + 1; t <= tier; t++) {
      if (this.rewardState(d, t, "free") === "claimable") n++;
      if (this.rewardState(d, t, "premium") === "claimable") n++;
    }
    return n;
  },

  DUPLICATE_DIAMONDS: 5,

  _EXCLUSIVE_CAT: {
    camo: "camos", emblem: "emblems", title: "titles", spray: "sprays",
    charm: "charms", crosshair: "crosshairs", color: "colors",
    operator: "operators", finisher: "finishers",
  },

  _SHOP_CAT: {
    camo: "camos", crosshair: "crosshairs", spray: "sprays", charm: "charms",
    card: "callingCards", emblem: "emblems", title: "titles", color: "colors",
    operator: "operators", finisher: "finishers",
  },

  _emptyExclusive() {
    return {
      camos: new Set(), emblems: new Set(), titles: new Set(), sprays: new Set(),
      charms: new Set(), crosshairs: new Set(), colors: new Set(),
      operators: new Set(), finishers: new Set(),
    };
  },

  _addExclusiveReward(exclusive, reward) {
    if (!reward || !exclusive) return;
    if (reward.type === "bundle" && reward.rewards) {
      for (const sub of reward.rewards) this._addExclusiveReward(exclusive, sub);
      return;
    }
    const cat = this._EXCLUSIVE_CAT[reward.type];
    if (cat && reward.id) exclusive[cat].add(reward.id);
  },

  _rebuildExclusiveRegistry() {
    if (!this.SEASONS) return;
    const exclusive = this._emptyExclusive();
    for (const key of Object.keys(this.SEASONS || {})) {
      const bp = this.SEASONS[key];
      for (const row of bp.rewards || []) {
        this._addExclusiveReward(exclusive, row.free);
        this._addExclusiveReward(exclusive, row.premium);
      }
    }
    this._exclusive = exclusive;
  },

  isExclusive(cat, id) {
    if (!cat || !id) return false;
    if (!this._exclusive) {
      this._initSeasons();
      if (!this._exclusive) this._rebuildExclusiveRegistry();
    }
    const set = this._exclusive[cat];
    return !!(set && set.has(id));
  },

  isShopExclusive(shopCat, id) {
    const cat = this._SHOP_CAT[shopCat] || shopCat;
    return this.isExclusive(cat, id);
  },

  SEASONS: null,
  _seasonVersion: 0,

  _initSeasons() {
    if (this.SEASONS && this._seasonVersion === this._SEASON_VERSION) return;
    this._seasonVersion = this._SEASON_VERSION;
    const R = this._R;
    const S1_FREE = [
      R.cr(100), R.emblem("shop_wolf", "Wolf"), R.cr(150), R.spray("gg", "GG", "🫡"),
      R.cr(125), R.cross("dot", "Punkt"), R.cr(175), R.emblem("shop_cross", "Fadenkreuz"),
      R.cr(200), R.token("15", 1), R.spray("boom", "BOOM", "💥"),
    ];
    const S1_PREM = [
      R.spray("horizon", "Horizont", "🌑"), R.cross("circle", "Kreis"), R.cr(200),
      R.emblem("shop_shield", "Schild"), R.camo("blutmond", "Blutmond"), R.cr(250),
      R.spray("target", "Ziel erfasst", "🎯"), R.title("shop_merc", "Söldner"),
      R.charm("star_ch", "Stern"), R.token("30", 1),
    ];
    const S1_CAP = {
      10: { free: R.camo("aschegrau", "Aschegrau"), premium: R.op("breaker", "Brecher") },
      25: { free: R.camo("galaxie", "Galaxie"), premium: R.emblem("shop_crown", "Krone", "👑") },
      40: { free: R.camo("inferno", "Inferno"), premium: R.title("shop_warlord", "Kriegsherr") },
      50: { free: R.camo("drachen", "Drachenfeuer"), premium: R.title("shop_elite", "Horizon-Elite") },
    };

    const S2_FREE = [
      R.cr(125), R.emblem("shop_horizon", "Horizont", "🌑"), R.cr(175), R.spray("horizon", "Horizont", "🌑"),
      R.cr(150), R.cross("sharp", "Scharf"), R.cr(200), R.emblem("shop_viper", "Viper", "🐍"),
      R.cr(225), R.token("15", 1),
    ];
    const S2_PREM = [
      R.camo("mitternacht", "Mitternacht"), R.charm("horizon_ch", "Horizont"), R.cr(275),
      R.title("shop_ghost", "Phantom"), R.camo("void", "Void"), R.cr(300),
      R.spray("fire_s", "In Flammen", "🔥"), R.emblem("shop_nuke", "Atombombe", "☢"),
      R.token("60", 1), R.color("gold", "Gold"),
    ];
    const S2_CAP = {
      10: { free: R.camo("aurora", "Aurora"), premium: R.op("wraith", "Wraith") },
      15: { free: R.emblem("shop_horizon", "Horizont", "🌑"), premium: R.fin("saber_salute", "Säbelgruß") },
      25: { free: R.camo("kobalt", "Kobalt"), premium: R.emblem("shop_blood", "Blutbadge", "🩸") },
      40: { free: R.camo("predator", "Predator"), premium: R.title("shop_reaper", "Schnitter") },
      50: { free: R.crate("horizon", 2, "2× Horizont-Kiste"), premium: R.op("spectre", "Spectre") },
    };

    this.SEASONS = {
      1: {
        id: 1,
        name: "ASCHEFRONT",
        tagline: "Die erste Front — Asche, Stahl und Überleben.",
        tiers: 50,
        xpPerTier: 900,
        xpTierGrowth: 22,
        overflowCredits: 90,
        overflowDiamonds: 2,
        overflowXpPerTier: 1100,
        overflowXpGrowth: 30,
        premiumPrice: 2200,
        accent: "#ff7a00",
        rewards: this._buildRewards(S1_CAP, S1_FREE, S1_PREM, 50),
      },
      2: {
        id: 2,
        name: "SCHWARZER HORIZONT",
        tagline: "Saison 2 — Tower, Phantome und der Horizont.",
        tiers: 50,
        xpPerTier: 950,
        xpTierGrowth: 26,
        overflowCredits: 100,
        overflowDiamonds: 3,
        overflowXpPerTier: 1200,
        overflowXpGrowth: 35,
        premiumPrice: 2600,
        accent: "#39c5ff",
        rewards: this._buildRewards(S2_CAP, S2_FREE, S2_PREM, 50),
      },
    };
    this._rebuildExclusiveRegistry();
  },

  getDef(season) {
    this._initSeasons();
    return this.SEASONS[season] || this.SEASONS[1];
  },

  effectiveSeason(d) {
    return BH.SeasonRelease
      ? BH.SeasonRelease.effectiveBpSeason(d)
      : (d.bpSeason || 1);
  },

  ensure(d) {
    if (!d) return;
    if (!d.bpClaims) d.bpClaims = {};
    this.ensureWeekly(d);
    this.ensureDaily(d);
    this.ensureSeason(d);
  },

  ensureDaily(d) {
    const dk = this._dayKey();
    if (!d.bpDaily || d.bpDaily.dayKey !== dk) {
      d.bpDaily = { dayKey: dk, prog: {}, claimed: [] };
    }
    if (!d.bpDaily.prog) d.bpDaily.prog = {};
    if (!d.bpDaily.claimed) d.bpDaily.claimed = [];
    this.touchDailyLogin(d);
  },

  touchDailyLogin(d) {
    if (!d || !d.bpDaily) return;
    let dirty = false;
    for (const m of this.getDailyMissions(d.bpDaily.dayKey)) {
      if (m.track !== "login") continue;
      if ((d.bpDaily.claimed || []).includes(m.id)) continue;
      if ((d.bpDaily.prog[m.id] || 0) < 1) {
        d.bpDaily.prog[m.id] = 1;
        dirty = true;
      }
    }
    if (dirty) BH.Progress.save();
  },

  ensureWeekly(d) {
    const wk = this._weekKey();
    if (!d.bpWeekly || d.bpWeekly.weekKey !== wk) {
      d.bpWeekly = { weekKey: wk, prog: {}, claimed: [] };
    }
    if (!d.bpWeekly.prog) d.bpWeekly.prog = {};
    if (!d.bpWeekly.claimed) d.bpWeekly.claimed = [];
  },

  ensureSeason(d) {
    const season = this.effectiveSeason(d);
    if (!d.bpSeasonMissions || d.bpSeasonMissions.season !== season) {
      d.bpSeasonMissions = { season, prog: {}, claimed: [] };
    }
    if (!d.bpSeasonMissions.prog) d.bpSeasonMissions.prog = {};
    if (!d.bpSeasonMissions.claimed) d.bpSeasonMissions.claimed = [];
    this.syncTierMissions(d);
  },

  syncTierMissions(d) {
    if (!d || !d.bpSeasonMissions) return false;
    let dirty = false;
    const tier = this.getTier(d);
    for (const m of this.getSeasonMissions(d)) {
      if (m.track !== "tier") continue;
      if ((d.bpSeasonMissions.claimed || []).includes(m.id)) continue;
      const cur = d.bpSeasonMissions.prog[m.id] || 0;
      const val = Math.min(m.target, tier);
      if (val > cur) {
        d.bpSeasonMissions.prog[m.id] = val;
        dirty = true;
      }
    }
    return dirty;
  },

  /** XP für Stufe t (1 … tiers) — steigt pro Stufe */
  tierXpNeed(bp, tier) {
    if (!bp || tier < 1) return 0;
    if (tier > bp.tiers) return this.overflowXpNeed(bp, tier - bp.tiers);
    const base = bp.xpPerTier || 1000;
    const growth = typeof bp.xpTierGrowth === "number" ? bp.xpTierGrowth : 0;
    return base + (tier - 1) * growth;
  },

  overflowXpNeed(bp, ovIndex) {
    if (!bp || ovIndex < 1) return 0;
    const base = bp.overflowXpPerTier || 1100;
    const growth = bp.overflowXpGrowth || 30;
    return base + (ovIndex - 1) * growth;
  },

  overflowLevel(d) {
    const bp = this.getDef(this.effectiveSeason(d));
    return Math.max(0, this.getTier(d) - bp.tiers);
  },

  _xpThresholds(bp) {
    if (bp._xpThresholds) return bp._xpThresholds;
    const thr = [0];
    let acc = 0;
    for (let t = 1; t <= bp.tiers; t++) {
      acc += this.tierXpNeed(bp, t);
      thr.push(acc);
    }
    bp._xpThresholds = thr;
    return thr;
  },

  getTier(d) {
    const bp = this.getDef(this.effectiveSeason(d));
    if (!bp || !bp.tiers) return 0;
    const xp = d.seasonXp || 0;
    const thr = this._xpThresholds(bp);
    let tier = 0;
    for (let t = 1; t <= bp.tiers; t++) {
      if (xp >= thr[t]) tier = t;
      else break;
    }
    if (tier < bp.tiers) return tier;
    let remain = xp - thr[bp.tiers];
    let ov = 0;
    while (remain >= this.overflowXpNeed(bp, ov + 1)) {
      ov++;
      remain -= this.overflowXpNeed(bp, ov);
    }
    return bp.tiers + ov;
  },

  xpInTier(d) {
    const bp = this.getDef(this.effectiveSeason(d));
    const xp = d.seasonXp || 0;
    const tier = this.getTier(d);
    const thr = this._xpThresholds(bp);
    if (tier < bp.tiers) {
      const need = this.tierXpNeed(bp, tier + 1);
      const current = Math.max(0, xp - thr[tier]);
      return { current, need, done: false, isOverflow: false };
    }
    const ovDone = tier - bp.tiers;
    let spent = thr[bp.tiers];
    for (let o = 1; o <= ovDone; o++) spent += this.overflowXpNeed(bp, o);
    const need = this.overflowXpNeed(bp, ovDone + 1);
    const current = Math.max(0, xp - spent);
    return {
      current,
      need,
      done: false,
      isOverflow: true,
      overflowNext: bp.tiers + ovDone + 1,
    };
  },

  getReward(d, tier, track) {
    const bp = this.getDef(this.effectiveSeason(d));
    const R = this._R;
    if (tier <= bp.tiers) {
      const row = bp.rewards[tier - 1];
      return row ? row[track] : null;
    }
    if (track === "free") {
      return R.cr(bp.overflowCredits || 90);
    }
    return R.dia(bp.overflowDiamonds || 2);
  },

  _claims(d) {
    const s = this.effectiveSeason(d);
    if (!d.bpClaims[s]) d.bpClaims[s] = { free: [], premium: [] };
    return d.bpClaims[s];
  },

  rewardState(d, tier, track) {
    const bp = this.getDef(this.effectiveSeason(d));
    if (tier < 1) return "locked";
    if (tier > this.getTier(d)) return "locked";
    const reward = this.getReward(d, tier, track);
    if (track === "free" && tier <= bp.tiers && !reward) return "empty";
    if (!reward) return "locked";
    const claims = this._claims(d);
    const list = track === "premium" ? claims.premium : claims.free;
    if (list.includes(tier)) return "claimed";
    if (track === "premium" && !d.premiumPass) return "needs-pass";
    return "claimable";
  },

  pendingCount(d) {
    const tier = this.getTier(d);
    const bp = this.getDef(this.effectiveSeason(d));
    let n = 0;
    for (let t = 1; t <= tier; t++) {
      if (this.rewardState(d, t, "free") === "claimable") n++;
      if (this.rewardState(d, t, "premium") === "claimable") n++;
    }
    for (const m of this.getDailyMissions()) {
      if (this.dailyMissionStatus(d, m).claimable) n++;
    }
    for (const m of this.WEEKLY) {
      if (this.missionStatus(d, m).claimable) n++;
    }
    for (const m of this.getSeasonMissions(d)) {
      if (this.seasonMissionStatus(d, m).claimable) n++;
    }
    return n;
  },

  _own(d, cat, id) {
    if (!d.owned) return false;
    if (!d.owned[cat]) d.owned[cat] = [];
    if (d.owned[cat].includes(id)) return false;
    d.owned[cat].push(id);
    return true;
  },

  _has(d, cat, id) {
    return !!(d && d.owned && d.owned[cat] && d.owned[cat].includes(id));
  },

  _hasFinisher(d, id) {
    return this._has(d, "finishers", id);
  },

  _grantDuplicateDiamonds(d) {
    const amount = this.DUPLICATE_DIAMONDS || 5;
    if (BH.OperatorSkills) {
      const ops = (d.owned && d.owned.operators) || [];
      const opId = ops.includes(d.operator) ? d.operator : ops[0];
      if (opId) BH.OperatorSkills.grantDiamonds(d, opId, amount);
    }
    return {
      type: "diamonds",
      amount,
      name: amount + " 💎 (Duplikat)",
      icon: "💎",
      duplicate: true,
    };
  },

  grant(d, reward) {
    if (!reward || !d) return null;
    if (reward.type === "bundle" && reward.rewards) {
      let last = null;
      for (const sub of reward.rewards) {
        const res = this.grant(d, sub);
        if (res) last = res;
      }
      return last || reward;
    }
    switch (reward.type) {
      case "credits":
        d.credits = (d.credits || 0) + (reward.amount || 0);
        break;
      case "camo":
        if (this._has(d, "camos", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "camos", reward.id);
        break;
      case "emblem":
        if (this._has(d, "emblems", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "emblems", reward.id);
        break;
      case "title":
        if (this._has(d, "titles", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "titles", reward.id);
        break;
      case "spray":
        if (this._has(d, "sprays", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "sprays", reward.id);
        break;
      case "charm":
        if (this._has(d, "charms", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "charms", reward.id);
        break;
      case "crosshair":
        if (this._has(d, "crosshairs", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "crosshairs", reward.id);
        break;
      case "color":
        if (this._has(d, "colors", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "colors", reward.id);
        break;
      case "operator":
        if (this._has(d, "operators", reward.id)) return this._grantDuplicateDiamonds(d);
        this._own(d, "operators", reward.id);
        break;
      case "crate":
        if (BH.Crates && BH.Crates.grant) {
          BH.Crates.grant(d, reward.crateType || "front", reward.count || 1, { skipDailyCap: true });
        }
        break;
      case "bpToken":
        if (BH.BpXpTokens) {
          BH.BpXpTokens.grant(d, reward.area || "bp", reward.tier || "30", reward.count || 1);
        }
        break;
      case "finisher":
        if (this._hasFinisher(d, reward.id)) return this._grantDuplicateDiamonds(d);
        if (BH.BpFinishers && BH.BpFinishers.isAvailable()) BH.BpFinishers.grant(d, reward.id);
        else return null;
        break;
      case "diamonds":
        if (BH.OperatorSkills) {
          const ops = (d.owned && d.owned.operators) || [];
          const opId = ops.includes(d.operator) ? d.operator : ops[0];
          if (opId) BH.OperatorSkills.grantDiamonds(d, opId, reward.amount || 0);
        }
        break;
      default: break;
    }
    return reward;
  },

  claim(d, tier, track) {
    this.ensure(d);
    const state = this.rewardState(d, tier, track);
    if (state !== "claimable") return { ok: false, reason: state };
    const reward = this.getReward(d, tier, track);
    if (!reward) return { ok: false, reason: "missing" };
    const finBlock = (r) => r && r.type === "finisher" && BH.BpFinishers && !BH.BpFinishers.isAvailable();
    if (finBlock(reward)) return { ok: false, reason: "s2" };
    if (reward.type === "bundle" && reward.rewards) {
      for (const sub of reward.rewards) {
        if (finBlock(sub)) return { ok: false, reason: "s2" };
      }
    }
    const granted = this.grant(d, reward);
    const claims = this._claims(d);
    const list = track === "premium" ? claims.premium : claims.free;
    if (!list.includes(tier)) list.push(tier);
    BH.Progress.save();
    return { ok: true, reward: granted || reward, tier, track, duplicate: !!(granted && granted.duplicate) };
  },

  claimAll(d) {
    this.ensure(d);
    const tier = this.getTier(d);
    const granted = [];
    for (let t = 1; t <= tier; t++) {
      for (const track of ["free", "premium"]) {
        const res = this.claim(d, t, track);
        if (res.ok) granted.push(res);
      }
    }
    return { ok: true, count: granted.length, granted };
  },

  claimOverflowAll(d) {
    this.ensure(d);
    const bp = this.getDef(this.effectiveSeason(d));
    const tier = this.getTier(d);
    const granted = [];
    for (let t = bp.tiers + 1; t <= tier; t++) {
      for (const track of ["free", "premium"]) {
        const res = this.claim(d, t, track);
        if (res.ok) granted.push(res);
      }
    }
    return { ok: true, count: granted.length, granted };
  },

  onMatchEnd(d, stats, won, modeId) {
    this.ensure(d);
    let dirty = false;
    if (this._trackProgress(d.bpWeekly.prog, d.bpWeekly.claimed || [], this.WEEKLY, stats, won, modeId, d)) {
      dirty = true;
    }
    if (this._trackProgress(d.bpDaily.prog, d.bpDaily.claimed || [], this.getDailyMissions(), stats, won, modeId, d)) {
      dirty = true;
    }
    if (this._trackProgress(d.bpSeasonMissions.prog, d.bpSeasonMissions.claimed || [], this.getSeasonMissions(d), stats, won, modeId, d)) {
      dirty = true;
    }
    if (this.syncTierMissions(d)) dirty = true;
    if (dirty) BH.Progress.save();
  },

  _trackProgress(progObj, claimedList, missions, stats, won, modeId, d) {
    if (!progObj || !missions) return false;
    let dirty = false;
    for (const m of missions) {
      if ((claimedList || []).includes(m.id)) continue;
      const cur = progObj[m.id] || 0;
      if (cur >= m.target) continue;
      if (m.track === "streak") {
        const best = stats.bestStreak || 0;
        if (best > cur) {
          progObj[m.id] = Math.min(m.target, best);
          dirty = true;
        }
        continue;
      }
      if (m.track === "tier") {
        if (!d) continue;
        const t = this.getTier(d);
        if (t > cur) {
          progObj[m.id] = Math.min(m.target, t);
          dirty = true;
        }
        continue;
      }
      let add = 0;
      switch (m.track) {
        case "matches": add = 1; break;
        case "kills": add = stats.kills || 0; break;
        case "wins": add = won ? 1 : 0; break;
        case "headshots": add = stats.headshots || 0; break;
        case "mode": add = modeId === m.modeId ? 1 : 0; break;
        case "login": continue;
        default: break;
      }
      if (add > 0) {
        progObj[m.id] = Math.min(m.target, cur + add);
        dirty = true;
      }
    }
    return dirty;
  },

  dailyMissionStatus(d, mission) {
    this.ensureDaily(d);
    const prog = (d.bpDaily.prog || {})[mission.id] || 0;
    const done = prog >= mission.target;
    const claimed = (d.bpDaily.claimed || []).includes(mission.id);
    return { prog, target: mission.target, done, claimed, claimable: done && !claimed };
  },

  seasonMissionStatus(d, mission) {
    this.ensureSeason(d);
    const prog = (d.bpSeasonMissions.prog || {})[mission.id] || 0;
    const done = prog >= mission.target;
    const claimed = (d.bpSeasonMissions.claimed || []).includes(mission.id);
    return { prog, target: mission.target, done, claimed, claimable: done && !claimed };
  },

  missionStatus(d, mission) {
    this.ensureWeekly(d);
    const prog = (d.bpWeekly.prog || {})[mission.id] || 0;
    const done = prog >= mission.target;
    const claimed = (d.bpWeekly.claimed || []).includes(mission.id);
    return { prog, target: mission.target, done, claimed, claimable: done && !claimed };
  },

  _grantMissionRewards(d, mission) {
    let seasonBonus = 0;
    if (mission.xp) {
      if (BH.BpXpTokens) {
        const sea = BH.BpXpTokens.addSeasonXp(d, mission.xp);
        seasonBonus = sea.bonus;
      } else {
        d.seasonXp = (d.seasonXp || 0) + mission.xp;
      }
    }
    if (mission.credits) d.credits = (d.credits || 0) + mission.credits;
    if (mission.token && BH.BpXpTokens) {
      BH.BpXpTokens.grant(d, "bp", mission.token.tier || "15", mission.token.count || 1);
    }
    if (mission.crate && BH.Crates && BH.Crates.grant) {
      BH.Crates.grant(d, mission.crate.type || "front", mission.crate.count || 1, { skipDailyCap: true });
    }
    return { seasonBonus };
  },

  claimDailyMission(d, missionId) {
    this.ensure(d);
    const mission = this.getDailyMissions().find(m => m.id === missionId);
    if (!mission) return { ok: false, reason: "missing" };
    const st = this.dailyMissionStatus(d, mission);
    if (!st.claimable) return { ok: false, reason: st.claimed ? "claimed" : "progress" };
    const { seasonBonus } = this._grantMissionRewards(d, mission);
    d.bpDaily.claimed.push(missionId);
    this.syncTierMissions(d);
    BH.Progress.maybeAdvanceBpSeason();
    BH.Progress.save();
    return { ok: true, xp: mission.xp, credits: mission.credits || 0, seasonBonus, mission, daily: true };
  },

  claimMission(d, missionId) {
    this.ensure(d);
    const mission = this.WEEKLY.find(m => m.id === missionId);
    if (!mission) return { ok: false, reason: "missing" };
    const st = this.missionStatus(d, mission);
    if (!st.claimable) return { ok: false, reason: st.claimed ? "claimed" : "progress" };
    const { seasonBonus } = this._grantMissionRewards(d, mission);
    d.bpWeekly.claimed.push(missionId);
    this.syncTierMissions(d);
    BH.Progress.maybeAdvanceBpSeason();
    BH.Progress.save();
    return { ok: true, xp: mission.xp, credits: mission.credits || 0, seasonBonus, mission };
  },

  claimSeasonMission(d, missionId) {
    this.ensure(d);
    const mission = this.getSeasonMissions(d).find(m => m.id === missionId);
    if (!mission) return { ok: false, reason: "missing" };
    const st = this.seasonMissionStatus(d, mission);
    if (!st.claimable) return { ok: false, reason: st.claimed ? "claimed" : "progress" };
    const { seasonBonus } = this._grantMissionRewards(d, mission);
    d.bpSeasonMissions.claimed.push(missionId);
    this.syncTierMissions(d);
    BH.Progress.maybeAdvanceBpSeason();
    BH.Progress.save();
    return { ok: true, xp: mission.xp, credits: mission.credits || 0, seasonBonus, mission, season: true };
  },

  buyPremium(d) {
    const bp = this.getDef(this.effectiveSeason(d));
    const premCost = BH.ShopEconomy
      ? BH.ShopEconomy.bpPremiumPrice(bp, d)
      : (bp.premiumPrice || 2200);
    if (d.premiumPass) return { ok: false, reason: "owned" };
    if ((d.credits || 0) < premCost) return { ok: false, reason: "credits", need: premCost };
    d.credits -= premCost;
    d.premiumPass = true;
    BH.Progress.save();
    return { ok: true, price: premCost };
  },

  /** XP-Schwellwert für erreichte Stufe (kumuliert) */
  _xpForTier(bp, tier) {
    if (!bp || tier <= 0) return 0;
    const thr = this._xpThresholds(bp);
    if (tier <= bp.tiers) return thr[tier];
    let xp = thr[bp.tiers];
    for (let o = 1; o <= tier - bp.tiers; o++) {
      xp += this.overflowXpNeed(bp, o);
    }
    return xp;
  },

  /** Preis in ⛁ für N Stufen (restliche XP der ersten Stufe + volle Folgestufen) */
  tierSkipPrice(d, count = 1) {
    this.ensure(d);
    count = Math.max(1, Math.min(25, Math.floor(count || 1)));
    const bp = this.getDef(this.effectiveSeason(d));
    const tierBefore = this.getTier(d);
    const xpInfo = this.xpInTier(d);
    let price = 0;
    for (let i = 0; i < count; i++) {
      const t = tierBefore + 1 + i;
      let xpPortion;
      if (i === 0) {
        xpPortion = Math.max(1, (xpInfo.need || 0) - (xpInfo.current || 0));
      } else {
        xpPortion = t <= bp.tiers
          ? this.tierXpNeed(bp, t)
          : this.overflowXpNeed(bp, t - bp.tiers);
      }
      const base = Math.round(xpPortion * 0.38);
      const season = bp.id >= 2 ? 2 : 1;
      price += BH.ShopEconomy
        ? BH.ShopEconomy.price(base, { season, data: d })
        : base;
    }
    return price;
  },

  /** Stufen mit Credits kaufen — fügt fehlende Saison-XP hinzu */
  buyTierSkip(d, count = 1) {
    this.ensure(d);
    count = Math.max(1, Math.min(25, Math.floor(count || 1)));
    const bp = this.getDef(this.effectiveSeason(d));
    const tierBefore = this.getTier(d);
    const targetTier = tierBefore + count;
    const currentXp = d.seasonXp || 0;
    const targetXp = this._xpForTier(bp, targetTier);
    const addXp = targetXp - currentXp;
    if (addXp <= 0) return { ok: false, reason: "max" };

    const price = this.tierSkipPrice(d, count);
    if ((d.credits || 0) < price) {
      return { ok: false, reason: "credits", need: price, have: d.credits || 0 };
    }

    d.credits -= price;
    if (BH.BpXpTokens) {
      BH.BpXpTokens.addSeasonXp(d, addXp);
    } else {
      d.seasonXp = currentXp + addXp;
    }
    this.syncTierMissions(d);
    BH.Progress.maybeAdvanceBpSeason();
    BH.Progress.save();
    return {
      ok: true,
      price,
      count,
      tierBefore,
      tierAfter: this.getTier(d),
      xpAdded: addXp,
    };
  },
};

/* Abwärtskompatibilität */
BH.BattlePass._initSeasons();
BH.BATTLEPASS = BH.BattlePass.getDef(1);
BH.BATTLEPASS_S2 = BH.BattlePass.getDef(2);
BH.getBattlePass = function (season) {
  return BH.BattlePass.getDef(season);
};
