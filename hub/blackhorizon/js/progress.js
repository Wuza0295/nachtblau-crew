/* Spielerfortschritt: XP, Level, Ränge, Battle Pass, Statistiken */
window.BH = window.BH || {};

/* Ränge: 11 Stufen pro Level-Zyklus (Level 1–100) · 10 Prestige-Zyklen à 100 Level */
BH.RANKS = [
  { name: "REKRUT",     icon: "🎖", level: 1 },
  { name: "GEFREITER",  icon: "⚔", level: 10 },
  { name: "SOLDAT",     icon: "🎯", level: 20 },
  { name: "KORPORAL",   icon: "🛡", level: 30 },
  { name: "FELDWEBEL",  icon: "📡", level: 40 },
  { name: "SERGEANT",   icon: "⭐", level: 50 },
  { name: "LEUTNANT",   icon: "🎖", level: 60 },
  { name: "HAUPTMANN",  icon: "🔱", level: 70 },
  { name: "OBERST",     icon: "🦅", level: 80 },
  { name: "GENERAL",    icon: "👑", level: 90 },
  { name: "LEGENDE",    icon: "🏆", level: 100 },
];

BH.PRESTIGE_TIERS = [
  { tier: 1,  name: "BRONZE",            subtitle: "Frontlinie I",      color: "#cd7f32", icon: "✪" },
  { tier: 2,  name: "SILBER",            subtitle: "Frontlinie II",     color: "#c8d0dc", icon: "✪" },
  { tier: 3,  name: "GOLD",              subtitle: "Elite-Kampf",       color: "#ffd24d", icon: "✪" },
  { tier: 4,  name: "PLATIN",            subtitle: "Spezialops",        color: "#7dd3fc", icon: "✪" },
  { tier: 5,  name: "SMARAGD",           subtitle: "Veteranen-Krieg",   color: "#4ade80", icon: "✪" },
  { tier: 6,  name: "RUBIN",             subtitle: "Schocktruppe",      color: "#f87171", icon: "✪" },
  { tier: 7,  name: "SAPHIR",            subtitle: "Nachtfalke",        color: "#6366f1", icon: "✪" },
  { tier: 8,  name: "OBSIDIAN",          subtitle: "Schwarze Garde",    color: "#a855f7", icon: "✪" },
  { tier: 9,  name: "HORIZONT",          subtitle: "Alpha-Sturm",       color: "#38bdf8", icon: "✪" },
  { tier: 10, name: "SCHWARZER HORIZONT", subtitle: "Endgame · Max",    color: "#ff7a00", icon: "★" },
];

BH.MAX_LEVEL = 100;
BH.MAX_PRESTIGE = 10;

BH.Ranks = {
  careerLevel(d) {
    const data = d || (BH.Progress && BH.Progress.data) || {};
    const p = data.prestige || 0;
    const lvl = BH.Progress ? BH.Progress.getLevel().level : 1;
    return p * BH.MAX_LEVEL + lvl;
  },

  maxCareerLevel() {
    return BH.MAX_PRESTIGE * BH.MAX_LEVEL + BH.MAX_LEVEL;
  },

  prestigeTier(prestige) {
    const p = prestige || 0;
    if (p < 1) return null;
    return BH.PRESTIGE_TIERS.find(t => t.tier === p) || null;
  },

  nextPrestigeTier(prestige) {
    const next = (prestige || 0) + 1;
    if (next > BH.MAX_PRESTIGE) return null;
    return BH.PRESTIGE_TIERS.find(t => t.tier === next) || null;
  },

  prestigeCreditMult(prestige) {
    const p = Math.max(0, Math.min(BH.MAX_PRESTIGE, prestige || 0));
    return 1 + p * 0.12;
  },

  prestigeCreditBonusPct(prestige) {
    return Math.round((this.prestigeCreditMult(prestige) - 1) * 100);
  },

  prestigeReward(prestige) {
    const p = prestige || 0;
    const next = p + 1;
    const credits = Math.round(2000 + next * 550 + p * 300);
    return {
      credits,
      tier: this.nextPrestigeTier(prestige),
      mult: this.prestigeCreditMult(p),
    };
  },

  prestigeTierState(tier, d, lvlInfo) {
    const p = (d && d.prestige) || 0;
    const info = lvlInfo || (BH.Progress && BH.Progress.getLevel()) || { level: 1, maxed: false };
    if (p >= tier) return "done";
    if (p === tier - 1) return "active";
    return "locked";
  },

  displayRank(d) {
    const data = d || (BH.Progress && BH.Progress.data) || {};
    const rank = BH.Progress ? BH.Progress.getRank() : BH.RANKS[0];
    const p = data.prestige || 0;
    const pt = this.prestigeTier(p);
    return {
      ...rank,
      prestige: p,
      prestigeTier: pt,
      label: (p > 0 ? "✪" + p + " · " : "") + rank.name,
      accent: pt ? pt.color : "#ff7a00",
    };
  },

  cycleLabel(prestige) {
    const p = prestige || 0;
    return p >= BH.MAX_PRESTIGE ? "MAX PRESTIGE" : "Zyklus " + (p + 1) + " / " + BH.MAX_PRESTIGE;
  },

  cycleCreditsTotal(prestige) {
    const p = prestige != null ? prestige : 0;
    let sum = 0;
    for (let l = 1; l <= BH.MAX_LEVEL; l++) {
      sum += BH.Progress.levelReward(l, p).credits;
    }
    return sum;
  },

  cycleCreditsEarned(lvlInfo, d) {
    const data = d || (BH.Progress && BH.Progress.data) || {};
    const prestige = data.prestige || 0;
    const lvl = lvlInfo ? lvlInfo.level : 1;
    let sum = 0;
    for (let l = 2; l <= Math.min(lvl, BH.MAX_LEVEL); l++) {
      sum += BH.Progress.levelReward(l, prestige).credits;
    }
    return sum;
  },

  levelCycleState(level, lvlInfo) {
    const lvl = lvlInfo.level;
    if (lvlInfo.maxed) return "done";
    if (level <= lvl) return "done";
    if (level === lvl + 1) return "next";
    return "locked";
  },

  levelEntry(level, prestige) {
    const p = prestige != null ? prestige : ((BH.Progress && BH.Progress.data && BH.Progress.data.prestige) || 0);
    const reward = BH.Progress.levelReward(level, p);
    const rank = BH.RANKS.find(r => r.level === level);
    const xp = level < BH.MAX_LEVEL ? BH.Progress.xpForLevel(level) : 0;
    return {
      level,
      credits: reward.credits,
      bonus: reward.bonus,
      rank: rank ? rank.name : null,
      rankIcon: rank ? rank.icon : null,
      milestone: level % 10 === 0,
      prestigeUnlock: level === BH.MAX_LEVEL,
      xp,
      prestige: p,
      mult: reward.mult,
    };
  },

  infoPrestigeTier(prestigeTier) {
    const t = Math.max(1, Math.min(BH.MAX_PRESTIGE, prestigeTier || 1));
    const meta = BH.PRESTIGE_TIERS.find(x => x.tier === t);
    const cycleAt = t - 1;
    const reward = this.prestigeReward(cycleAt);
    const camos = (BH.CAMOS || []).filter(c => c.requirePrestige === t);
    return {
      tier: t,
      meta,
      cycleAt,
      cycleLabel: cycleAt === 0 ? "Erster Durchlauf · ohne Prestige" : "✪" + cycleAt + " · " + (this.prestigeTier(cycleAt)?.name || "Zyklus"),
      completionReward: reward,
      camos,
    };
  },

  defaultInfoPrestige(d) {
    const p = (d && d.prestige) || 0;
    if (p >= BH.MAX_PRESTIGE) return BH.MAX_PRESTIGE;
    return p + 1;
  },
};

/** Studio-Credits */
BH.STUDIO = {
  name: "NACHTBLAU Interaktive",
  creditLine: "© NACHTBLAU Interaktive",
  byLine: "Entwicklung · NACHTBLAU Interaktive",
};

/** Spielversion (sichtbar für Spieler) */
BH.GAME_VERSION = "0.0.1";

BH.gameVersionLabel = function (d) {
  const data = d || (BH.Progress && BH.Progress.data) || {};
  const season = BH.SeasonRelease
    ? BH.SeasonRelease.effectiveBpSeason(data)
    : (data.bpSeason || 1);
  return "v" + BH.GAME_VERSION + " · Saison " + season;
};

BH.gameVersionShort = function () {
  return "v" + (BH.GAME_VERSION || "0.0.0");
};

BH.gameVersionUpdateLabel = function () {
  return "Update " + (BH.GAME_VERSION || "0.0.1");
};

