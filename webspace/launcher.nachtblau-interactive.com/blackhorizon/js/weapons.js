/* Waffendefinitionen, Aufsätze und Tarnungen */
window.BH = window.BH || {};

BH.WEAPONS = {
  ar: {
    id: "ar", name: "AX-19 VORTEX", type: "STURMGEWEHR", sound: "ar",
    damage: 28, headMult: 1.8, rpm: 700, mag: 30, reserve: 120,
    spread: 0.014, adsSpread: 0.004, recoil: 0.011, auto: true,
    reloadTime: 2.0, range: 60, adsFov: 55, adsTime: 0.18, moveSpeed: 1.0,
  },
  smg: {
    id: "smg", name: "MP-7 GEIST", type: "MASCHINENPISTOLE", sound: "ar",
    damage: 22, headMult: 1.6, rpm: 920, mag: 32, reserve: 160,
    spread: 0.020, adsSpread: 0.008, recoil: 0.008, auto: true,
    reloadTime: 1.7, range: 35, adsFov: 60, adsTime: 0.13, moveSpeed: 1.1,
  },
  shotgun: {
    id: "shotgun", name: "S-12 BRECHER", type: "SCHROTFLINTE", sound: "shotgun",
    damage: 13, headMult: 1.5, rpm: 78, mag: 6, reserve: 36, pellets: 8,
    spread: 0.045, adsSpread: 0.032, recoil: 0.040, auto: false,
    reloadTime: 2.6, range: 22, adsFov: 62, adsTime: 0.16, moveSpeed: 1.0,
  },
  sniper: {
    id: "sniper", name: "LRX PHANTOM", type: "PRÄZISIONSGEWEHR", sound: "sniper",
    damage: 120, headMult: 2.0, rpm: 42, mag: 5, reserve: 30,
    spread: 0.035, adsSpread: 0.0006, recoil: 0.050, auto: false,
    reloadTime: 3.0, range: 200, adsFov: 16, adsTime: 0.30, moveSpeed: 0.9,
    scope: true,
  },
  lmg: {
    id: "lmg", name: "M250 DONNER", type: "LMG", sound: "lmg",
    damage: 30, headMult: 1.6, rpm: 580, mag: 75, reserve: 225,
    spread: 0.026, adsSpread: 0.011, recoil: 0.015, auto: true,
    reloadTime: 4.2, range: 70, adsFov: 55, adsTime: 0.28, moveSpeed: 0.85,
  },
  ak: {
    id: "ak", name: "KAR-47 BULLE", type: "STURMGEWEHR", sound: "ar",
    damage: 34, headMult: 1.8, rpm: 540, mag: 30, reserve: 120,
    spread: 0.018, adsSpread: 0.006, recoil: 0.017, auto: true,
    reloadTime: 2.3, range: 55, adsFov: 55, adsTime: 0.2, moveSpeed: 0.98,
  },
  viper: {
    id: "viper", name: "VIPER-9", type: "MASCHINENPISTOLE", sound: "ar",
    damage: 17, headMult: 1.6, rpm: 1100, mag: 42, reserve: 168,
    spread: 0.024, adsSpread: 0.010, recoil: 0.007, auto: true,
    reloadTime: 1.6, range: 28, adsFov: 60, adsTime: 0.12, moveSpeed: 1.12,
  },
  dmr: {
    id: "dmr", name: "MK-14 RICHTER", type: "DMR", sound: "sniper",
    damage: 62, headMult: 2.0, rpm: 240, mag: 12, reserve: 60,
    spread: 0.020, adsSpread: 0.002, recoil: 0.030, auto: false,
    reloadTime: 2.4, range: 120, adsFov: 35, adsTime: 0.24, moveSpeed: 0.95,
  },
  pistol: {
    id: "pistol", name: "P9 SCHATTEN", type: "PISTOLE", sound: "pistol",
    damage: 32, headMult: 1.8, rpm: 330, mag: 12, reserve: 60,
    spread: 0.016, adsSpread: 0.007, recoil: 0.013, auto: false,
    reloadTime: 1.5, range: 30, adsFov: 62, adsTime: 0.11, moveSpeed: 1.1,
  },
  r93: {
    id: "r93", name: "R-93 SCHNEIDE", type: "PRÄZISIONSGEWEHR", sound: "sniper",
    damage: 98, headMult: 2.0, rpm: 52, mag: 8, reserve: 40,
    spread: 0.028, adsSpread: 0.001, recoil: 0.042, auto: false,
    reloadTime: 2.8, range: 160, adsFov: 22, adsTime: 0.28, moveSpeed: 0.92,
    scope: true,
  },

  /* ---------- Erweiterung · 20 Standard-Waffen (Loadout) ---------- */
  scar_h: {
    id: "scar_h", name: "SCAR-H VORTEX II", type: "STURMGEWEHR", sound: "ar",
    damage: 32, headMult: 1.85, rpm: 620, mag: 30, reserve: 120,
    spread: 0.015, adsSpread: 0.005, recoil: 0.014, auto: true,
    reloadTime: 2.2, range: 58, adsFov: 55, adsTime: 0.19, moveSpeed: 0.99,
  },
  m4a1: {
    id: "m4a1", name: "M4A1 NACHTSTURM", type: "STURMGEWEHR", sound: "ar",
    damage: 27, headMult: 1.8, rpm: 750, mag: 30, reserve: 120,
    spread: 0.013, adsSpread: 0.004, recoil: 0.010, auto: true,
    reloadTime: 1.9, range: 62, adsFov: 54, adsTime: 0.17, moveSpeed: 1.02,
  },
  famas: {
    id: "famas", name: "FAMAS-RS8", type: "STURMGEWEHR", sound: "ar",
    damage: 26, headMult: 1.75, rpm: 900, mag: 25, reserve: 100,
    spread: 0.017, adsSpread: 0.006, recoil: 0.012, auto: true,
    reloadTime: 2.1, range: 52, adsFov: 56, adsTime: 0.18, moveSpeed: 1.0,
  },
  aug: {
    id: "aug", name: "AUG-STURM", type: "STURMGEWEHR", sound: "ar",
    damage: 29, headMult: 1.8, rpm: 680, mag: 30, reserve: 120,
    spread: 0.014, adsSpread: 0.004, recoil: 0.011, auto: true,
    reloadTime: 2.0, range: 60, adsFov: 52, adsTime: 0.18, moveSpeed: 1.0,
  },
  hk416: {
    id: "hk416", name: "HK-416 PHANTOM", type: "STURMGEWEHR", sound: "ar",
    damage: 30, headMult: 1.82, rpm: 720, mag: 30, reserve: 120,
    spread: 0.013, adsSpread: 0.004, recoil: 0.011, auto: true,
    reloadTime: 2.0, range: 64, adsFov: 54, adsTime: 0.17, moveSpeed: 1.01,
  },
  galil: {
    id: "galil", name: "GALIL-AR WÄCHTER", type: "STURMGEWEHR", sound: "ar",
    damage: 33, headMult: 1.78, rpm: 650, mag: 35, reserve: 140,
    spread: 0.016, adsSpread: 0.005, recoil: 0.015, auto: true,
    reloadTime: 2.3, range: 56, adsFov: 55, adsTime: 0.20, moveSpeed: 0.97,
  },
  p90: {
    id: "p90", name: "P90 GEISTER", type: "MASCHINENPISTOLE", sound: "ar",
    damage: 20, headMult: 1.55, rpm: 900, mag: 50, reserve: 200,
    spread: 0.019, adsSpread: 0.008, recoil: 0.007, auto: true,
    reloadTime: 2.0, range: 38, adsFov: 58, adsTime: 0.14, moveSpeed: 1.08,
  },
  mp5: {
    id: "mp5", name: "MP-5 SCHLEICHER", type: "MASCHINENPISTOLE", sound: "ar",
    damage: 24, headMult: 1.6, rpm: 800, mag: 30, reserve: 150,
    spread: 0.018, adsSpread: 0.007, recoil: 0.008, auto: true,
    reloadTime: 1.8, range: 36, adsFov: 58, adsTime: 0.13, moveSpeed: 1.09,
  },
  uzi: {
    id: "uzi", name: "UZI-KOMPAKT", type: "MASCHINENPISTOLE", sound: "ar",
    damage: 21, headMult: 1.55, rpm: 950, mag: 32, reserve: 160,
    spread: 0.021, adsSpread: 0.009, recoil: 0.007, auto: true,
    reloadTime: 1.7, range: 30, adsFov: 60, adsTime: 0.12, moveSpeed: 1.11,
  },
  vector: {
    id: "vector", name: "VECTOR-X", type: "MASCHINENPISTOLE", sound: "ar",
    damage: 19, headMult: 1.58, rpm: 1050, mag: 33, reserve: 165,
    spread: 0.020, adsSpread: 0.008, recoil: 0.006, auto: true,
    reloadTime: 1.65, range: 32, adsFov: 60, adsTime: 0.12, moveSpeed: 1.10,
  },
  bizon: {
    id: "bizon", name: "BIZON-19", type: "MASCHINENPISTOLE", sound: "ar",
    damage: 23, headMult: 1.6, rpm: 700, mag: 64, reserve: 256,
    spread: 0.022, adsSpread: 0.009, recoil: 0.008, auto: true,
    reloadTime: 2.2, range: 34, adsFov: 59, adsTime: 0.14, moveSpeed: 1.06,
  },
  aa12: {
    id: "aa12", name: "AA-12 STURM", type: "SCHROTFLINTE", sound: "shotgun",
    damage: 11, headMult: 1.45, rpm: 300, mag: 20, reserve: 80, pellets: 6,
    spread: 0.042, adsSpread: 0.030, recoil: 0.035, auto: true,
    reloadTime: 3.0, range: 24, adsFov: 62, adsTime: 0.18, moveSpeed: 0.95,
  },
  spas: {
    id: "spas", name: "SPAS-12 HAMMER", type: "SCHROTFLINTE", sound: "shotgun",
    damage: 14, headMult: 1.5, rpm: 72, mag: 8, reserve: 40, pellets: 8,
    spread: 0.040, adsSpread: 0.028, recoil: 0.038, auto: false,
    reloadTime: 2.4, range: 26, adsFov: 62, adsTime: 0.17, moveSpeed: 1.0,
  },
  m870: {
    id: "m870", name: "M870 JÄGER", type: "SCHROTFLINTE", sound: "shotgun",
    damage: 15, headMult: 1.55, rpm: 68, mag: 7, reserve: 35, pellets: 9,
    spread: 0.048, adsSpread: 0.034, recoil: 0.042, auto: false,
    reloadTime: 2.8, range: 20, adsFov: 64, adsTime: 0.16, moveSpeed: 1.02,
  },
  awm: {
    id: "awm", name: "AWM ZERBERST", type: "PRÄZISIONSGEWEHR", sound: "sniper",
    damage: 130, headMult: 2.0, rpm: 38, mag: 5, reserve: 25,
    spread: 0.038, adsSpread: 0.0005, recoil: 0.055, auto: false,
    reloadTime: 3.2, range: 220, adsFov: 14, adsTime: 0.32, moveSpeed: 0.88,
    scope: true,
  },
  bar50: {
    id: "bar50", name: "BARRETT .50 VERNICHTER", type: "PRÄZISIONSGEWEHR", sound: "sniper",
    damage: 155, headMult: 2.0, rpm: 28, mag: 4, reserve: 20,
    spread: 0.042, adsSpread: 0.0004, recoil: 0.068, auto: false,
    reloadTime: 3.6, range: 280, adsFov: 12, adsTime: 0.36, moveSpeed: 0.82,
    scope: true, pierce: true,
  },
  m14: {
    id: "m14", name: "M14 BULLSEYE", type: "DMR", sound: "sniper",
    damage: 58, headMult: 2.0, rpm: 280, mag: 15, reserve: 75,
    spread: 0.018, adsSpread: 0.002, recoil: 0.028, auto: false,
    reloadTime: 2.3, range: 110, adsFov: 38, adsTime: 0.23, moveSpeed: 0.96,
  },
  sks: {
    id: "sks", name: "SKS PATRIOT", type: "DMR", sound: "sniper",
    damage: 54, headMult: 1.95, rpm: 320, mag: 10, reserve: 50,
    spread: 0.019, adsSpread: 0.002, recoil: 0.026, auto: false,
    reloadTime: 2.5, range: 95, adsFov: 40, adsTime: 0.22, moveSpeed: 0.97,
  },
  m249: {
    id: "m249", name: "M249 SÄGE", type: "LMG", sound: "lmg",
    damage: 28, headMult: 1.58, rpm: 600, mag: 100, reserve: 300,
    spread: 0.028, adsSpread: 0.012, recoil: 0.016, auto: true,
    reloadTime: 4.5, range: 68, adsFov: 54, adsTime: 0.30, moveSpeed: 0.84,
  },
  pkp: {
    id: "pkp", name: "PKP PANZER", type: "LMG", sound: "lmg",
    damage: 32, headMult: 1.62, rpm: 550, mag: 80, reserve: 240,
    spread: 0.030, adsSpread: 0.013, recoil: 0.018, auto: true,
    reloadTime: 4.8, range: 72, adsFov: 53, adsTime: 0.32, moveSpeed: 0.82,
  },

  /* ---------- Prototypen (Fantasie-Waffen) ---------- */
  rail: {
    id: "rail", name: "RX-1 GAUSS", type: "PROTOTYP · RAILGUN", sound: "rail",
    damage: 170, headMult: 2.0, rpm: 32, mag: 3, reserve: 15,
    spread: 0.030, adsSpread: 0.0004, recoil: 0.060, auto: false,
    reloadTime: 3.4, range: 300, adsFov: 14, adsTime: 0.32, moveSpeed: 0.88,
    scope: true, pierce: true, fantasy: true, crateLegendary: true,
    tracerColor: 0x55eeff, glow: 0x2299ff,
  },
  plasma: {
    id: "plasma", name: "AURORA PG-9", type: "PROTOTYP · PLASMAGEWEHR", sound: "plasma",
    damage: 25, headMult: 1.7, rpm: 520, mag: 45, reserve: 180,
    spread: 0.016, adsSpread: 0.005, recoil: 0.009, auto: true,
    reloadTime: 2.2, range: 80, adsFov: 55, adsTime: 0.18, moveSpeed: 1.0,
    fantasy: true, crateLegendary: true, tracerColor: 0x55ff77, glow: 0x22cc55,
  },
  kryo: {
    id: "kryo", name: "KRYO-STRAHLER", type: "PROTOTYP · FROSTWAFFE", sound: "kryo",
    damage: 15, headMult: 1.5, rpm: 720, mag: 50, reserve: 200,
    spread: 0.020, adsSpread: 0.008, recoil: 0.006, auto: true,
    reloadTime: 2.4, range: 30, adsFov: 58, adsTime: 0.15, moveSpeed: 1.05,
    fantasy: true, crateLegendary: true, slow: { factor: 0.45, duration: 1.8 },
    tracerColor: 0x99ddff, glow: 0x66bbff,
  },
  dragon: {
    id: "dragon", name: "DRACHENFAUST", type: "PROTOTYP · WERFER", sound: "launcher",
    damage: 80, headMult: 1.2, rpm: 55, mag: 4, reserve: 16,
    spread: 0.012, adsSpread: 0.006, recoil: 0.050, auto: false,
    reloadTime: 3.2, range: 300, adsFov: 55, adsTime: 0.26, moveSpeed: 0.85,
    fantasy: true, crateLegendary: true, splash: { radius: 4.5, damage: 70 },
    tracerColor: 0xff8833, glow: 0xff5500,
  },
  blitz: {
    id: "blitz", name: "BLITZ-STAB", type: "WUNDERWAFFE · BLITZ", sound: "plasma",
    damage: 55, headMult: 1.8, rpm: 180, mag: 12, reserve: 48,
    spread: 0.022, adsSpread: 0.008, recoil: 0.012, auto: false,
    reloadTime: 2.8, range: 45, adsFov: 58, adsTime: 0.2, moveSpeed: 1.05,
    fantasy: true, crateLegendary: true, chain: { radius: 12, damage: 0.65, targets: 3 },
    tracerColor: 0x55eeff, glow: 0x2299ff,
  },
  pulse: {
    id: "pulse", name: "PULSE-AR X9", type: "PROTOTYP · ENERGIE", sound: "plasma",
    damage: 26, headMult: 1.75, rpm: 780, mag: 28, reserve: 112,
    spread: 0.015, adsSpread: 0.004, recoil: 0.010, auto: true,
    reloadTime: 2.1, range: 72, adsFov: 54, adsTime: 0.17, moveSpeed: 1.0,
    fantasy: true, crateLegendary: true, tracerColor: 0x38bdf8, glow: 0x0ea5e9,
  },
  razor: {
    id: "razor", name: "RAZOR-MK3", type: "PROTOTYP · HYPER-SMG", sound: "ar",
    damage: 18, headMult: 1.55, rpm: 1080, mag: 40, reserve: 160,
    spread: 0.022, adsSpread: 0.009, recoil: 0.006, auto: true,
    reloadTime: 1.55, range: 32, adsFov: 60, adsTime: 0.12, moveSpeed: 1.14,
    fantasy: true, crateLegendary: true, tracerColor: 0xff6080, glow: 0xff2040,
  },

  /* ---------- Alpha-Kiste · Legendary (nur per Kiste freischaltbar) ---------- */
  eclipse: {
    id: "eclipse", name: "ECLIPSE-X7", type: "WUNDERWAFFE · FINSTERNIS", sound: "rail",
    damage: 52, headMult: 2.0, rpm: 260, mag: 18, reserve: 72,
    spread: 0.018, adsSpread: 0.003, recoil: 0.022, auto: false,
    reloadTime: 2.6, range: 95, adsFov: 48, adsTime: 0.22, moveSpeed: 1.0,
    fantasy: true, alphaLegendary: true, pierce: true,
    tracerColor: 0xc084fc, glow: 0x9333ea,
  },
  nexus: {
    id: "nexus", name: "NEXUS-PRIME", type: "WUNDERWAFFE · NEXUS", sound: "plasma",
    damage: 20, headMult: 1.7, rpm: 980, mag: 55, reserve: 220,
    spread: 0.014, adsSpread: 0.004, recoil: 0.007, auto: true,
    reloadTime: 2.5, range: 65, adsFov: 54, adsTime: 0.17, moveSpeed: 1.02,
    fantasy: true, alphaLegendary: true,
    tracerColor: 0x38bdf8, glow: 0x0ea5e9,
  },
  oblivion: {
    id: "oblivion", name: "OBLIVION MK-0", type: "WUNDERWAFFE · GRAVITON", sound: "launcher",
    damage: 88, headMult: 1.3, rpm: 62, mag: 5, reserve: 20,
    spread: 0.010, adsSpread: 0.005, recoil: 0.048, auto: false,
    reloadTime: 3.0, range: 280, adsFov: 52, adsTime: 0.24, moveSpeed: 0.88,
    fantasy: true, alphaLegendary: true,
    splash: { radius: 5.2, damage: 75 },
    slow: { factor: 0.55, duration: 1.4 },
    tracerColor: 0xfbbf24, glow: 0xf97316,
  },

  /* ---------- Beta-Kiste · Legendary ---------- */
  voidlance: {
    id: "voidlance", name: "VOID-LANZE", type: "WUNDERWAFFE · VOID", sound: "rail",
    damage: 148, headMult: 2.0, rpm: 26, mag: 4, reserve: 16,
    spread: 0.028, adsSpread: 0.0003, recoil: 0.062, auto: false,
    reloadTime: 3.6, range: 320, adsFov: 12, adsTime: 0.34, moveSpeed: 0.86,
    fantasy: true, betaLegendary: true, pierce: true,
    tracerColor: 0xa855f7, glow: 0x7c3aed,
  },
  stormcell: {
    id: "stormcell", name: "STURMZELLE", type: "WUNDERWAFFE · STURM", sound: "plasma",
    damage: 50, headMult: 1.85, rpm: 200, mag: 14, reserve: 56,
    spread: 0.020, adsSpread: 0.007, recoil: 0.011, auto: false,
    reloadTime: 2.9, range: 50, adsFov: 56, adsTime: 0.19, moveSpeed: 1.04,
    fantasy: true, betaLegendary: true,
    chain: { radius: 14, damage: 0.72, targets: 4 },
    tracerColor: 0x67e8f9, glow: 0x22d3ee,
  },
  graviton: {
    id: "graviton", name: "GRAVITON-HAMMER", type: "WUNDERWAFFE · GRAVITON", sound: "launcher",
    damage: 94, headMult: 1.25, rpm: 58, mag: 5, reserve: 20,
    spread: 0.011, adsSpread: 0.005, recoil: 0.052, auto: false,
    reloadTime: 3.1, range: 290, adsFov: 50, adsTime: 0.25, moveSpeed: 0.87,
    fantasy: true, betaLegendary: true,
    splash: { radius: 5.8, damage: 82 },
    slow: { factor: 0.5, duration: 1.6 },
    tracerColor: 0xe879f9, glow: 0xc026d3,
  },

  /* ---------- Horizont-Kiste · Legendary ---------- */
  hz_shatter: {
    id: "hz_shatter", name: "SHATTER-BOW", type: "WUNDERWAFFE · HORIZONT", sound: "sniper",
    damage: 112, headMult: 2.0, rpm: 44, mag: 6, reserve: 24,
    spread: 0.032, adsSpread: 0.0008, recoil: 0.048, auto: false,
    reloadTime: 2.9, range: 180, adsFov: 18, adsTime: 0.30, moveSpeed: 0.94,
    fantasy: true, horizonLegendary: true, pierce: true,
    tracerColor: 0x38bdf8, glow: 0x0284c7,
  },
  hz_breach: {
    id: "hz_breach", name: "BREACH-CANNON", type: "WUNDERWAFFE · HORIZONT", sound: "shotgun",
    damage: 72, headMult: 1.35, rpm: 64, mag: 5, reserve: 20, pellets: 6,
    spread: 0.038, adsSpread: 0.028, recoil: 0.044, auto: false,
    reloadTime: 3.0, range: 38, adsFov: 58, adsTime: 0.22, moveSpeed: 0.96,
    fantasy: true, horizonLegendary: true,
    splash: { radius: 3.8, damage: 55 },
    tracerColor: 0x7dd3fc, glow: 0x0ea5e9,
  },
};

