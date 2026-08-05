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
  grass1: '#38a838',
  grass2: '#48b848',
  grass3: '#288828',
  wall: '#684830',
  wallDark: '#483018',
  water1: '#2868c8',
  water2: '#3888e8',
  bush: '#208020',
  bushDark: '#106010',
  rock: '#888898',
  rockDark: '#686878',
  floor: '#a0a0a8',
  floorDark: '#808088',
  sand: '#d8b868',
  sandDark: '#b89848',
  tree: '#186818',
  treeDark: '#085008',
  fence: '#c89848',
  linkGreen: '#38a838',
  linkGreenDark: '#208020',
  linkSkin: '#f8c878',
  linkHair: '#f8d848',
  heart: '#e04040',
  rupee: '#40c840',
  gold: '#ffd700',
};

export const PLAYER_SPEED = 1.5;
export const ENEMY_SPEED = 0.75;
export const SWORD_DURATION = 12;
export const HURT_DURATION = 30;
export const TRANSITION_DURATION = 20;