/* Battle-Pass-Definitionen → js/battle-pass.js (BH.BattlePass) */
BH.SHOP = {
  camos: [
    { id: "blutmond", name: "Blutmond",    color: 0x7a1020, price: 400 },
    { id: "toxin",    name: "Toxin",       color: 0x39c41f, price: 400 },
    { id: "hex",      name: "Hex-Tarn",    color: 0x0fb8a0, price: 500 },
    { id: "chrom",    name: "Chrom",       color: 0xc8ccd2, price: 600 },
    { id: "galaxie",  name: "Galaxie",     color: 0x6a2fd0, price: 800 },
    { id: "inferno",  name: "Inferno",     color: 0xff5a00, price: 800 },
    { id: "aschegrau", name: "Aschegrau",  color: 0x5a5a5a, price: 350 },
    { id: "kobalt",   name: "Kobalt",      color: 0x1a3a8a, price: 450 },
    { id: "smaragd",  name: "Smaragd",     color: 0x0a6a4a, price: 450 },
    { id: "vulkan",   name: "Vulkan",      color: 0x8a2020, price: 500 },
    { id: "sandsturm", name: "Sandsturm",  color: 0xc4a060, price: 400 },
    { id: "mitternacht", name: "Mitternacht", color: 0x0a1428, price: 550 },
    { id: "predator", name: "Predator",    color: 0x3a4a20, price: 500 },
    { id: "void",     name: "Void",        color: 0x120818, price: 700 },
    { id: "aurora",   name: "Aurora",      color: 0x4a90d9, price: 750 },
    { id: "drachen",  name: "Drachenfeuer", color: 0xff4500, price: 900 },
    { id: "stahlblau", name: "Stahlblau",  color: 0x2563eb, price: 480 },
    { id: "neon_vio", name: "Neon · Violett", color: 0x0c0618, neon: true, neonColor: 0x9333ea, price: 620 },
    { id: "neon_toxic", name: "Neon · Toxic", color: 0x061008, neon: true, neonColor: 0x39ff14, price: 580 },
    { id: "neon_pulse", name: "Neon · Puls", color: 0x080612, neon: true, neonColor: 0x06b6d4, price: 650 },
    { id: "neon_ghost", name: "Neon · Ghost", color: 0x0a0c14, neon: true, neonColor: 0xe0f2ff, price: 720 },
    { id: "neon_sunset", name: "Neon · Sunset", color: 0x120608, neon: true, neonColor: 0xff6b9d, price: 680 },
    { id: "phoenix_gold", name: "Phönix-Gold", color: 0xf59e0b, price: 850 },
    { id: "beta_pulse", name: "Beta-Puls",  color: 0x06b6d4, price: 720 },
  ],
  premiumDays: [
    { id: "prem_1",   days: 1,   price: 600,   icon: "⭐", desc: "1 Tag Premium · +15 % Match-XP · +10 % Credits" },
    { id: "prem_3",   days: 3,   price: 1650,  icon: "⭐", desc: "3 Tage Premium · stapelbar" },
    { id: "prem_7",   days: 7,   price: 3500,  icon: "⭐", desc: "1 Woche Premium · stapelbar" },
    { id: "prem_14",  days: 14,  price: 6500,  icon: "⭐", desc: "2 Wochen Premium · stapelbar" },
    { id: "prem_30",  days: 30,  price: 13500, icon: "💎", badge: "BELIEBT", desc: "1 Monat Premium-Spielzeit" },
    { id: "prem_90",  days: 90,  price: 35000, icon: "💎", desc: "3 Monate Premium · Saison-Pass" },
    { id: "prem_180", days: 180, price: 62000, icon: "💎", badge: "TEUER", desc: "6 Monate Premium · Langzeit" },
    { id: "prem_365", days: 365, price: 110000, icon: "👑", badge: "MEGA", desc: "1 Jahr Premium · bestes Paket" },
  ],
  /** Operator-Skill-Diamanten · extrem teuer — gilt für gewählten Operator */
  diamondPacks: [
    { id: "dia_60",    diamonds: 60,    price: 24000,  icon: "💎", desc: "Einstieg · mehr Diamanten pro Paket" },
    { id: "dia_180",   diamonds: 180,   price: 58000,  icon: "💎", badge: "TEUER", desc: "Mittleres Paket · Skill-Fortschritt" },
    { id: "dia_500",   diamonds: 500,   price: 145000, icon: "💎", desc: "Großes Paket · mehrere Skills" },
    { id: "dia_1200",  diamonds: 1200,  price: 330000, icon: "💎", badge: "LUXUS", desc: "Max-Paket · volle Skill-Bäume" },
  ],
  crosshairs: [
    { id: "classic", name: "Klassisch", glyph: "✛", price: 0 },
    { id: "dot",     name: "Punkt",     glyph: "⦁", price: 200 },
    { id: "tshape",  name: "T-Form",    glyph: "⊥", price: 250 },
    { id: "circle",  name: "Kreis",     glyph: "◎", price: 300 },
    { id: "sharp",   name: "Scharf",    glyph: "✚", price: 280 },
    { id: "diamond", name: "Diamant",   glyph: "◇", price: 350 },
    { id: "brackets", name: "Ecken",    glyph: "⌜", price: 400 },
    { id: "xform",   name: "X-Form",    glyph: "✕", price: 320 },
  ],
  colors: [
    { id: "white",  name: "Weiß",    css: "#ffffff", price: 0 },
    { id: "green",  name: "Grün",    css: "#3ddc84", price: 100 },
    { id: "cyan",   name: "Cyan",    css: "#39c5ff", price: 100 },
    { id: "red",    name: "Rot",     css: "#ff3b30", price: 100 },
    { id: "yellow", name: "Gelb",    css: "#ffd24d", price: 100 },
    { id: "pink",   name: "Pink",    css: "#ff2bd6", price: 150 },
    { id: "orange", name: "Orange",  css: "#ff9500", price: 100 },
    { id: "purple", name: "Violett", css: "#bf5af2", price: 120 },
    { id: "lime",   name: "Limette", css: "#adff2f", price: 100 },
    { id: "gold",   name: "Gold",    css: "#ffd700", price: 150 },
  ],
  sprays: [
    { id: "gg",       name: "GG",              icon: "🫡", price: 300 },
    { id: "ez",       name: "EZ",              icon: "😎", price: 300 },
    { id: "boom",     name: "BOOM",            icon: "💥", price: 350 },
    { id: "skull_s",  name: "Totenkopf",       icon: "💀", price: 350 },
    { id: "fire_s",   name: "In Flammen",      icon: "🔥", price: 400 },
    { id: "salute",   name: "Gruß",            icon: "🎖", price: 400 },
    { id: "laugh",    name: "Lach-Spray",      icon: "😂", price: 450 },
    { id: "horizon",  name: "Black Horizon",   icon: "🌑", price: 600 },
    { id: "outbreak", name: "Outbreak",        icon: "🧟", price: 500 },
    { id: "target",   name: "Ziel erfasst",    icon: "🎯", price: 450 },
    { id: "proto",    name: "Prototyp",        icon: "⚡", price: 520 },
    { id: "beta_sig", name: "Beta-Siegel",     icon: "🔹", price: 480 },
    { id: "void_mark", name: "Void-Mark",      icon: "🌑", price: 550 },
  ],
  emblems: [
    { id: "shop_wolf",    name: "Wolf",           icon: "🐺", price: 500 },
    { id: "shop_cross",   name: "Fadenkreuz",     icon: "🎯", price: 450 },
    { id: "shop_nuke",    name: "Atombombe",      icon: "☢", price: 650 },
    { id: "shop_crown",   name: "Krone",          icon: "👑", price: 700 },
    { id: "shop_shield",  name: "Schild",         icon: "🛡", price: 550 },
    { id: "shop_horizon", name: "Horizont",       icon: "🌑", price: 800 },
    { id: "shop_viper",   name: "Viper",          icon: "🐍", price: 600 },
    { id: "shop_blood",   name: "Blutbadge",      icon: "🩸", price: 550 },
    { id: "shop_proto",   name: "Prototyp-Badge", icon: "⚡", price: 680 },
    { id: "shop_beta",    name: "Beta-Signal",    icon: "🔹", price: 720 },
  ],
  titles: [
    { id: "shop_apex",     name: "Apex-Jäger",        price: 600 },
    { id: "shop_silent",   name: "Stille Hand",       price: 550 },
    { id: "shop_reaper",   name: "Schnitter",         price: 700 },
    { id: "shop_merc",     name: "Söldner",           price: 500 },
    { id: "shop_warlord",  name: "Kriegsherr",        price: 850 },
    { id: "shop_elite",    name: "Horizon-Elite",     price: 900 },
    { id: "shop_ghost",    name: "Phantom",           price: 650 },
    { id: "shop_danger",   name: "Lebendige Gefahr",  price: 750 },
    { id: "shop_proto",    name: "Prototyp-Jäger",    price: 680 },
    { id: "shop_void",     name: "Void-Runner",       price: 820 },
  ],
  xpTokens: [
    { id: "boost_lvl_15", area: "level", tier: "15", name: "Level · 15 Min.", desc: "2× Account-Level-XP", price: 420, icon: "📈" },
    { id: "boost_lvl_30", area: "level", tier: "30", name: "Level · 30 Min.", desc: "2× Account-Level-XP", price: 680, icon: "📈" },
    { id: "boost_lvl_60", area: "level", tier: "60", name: "Level · 1 Std.", desc: "2× Account-Level-XP", price: 1150, icon: "📈" },
    { id: "boost_bp_15",  area: "bp",    tier: "15", name: "Battle Pass · 15 Min.", desc: "2× Saison- & BP-XP", price: 420, icon: "🎖" },
    { id: "boost_bp_30",  area: "bp",    tier: "30", name: "Battle Pass · 30 Min.", desc: "2× Saison- & BP-XP", price: 680, icon: "🎖", badge: "BELIEBT" },
    { id: "boost_bp_60",  area: "bp",    tier: "60", name: "Battle Pass · 1 Std.", desc: "2× Saison- & BP-XP", price: 1150, icon: "🎖" },
    { id: "boost_cln_15", area: "clan",  tier: "15", name: "Clan · 15 Min.", desc: "2× Clan-XP · Clan nötig", price: 480, icon: "🛡" },
    { id: "boost_cln_30", area: "clan",  tier: "30", name: "Clan · 30 Min.", desc: "2× Clan-XP · Clan nötig", price: 750, icon: "🛡" },
    { id: "boost_cln_60", area: "clan",  tier: "60", name: "Clan · 1 Std.", desc: "2× Clan-XP · Clan nötig", price: 1250, icon: "🛡" },
  ],
  /* Bundles – mehrere Items zum Paketpreis (Credits, kein Echtgeld) */
  bundles: [
    {
      id: "starter", name: "EINSTIEGSPAKET", badge: "SPARPAKET", price: 1199,
      desc: "Der perfekte Start in Saison 1.",
      items: { camos: ["blutmond", "toxin"], crosshairs: ["dot"], colors: ["cyan"], credits: 250 },
    },
    {
      id: "ghost_ops", name: "GEIST-OPS BUNDLE", badge: "OPERATOR", price: 2199,
      desc: "GEIST-9 plus Tarn- und Visier-Set.",
      items: { operators: ["ghost9"], camos: ["hex"], crosshairs: ["circle"], colors: ["pink"] },
    },
    {
      id: "vanguard", name: "VANGUARD ELITE", badge: "ELITE", price: 2899,
      desc: "CINDER und zwei Premium-Skins.",
      items: { operators: ["cinder"], camos: ["chrom", "inferno"], crosshairs: ["tshape"], colors: ["red", "yellow"] },
    },
    {
      id: "frontline", name: "ASCHEFRONT-PAKET", badge: "SAISON 1", price: 3499,
      desc: "Alles für die Karten-Rotation der Aschefront.",
      items: { operators: ["karst", "breaker"], camos: ["galaxie", "inferno"], crosshairs: ["circle", "dot"], colors: ["green", "cyan"], credits: 400 },
    },
    {
      id: "legend", name: "LEGENDEN-KISTE", badge: "MEGA", price: 4999,
      desc: "Das ultimative Kosmetik-Bundle der Saison.",
      items: { operators: ["ghost9", "cinder", "karst"], camos: ["blutmond", "hex", "galaxie", "inferno"], crosshairs: ["dot", "circle", "tshape"], colors: ["green", "cyan", "red", "yellow", "pink"], credits: 800 },
    },
    {
      id: "cosmetic", name: "KOSMETIK-PAKET", badge: "NEU", price: 1899,
      desc: "Sprays, Embleme und Titel in einem Paket.",
      items: { sprays: ["gg", "boom", "horizon"], emblems: ["shop_wolf", "shop_cross"], titles: ["shop_merc", "shop_silent"], credits: 200 },
    },
    {
      id: "arsenal", name: "ARSENAL-PAKET", badge: "SKINS", price: 2299,
      desc: "Acht Premium-Waffen-Skins für jede Front.",
      items: { camos: ["kobalt", "smaragd", "vulkan", "mitternacht", "predator", "void", "aurora", "drachen"], credits: 300 },
    },
    {
      id: "elite_ops", name: "ELITE-OPS", badge: "PREMIUM", price: 3999,
      desc: "Operator BRECHER, Visier-Set und Horizon-Kosmetik.",
      items: { operators: ["breaker"], camos: ["drachen", "aurora"], crosshairs: ["diamond", "xform"], colors: ["gold", "purple"], emblems: ["shop_crown", "shop_horizon"], titles: ["shop_elite"], sprays: ["horizon"], credits: 500 },
    },
    {
      id: "horizon_ultimate", name: "HORIZONT-MEGAKISTE", badge: "ULTIMATE", price: 7999, featured: true,
      desc: "Das größte Paket im Shop — 5 Operatoren, alle Tarnungen, jedes Fadenkreuz und Premium-Kosmetik inkl. 2.000 Bonus-Credits.",
      items: {
        operators: ["striker", "zero", "raven", "fluss", "vortex"],
        camos: ["blutmond", "hex", "galaxie", "inferno", "chrom", "void", "aurora", "drachen", "mitternacht", "predator", "kobalt", "smaragd", "vulkan", "sandsturm", "aschegrau", "toxin"],
        crosshairs: ["dot", "tshape", "circle", "sharp", "diamond", "brackets", "xform"],
        colors: ["green", "cyan", "red", "yellow", "pink", "orange", "purple", "lime", "gold"],
        sprays: ["gg", "ez", "boom", "skull_s", "fire_s", "salute", "horizon", "outbreak", "target", "laugh"],
        emblems: ["shop_wolf", "shop_cross", "shop_nuke", "shop_crown", "shop_shield", "shop_horizon", "shop_viper", "shop_blood"],
        titles: ["shop_apex", "shop_silent", "shop_reaper", "shop_merc", "shop_warlord", "shop_elite", "shop_ghost", "shop_danger"],
        charms: ["skull_ch", "star_ch", "bolt_ch", "horizon_ch", "dogtag", "flame_ch"],
        callingCards: ["blood", "neon", "horizon"],
        credits: 2000,
      },
    },
    {
      id: "tower_zero", name: "HOCHHAUS-ZERO PAKET", badge: "SAISON 2", season: 2, price: 5499, featured: true,
      desc: "Alles für vertikales Gameplay — RABE & ZERO, Nacht-Skins, Horizon-Flair und 900 Bonus-Credits.",
      items: {
        operators: ["raven", "zero"],
        camos: ["mitternacht", "void", "aurora", "kobalt"],
        crosshairs: ["brackets", "diamond", "sharp"],
        colors: ["purple", "gold", "cyan"],
        sprays: ["horizon", "target", "salute"],
        emblems: ["shop_horizon", "shop_viper"],
        titles: ["shop_elite", "shop_ghost"],
        charms: ["horizon_ch", "bolt_ch"],
        callingCards: ["horizon", "neon"],
        credits: 900,
      },
    },
    {
      id: "vanguard_war", name: "VANGUARD-KRIEGSMACHINE", badge: "VANGUARD", price: 4999, featured: true,
      desc: "CINDER, VORTEX & SLAG — die komplette Vanguard-Front mit Inferno-Look und 750 Bonus-Credits.",
      items: {
        operators: ["cinder", "vortex", "slag"],
        camos: ["inferno", "vulkan", "drachen", "chrom", "blutmond"],
        crosshairs: ["tshape", "diamond", "xform"],
        colors: ["red", "yellow", "gold", "orange"],
        sprays: ["fire_s", "boom", "outbreak"],
        emblems: ["shop_nuke", "shop_crown"],
        titles: ["shop_warlord", "shop_danger"],
        charms: ["flame_ch", "bolt_ch"],
        callingCards: ["blood", "neon"],
        credits: 750,
      },
    },
    {
      id: "phantom_cmd", name: "PHANTOM-KOMMANDO", badge: "STEALTH", price: 4599,
      desc: "GEIST-9 & STRIKER — Schatten-Operatoren mit Void-Tarnung, Elite-Emblemen und Totenkopf-Charm.",
      items: {
        operators: ["ghost9", "striker"],
        camos: ["void", "mitternacht", "predator", "hex"],
        crosshairs: ["circle", "dot", "xform"],
        colors: ["pink", "purple", "cyan"],
        sprays: ["skull_s", "target", "horizon"],
        emblems: ["shop_viper", "shop_blood", "shop_nuke"],
        titles: ["shop_ghost", "shop_reaper", "shop_danger"],
        charms: ["skull_ch", "dogtag"],
        credits: 650,
      },
    },
    {
      id: "tf_command", name: "NACHTFALKE-KOMMANDO", badge: "TASK FORCE", price: 4499,
      desc: "BRECHER, FLUSS & RABE — die Task-Force-Trinity mit Kobalt-Skins und Horizon-Kosmetik.",
      items: {
        operators: ["breaker", "fluss", "raven"],
        camos: ["kobalt", "aurora", "aschegrau", "smaragd"],
        crosshairs: ["brackets", "circle", "dot"],
        colors: ["cyan", "green", "gold"],
        sprays: ["salute", "gg", "horizon"],
        emblems: ["shop_cross", "shop_horizon", "shop_shield"],
        titles: ["shop_elite", "shop_apex"],
        charms: ["horizon_ch", "star_ch", "bolt_ch"],
        callingCards: ["horizon"],
        credits: 600,
      },
    },
    {
      id: "desert_legion", name: "WÜSTEN-LEGION", badge: "KORPS", price: 4299,
      desc: "KARST & DÜNE plus Sandsturm-Skins — das komplette Wüstenkorps-Paket mit 550 Bonus-Credits.",
      items: {
        operators: ["karst", "dune"],
        camos: ["sandsturm", "vulkan", "smaragd", "toxin", "galaxie"],
        crosshairs: ["tshape", "sharp", "circle"],
        colors: ["yellow", "orange", "lime", "green"],
        sprays: ["fire_s", "boom", "ez"],
        emblems: ["shop_shield", "shop_wolf"],
        titles: ["shop_merc", "shop_apex"],
        charms: ["flame_ch", "star_ch"],
        callingCards: ["blood"],
        credits: 550,
      },
    },
    {
      id: "outbreak_crate", name: "OUTBREAK-KISTE", badge: "ZOMBIES", price: 3799,
      desc: "Für Zombie-Fans — Outbreak-Sprays, Totenkopf-Charm, Blutmond-Tarnung und 450 Bonus-Credits.",
      items: {
        operators: ["cinder"],
        camos: ["blutmond", "toxin", "inferno", "predator"],
        crosshairs: ["dot", "sharp"],
        colors: ["red", "green", "pink"],
        sprays: ["outbreak", "fire_s", "skull_s", "laugh"],
        emblems: ["shop_blood", "shop_nuke"],
        titles: ["shop_reaper", "shop_silent"],
        charms: ["skull_ch", "flame_ch", "dogtag"],
        callingCards: ["blood"],
        credits: 450,
      },
    },
    {
      id: "prototype_arsenal", name: "PROTOTYP-LOOK", badge: "KOSMETIK", price: 3499, featured: true,
      desc: "Prototyp-Style ohne Waffen — Skins & Sprays. Legendary-Waffen nur über Alpha- & Beta-Kiste.",
      items: {
        camos: ["beta_pulse", "void", "neon_vio"],
        sprays: ["proto", "horizon"],
        titles: ["shop_proto"],
        emblems: ["shop_proto"],
        credits: 500,
      },
    },
    {
      id: "beta_strike", name: "BETA-STRIKE", badge: "BETA · S2", season: 2, price: 5799,
      desc: "VEIL, ATLAS & EMBER plus Beta-Kosmetik — ideal für die Beta-Kiste.",
      items: {
        operators: ["veil", "atlas", "ember"],
        camos: ["beta_pulse", "stahlblau", "mitternacht"],
        sprays: ["beta_sig", "void_mark", "proto"],
        emblems: ["shop_beta", "shop_proto"],
        titles: ["shop_void", "shop_proto"],
        charms: ["bolt_ch", "horizon_ch"],
        credits: 700,
      },
    },
    {
      id: "horizon_ops", name: "HORIZONT-OPS", badge: "S2 · OPS", season: 2, price: 4999,
      desc: "CIPHER & RABE · Horizont-Skins, Embleme und 600 Bonus-Credits.",
      items: {
        operators: ["cipher", "raven"],
        camos: ["phoenix_gold", "aurora", "void"],
        crosshairs: ["diamond", "brackets"],
        sprays: ["horizon", "void_mark"],
        emblems: ["shop_horizon", "shop_beta"],
        titles: ["shop_elite", "shop_void"],
        callingCards: ["horizon", "neon"],
        credits: 600,
      },
    },
  ],
};

