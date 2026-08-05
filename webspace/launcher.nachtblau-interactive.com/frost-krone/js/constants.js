export const TILE = 16;
export const W = 256;
export const H = 224;
export const COLS = W / TILE;
export const ROWS = H / TILE;

export const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };

export const TILES = {
  GRASS: 0,
  WALL: 1,
  WATER: 2,
  BUSH: 3,
  ROCK: 4,
  DOOR_LOCKED: 5,
  DOOR_OPEN: 6,
  STAIRS: 7,
  FLOOR: 8,
  CHEST: 9,
  POT: 10,
  BRIDGE: 11,
  SAND: 12,
  TREE: 13,
  FENCE: 14,
  SIGN: 15,
};

export const PALETTE = {
  snow1: '#d8e8f8',
  snow2: '#c0d8f0',
  snow3: '#a0c0e0',
  wall: '#506888',
  wallDark: '#304060',
  ice1: '#68b8e8',
  ice2: '#88d0f8',
  bush: '#4080b0',
  bushDark: '#2868a0',
  rock: '#8090a8',
  rockDark: '#607088',
  floor: '#b0c0d0',
  floorDark: '#90a8b8',
  sand: '#e0f0ff',
  sandDark: '#b8d0e8',
  tree: '#184868',
  treeDark: '#083050',
  fence: '#88b8d8',
  heroBlue: '#3888c8',
  heroBlueDark: '#2060a0',
  heroSkin: '#f8c878',
  heroHair: '#e8a848',
  heart: '#e04060',
  crystal: '#60e8ff',
  gold: '#ffd700',
};

export const PLAYER_SPEED = 1.5;
export const ENEMY_SPEED = 0.75;
export const SWORD_DURATION = 12;
export const HURT_DURATION = 30;
export const TRANSITION_DURATION = 20;
