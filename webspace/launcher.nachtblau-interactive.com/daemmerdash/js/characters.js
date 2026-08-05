/** Characters & kart classes — Double Dash style: two riders, specials */

/**
 * @typedef {object} Character
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {string} accent
 * @property {'light'|'medium'|'heavy'} weight
 * @property {string} special
 * @property {string} specialName
 * @property {string} blurb
 */

/** @type {Character[]} */
export const CHARACTERS = [
  {
    id: 'luma',
    name: 'Luma',
    color: '#7ec8ff',
    accent: '#e8f4ff',
    weight: 'medium',
    special: 'star_burst',
    specialName: 'Sternenschub',
    blurb: 'Ausgewogen — starker Sternenschub',
  },
  {
    id: 'shade',
    name: 'Shade',
    color: '#6b5cff',
    accent: '#c4b8ff',
    weight: 'light',
    special: 'shadow_shell',
    specialName: 'Schattenpanzer',
    blurb: 'Schnell & wendig — homing Schattenpanzer',
  },
  {
    id: 'ember',
    name: 'Ember',
    color: '#ff7a45',
    accent: '#ffd0b8',
    weight: 'medium',
    special: 'fire_trail',
    specialName: 'Feuerspur',
    blurb: 'Gute Beschleunigung — Feuerspur hinter dem Kart',
  },
  {
    id: 'bolt',
    name: 'Bolt',
    color: '#ffe566',
    accent: '#fff8c8',
    weight: 'light',
    special: 'chain_zap',
    specialName: 'Kettenblitz',
    blurb: 'Handling-König — Kettenblitz auf die Plätze davor',
  },
  {
    id: 'titan',
    name: 'Titan',
    color: '#8a9bb0',
    accent: '#d0d8e0',
    weight: 'heavy',
    special: 'boulder',
    specialName: 'Felswurf',
    blurb: 'Schwer & stabil — riesiger Felswurf',
  },
  {
    id: 'mira',
    name: 'Mira',
    color: '#ff7ab8',
    accent: '#ffd0e8',
    weight: 'medium',
    special: 'mirror_box',
    specialName: 'Spiegelbox',
    blurb: 'Allrounder — Spiegelbox stiehlt Items',
  },
  {
    id: 'rook',
    name: 'Rook',
    color: '#3ddc84',
    accent: '#b8ffe0',
    weight: 'heavy',
    special: 'guard_wall',
    specialName: 'Schutzmauer',
    blurb: 'Defensiv — temporäre Schutzmauer hinter dem Kart',
  },
  {
    id: 'spark',
    name: 'Spark',
    color: '#a78bfa',
    accent: '#e0d4ff',
    weight: 'light',
    special: 'warp_dash',
    specialName: 'Warp-Dash',
    blurb: 'Item-Glückspilz — kurzer Warp nach vorn',
  },
];

/** @typedef {object} KartClass
 * @property {string} id
 * @property {string} name
 * @property {number} topSpeed
 * @property {number} accel
 * @property {number} handling
 * @property {number} drift
 * @property {number} weight
 */

/** @type {KartClass[]} */
export const KART_CLASSES = [
  { id: 'sprint', name: 'Sprint', topSpeed: 1.0, accel: 1.15, handling: 1.1, drift: 1.05, weight: 0.9 },
  { id: 'cruiser', name: 'Cruiser', topSpeed: 1.08, accel: 0.95, handling: 0.95, drift: 1.0, weight: 1.05 },
  { id: 'tank', name: 'Tank', topSpeed: 1.12, accel: 0.82, handling: 0.85, drift: 0.9, weight: 1.25 },
];

const WEIGHT_MOD = {
  light: { topSpeed: 0.96, accel: 1.12, handling: 1.15, drift: 1.1, weight: 0.85 },
  medium: { topSpeed: 1.0, accel: 1.0, handling: 1.0, drift: 1.0, weight: 1.0 },
  heavy: { topSpeed: 1.06, accel: 0.88, handling: 0.9, drift: 0.92, weight: 1.2 },
};

/**
 * Combine two characters + kart class into race stats (Double Dash style).
 * Driver influences handling/accel, passenger influences topSpeed/specials.
 */
export function buildTeamStats(driver, passenger, kartClass) {
  const wA = WEIGHT_MOD[driver.weight];
  const wB = WEIGHT_MOD[passenger.weight];
  const avg = (a, b) => (a + b) * 0.5;
  return {
    topSpeed: kartClass.topSpeed * avg(wA.topSpeed, wB.topSpeed) * 2.85,
    accel: kartClass.accel * (wA.accel * 0.65 + wB.accel * 0.35) * 0.045,
    handling: kartClass.handling * (wA.handling * 0.7 + wB.handling * 0.3) * 0.055,
    drift: kartClass.drift * avg(wA.drift, wB.drift),
    weight: kartClass.weight * avg(wA.weight, wB.weight),
    specials: [driver.special, passenger.special],
    specialNames: [driver.specialName, passenger.specialName],
  };
}

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

export function getKartClass(id) {
  return KART_CLASSES.find((k) => k.id === id) || KART_CLASSES[1];
}