/** Shop-Preise — Basis-Skalierung + Saison-2-Aufschlag ab S2-Start */
BH.ShopEconomy = {
  mult: 2.25,
  /** Zusätzlicher Aufschlag für S2-Inhalte (auf bereits skalierten Preis) */
  s2Mult: 1.4,

  /** Ab globalem S2-Start — nicht an persönlichen BP-Fortschritt gebunden */
  isS2Active() {
    if (!BH.SeasonRelease) return false;
    if (BH.SeasonRelease.isS2Live()) return true;
    const sr = BH.SeasonRelease;
    return sr.isS2Feature("battlePass")
      || sr.isS2Feature("eventCrateHorizon")
      || sr.isS2Feature("eventCrateBeta")
      || sr.isS2Feature("operators");
  },

  _round(scaled) {
    if (scaled >= 2000) return Math.round(scaled / 100) * 100;
    if (scaled >= 500) return Math.round(scaled / 50) * 50;
    if (scaled >= 100) return Math.round(scaled / 25) * 25;
    return Math.max(10, Math.round(scaled / 10) * 10);
  },

  price(base, opts) {
    const n = Number(base);
    if (!n || n <= 0) return 0;
    const o = opts || {};
    let mult = this.mult;
    if (o.season === 2 && this.isS2Active()) mult *= this.s2Mult;
    return this._round(Math.round(n * mult));
  },

  bundlePrice(bundle, data) {
    if (!bundle) return 0;
    const season = bundle.season || (bundle.badge === "SAISON 2" ? 2 : 1);
    return this.price(bundle.price, { season, data });
  },

  operatorPrice(op, data) {
    if (!op || !op.price) return 0;
    const s2 = BH.OperatorCatalog && BH.OperatorCatalog.useS2(data);
    return this.price(op.price, { season: s2 ? 2 : 1, data });
  },

  bpPremiumPrice(bpDef, data) {
    if (!bpDef) return 0;
    const season = bpDef.id >= 2 ? 2 : 1;
    return this.price(bpDef.premiumPrice || 2200, { season, data });
  },
};

/* Willkommen-Banner (Startseite) — Neuerungen auf einen Blick */
BH.WELCOME_UPDATE = {
  date: "13.06.2026",
  tag: "UPDATE",
  title: "3D-MULTIPLAYER · KISTEN · NEUE MODI",
  subtitle: "Grafik-Push · Alpha-Pity · 8 Event-Kisten · Hardpoint · Flaggenraub · Eskorte",
  highlights: [
    { icon: "🎮", text: "Multiplayer 3D: Bot-Waffen, Regen & Schnee, Rauch-Volumes, Panzer-Hulls, S&D-Beacons" },
    { icon: "💥", text: "Feuer-Effekte: Viewmodel-Muzzle-Flash, Bullet-Decals, Shockwave-Explosionen, Sprint-Staub" },
    { icon: "📦", text: "ALPHA-Kiste: höhere Credits · Legendär-Pity nach 1.000 Öffnungen · 8 neue Platzhalter-Kisten" },
    { icon: "🔒", text: "3 neue Modi als Coming Soon: Hardpoint, Flaggenraub & Eskorte im Modus-Menü" },
    { icon: "🎖", text: "Battle Pass, Diamanten-Skills, Fraktionskrieg & 2×-Booster — Details im DevBlog" },
    { icon: "⭐", text: "DevBlog lesen & 1 Tag Premium gratis einsammeln — oben im News-Tab" },
  ],
};

/* DevBlog-Geschenk: 1 Tag Premium fürs Lesen der News */
BH.DevBlogReward = {
  canClaim(d) {
    return !!(d && !d.devblogNewsPremium);
  },

  claimPremiumDay(d) {
    if (!d) return { ok: false, reason: "missing" };
    if (d.devblogNewsPremium) return { ok: false, reason: "claimed" };
    if (!BH.PremiumPlaytime) return { ok: false, reason: "missing" };
    BH.PremiumPlaytime.grantDays(d, 1);
    d.devblogNewsPremium = true;
    BH.Progress.save();
    return { ok: true, days: 1 };
  },
};