/* Reihenfolge für die Loadout-Liste */
BH.ALPHA_EPIC_WEAPON_IDS = [
  "scar_h", "m4a1", "famas", "aug", "hk416", "galil",
  "p90", "mp5", "uzi", "vector", "bizon",
  "aa12", "spas", "m870",
  "awm", "bar50",
  "m14", "sks",
  "m249", "pkp",
];
for (const id of BH.ALPHA_EPIC_WEAPON_IDS) {
  if (BH.WEAPONS[id]) {
    BH.WEAPONS[id].alphaEpic = true;
    BH.WEAPONS[id].isNew = true;
  }
}
BH.PRIMARY_IDS = [
  "ar", "ak", "smg", "viper", "shotgun", "sniper", "dmr", "lmg", "r93",
].concat(BH.ALPHA_EPIC_WEAPON_IDS);
BH.FANTASY_IDS = ["rail", "plasma", "kryo", "dragon", "blitz", "pulse", "razor"];
BH.PROTOTYPE_ALPHA_IDS = ["rail", "plasma", "kryo", "dragon"];
BH.PROTOTYPE_BETA_IDS = ["blitz", "pulse", "razor"];
BH.ALPHA_LEGENDARY_IDS = ["eclipse", "nexus", "oblivion"];
BH.BETA_LEGENDARY_IDS = ["voidlance", "stormcell", "graviton"];
BH.HORIZON_LEGENDARY_IDS = ["hz_shatter", "hz_breach"];
BH.ALPHA_CRATE_WEAPON_IDS = BH.PROTOTYPE_ALPHA_IDS.concat(BH.ALPHA_LEGENDARY_IDS);
BH.BETA_CRATE_WEAPON_IDS = BH.PROTOTYPE_BETA_IDS.concat(BH.BETA_LEGENDARY_IDS);
BH.HORIZON_CRATE_WEAPON_IDS = BH.HORIZON_LEGENDARY_IDS.slice();
BH.PROTOTYPE_IDS = BH.FANTASY_IDS.concat(
  BH.ALPHA_LEGENDARY_IDS,
  BH.BETA_LEGENDARY_IDS,
  BH.HORIZON_LEGENDARY_IDS
);
BH.SECONDARY_IDS = ["pistol", "smg", "viper", "shotgun"];

