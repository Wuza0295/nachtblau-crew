/** @typedef {'menu'|'select'|'race'|'results'} GamePhase */

export const W = 320;
export const H = 240;
/** Lower horizon + FOV tuned for SNES Mario Kart camera feel */
export const HORIZON = 78;
export const FOV = 320;
export const CAM_HEIGHT = 22;
export const TRACK_SIZE = 1024;
export const LAPS = 3;
export const FIELD_COUNT = 8;

export const PHASE = {
  MENU: 'menu',
  SELECT: 'select',
  RACE: 'race',
  RESULTS: 'results',
};

export const ITEM = {
  NONE: null,
  BANANA: 'banana',
  GREEN_SHELL: 'green',
  RED_SHELL: 'red',
  MUSHROOM: 'mushroom',
  STAR: 'star',
  LIGHTNING: 'lightning',
  FAKE_BOX: 'fake',
  TRIPLE_MUSHROOM: 'triple_mushroom',
  SPECIAL: 'special',
};

export const ITEM_COLORS = {
  banana: '#f5e642',
  green: '#3ddc84',
  red: '#ff5a5a',
  mushroom: '#ff7ab8',
  star: '#ffe566',
  lightning: '#fff06a',
  fake: '#6ec8ff',
  triple_mushroom: '#ff9ad0',
  special: '#c9a0ff',
};

export const ITEM_LABELS = {
  banana: 'BANANE',
  green: 'GRÜN',
  red: 'ROT',
  mushroom: 'PILZ',
  star: 'STERN',
  lightning: 'BLITZ',
  fake: 'FALSCH',
  triple_mushroom: '3×PILZ',
  special: 'SPEZIAL',
};