/* DevBlog – Patchnotes & News */
BH.DEVBLOG = [
  {
    id: "mp-3d-update-jun2026",
    date: "13.06.2026",
    tag: "3D-UPDATE",
    tagClass: "db-tag-game",
    title: "MULTIPLAYER 3D · BOTS · EFFEKTE · KARTEN",
    text: "Der Multiplayer bekommt deutlich mehr Tiefe: humanoide Bots mit Waffen, Wetter, Rauch, Panzer im Frontkrieg, leuchtende Zonen und neue Map-Props auf allen Karten.",
    intro: "Zwei Grafik-Pushes für den Bot-Multiplayer: mehr Silhouette, mehr Feedback beim Schießen und lebendigere Arenen — ohne Performance-Killer wie hunderte dynamische Lichter.",
    premiumGift: true,
    sections: [
      {
        emoji: "🤖",
        title: "BOT-VISUALS",
        subtitle: "Humanoids · Waffen · Panzer",
        changes: [
          "Soldaten-Bots: Helm, Visor, Weste, Schulterpads & procedurale Sturmgewehre",
          "Muzzle-Flash an Bot-Waffen beim Schießen (emissive, kein Extra-Licht)",
          "Frontkrieg-Panzer: Rumpf, Ketten, Turm & Rohr statt skaliertem Soldat",
          "Todes-Funken in Teamfarbe bei Bot-Eliminierungen",
        ],
      },
      {
        emoji: "💥",
        title: "SPIELER-EFFEKTE",
        subtitle: "Schießen · Treffer · Explosionen",
        changes: [
          "Viewmodel-Muzzle-Flash beim eigenen Schuss",
          "Bullet-Decals an Wänden · Funken statt PointLight pro Einschlag",
          "Explosionen mit Shockwave-Ring, Trümmer & Funken-Burst",
          "Spieler-Schatten unter den Füßen · Sprint-Staub beim Rennen",
        ],
      },
      {
        emoji: "🌧",
        title: "WETTER & Rauch",
        subtitle: "Regen · Schnee · Smoke-Grenades",
        changes: [
          "Regen-Partikel auf Karten mit Regen-Variante (Frostlinie u. a.)",
          "Schneefall auf der Frostlinie (wenn kein Regen aktiv)",
          "3D-Rauch-Volumes für Smoke-Grenades — animierte Puffs",
        ],
      },
      {
        emoji: "🗺",
        title: "KARTEN & MODI",
        subtitle: "Props · Zonen · S&D",
        changes: [
          "Hafen & Sierra-7: extra Fässer, Kisten, Straßenlaternen",
          "Frostlinie: Sandsäcke, Fässer, blaue Laternen · Vorort Zero: Glut & Trümmer · Hochhaus: Neon-Streifen",
          "Herrschaft/Eroberung: Flaggen-Masten, Boden-Pads & animierte Flaggen",
          "Suchen & Zerstören: leuchtende Bomben-Spot-Beacons mit Puls-Animation",
        ],
      },
    ],
    notes: [
      "Performance: keine InstancedMesh-Props · keine PointLights pro Schuss",
      "Grafik-Presets (Tone Mapping, Schatten) greifen nach Map-Load",
      "Feedback über 🐛 FEEDBACK im Einstellungs-Menü",
    ],
    notesLabel: "HINWEIS",
  },
  {
    id: "crates-economy-jun2026",
    date: "13.06.2026",
    tag: "KISTEN",
    tagClass: "db-tag-season",
    title: "ALPHA-KISTE · PITY · 8 EVENT-PLATZHALTER",
    text: "Die ALPHA-Kiste zahlt deutlich mehr Credits, garantiert nach 1.000 Öffnungen eine legendäre Waffe — und im Event-Shop warten acht neue Kisten mit „Bald“-Badge.",
    intro: "Wirtschaft & Transparenz: fairere Drops, sichtbarer Pity-Fortschritt und Vorbereitung für kommende Event-Kisten.",
    sections: [
      {
        emoji: "⛁",
        title: "ALPHA-KISTE · CREDITS",
        subtitle: "Höhere Coin-Rewards",
        changes: [
          "Common: 150–400 ⛁ · Uncommon: 550–800 ⛁ · Rare: 1.200–1.800 ⛁ · Epic: 3.000–5.000 ⛁",
          "Legendäre Waffen & Kosmetik unverändert selten — Credits spürbar angehoben",
        ],
      },
      {
        emoji: "🎯",
        title: "LEGENDÄR-PITY",
        subtitle: "1.000 Öffnungen · garantierte Waffe",
        changes: [
          "Zähler steigt bei jeder ALPHA-Öffnung — Anzeige X / 1.000 im Shop",
          "Bei 1.000: garantierte legendäre Waffe aus dem Waffen-Pool",
          "Pity resettet nur beim Pity-Treffer — nicht bei natürlichem Legendär-Drop",
        ],
      },
      {
        emoji: "📦",
        title: "8 NEUE PLATZHALTER-KISTEN",
        subtitle: "Event-Shop · Coming Soon",
        changes: [
          "Tresor, Omega, Sigma, Phantom, Void, Sturm, Prism & Cipher — Badge „BALD“",
          "Kauf noch nicht möglich · Drop-Pools werden später befüllt",
          "Max. 200 Kisten pro Typ im Inventar (wie bisher)",
        ],
      },
    ],
    notes: [
      "Pity-Fortschritt im Event-Shop unter der ALPHA-Kiste sichtbar",
      "FRONT-Kiste nach MP-Matches unverändert (max. 5/Tag)",
    ],
    notesLabel: "HINWEIS",
  },
  {
    id: "modes-roadmap-jun2026",
    date: "13.06.2026",
    tag: "MODI",
    tagClass: "db-tag-game",
    title: "3 NEUE MODI · COMING SOON",
    text: "Hardpoint, Flaggenraub und Eskorte erscheinen im Multiplayer-Tab — vorerst gesperrt mit Coming-Soon-Hinweis.",
    intro: "Diese Modi sind bereits im Menü sichtbar, damit du weißt, was als Nächstes kommt. Klick öffnet Infos — spielen geht noch nicht.",
    sections: [
      {
        emoji: "📍",
        title: "HARDPOINT",
        subtitle: "Rotierender Haltepunkt",
        changes: [
          "Ein aktiver Punkt rotiert über die Karte — halte ihn für Punkte pro Sekunde",
          "Team-Koordination & Map-Control im Fokus",
        ],
      },
      {
        emoji: "🚩",
        title: "FLAGGENRAUB",
        subtitle: "Capture the Flag",
        changes: [
          "Gegnerische Flagge stehlen und in der eigenen Basis sichern",
          "3D-Flaggen, Bot-KI für Attack & Defense geplant",
        ],
      },
      {
        emoji: "🛡",
        title: "ESKORTE",
        subtitle: "Payload · Push",
        changes: [
          "Fracht zum Ziel schieben — Angreifer pushen, Verteidiger blockieren",
          "Checkpoints, Routen & Rollen folgen im Update",
        ],
      },
    ],
    notes: [
      "Modus-Karten zeigen „🔒 COMING SOON“ im Multiplayer-Tab",
      "TDM, FFA, Herrschaft, Kill Confirmed, Hardcore & Infiziert bleiben spielbar",
    ],
    notesLabel: "HINWEIS",
  },
  {
    id: "mega-patch-jun2026",
    date: "13.06.2026",
    tag: "MEGA-PATCH",
    tagClass: "db-tag-season",
    title: "BATTLE PASS · DIAMANTEN · FRAKTION · BOOSTER · KISTEN",
    text: "Überarbeiteter Battle Pass mit getrennten Leisten, Operator-Skills, Diamanten-Shop, Fraktionskrieg, 2×-Booster und das Kisten-Ökosystem.",
    intro: "Das Fundament der aktuellen Saison: Progression, Kosmetik-Exklusivität und Meta-Systeme — alles in einem Eintrag zusammengefasst.",
    sections: [
      {
        emoji: "🎖",
        title: "BATTLE PASS · NEU",
        subtitle: "Zwei Leisten · Bonus-Stufen · Exklusivität",
        changes: [
          "Gratis- und Premium-Spur als eigene horizontale Leiste — je Stufe eine Spalte",
          "Gratis: Meilensteine (5/10), kleine Credits auf geraden Stufen, Capstones bei 10/25/40/50",
          "Premium St. 1–50: klassische Spur (Operatoren, Kosmetik, Booster)",
          "Ab Stufe 51: weiterlevelbar — Gratis ⛁ · Premium 💎 pro Bonus-Level",
          "Alle BP-Kosmetik-Items sind Shop-exklusiv — nur über den Pass",
          "Duplikat beim Einsammeln: bereits besessen = 5 💎 auf den ausgerüsteten Operator",
        ],
      },
      {
        emoji: "💎",
        title: "OPERATOR-SKILLS & DIAMANTEN",
        subtitle: "Skills · Shop · Match-Belohnungen",
        changes: [
          "Pro Operator: Mobilität, Reload, ADS, Vitalität, Stabilisierung — mit 💎 upgraden",
          "Skills-Fenster als Modal im Operator-Screen (💎 SKILLS-Button)",
          "Diamanten-Shop: Pakete + eigene Menge (min. 500 💎)",
          "Premium-Tage im Shop: 1 / 3 / 7 / 14 / 30 / 90 / 180 / 365 Tage",
          "1 💎 pro 10 Matches auf den aktiven Operator · Endscreen zeigt Diamanten getrennt",
        ],
      },
      {
        emoji: "⚔",
        title: "FRAKTIONSKRIEG",
        subtitle: "Kriegslage · Aufträge · Kill-Punkte",
        changes: [
          "Übersichtliche Kriegslage: 4 Fraktionskarten mit Punkten, Territorien & Fortschritt",
          "Grenzen & Eroberungen: Textliste der Fronten plus Capture-Log",
          "Tab AUFTRÄGE (Wochen-Auftrag) · Intel erst nach Fraktionswahl",
          "Jeder Kill = 1 Fraktionspunkt — Spieler und KI gleichermaßen",
          "Territoriums-Einfluss auf der aktuellen Karte (6 = Eroberung)",
          "Kampagne & Ranked zählen nicht für Fraktionskrieg",
        ],
      },
      {
        emoji: "⚡",
        title: "2×-BOOSTER & BP-FORTSCHRITT",
        subtitle: "Level · BP · Clan · Skalierung",
        changes: [
          "Getrennte Booster: Level-XP, Saison-/BP-XP und Clan-XP (15 / 30 / 60 Min)",
          "Kompakte Booster-Leiste im Battle Pass — standardmäßig eingeklappt",
          "Neulinge: 2× 30-Min-Token gratis · Token als BP-Belohnung & im Shop",
          "BP-XP pro Stufe steigt mit dem Tier (900+22/Tier in Saison 1)",
          "Bonus-XP nach Stufe 50 mit eigener XP-Kurve",
        ],
      },
      {
        emoji: "🎨",
        title: "3D-GRAFIK · POLISH",
        subtitle: "Tone Mapping · Himmel · Effekte",
        changes: [
          "ACES Tone Mapping & sRGB für kräftigere Farben",
          "Gradient-Himmel pro Karte, verbesserte 3-Punkt-Beleuchtung",
          "Weiche Schatten auf Grafik-Preset „Hoch“",
          "Leuchtende Tracer, hellere Einschläge & Explosionen",
          "Nacht- & Regen-Varianten · leichte HUD-Vignette",
        ],
      },
      {
        emoji: "📦",
        title: "KISTEN · SHOP · CLAN · PREMIUM",
        subtitle: "Belohnungen · Spielzeit · Social",
        changes: [
          "FRONT-KISTE nach MP-Matches (max. 5/Tag) · Inventar unter 📦 KISTEN",
          "Event-Shop: ALPHA- & HORIZONT-Kiste — Pakete 1 / 5 / 25 · transparente Drop-Raten",
          "Premium-Spielzeit: +15 % Match-XP · +10 % Credits (Kisten, Shop, DevBlog-Geschenk)",
          "Clan: Zuletzt-online · Booster nur mit Clan für Clan-XP",
          "Horizont-Waffen & Operatoren im Shop, Bundles & Beta-Kiste",
        ],
      },
    ],
    notes: [
      "Spielversion: Update 0.0.1 · NACHTBLAU Interaktive",
      "DevBlog oben: 1 Tag Premium gratis einsammeln (einmalig pro Speicherstand)",
      "Feedback über 🐛 FEEDBACK · Speicherstand lokal im Browser",
    ],
    notesLabel: "HINWEIS",
  },
  {
    id: "maintenance-jun2026",
    date: "12.06.2026",
    until: "16.06.2026",
    tag: "WARTUNG",
    tagClass: "db-tag-maint",
    title: "MODUS-WARTUNG · FRONTKRIEG · EROBERUNG · RANKED",
    text: "Bis 15.06. sind Frontkrieg, Eroberung und Ranked vorübergehend gesperrt — Optimierung von Bot-KI, Tickets und LP-System. Alle anderen Modi bleiben spielbar.",
    intro: "Ab dem 12.06. bis einschließlich 15.06. (Wiedereröffnung am 16.06.) sind drei Modi im Menü gesperrt. TDM, FFA, Herrschaft, Fraktionskrieg und Karten-Rotation laufen normal weiter.",
    sections: [
      {
        mode: "frontwar",
        emoji: "⚔️",
        title: "FRONTKRIEG",
        subtitle: "14 vs 14 · Großschlacht",
        changes: [
          "Bot-Performance in 14v14-Matches stabilisiert",
          "Spawn-Verteilung neu ausbalanciert — weniger Spawn-Camping",
          "Verbündete-Bots halten Zentrum und Flanken klarer getrennt",
        ],
      },
      {
        mode: "conquest",
        emoji: "🚩",
        title: "EROBERUNG",
        subtitle: "5 Zonen · Ticket-System",
        changes: [
          "Ticket-Verlust und -Regeneration neu kalibriert",
          "Bot-Pfadfindung zu Zonen A–E verbessert",
          "Minimap mit Zonen-Labels (A/B/C)",
        ],
      },
      {
        mode: "ranked",
        emoji: "🏆",
        title: "RANKED",
        subtitle: "Competitive TDM · LP-Rangliste",
        changes: [
          "LP-Gewinn und -Verlust bei knappen Matches fairer",
          "Anti-AFK-Erkennung ab 90 Sekunden Inaktivität",
          "End-Screen zeigt LP-Änderung deutlicher an",
        ],
      },
    ],
    notes: [
      "TDM, FFA, Herrschaft, Gun Game u. a. bleiben spielbar",
      "Fraktionskrieg & neue Kill-Punkte laufen in allen offenen MP-Modi",
      "Nach Wartungsende: Countdown verschwindet automatisch",
    ],
  },
  {
    id: "maintenance-snd-2026",
    date: "13.06.2026",
    until: "08.07.2026",
    tag: "WARTUNG",
    tagClass: "db-tag-maint",
    title: "MODUS-WARTUNG · SUCHEN & ZERSTÖREN · 25 TAGE",
    text: "Suchen & Zerstören ist 25 Tage gesperrt — Bomben-KI, sichere Spawnpunkte und Rundenbalance werden überarbeitet.",
    intro: "Ab dem 13.06. bis einschließlich 07.07. (Wiedereröffnung am 08.07.) ist Suchen & Zerstören im Menü gesperrt. TDM, FFA, Frontkrieg (sofern offen) und alle anderen Modi laufen weiter.",
    sections: [
      {
        mode: "snd",
        emoji: "💣",
        title: "SUCHEN & ZERSTÖREN",
        subtitle: "Best of 5 · Keine Respawns",
        changes: [
          "Multiplayer-KI überarbeitet — Rollen (Push, Flank, Hold), bessere Pfadfindung",
          "Spawnpunkte liegen nicht mehr in Containern, Wänden oder Map-Objekten",
          "Angreifer- und Verteidiger-Bots reagieren langsamer und präziser unter Feuer",
          "Rundenstart und Bomben-Sites werden neu ausbalanciert",
        ],
      },
    ],
    notes: [
      "TDM, FFA, Eroberung, Gun Game und Kampagne bleiben spielbar",
      "Clan-Matches und Fraktionskrieg sind nicht betroffen",
      "Countdown im Menü zeigt verbleibende Wartungszeit",
    ],
    notesLabel: "WÄHREND DER WARTUNG",
  },
];

