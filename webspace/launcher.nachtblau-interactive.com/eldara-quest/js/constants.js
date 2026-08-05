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
  COBBLESTONE: 16,
  CRACKED: 17,
};

/** SNES-Palette — A Link to the Past Overworld */
export const PALETTE = {
  outline: '#181008',
  shadow: 'rgba(0,0,0,0.4)',

  grass1: '#68b838',
  grass2: '#58a828',
  grass3: '#488820',
  grass4: '#78c848',
  grassShadow: '#387018',
  flower1: '#f8d848',
  flower2: '#f878a8',

  hedgeTop: '#98e058',
  hedgeMid: '#68b838',
  hedgeFront: '#287010',
  hedgeDark: '#184808',
  hedgeHighlight: '#b8f070',

  wallTop: '#b8a888',
  wallFace: '#908068',
  wallDark: '#584830',
  wallLine: '#403020',
  wallMoss: '#488820',

  water1: '#3888e8',
  water2: '#58a8f8',
  waterDeep: '#1868c0',
  waterSpark: '#e8f8ff',
  waterEdge: '#2868a8',

  rock: '#a8a8b8',
  rockLight: '#d0d0d8',
  rockDark: '#686878',
  rockMoss: '#588838',

  path: '#e0c078',
  pathDark: '#b89850',
  pathLine: '#987838',
  pathHighlight: '#f0d898',

  floor: '#a0a0a8',
  floorLight: '#c0c0c8',
  floorDark: '#686870',
  floorGrout: '#484850',

  sand: '#f0d070',
  sandDark: '#d0a848',
  sandGrain: '#b08830',

  treeCanopy: '#287818',
  treeLight: '#48a030',
  treeDark: '#104808',
  treeTrunk: '#785028',
  treeTrunkDark: '#503018',

  roof: '#c84818',
  roofDark: '#882808',
  roofLight: '#e87838',
  building: '#f0e0b8',
  buildingDark: '#c8b088',
  buildingLine: '#987848',
  buildingWindow: '#68b8e8',
  buildingDoor: '#684018',

  fenceWood: '#c89848',
  fenceDark: '#886028',

  heroTunic: '#2868c8',
  heroTunicDark: '#1848a0',
  heroTunicLight: '#4890e8',
  heroSkin: '#f8b868',
  heroHair: '#e87828',
  heroBoots: '#503018',
  heroBelt: '#f8d830',
  heroShield: '#e8e8f0',
  heroShieldRim: '#2868c8',
  heroHat: '#2868c8',

  heart: '#f83838',
  heartDark: '#c01818',
  heartEmpty: '#404040',

  rupee: '#40e848',
  rupeeLight: '#88f888',
  rupeeDark: '#18a828',

  gold: '#f8d830',
  goldDark: '#c8a018',

  crystal: '#88e8ff',
  crystalDark: '#48a8d8',

  ghost: '#a8b8e8',
  uiBlack: '#000000',
  uiGreen: '#084808',
  uiBorder: '#f8f8f8',
  uiText: '#f8f8f8',
  dialogBg: '#f8e8b8',
  dialogBorder: '#886830',
  dialogText: '#181818',
};

export const PLAYER_SPEED = 1.75;
export const ENEMY_SPEED = 0.75;
export const SWORD_DURATION = 14;
export const SWORD_ACTIVE_FROM = 3;
export const SWORD_ACTIVE_TO = 9;
export const HURT_DURATION = 36;
export const KNOCKBACK_DURATION = 14;
export const KNOCKBACK_FORCE = 2.5;
export const TRANSITION_DURATION = 24;
export const SWORD_BEAM_SPEED = 3.5;
export const CHEST_PAUSE = 48;
export const PLAYFIELD_TOP = 16;