/** Kategorien für die Loadout-Waffenliste (Sturmgewehr, Sniper, …) */
BH.WeaponCategories = {
  ORDER: ["ar", "smg", "shotgun", "sniper", "dmr", "lmg", "pistol", "prototype", "wonder", "horizon", "other"],
  LABELS: {
    ar: "STURMGEWEHR",
    smg: "MASCHINENPISTOLE",
    shotgun: "SCHROTFLINTE",
    sniper: "PRÄZISIONSGEWEHR",
    dmr: "DMR",
    lmg: "LMG",
    pistol: "PISTOLE",
    prototype: "PROTOTYPEN",
    wonder: "WUNDERWAFFEN",
    horizon: "HORIZONT · LEGENDARY",
    other: "SONSTIGE",
  },
  keyFor(id) {
    const def = BH.WEAPONS[id];
    if (!def) return "other";
    const type = (def.type || "").toUpperCase();
    if (type.includes("STURMGEWEHR")) return "ar";
    if (type.includes("HYPER-SMG") || type.includes("MASCHINENPISTOLE")) return "smg";
    if (type.includes("SCHROTFLINTE")) return "shotgun";
    if (type.includes("PRÄZISIONSGEWEHR") || type.includes("PRAEZISIONSGEWEHR")) return "sniper";
    if (/\bDMR\b/.test(type)) return "dmr";
    if (/\bLMG\b/.test(type)) return "lmg";
    if (type.includes("PISTOLE")) return "pistol";
    if (def.horizonLegendary || type.includes("HORIZONT")) return "horizon";
    if (type.includes("WUNDERWAFFE")) return "wonder";
    if (type.includes("PROTOTYP") || def.fantasy) return "prototype";
    return "other";
  },
  label(key) {
    return this.LABELS[key] || key;
  },
  groupIds(ids) {
    const map = new Map();
    for (const id of ids) {
      const key = this.keyFor(id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(id);
    }
    const out = [];
    for (const key of this.ORDER) {
      const list = map.get(key);
      if (list && list.length) out.push({ key, label: this.label(key), ids: list });
    }
    for (const [key, list] of map) {
      if (!this.ORDER.includes(key)) out.push({ key, label: this.label(key), ids: list });
    }
    return out;
  },
};

BH.FantasyUnlock = {
  isAlphaLegendary(id) {
    return (BH.ALPHA_LEGENDARY_IDS || []).includes(id);
  },
  isBetaLegendary(id) {
    return (BH.BETA_LEGENDARY_IDS || []).includes(id);
  },
  isHorizonLegendary(id) {
    return (BH.HORIZON_LEGENDARY_IDS || []).includes(id);
  },
  isAlphaEpic(id) {
    return (BH.ALPHA_EPIC_WEAPON_IDS || []).includes(id);
  },
  isPrototypeLegendary(id) {
    return (BH.PROTOTYPE_ALPHA_IDS || []).includes(id)
      || (BH.PROTOTYPE_BETA_IDS || []).includes(id);
  },

  crateLabel(id) {
    if (this.isAlphaEpic(id)) return "EPIC · ALPHA";
    if ((BH.PROTOTYPE_ALPHA_IDS || []).includes(id) || this.isAlphaLegendary(id)) {
      return "LEGENDARY · ALPHA";
    }
    if ((BH.PROTOTYPE_BETA_IDS || []).includes(id) || this.isBetaLegendary(id)) {
      return "LEGENDARY · BETA";
    }
    if (this.isHorizonLegendary(id)) return "LEGENDARY · HORIZONT";
    return "LEGENDARY · KISTE";
  },

  lockInfo(id, data) {
    const owned = (data && data.owned && data.owned.weapons) || [];
    if (owned.includes(id)) return { state: "owned" };
    const def = BH.WEAPONS && BH.WEAPONS[id];
    if (def && def.alphaEpic) {
      return { state: "locked", label: this.crateLabel(id), epic: true };
    }
    if (def && (def.fantasy || def.crateLegendary || def.alphaLegendary
      || def.betaLegendary || def.horizonLegendary)) {
      return { state: "locked", label: this.crateLabel(id), legendary: true };
    }
    return { state: "owned" };
  },
};

BH.SecondaryUnlock = {
  rules: {
    pistol: {},
    smg: { requireLevel: 10 },
    viper: { requireLevel: 22 },
    shotgun: { requirePrestige: 1 },
  },

  lockInfo(id, data) {
    const def = BH.WEAPONS[id];
    if (!def) return { state: "locked", label: "?" };
    const rule = this.rules[id] || {};
    if (rule.requireLevel) {
      const lvl = BH.Progress.getLevel().level;
      return lvl >= rule.requireLevel
        ? { state: "owned" }
        : { state: "locked", label: "AB LV " + rule.requireLevel };
    }
    if (rule.requirePrestige) {
      const p = (data && data.prestige) || 0;
      return p >= rule.requirePrestige
        ? { state: "owned" }
        : { state: "locked", label: "PRESTIGE ✪" + rule.requirePrestige };
    }
    return { state: "owned" };
  },
};

BH.ATTACHMENTS = {
  optic: [
    { id: "none",   name: "Kimme & Korn", mod: {} },
    { id: "reddot", name: "Reddot",       mod: { adsSpread: 0.85, adsTime: 0.85 }, requireMastery: 2 },
    { id: "scope4", name: "4x Visier",    mod: { adsFov: 0.6, adsSpread: 0.7, adsTime: 1.2 }, requireMastery: 6 },
  ],
  barrel: [
    { id: "none",     name: "Standardlauf",      mod: {} },
    { id: "long",     name: "Verlängerter Lauf", mod: { damage: 1.1, range: 1.3, adsTime: 1.1 }, requireMastery: 4 },
    { id: "silencer", name: "Schalldämpfer",     mod: { spread: 0.85, range: 0.9 }, requireMastery: 7 },
  ],
  grip: [
    { id: "none",  name: "Ohne Griff",  mod: {} },
    { id: "vgrip", name: "Vordergriff", mod: { recoil: 0.65 }, requireMastery: 3 },
    { id: "laser", name: "Lasergriff",  mod: { spread: 0.8 }, requireMastery: 8 },
  ],
  mag: [
    { id: "none", name: "Standardmagazin",     mod: {} },
    { id: "ext",  name: "Erweitertes Magazin", mod: { mag: 1.5, reloadTime: 1.15 }, requireMastery: 5 },
    { id: "fast", name: "Schnelllademagazin",  mod: { reloadTime: 0.7 }, requireMastery: 9 },
  ],
};

BH.CAMOS = [
  { id: "black",  name: "Schwarz", color: 0x23272b },
  { id: "desert", name: "Wüste",   color: 0xb09a6a },
  { id: "forest", name: "Wald",    color: 0x4a5d3a },
  { id: "arctic", name: "Arktis",  color: 0xc8d4dc },
  { id: "gold",   name: "Gold",    color: 0xd4a017, requireLevel: 20 },
  /* Neon-Tarnungen */
  { id: "neon",         name: "Neon · Magenta",  color: 0x120810, neon: true, neonColor: 0xff2bd6, requireBpTier: 10 },
  { id: "neon_cyan",    name: "Neon · Cyan",     color: 0x061018, neon: true, neonColor: 0x39c5ff, requireLevel: 18 },
  { id: "neon_lime",    name: "Neon · Limette",  color: 0x061008, neon: true, neonColor: 0xadff2f, requireLevel: 22 },
  { id: "neon_orange",  name: "Neon · Orange",   color: 0x140804, neon: true, neonColor: 0xff7a00, requireLevel: 26 },
  { id: "neon_red",     name: "Neon · Rot",      color: 0x140606, neon: true, neonColor: 0xff3b30, requireLevel: 30 },
  { id: "neon_gold",    name: "Neon · Gold",     color: 0x100c04, neon: true, neonColor: 0xffd24d, requirePrestige: 1 },
];
// Shop-Skins in die Tarnungsliste übernehmen (freigeschaltet nach Kauf)
for (const c of BH.SHOP.camos) {
  BH.CAMOS.push({
    id: c.id,
    name: c.name,
    color: c.color,
    shop: true,
    price: c.price,
    neon: !!c.neon,
    neonColor: c.neonColor,
  });
}
// Prestige-exklusive Tarnungen
BH.CAMOS.push(
  { id: "prestige1", name: "Prestige I – Karmesin",   color: 0xa01030, requirePrestige: 1 },
  { id: "prestige2", name: "Prestige II – Königsblau", color: 0x2040c0, requirePrestige: 2 },
  { id: "prestige3", name: "Prestige III – Smaragd",   color: 0x10a050, requirePrestige: 3 },
  { id: "prestige5", name: "Prestige V – Obsidianglut", color: 0x3a0a0a, requirePrestige: 5 },
  { id: "prestige10", name: "Prestige X – Schwarzer Horizont", color: 0x05060a, requirePrestige: 10 }
);
if (BH.Crates) BH.Crates.registerExclusive();

/** Neon-Tarnungen & Swatch-Hilfen */
BH.CamoStyle = {
  isNeon(camo) {
    return !!(camo && camo.neon);
  },
  hex(n) {
    return (n >>> 0).toString(16).padStart(6, "0");
  },
  swatchStyle(camo) {
    if (!camo) return "background:#23272b";
    if (!this.isNeon(camo)) return `background:#${this.hex(camo.color)}`;
    const base = this.hex(camo.color);
    const glow = this.hex(camo.neonColor != null ? camo.neonColor : camo.color);
    return (
      `background:linear-gradient(145deg,#${base} 0%,#${glow}44 42%,#${glow} 100%)` +
      `;box-shadow:0 0 10px #${glow}77,inset 0 0 6px #${glow}33`
    );
  },
  swatchClass(camo) {
    return this.isNeon(camo) ? " camo-neon" : "";
  },
  cardClass(camo) {
    return this.isNeon(camo) ? " camo-neon-card" : "";
  },
  materialOpts(camo) {
    if (!camo || !this.isNeon(camo)) {
      return { color: camo ? camo.color : 0x23272b, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.46, metalness: 0.42 };
    }
    return {
      color: camo.color,
      emissive: camo.neonColor != null ? camo.neonColor : camo.color,
      emissiveIntensity: 0.78,
      roughness: 0.35,
      metalness: 0.5,
    };
  },
};

/**
 * Erzeugt eine spielbare Waffeninstanz aus Definition + Aufsätzen.
 * attachments: { optic, barrel, grip, mag } (IDs), camo: ID
 */
BH.buildWeapon = function (defId, attachments, camoId) {
  const def = BH.WEAPONS[defId];
  const stats = Object.assign({}, def);
  attachments = attachments || {};

  for (const slot of ["optic", "barrel", "grip", "mag"]) {
    const opt = (BH.ATTACHMENTS[slot] || []).find(a => a.id === (attachments[slot] || "none"));
    if (!opt) continue;
    for (const key in opt.mod) {
      if (key === "adsFov") stats.adsFov = Math.max(10, stats.adsFov * opt.mod[key]);
      else stats[key] = stats[key] * opt.mod[key];
    }
  }
  stats.mag = Math.round(stats.mag);
  stats.reserve = Math.round(stats.reserve);
  // Standardwaffen haben unendlich Reserve – nur Prototypen (Sonderwaffen) sind limitiert
  stats.infiniteAmmo = !stats.fantasy;

  const camo = BH.CAMOS.find(c => c.id === camoId) || BH.CAMOS[0];

  return {
    def: stats,
    camo,
    magAmmo: stats.mag,
    reserveAmmo: stats.reserve,
    lastShot: 0,
    reloading: false,
    reloadEnd: 0,
  };
};

/** Zufallswaffe für die Mystery-Box (alles außer Pistole) */
BH.randomWeapon = function (camoId) {
  const ids = BH.PRIMARY_IDS.concat(BH.FANTASY_IDS);
  const id = ids[Math.floor(Math.random() * ids.length)];
  const d = BH.Progress && BH.Progress.data;
  const pick = slot => {
    const opts = (BH.ATTACHMENTS[slot] || []).filter(a =>
      !BH.Mastery || !d || BH.Mastery.isAttachmentUnlocked(d, id, a.id)
    );
    const pool = opts.length ? opts : [{ id: "none" }];
    return pool[Math.floor(Math.random() * pool.length)].id;
  };
  const attachments = {
    optic: pick("optic"),
    barrel: pick("barrel"),
    grip: pick("grip"),
    mag: pick("mag"),
  };
  return BH.buildWeapon(id, attachments, camoId);
};