/* Season-Preview (Sidebar & DevBlog-Roadmap) */
BH.SEASON_PREVIEW = [
  {
    nextSeason: 1,
    label: "SAISON 1",
    name: "ASCHEFRONT",
    sub: "Aschefront · Early Access",
    eta: "Live",
    intro: "Saison 1 · Aschefront — vier Story-Missionen, Battle Pass, Karten-Rotation, Zombies, Ranked und das FRONT-Kisten-System im Browser.",
    introShort: "4 Missionen · BP 100 Stufen · 5 Karten · Zombies · Ranked",
    liveNow: [
      "Battle Pass Aschefront: 100 Stufen · Gratis- & Premium-Spur · Operatoren & Kosmetik",
      "Kampagne M1–M4: Schwarzer Morgen · Schattenop · Panzerfahrt · Endkampf",
      "5 Karten rotieren nach jedem Match — Hafen, Sierra-7, Frostlinie, Vorort Zero, Hochhaus Zero",
      "15+ MP-Modi: TDM, FFA, Herrschaft, S&D, Eroberung, Frontkrieg, Gun Game, Ranked, Zombies",
      "FRONT-Kiste nach Matches · ALPHA-Kiste im Event-Shop · Shop, Loadout & Bundles",
      "Fraktionskrieg · Clans · Achievements · Daily Login · 2×-XP-Token",
    ],
    highlights: [
      "4 Kampagne-Missionen mit Briefings, Boss-Mechaniken & Kapitelauswahl",
      "Battle Pass mit 100 Stufen — Meilensteine & Capstones",
      "Karten-Rotation · Nacht- & Regen-Varianten",
      "Zombies: Perks, Pack-a-Punch, Easter Egg",
      "Ranked TDM mit LP-Rangliste & Placement-Matches",
      "18 Operatoren · Waffen-Shop · Prestige · Battle Pass XP-Skalierung",
      "Fraktionskrieg mit Kriegslage, Aufträgen & Kill-Punkten",
    ],
    bpTeaser: "Gratis: Meilensteine, Credits & Capstones. Premium: Operatoren, Tarnungen, Embleme, Booster & Kosmetik entlang der 100 Stufen.",
    maps: [
      { name: "MILITÄRHAFEN DELTA", tag: "KARTE", desc: "Kai, Container & Schiffskran — Start der Saison-Rotation." },
      { name: "ANLAGE SIERRA-7", tag: "KARTE", desc: "Industrieanlage mit Fabrikhallen — Schattenop-Mission." },
      { name: "AUSPOSTEN FROSTLINIE", tag: "KARTE", desc: "Arktis-Outpost · Regen-Variante mit dichterem Nebel." },
      { name: "VORORT ZERO", tag: "KARTE", desc: "Verlassene Vorstadt — enge CQB-Gassen." },
      { name: "HOCHHAUS ZERO", tag: "KARTE", desc: "Vertical Map mit Lifts & Dach-Lanes — in der Rotation." },
    ],
    ranked: {
      title: "Ranked Saison 1",
      items: [
        "Competitive TDM · LP-Rangliste mit Tiers",
        "Placement-Matches für Saison-Einstieg",
        "End-Screen mit LP-Änderung & Match-Stats",
        "Zählt nicht für Fraktionskrieg",
      ],
    },
    modes: [
      { name: "Karten-Rotation", desc: "Nach jedem Match wechselt die Arena — 5 Karten im Pool." },
      { name: "Zombies", desc: "Wellen, Perks, Pack-a-Punch & Easter Egg auf dedizierter Map." },
      { name: "Fraktionskrieg", desc: "Wöchentliche Aufträge · Territorien · jeder Kill = 1 Punkt." },
      { name: "Gun Game & Infiziert", desc: "LTM-Modi in der Playlist-Rotation." },
    ],
    operators: [
      { name: "REKRUT-7", faction: "TF NACHTFALKE", desc: "Standard-Operator — sofort verfügbar." },
      { name: "BRECHER", faction: "TF NACHTFALKE", desc: "Shop · Sprengstoff-Spezialist." },
      { name: "GEIST-9", faction: "SCHATTENKOLLEKTIV", desc: "Shop · Aufklärer des Kollektivs." },
      { name: "CINDER", faction: "VANGUARD", desc: "Shop · Überlaufene Elite-Einheit." },
    ],
    qol: [
      "DevBlog mit Patchnotes · 1 Tag Premium gratis beim Lesen",
      "Grafik-Presets: Tone Mapping, Schatten (Hoch), Nacht-Mondlicht",
      "Touch-Steuerung auf Tablet & Handy",
      "Speicherstand lokal im Browser · kein Account nötig",
    ],
    changes: [
      { tag: "NEU", tagClass: "db-tag-season", title: "KAMPAGNE M1–M4", text: "Vier Story-Missionen mit Boss-Mechaniken & Briefings." },
      { tag: "NEU", tagClass: "db-tag-season", title: "BATTLE PASS S1", text: "100 Stufen · Aschefront-Kosmetik · Gratis & Premium." },
      { tag: "NEU", tagClass: "db-tag-season", title: "FRONT-KISTE", text: "Belohnung nach jedem Match — Tarnungen & Credits." },
      { tag: "NEU", tagClass: "db-tag-season", title: "ZOMBIES", text: "Perks, Pack-a-Punch & Easter Egg." },
      { tag: "NEU", tagClass: "db-tag-season", title: "FRAKTIONSKRIEG", text: "Kriegslage, Aufträge & Territorien." },
      { tag: "NEU", tagClass: "db-tag-season", title: "RANKED S1", text: "LP-Rangliste · Competitive TDM." },
    ],
  },
  {
    nextSeason: 2,
    label: "SAISON 2",
    name: "SCHWARZER HORIZONT",
    sub: "Schwarzer Horizont · 1.8.2026",
    eta: "1.8.2026",
    intro: "Ab 1.8.2026 startet Saison 2 · Schwarzer Horizont — alles, was neu dazukommt: Battle Pass mit 100 Stufen, Story M5–M6, HORIZONT-Kiste, Clan-Matches, Ranked-Reset und Waffen-Balance.",
    introShort: "BP 100 Stufen · M5–M6 · Horizont-Kiste · Clan-Matches · ab 1.8.2026",
    highlights: [
      "Battle Pass Schwarzer Horizont: 100 Stufen · Gratis- & Premium-Spur · Bonus-Level ab St. 51",
      "Operator Wraith (St. 10) · Säbelgruß-Finisher (St. 15) · Spectre Elite (St. 50)",
      "Premium-Tarnung Horizont-Riss ab St. 12 · Embleme, Sprays & 2×-Token in der Spur",
      "Kampagne M5–M6 · Endboss Kommandant Phönix mit Phasen-Kampf",
      "HORIZONT-Event-Kiste: 9 Tarnungen · Sprays · Embleme · Credits · Premium-Tage",
      "Clan-Matches: 2 Wochen TDM · alle Karten · Bonus-Clan-XP · 2 Wochen Pause",
      "Ranked Saison-Reset · Soft-MMR-Carry (20 % bleiben) · 5 Placements",
      "Hardcore-LTM: kein HUD/Minimap · +20 % Saison-XP · Wochen-Leaderboard",
      "12 neue Achievements · überarbeitetes Operator-Design für S2",
    ],
    bpTeaser: "100 Stufen · Gratis: Meilensteine (5/10/25/40/50), Credits & Capstones. Premium: Wraith (St. 10), Horizont-Riss (St. 12), Säbelgruß-Finisher (St. 15), Spectre Elite (St. 50), 2× Horizont-Kiste · ab St. 51 Bonus mit 💎 · BP-Kosmetik Shop-exklusiv.",
    maps: [
      { name: "HOCHHAUS ZERO", tag: "UPDATE", desc: "Spawn-Feintuning für Lifts & Dach-Lanes — kommt mit S2." },
      { name: "HAFEN DELTA", tag: "UPDATE", desc: "Kai-Deckung & Spawn-Flow für Domination und Fraktionskämpfe." },
    ],
    ranked: {
      title: "Ranked Saison 2",
      items: [
        "Saison-Reset mit Soft-MMR-Carry: 20 % des S1-Rangs bleiben erhalten",
        "5 Placement-Matches für schnelleren Saison-Einstieg",
        "Neue Belohnungen ab Gold: Operator-Spray & Titel",
        "Zählt nicht für Fraktionskrieg — reines Competitive",
      ],
    },
    modes: [
      { name: "Clan-Matches", desc: "Neu ab S2 — 2 Wochen aktiv, 2 Wochen Pause · Clan-TDM, Bonus-Clan-XP, alle Karten." },
      { name: "Hardcore LTM", desc: "Neu ab S2 — kein HUD, kein Minimap · +20 % Saison-XP · Wochen-Leaderboard." },
      { name: "Kampagne M5–M6", desc: "Eisiger Schatten & Endboss Phönix — Story-Fortsetzung, zählt nicht für Fraktionspunkte." },
      { name: "Fraktions-Sync", desc: "Gehaltene Territorien geben kleinen Waffen-XP-Bonus für deine Fraktion." },
    ],
    operators: [
      { name: "WRAITH", faction: "PHANTOM-EINHEIT", desc: "Neu · Battle Pass Stufe 10 — leise Schritte nach Kill, Horizont-Tarnung." },
      { name: "SPECTRE · ELITE", faction: "PHANTOM-EINHEIT", desc: "Neu · Battle Pass Stufe 50 — Radar-Puls nach 3 Kills, Elite-Silhouette." },
      { name: "PHÖNIX PRIME", faction: "MYTHISCH", desc: "Neu · Horizont-Story-Endboss-Operator · Gold-Look." },
      { name: "OPERATOR-UPDATE", faction: "ALLE", desc: "Überarbeitete Lore, Visor-Design & Fraktions-Farben für das gesamte Arsenal." },
    ],
    changes: [
      { tag: "BUFF", tagClass: "db-tag-game", title: "AX-19 VORTEX", text: "+8 % Körperschaden, reduzierter vertikaler Rückstoß im Feuerstoß." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "MP-7 GEIST", text: "Magazin 36 Patronen, Nachladen −0,15 s, leichtere ADS." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "KAR-47 BULLE", text: "Erster Schuss genauer, Dauerfeuer-Rückstoß −12 %." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "S-12 BRECHER", text: "+15 % Reichweite, engere Schrot-Streuung — CQB & Lift-Schächte." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "LRX PHANTOM", text: "Kugel-Recovery −10 %, weniger Scope-Sway auf Hochhaus Zero." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "P9 SCHATTEN", text: "Swap −8 %, Kopf-Multiplikator 1,9." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "R-93 STURM", text: "Semi-Auto +4 % Feuerrate, bessere Hipfire." },
      { tag: "NERF", tagClass: "db-tag-update", title: "VIPER-9", text: "RPM 1020, leichter Schadensschub (+1) zur Kompensation." },
      { tag: "NERF", tagClass: "db-tag-update", title: "M250 DONNER", text: "Bewegungs-Spread +6 %, Magazin 80 Patronen." },
      { tag: "NERF", tagClass: "db-tag-update", title: "MK-14 RICHTER", text: "Burst-Spread +5 % über 40 m Distanz." },
      { tag: "NEU", tagClass: "db-tag-season", title: "HORIZONT-KISTE", text: "Event-Shop · erweiterter Kosmetik-Pool, Credits & Premium-Spielzeit." },
      { tag: "NEU", tagClass: "db-tag-season", title: "CLAN MATCHES", text: "Clan-TDM auf Zufallskarte · 2-Wochen-Rhythmus ab S2-Start." },
      { tag: "NEU", tagClass: "db-tag-season", title: "BATTLE PASS S2", text: "100 Stufen · skalierendes XP · Wraith & Säbelgruß-Finisher." },
      { tag: "NEU", tagClass: "db-tag-season", title: "KAMPAGNE M5–M6", text: "Endboss Phönix · getrennt vom Fraktionskrieg." },
      { tag: "NEU", tagClass: "db-tag-season", title: "ACHIEVEMENTS S2", text: "12 neue Erfolge für Kampagne, Ranked & Fraktions-Aufträge." },
    ],
  },
  {
    nextSeason: 3,
    label: "SAISON 3",
    name: "PHANTOM-KRIEG",
    sub: "Prototypen · Ranked · Karten",
    eta: "Vorschau · 2038",
    intro: "Nach Schwarzer Horizont geht es in den Phantom-Krieg: Prototyp-Waffen im Balance-Fokus, härteres Ranked mit Map-Veto und die Nacht-Variante Nachtshafen.",
    highlights: [
      "Prototyp-Balance: Gauss, Plasma & Kryo",
      "Ranked: Map-Veto, 4v4 Hardpoint, LP-Decay",
      "Neue Karte Nachtshafen · Wasser-Lanes bei Nacht",
      "Gun Game & Infiziert fest in der Rotation",
      "Clan-Scores & FWP auf der Bestenliste",
      "3 neue Operator mit Fraktions-Synergien",
      "Zombies: Specials ab Welle 10",
    ],
    bpTeaser: "Premium: Prototyp-Skin „Phantom-Kern“, HUD-Glitch Calling Card, Operator Eclipse ab St. 15. Gratis: wöchentliche Prototyp-Testtage.",
    maps: [
      { name: "NACHTHAFEN", tag: "NEU", desc: "Nacht-Variante des Hafens — Krane, Wasser-Lanes, gedämpftes Licht." },
      { name: "HOCHHAUS ZERO", tag: "RANKED", desc: "Fest in Ranked · Map-Veto ab Saison 3." },
      { name: "BUNKER 7", tag: "ZOMBIES", desc: "Erweiterte Easter-Egg-Route & experimentelles Perk." },
    ],
    ranked: {
      title: "Ranked Saison 3",
      items: [
        "Map-Veto: je Team 1 Ban pro Match",
        "4v4 Hardpoint als primärer Competitive-Modus",
        "LP-Decay nach 14 Tagen Inaktivität",
        "Clan-Tag & Territorien-Score auf der Bestenliste",
      ],
    },
    modes: [
      { name: "Hardpoint 4v4", desc: "Ranked-Kernmodus mit rotierenden Zonen." },
      { name: "Gun Game", desc: "Feste Rotation — wöchentliche Waffen-Reihenfolge." },
      { name: "Infiziert", desc: "Permanente Playlist mit angepassten Spawn-Regeln." },
    ],
    operators: [
      { name: "ECLIPSE", faction: "PHANTOM-EINHEIT", desc: "BP S3 — Radar-Puls nach 3 Kills in Folge." },
      { name: "VANGUARD-7", faction: "VANGUARD", desc: "+3 % Schaden bei gehaltenen Territorien." },
      { name: "KRYO", faction: "WÜSTENKORPS", desc: "Prototyp-Spezialist — reduzierte Overheat-Zeit." },
    ],
    qol: [
      "Ranked-Queue mit geschätzter Wartezeit",
      "Clan-Einladungen direkt aus Social",
      "Fraktionskrieg: erweiterte Wochenstatistik",
      "Loadout zeigt Territorien-Bonus der aktiven Karte",
    ],
    changes: [
      { tag: "BUFF", tagClass: "db-tag-game", title: "RX-1 GAUSS", text: "Ladezeit −8 %, besserer Durchschlag an leichter Deckung." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "AURORA PG-9", text: "Plasma-DoT bei Kopftreffern, Magazin 50, leiserer Tracer." },
      { tag: "BUFF", tagClass: "db-tag-game", title: "MK-14 RICHTER", text: "Präziserer Burst, +5 % DMR-Headshot-XP." },
      { tag: "NERF", tagClass: "db-tag-update", title: "KRYO-STRAHLER", text: "Verlangsamung 1,2 s — mehr Counter-Spielraum." },
      { tag: "NERF", tagClass: "db-tag-update", title: "AURORA PG-9", text: "Overheat nach 18 Schüssen Dauerfeuer." },
      { tag: "NERF", tagClass: "db-tag-update", title: "RX-1 GAUSS", text: "Hüftfeuer-Spread +8 %." },
      { tag: "NEU", tagClass: "db-tag-season", title: "RANKED S3", text: "Map-Veto, 4v4 Hardpoint, LP-Decay." },
      { tag: "NEU", tagClass: "db-tag-season", title: "NACHTHAFEN", text: "Neue Nacht-Karte mit Schiffskran-Deckung." },
      { tag: "NEU", tagClass: "db-tag-season", title: "CLAN-LEADERBOARDS", text: "FWP & Territorien auf der Bestenliste." },
      { tag: "NEU", tagClass: "db-tag-season", title: "ZOMBIES W10+", text: "Neue Specials ab Welle 10." },
    ],
  },
];

