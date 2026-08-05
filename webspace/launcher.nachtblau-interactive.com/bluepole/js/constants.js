/** @typedef {'menu'|'select'|'race'|'results'} GamePhase */

/** 16:9 modern race canvas */
export const W = 640;
export const H = 360;
export const HORIZON = 118;
export const FOV = 420;
export const CAM_HEIGHT = 26;
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
  special: '#a8e6ff',
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

/** NachtBlau brand palette */
export const NB = {
  deep: '#040a14',
  mid: '#0c1e38',
  blue: '#1a3a6a',
  accent: '#a8e6ff',
  cyan: '#5eeaff',
  glow: '#3a8fd4',
  moon: '#eef6ff',
  soft: '#6b8aab',
  danger: '#ff6b6b',
  boost: '#ffe066',
};