BH.SeasonPreview = {
  forNextSeason(currentSeason) {
    const next = (currentSeason || 1) + 1;
    return BH.SEASON_PREVIEW.find(p => p.nextSeason === next)
      || BH.SEASON_PREVIEW[BH.SEASON_PREVIEW.length - 1];
  },
  forSeason(seasonNum) {
    return BH.SEASON_PREVIEW.find(p => p.nextSeason === seasonNum) || null;
  },
  /** DevBlog-Roadmap — immer nur Saison 2 (kommende Inhalte) */
  forRoadmap() {
    return this.forSeason(2);
  },
  roadmapsForPlayer(currentSeason) {
    const cur = currentSeason || 1;
    const out = [];
    const current = this.forSeason(cur);
    const next = this.forNextSeason(cur);
    if (current) out.push({ preview: current, role: "current" });
    if (next && (!current || next.nextSeason !== current.nextSeason)) {
      out.push({ preview: next, role: "upcoming" });
    }
    return out;
  },
  _weekKey() {
    return BH.FactionWar ? BH.FactionWar._weekKey() : "1970-W1";
  },
  visibleChanges(preview, count) {
    if (!preview || !preview.changes || !preview.changes.length) return [];
    const wk = this._weekKey();
    let hash = 0;
    for (let i = 0; i < wk.length; i++) hash = ((hash << 5) - hash) + wk.charCodeAt(i);
    const start = Math.abs(hash) % preview.changes.length;
    const out = [];
    for (let i = 0; i < Math.min(count, preview.changes.length); i++) {
      out.push(preview.changes[(start + i) % preview.changes.length]);
    }
    return out;
  },
};

/* Multiplayer-Modi mit Karten-Rotation */
BH.ROTATING_MODES = ["tdm", "ffa", "dom", "snd", "conquest", "frontwar", "gungame", "ranked"];

/* Operator – Saison 1 (Aschefront) */
BH.OPERATORS_S1 = [
  { id: "recruit",    name: "REKRUT-7",   faction: "TF NACHTFALKE", body: 0x4a5d3a, head: 0x8a7a66,
    desc: "Standard-Infanterist der Task Force. Zuverlässig, unauffällig, überall im Einsatz." },
  { id: "breaker",    name: "BRECHER",    faction: "TF NACHTFALKE", body: 0x6b5a2e, head: 0x5a4a30, price: 500,
    desc: "Ehemaliger Sprengstoffexperte. Geht zuerst durch die Tür – und manchmal durch die Wand." },
  { id: "ghost9",     name: "GEIST-9",    faction: "SCHATTENKOLLEKTIV", body: 0x23272b, head: 0xc8d4dc, price: 800,
    desc: "Aufklärer des Schattenkollektivs. Offiziell existiert diese Einheit nicht." },
  { id: "karst",      name: "KARST",      faction: "WÜSTENKORPS",   body: 0xb09a6a, head: 0x8a7050, price: 600,
    desc: "Überlebenskünstler aus der Wüste Rotglut. Kennt jeden Sandsturm beim Vornamen." },
  { id: "cinder",     name: "CINDER",     faction: "VANGUARD",      body: 0x7a1020, head: 0x101418, price: 900,
    desc: "Übergelaufene Vanguard-Elite. Kämpft jetzt gegen ihre alten Auftraggeber." },
  { id: "mirage",     name: "MIRAGE",     faction: "WÜSTENKORPS",   body: 0xc8d4dc, head: 0x39c5ff, price: 1050,
    desc: "Scharfschützin mit Arktis-Ausbildung — nur im Shop, Bundles oder Kisten." },
  { id: "nachtfalke", name: "NACHTFALKE", faction: "TF NACHTFALKE", body: 0x101830, head: 0x39c5ff, price: 1150,
    desc: "Kommandant der Task Force — Shop, Bundles oder Alpha-Kiste." },
  { id: "phoenix",    name: "PHÖNIX",     faction: "MYTHISCH",      body: 0xff5a00, head: 0xffd24d, crateOnly: "horizon",
    desc: "Mythischer Operator — nur Horizont-Kiste (Legendary)." },
  { id: "wraith",     name: "WRAITH",     faction: "PHANTOM-EINHEIT", body: 0x1a1428, head: 0x6a7a9a,
    requireSeason: 2, requireBpTier: 10,
    desc: "Phantom-Aufklärer der Saison 2. Leise Schritte nach Kill – nur über Battle Pass Stufe 10." },
  { id: "striker",    name: "STRIKER",    faction: "VANGUARD",        body: 0x8a2020, head: 0x3a3a3a, price: 750,
    desc: "Sturmtruppler der Vanguard. Erste Welle, letzte Kugel – immer nach vorne." },
  { id: "fluss",      name: "FLUSS",      faction: "TF NACHTFALKE",   body: 0x2a4a5a, head: 0xc8d4dc, price: 650,
    desc: "Sanitäter und Funker der Task Force. Hält das Squad am Leben und auf Kanal." },
  { id: "dune",       name: "DÜNE",       faction: "WÜSTENKORPS",     body: 0xc4a060, head: 0x6a5030, price: 550,
    desc: "Wüsten-Späher des Korps. Kennt jede Düne zwischen Rotglut und Frostlinie." },
  { id: "raven",      name: "RABE",       faction: "TF NACHTFALKE",   body: 0x181820, head: 0x505868, price: 950,
    desc: "Drohnenpilot und SIGINT-Spezialist. Sieht das Schlachtfeld von oben – und darunter." },
  { id: "zero",       name: "ZERO",       faction: "VANGUARD",        body: 0x2a2a32, head: 0x39c5ff, price: 1200,
    desc: "Cyber-Kampf-Spezialist. Stört Feind-Comms und liebt saubere Hacks." },
  { id: "vortex",     name: "VORTEX",     faction: "VANGUARD",        body: 0x5a1020, head: 0x8a8a90, price: 980,
    desc: "Schwerer Unterstützer — Shop, Bundles oder Kisten." },
  { id: "frost",      name: "FROST",      faction: "WÜSTENKORPS",     body: 0x6a8aa8, head: 0xd8e8f0, price: 1250,
    desc: "Arktis-Jäger — Shop, Bundles oder Horizont-Kiste." },
  { id: "slag",       name: "SLAG",       faction: "VANGUARD",        body: 0x4a4a48, head: 0xff8040, price: 1180,
    desc: "Vanguard-Veteran — Shop, Bundles oder Beta-Kiste." },
  { id: "spectre",    name: "SPECTRE",    faction: "PHANTOM-EINHEIT", body: 0x0a1820, head: 0x80a0b0,
    requireSeason: 2, requireBpTier: 15,
    desc: "Elite der Phantom-Einheit. Battle Pass Stufe 15 – Radar-Puls nach Kill-Serie." },
  { id: "veil",       name: "VEIL",       faction: "SCHATTENKOLLEKTIV", body: 0x1a1a22, head: 0x8090a0, price: 850,
    desc: "Infiltratorin des Schattenkollektivs. Stille Kills, laute Ergebnisse." },
  { id: "atlas",      name: "ATLAS",      faction: "TF NACHTFALKE",   body: 0x304050, head: 0x708090, price: 700,
    desc: "Schwerer Brecher der Task Force. Trägt das Squad durch jede Zone." },
  { id: "ember",      name: "EMBER",      faction: "VANGUARD",        body: 0x602010, head: 0xff6030, price: 800,
    desc: "Vanguard-Flammen-Spezialist. Wo Ember hintritt, brennt die Front." },
  { id: "cipher",     name: "CIPHER",     faction: "PHANTOM-EINHEIT", body: 0x121828, head: 0x5080c0,
    requireSeason: 2, price: 1100,
    desc: "Codierter Agent der Phantom-Einheit — Saison-2-exklusiv im Shop & Horizont-Kiste." },
];

/* Operator – Saison 2 (Schwarzer Horizont): überarbeitete Lore, Farben & Silhouette */
BH.OPERATORS_S2 = [
  { id: "recruit",    name: "REKRUT-X7",     faction: "TF NACHTFALKE",     body: 0x1a2830, head: 0x3a4850, accent: 0x39c5ff, visor: 0x0a1820,
    desc: "Horizont-Infanterist der Task Force. Ausgerüstet für Hochhaus Zero und die biologische Front." },
  { id: "breaker",    name: "BRECHER Mk.II", faction: "TF NACHTFALKE",     body: 0x3a3020, head: 0x2a2018, accent: 0xff8040, visor: 0x101010, price: 500,
    desc: "Spezialist für strukturelle Durchbrüche. Erste Wahl beim Sturm auf Hochhaus Zero." },
  { id: "ghost9",     name: "GEIST-9 Ω",     faction: "SCHATTENKOLLEKTIV", body: 0x0a0c10, head: 0x1a2030, accent: 0x6080a0, visor: 0x304050, price: 800,
    desc: "Schattenkollektiv-Aufklärer im Horizont-Krieg. Keine Akte, kein Ping, kein Zeuge." },
  { id: "karst",      name: "KARST · FROST", faction: "WÜSTENKORPS",       body: 0x4a5868, head: 0x708898, accent: 0xa0c8e0, visor: 0x203040, price: 600,
    desc: "Wüstenkorps-Veteran auf Mission Eisiger Schatten. Kälte, Sand und Präzision." },
  { id: "cinder",     name: "CINDER-04",     faction: "VANGUARD",          body: 0x4a0818, head: 0x0a0810, accent: 0xff2040, visor: 0x200810, price: 900,
    desc: "Vanguard-Überläuferin mit Insider-Wissen. Jagt ihre ehemaligen Kommandeure." },
  { id: "mirage",     name: "MIRAGE · ZERO", faction: "WÜSTENKORPS",       body: 0x283848, head: 0x506878, accent: 0x80d0ff, visor: 0x102030, price: 1050,
    desc: "Langstrecken-Scharfschützin — Shop, Bundles oder Kisten." },
  { id: "nachtfalke", name: "NACHTFALKE-α",  faction: "TF NACHTFALKE",     body: 0x081018, head: 0x182838, accent: 0x39c5ff, visor: 0x004060, price: 1150,
    desc: "Task-Force-Kommandant — Shop, Bundles oder Alpha-Kiste." },
  { id: "phoenix",    name: "PHÖNIX PRIME",  faction: "MYTHISCH",          body: 0x8a2800, head: 0xffa030, accent: 0xffd050, visor: 0x401000, crateOnly: "horizon",
    desc: "Mythischer Operator — nur Horizont-Kiste (Legendary)." },
  { id: "wraith",     name: "WRAITH",        faction: "PHANTOM-EINHEIT",   body: 0x100818, head: 0x283848, accent: 0x8060c0, visor: 0x180828,
    requireSeason: 2, requireBpTier: 10,
    desc: "Phantom-Aufklärer S2. Passive: leise Schritte 3 s nach Kill. Battle Pass Stufe 10." },
  { id: "striker",    name: "STRIKER-7",     faction: "VANGUARD",          body: 0x501018, head: 0x281818, accent: 0xff4040, visor: 0x180808, price: 750,
    desc: "Vanguard-Sturmtruppler der Horizont-Offensive. Druck, Tempo, kein Zurück." },
  { id: "fluss",      name: "FLUSS · SIG",   faction: "TF NACHTFALKE",     body: 0x183040, head: 0x284858, accent: 0x60c0a0, visor: 0x081820, price: 650,
    desc: "Sanitäter und SIGINT der Task Force. Hält Kanäle offen, wenn der Horizont zusammenbricht." },
  { id: "dune",       name: "DÜNE · SCOUT",  faction: "WÜSTENKORPS",       body: 0x685038, head: 0x483828, accent: 0xc0a060, visor: 0x281810, price: 550,
    desc: "Wüstenspäher zwischen Rotglut und Frostlinie. Liest Spuren, bevor der Feind schießt." },
  { id: "raven",      name: "RABE · EYE",    faction: "TF NACHTFALKE",     body: 0x101018, head: 0x283040, accent: 0x5080a0, visor: 0x081018, price: 950,
    desc: "Drohnenpilot für Hochhaus Zero. Sieht Lift-Schächte, Dach-Lanes und Hinterhalte zuerst." },
  { id: "zero",       name: "ZERO · NULL",   faction: "VANGUARD",          body: 0x181820, head: 0x283038, accent: 0x39c5ff, visor: 0x004060, price: 1200,
    desc: "Cyber-Kampf-Spezialist. Stört Vanguard-Netze und sichert Horizont-Daten." },
  { id: "vortex",     name: "VORTEX · HEAVY", faction: "VANGUARD",         body: 0x401018, head: 0x303038, accent: 0xff6040, visor: 0x180808, price: 980,
    desc: "Schwerer Unterstützer — Shop, Bundles oder Kisten." },
  { id: "frost",      name: "FROST · LINE",  faction: "WÜSTENKORPS",       body: 0x486878, head: 0xa0c0d0, accent: 0xd0f0ff, visor: 0x204050, price: 1250,
    desc: "Arktis-Jäger — Shop, Bundles oder Horizont-Kiste." },
  { id: "slag",       name: "SLAG · CORE",   faction: "VANGUARD",          body: 0x303028, head: 0x484038, accent: 0xff9040, visor: 0x181008, price: 1180,
    desc: "Vanguard-Kernveteran — Shop, Bundles oder Beta-Kiste." },
  { id: "spectre",    name: "SPECTRE · ELITE", faction: "PHANTOM-EINHEIT", body: 0x080c18, head: 0x203040, accent: 0x6080ff, visor: 0x081828,
    requireSeason: 2, requireBpTier: 15,
    desc: "Phantom-Elite S2. Radar-Puls nach 3 Kills in Folge. Battle Pass Stufe 15." },
  { id: "veil",       name: "VEIL · SHADE",    faction: "SCHATTENKOLLEKTIV", body: 0x0a0c12, head: 0x283848, accent: 0x8090a8, visor: 0x101820, price: 850,
    desc: "Schattenkollektiv-Infiltratorin im Horizont-Krieg. Kein Ping, kein Zeuge." },
  { id: "atlas",      name: "ATLAS · HEAVY",   faction: "TF NACHTFALKE",     body: 0x203040, head: 0x405060, accent: 0xff8040, visor: 0x081018, price: 700,
    desc: "Task-Force-Brecher für Hochhaus Zero. Trägt das Squad durch jede Etage." },
  { id: "ember",      name: "EMBER · FLARE",   faction: "VANGUARD",          body: 0x401008, head: 0x281818, accent: 0xff5020, visor: 0x180808, price: 800,
    desc: "Vanguard-Flammen-Spezialist. Brennt die Front für den Horizont-Einsatz." },
  { id: "cipher",     name: "CIPHER · NULL",   faction: "PHANTOM-EINHEIT",   body: 0x081018, head: 0x204060, accent: 0x5080ff, visor: 0x081828,
    requireSeason: 2, price: 1100,
    desc: "Phantom-Codierer S2. Entschlüsselt Feindpositionen — Shop & Horizont-Kiste." },
];

BH.OperatorCatalog = {
  useS2(data) {
    if (!BH.SeasonRelease || !BH.SeasonRelease.isS2Feature("operators")) return false;
    const d = data || (BH.Progress && BH.Progress.data);
    return BH.SeasonRelease.effectiveBpSeason(d) >= 2;
  },
  all(data) {
    return this.useS2(data) ? BH.OPERATORS_S2 : BH.OPERATORS_S1;
  },
  find(id, data) {
    const list = this.all(data);
    return list.find(o => o.id === id) || list[0];
  },
  validIds() {
    return BH.OPERATORS_S1.map(o => o.id);
  },
};

/* Abwärtskompatibilität – zeigt immer Saison-1-Stand */
BH.OPERATORS = BH.OPERATORS_S1;

BH.OperatorRarity = {
  TIERS: {
    common:    { id: "common",    label: "Common",    css: "op-r-common",    color: "#94a3b8", order: 1 },
    uncommon:  { id: "uncommon",  label: "Uncommon",  css: "op-r-uncommon",  color: "#4ade80", order: 2 },
    rare:      { id: "rare",      label: "Rare",      css: "op-r-rare",      color: "#38bdf8", order: 3 },
    epic:      { id: "epic",      label: "Epic",      css: "op-r-epic",      color: "#c084fc", order: 4 },
    legendary: { id: "legendary", label: "Legendary", css: "op-r-legendary", color: "#fbbf24", order: 5 },
  },

  resolve(op) {
    if (!op) return this.TIERS.common;
    if (op.rarity && this.TIERS[op.rarity]) return this.TIERS[op.rarity];
    if (op.id === "recruit") return this.TIERS.common;
    if (op.crateOnly || op.id === "phoenix") return this.TIERS.legendary;
    if (op.requireBpTier >= 10) return this.TIERS.legendary;
    if ((op.price || 0) >= 1100) return this.TIERS.epic;
    if ((op.price || 0) >= 850) return this.TIERS.rare;
    if ((op.price || 0) >= 550) return this.TIERS.uncommon;
    return this.TIERS.common;
  },

  badgeHtml(rarity, opts) {
    const o = opts || {};
    const r = typeof rarity === "string" ? this.TIERS[rarity] : rarity;
    if (!r) return "";
    return `<span class="op-rarity-badge ${r.css}${o.small ? " small" : ""}">${r.label.toUpperCase()}</span>`;
  },

  sortOps(list) {
    return [...list].sort((a, b) => {
      const ra = this.resolve(a).order;
      const rb = this.resolve(b).order;
      if (rb !== ra) return rb - ra;
      return a.name.localeCompare(b.name, "de");
    });
  },
};

BH.OperatorUnlock = {
  _crateLabel(crate) {
    const map = { alpha: "ALPHA-KISTE", beta: "BETA-KISTE", horizon: "HORIZONT" };
    return map[crate] || "KISTE";
  },

  lockInfo(op, data) {
    if (!op || !data) return { state: "locked", label: "?" };
    const owned = (data.owned.operators || []).includes(op.id);
    if (owned) return { state: "owned" };

    if (op.requireSeason) {
      if (!BH.SeasonRelease || !BH.SeasonRelease.isS2Feature("operatorWraith")) {
        return { state: "locked", label: "S2 · " + (BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026"), source: "season" };
      }
      const eff = BH.SeasonRelease.effectiveBpSeason(data);
      if (eff < op.requireSeason) {
        return { state: "locked", label: "SAISON " + op.requireSeason, source: "season" };
      }
    }

    if (op.requireBpTier) {
      const tier = BH.Progress.getBpTier();
      if (tier < op.requireBpTier) {
        return { state: "locked", label: "BP STUFE " + op.requireBpTier, source: "battlepass" };
      }
      return { state: "locked", label: "BATTLE PASS · ST. " + op.requireBpTier, source: "battlepass" };
    }

    if (BH.BattlePass && BH.BattlePass.isExclusive("operators", op.id)) {
      return { state: "locked", label: "BATTLE PASS", source: "battlepass" };
    }

    if (op.crateOnly) {
      return {
        state: "locked",
        label: this._crateLabel(op.crateOnly),
        source: "crate",
      };
    }

    if (op.price) {
      const p = BH.ShopEconomy ? BH.ShopEconomy.operatorPrice(op, data) : op.price;
      return { state: "buy", label: "⛁ " + p.toLocaleString("de-DE"), source: "shop" };
    }

    return { state: "locked", label: "GESPERRT", source: "unknown" };
  },

  sanitize(data) {
    if (!data || !BH.OperatorCatalog) return;
    const valid = new Set(BH.OperatorCatalog.validIds());
    data.owned.operators = (data.owned.operators || []).filter(id => valid.has(id));
    if (!data.owned.operators.includes("recruit")) data.owned.operators.unshift("recruit");
    const eq = BH.OperatorCatalog.find(data.operator, data);
    if (!eq || !data.owned.operators.includes(data.operator)) {
      const li = eq ? this.lockInfo(eq, data) : null;
      if (eq && li.state === "owned") {
        if (!data.owned.operators.includes(eq.id)) data.owned.operators.push(eq.id);
      } else {
        data.operator = "recruit";
      }
    }
  },
};

BH.Progress = {
  KEY: "bh_save_v1",
  data: null,

  load() {
    try {
      this.data = JSON.parse(localStorage.getItem(this.KEY)) || null;
    } catch (e) { this.data = null; }
    const defaults = {
      xp: 0,
      seasonXp: 0,
      levelXp: 0,
      prestige: 0,
      kills: 0, deaths: 0, zombieKills: 0,
      bestZombieRound: 0,
      wins: 0, matches: 0, missionsCompleted: 0,
      loadout: null,
      credits: 500,
      premiumPass: false,
      premiumPlaytime: null,
      operator: "recruit",
      lastMode: "tdm",
      mapIndex: 0,
      mapPickMode: "rotation",
      selectedMapId: null,
      emblem: "recruit",
      title: "none",
      settings: null,
      mastery: {},
      ranked: { lp: 0, wins: 0, losses: 0 },
      owned: { camos: [], crosshairs: ["classic"], colors: ["white"], operators: ["recruit"], bundles: [], emblems: [], titles: [], sprays: [], charms: [], callingCards: [], weapons: [], finishers: [] },
      crosshair: { style: "classic", color: "#ffffff" },
      spray: "none",
      charm: "none",
      callingCard: "default",
      finisher: null,
      loadoutPresets: null,
      activePreset: 0,
      contracts: null,
      factionWar: null,
      dailyDeal: null,
      campaignMission: 0,
      campaignComplete: false,
      achievements: [],
      totalHeadshots: 0,
      zombieEasterEgg: false,
      bpSeason: 1,
      bpS1Complete: false,
      modeStats: {},
      dailyLogin: null,
      playerName: "",
      friends: [],
      clan: null,
      tutorialDone: false,
      tutorialActive: false,
      weeklyShop: null,
      bpXpTokens: null,
      crates: null,
      weeklyOp: null,
    };
    this.data = Object.assign(defaults, this.data || {});
    // Ältere Speicherstände auffüllen
    if (!this.data.owned) this.data.owned = defaults.owned;
    if (!this.data.owned.camos) this.data.owned.camos = [];
    if (!this.data.owned.crosshairs) this.data.owned.crosshairs = ["classic"];
    if (!this.data.owned.colors) this.data.owned.colors = ["white"];
    if (!this.data.owned.operators) this.data.owned.operators = ["recruit"];
    if (!this.data.operator) this.data.operator = "recruit";
    if (!this.data.lastMode) this.data.lastMode = "tdm";
    if (typeof this.data.mapIndex !== "number") this.data.mapIndex = 0;
    if (!this.data.mapPickMode) this.data.mapPickMode = "rotation";
    if (this.data.selectedMapId === undefined) this.data.selectedMapId = null;
    if (this.data.mapPickMode === "manual" && this.data.selectedMapId && BH.Maps) {
      const pool = BH.Maps.livePool ? BH.Maps.livePool() : BH.Maps.MAP_POOL;
      if (!pool.some(m => m.id === this.data.selectedMapId)) {
        this.data.selectedMapId = pool[0] ? pool[0].id : null;
      }
    }
    if (!this.data.owned.bundles) this.data.owned.bundles = [];
    if (!this.data.owned.emblems) this.data.owned.emblems = [];
    if (!this.data.owned.titles) this.data.owned.titles = [];
    if (!this.data.owned.sprays) this.data.owned.sprays = [];
    if (!this.data.spray) this.data.spray = "none";
    if (!this.data.owned.charms) this.data.owned.charms = [];
    if (!this.data.owned.callingCards) this.data.owned.callingCards = ["default"];
    if (!this.data.owned.weapons) this.data.owned.weapons = [];
    if (!this.data.owned.finishers) this.data.owned.finishers = [];
    if (this.data.finisher === undefined) this.data.finisher = null;
    if (!this.data.charm) this.data.charm = "none";
    if (!this.data.callingCard) this.data.callingCard = "default";
    if (BH.LoadoutPresets) BH.LoadoutPresets.ensure(this.data);
    if (BH.DailyDeal) BH.DailyDeal.ensure(this.data);
    if (BH.WeeklyShop) BH.WeeklyShop.ensure(this.data);
    if (BH.Contracts) BH.Contracts.ensure(this.data);
    if (BH.FactionWar) BH.FactionWar.ensure(this.data);
    if (!this.data.emblem) this.data.emblem = "recruit";
    if (!this.data.title) this.data.title = "none";
    if (!this.data.mastery) this.data.mastery = {};
    if (!this.data.ranked) this.data.ranked = { lp: 0, wins: 0, losses: 0 };
    if (BH.Challenges) BH.Challenges.ensure(this.data);
    if (BH.Settings) BH.Settings.apply();
    if (!this.data.crosshair) this.data.crosshair = defaults.crosshair;
    if (typeof this.data.credits !== "number") this.data.credits = 500;
    if (typeof this.data.prestige !== "number") this.data.prestige = 0;
    if (typeof this.data.campaignMission !== "number") this.data.campaignMission = 0;
    if (typeof this.data.campaignComplete !== "boolean") this.data.campaignComplete = false;
    if (!this.data.achievements) this.data.achievements = [];
    if (typeof this.data.totalHeadshots !== "number") this.data.totalHeadshots = 0;
    if (typeof this.data.zombieEasterEgg !== "boolean") this.data.zombieEasterEgg = false;
    if (typeof this.data.tutorialDone !== "boolean") {
      this.data.tutorialDone = (this.data.matches || 0) > 3;
    }
    if (typeof this.data.tutorialActive !== "boolean") this.data.tutorialActive = false;
    if (this.data.campaignComplete && (this.data.campaignMission || 0) < 6) {
      this.data.campaignComplete = false;
    }
    if (BH.SeasonRelease) BH.SeasonRelease.clampSaveData(this.data);
    if (BH.OperatorUnlock) BH.OperatorUnlock.sanitize(this.data);
    if (typeof this.data.bpSeason !== "number") this.data.bpSeason = 1;
    if (typeof this.data.bpS1Complete !== "boolean") this.data.bpS1Complete = false;
    if (!this.data.modeStats) this.data.modeStats = {};
    if (BH.DailyLogin) BH.DailyLogin.ensure(this.data);
    if (BH.ModeStats) BH.ModeStats.ensure(this.data);
    if (BH.Social) BH.Social.ensure(this.data);
    if (BH.Crates) BH.Crates.ensure(this.data);
    if (BH.BattlePass) BH.BattlePass.ensure(this.data);
    if (BH.EventPass) BH.EventPass.ensure(this.data);
    if (BH.BpXpTokens) BH.BpXpTokens.ensure(this.data);
    if (BH.PremiumPlaytime) BH.PremiumPlaytime.ensure(this.data);
    if (BH.OperatorSkills) BH.OperatorSkills.ensure(this.data);
    if (!Array.isArray(this.data.friends)) this.data.friends = [];
    if (this.data.clan === undefined) this.data.clan = null;
    if (typeof this.data.playerName !== "string") this.data.playerName = "";
    if (this.maybeAdvanceBpSeason) this.maybeAdvanceBpSeason();
    if (typeof this.data.levelXp !== "number") this.data.levelXp = this.data.xp || 0;
    return this.data;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
  },

  /** Kompletter Neustart — Fortschritt, Shop, Clan, Kisten, BP … */
  reset(opts = {}) {
    const keepSettings = opts.keepSettings !== false;
    const prevSettings = keepSettings && this.data ? this.data.settings : null;
    const prevVoice = keepSettings && this.data ? this.data.operatorVoice : true;
    const prevCrosshair = keepSettings && this.data ? JSON.parse(JSON.stringify(this.data.crosshair || null)) : null;

    try {
      localStorage.removeItem(this.KEY);
      if (opts.leaderboard !== false) localStorage.removeItem("bh_leaderboard_v1");
      if (opts.feedback) localStorage.removeItem("bh_feedback_log");
    } catch (e) { /* localStorage blockiert */ }

    this._totalMax = null;
    this.data = null;
    this.load();

    const d = this.data;
    const loadout = {
      weaponId: "ar",
      attachments: { optic: "none", barrel: "none", grip: "none", mag: "none" },
      secondaryWeaponId: "pistol",
      secondaryAttachments: { optic: "none", barrel: "none", grip: "none", mag: "none" },
      camo: "black",
    };
    d.xp = 0;
    d.seasonXp = 0;
    d.levelXp = 0;
    d.prestige = 0;
    d.kills = 0;
    d.deaths = 0;
    d.zombieKills = 0;
    d.bestZombieRound = 0;
    d.wins = 0;
    d.matches = 0;
    d.missionsCompleted = 0;
    d.totalHeadshots = 0;
    d.credits = 500;
    d.premiumPass = false;
    d.premiumPlaytime = { until: 0 };
    d.operator = "recruit";
    d.lastMode = "tdm";
    d.mapIndex = 0;
    d.mapPickMode = "rotation";
    d.selectedMapId = null;
    d.emblem = "recruit";
    d.title = "none";
    d.spray = "none";
    d.charm = "none";
    d.callingCard = "default";
    d.campaignMission = 0;
    d.campaignComplete = false;
    d.zombieEasterEgg = false;
    d.bpSeason = 1;
    d.bpS1Complete = false;
    d.bpArchive = undefined;
    d.tutorialDone = false;
    d.tutorialActive = false;
    d.playerName = "";
    d.friends = [];
    d.clan = null;
    d.challenges = undefined;
    d.owned = {
      camos: [],
      crosshairs: ["classic"],
      colors: ["white"],
      operators: ["recruit"],
      bundles: [],
      emblems: [],
      titles: [],
      sprays: [],
      charms: [],
      callingCards: ["default"],
      finishers: [],
    };
    d.finisher = null;
    d.crosshair = prevCrosshair || { style: "classic", color: "#ffffff" };
    d.ranked = { lp: 0, wins: 0, losses: 0 };
    d.mastery = {};
    d.opSkills = {};
    d.modeStats = {};
    d.achievements = [];
    d.contracts = null;
    d.factionWar = null;
    d.dailyDeal = null;
    d.weeklyShop = null;
    d.dailyLogin = null;
    d.crates = null;
    d.bpClaims = {};
    d.bpWeekly = null;
    d.bpDaily = null;
    d.bpSeasonMissions = null;
    d.bpXpTokens = null;
    d.loadout = JSON.parse(JSON.stringify(loadout));
    d.loadoutPresets = null;
    d.activePreset = 0;
    if (prevSettings) d.settings = prevSettings;
    if (typeof prevVoice === "boolean") d.operatorVoice = prevVoice;

    if (BH.LoadoutPresets) BH.LoadoutPresets.ensure(d);
    if (BH.DailyDeal) BH.DailyDeal.ensure(d);
    if (BH.WeeklyShop) BH.WeeklyShop.ensure(d);
    if (BH.Contracts) BH.Contracts.ensure(d);
    if (BH.FactionWar) BH.FactionWar.ensure(d);
    if (BH.Challenges) BH.Challenges.ensure(d);
    if (BH.DailyLogin) BH.DailyLogin.ensure(d);
    if (BH.ModeStats) BH.ModeStats.ensure(d);
    if (BH.Social) BH.Social.ensure(d);
    if (BH.Crates) BH.Crates.ensure(d);
    if (BH.BpXpTokens) BH.BpXpTokens.ensure(d);
    if (BH.PremiumPlaytime) BH.PremiumPlaytime.ensure(d);
    if (BH.OperatorUnlock) BH.OperatorUnlock.sanitize(d);
    if (BH.OperatorSkills) BH.OperatorSkills.ensure(d);
    if (BH.SeasonRelease) BH.SeasonRelease.clampSaveData(d);

    this.save();
    return { ok: true };
  },

  /** Battle-Pass Premium-Strecke (Credits-Kauf — unabhängig von Premium-Spielzeit) */
  hasPremium(d) {
    const data = d || this.data;
    return !!(data && data.premiumPass);
  },

  /** XP-Kosten von Level l auf l+1 */
  xpForLevel(level) { return 120 + level * 18; },

  /** Gesamt-XP von Level 1 bis 100 (gecacht) */
  totalXpToMax() {
    if (!this._totalMax) {
      let sum = 0;
      for (let l = 1; l < BH.MAX_LEVEL; l++) sum += this.xpForLevel(l);
      this._totalMax = sum;
    }
    return this._totalMax;
  },

  getLevel() {
    let xp = Math.min(this.data.levelXp, this.totalXpToMax());
    let level = 1;
    while (level < BH.MAX_LEVEL && xp >= this.xpForLevel(level)) {
      xp -= this.xpForLevel(level);
      level++;
    }
    if (level >= BH.MAX_LEVEL) {
      return { level: BH.MAX_LEVEL, intoLevel: 1, needed: 1, maxed: true };
    }
    return { level, intoLevel: xp, needed: this.xpForLevel(level), maxed: false };
  },

  getRank() {
    const lvl = this.getLevel().level;
    let rank = BH.RANKS[0];
    for (const r of BH.RANKS) if (lvl >= r.level) rank = r;
    return rank;
  },

  getBpTier() {
    if (BH.BattlePass) return BH.BattlePass.getTier(this.data);
    const season = BH.SeasonRelease
      ? BH.SeasonRelease.effectiveBpSeason(this.data)
      : (this.data.bpSeason || 1);
    const bp = (BH.getBattlePass && BH.getBattlePass(season)) || BH.BATTLEPASS;
    if (!bp || !bp.xpPerTier) return 0;
    return Math.min(bp.tiers, Math.floor((this.data.seasonXp || 0) / bp.xpPerTier));
  },

  getBattlePassDef() {
    if (BH.BattlePass) return BH.BattlePass.getDef(BH.BattlePass.effectiveSeason(this.data));
    const season = BH.SeasonRelease
      ? BH.SeasonRelease.effectiveBpSeason(this.data)
      : (this.data.bpSeason || 1);
    return (BH.getBattlePass && BH.getBattlePass(season)) || BH.BATTLEPASS;
  },

  maybeAdvanceBpSeason() {
    const d = this.data;
    if (!d.bpSeason) d.bpSeason = 1;
    if (d.bpSeason !== 1 || d.bpS1Complete) return;
    if (BH.SeasonRelease && !BH.SeasonRelease.isS2Feature("battlePass")) return;
    const bp1 = BH.BattlePass ? BH.BattlePass.getDef(1) : BH.BATTLEPASS;
    if (!bp1 || !bp1.tiers) return;
    const tier = BH.BattlePass ? BH.BattlePass.getTier(d) : 0;
    if (tier >= bp1.tiers) {
      d.bpS1Complete = true;
      d.bpArchive = d.bpArchive || {};
      d.bpArchive[1] = { seasonXp: d.seasonXp, premiumPass: !!d.premiumPass };
      d.bpSeason = 2;
      d.seasonXp = 0;
      d.premiumPass = false;
      this.save();
    }
  },

  /** Belohnung für das Erreichen eines Levels — skaliert mit Prestige (+12 % pro ✪) */
  levelReward(level, prestigeOrData) {
    let prestige = this.data ? (this.data.prestige || 0) : 0;
    if (prestigeOrData != null) {
      prestige = typeof prestigeOrData === "number"
        ? prestigeOrData
        : (prestigeOrData.prestige || 0);
    }
    const mult = BH.Ranks.prestigeCreditMult(prestige);
    let credits = Math.round((40 + level * 2) * mult);
    let bonus = null;
    if (level % 10 === 0) {
      credits += Math.round(250 * mult);
      bonus = "Meilenstein-Emblem „Stufe " + level + "“";
    }
    if (level === BH.MAX_LEVEL) {
      credits += Math.round(500 * mult);
      bonus = "PRESTIGE freigeschaltet!";
    }
    return { level, credits, bonus, prestige, mult };
  },

  /**
   * XP gutschreiben (zählt auch für Battle Pass und Level-Fortschritt).
   * Gibt die Liste der dabei erreichten Level-Belohnungen zurück.
   */
  addXp(amount) {
    const before = this.getLevel().level;
    const playerAdd = BH.BpXpTokens
      ? BH.BpXpTokens.xpAmount(this.data, amount, "level")
      : amount;
    const playerBonus = Math.max(0, playerAdd - amount);
    this.data.xp += playerAdd;
    this.data.levelXp = Math.min(this.data.levelXp + playerAdd, this.totalXpToMax());

    let seasonBonus = 0;
    if (BH.BpXpTokens) {
      const sea = BH.BpXpTokens.addSeasonXp(this.data, amount);
      seasonBonus = sea.bonus;
    } else {
      this.data.seasonXp += amount;
    }

    this.maybeAdvanceBpSeason();
    const after = this.getLevel().level;

    const rewards = [];
    for (let l = before + 1; l <= after; l++) {
      const r = this.levelReward(l);
      this.data.credits += r.credits;
      rewards.push(r);
    }
    this.save();
    return { rewards, seasonBonus, playerBonus };
  },

  canPrestige() {
    return this.getLevel().level >= BH.MAX_LEVEL && this.data.prestige < BH.MAX_PRESTIGE;
  },

  /** Prestige-Aufstieg: Level zurück auf 1, Prestige +1, skalierte Belohnung */
  doPrestige() {
    if (!this.canPrestige()) return null;
    const reward = BH.Ranks.prestigeReward(this.data.prestige);
    this.data.prestige++;
    this.data.levelXp = 0;
    this.data.credits += reward.credits;
    this.save();
    return {
      prestige: this.data.prestige,
      credits: reward.credits,
      tier: BH.Ranks.prestigeTier(this.data.prestige),
    };
  },

  /** Bundle kaufen – schaltet alle enthaltenen Items frei */
  buyBundle(bundleId) {
    const bundle = BH.SHOP.bundles.find(b => b.id === bundleId);
    if (!bundle) return { ok: false, reason: "missing" };
    const d = this.data;
    if (bundle.seasonLocked && BH.SeasonBundle && !BH.SeasonBundle.canBuy(d)) return { ok: false, reason: "locked" };
    if (d.owned.bundles.includes(bundleId)) return { ok: false, reason: "owned" };
    if (d.credits < BH.ShopEconomy.bundlePrice(bundle, d)) return { ok: false, reason: "credits" };
    d.credits -= BH.ShopEconomy.bundlePrice(bundle, d);
    d.owned.bundles.push(bundleId);
    const items = bundle.items;
    const bpSkip = (cat, id) => BH.BattlePass && BH.BattlePass.isExclusive(cat, id);
    for (const id of items.camos || []) {
      if (bpSkip("camos", id) || d.owned.camos.includes(id)) continue;
      d.owned.camos.push(id);
    }
    for (const id of items.crosshairs || []) {
      if (bpSkip("crosshairs", id) || d.owned.crosshairs.includes(id)) continue;
      d.owned.crosshairs.push(id);
    }
    for (const id of items.colors || []) {
      if (bpSkip("colors", id) || d.owned.colors.includes(id)) continue;
      d.owned.colors.push(id);
    }
    for (const id of items.operators || []) {
      if (bpSkip("operators", id) || d.owned.operators.includes(id)) continue;
      d.owned.operators.push(id);
    }
    for (const id of items.emblems || []) {
      if (bpSkip("emblems", id) || d.owned.emblems.includes(id)) continue;
      d.owned.emblems.push(id);
    }
    for (const id of items.titles || []) {
      if (bpSkip("titles", id) || d.owned.titles.includes(id)) continue;
      d.owned.titles.push(id);
    }
    for (const id of items.sprays || []) {
      if (bpSkip("sprays", id) || (d.owned.sprays || []).includes(id)) continue;
      if (!d.owned.sprays) d.owned.sprays = [];
      d.owned.sprays.push(id);
    }
    for (const id of items.charms || []) {
      if (bpSkip("charms", id) || (d.owned.charms || []).includes(id)) continue;
      if (!d.owned.charms) d.owned.charms = [];
      d.owned.charms.push(id);
    }
    for (const id of items.callingCards || []) {
      if (bpSkip("callingCards", id) || (d.owned.callingCards || []).includes(id)) continue;
      if (!d.owned.callingCards) d.owned.callingCards = [];
      d.owned.callingCards.push(id);
    }
    for (const id of items.weapons || []) {
      if ((d.owned.weapons || []).includes(id)) continue;
      if (!d.owned.weapons) d.owned.weapons = [];
      d.owned.weapons.push(id);
    }
    if (items.credits) d.credits += items.credits;
    this.save();
    return { ok: true, bundle };
  },
};
