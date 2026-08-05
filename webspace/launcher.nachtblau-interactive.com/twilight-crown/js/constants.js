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
  HOUSE_DOOR: 18,
  WOOD_FLOOR: 19,
  HOUSE_WALL: 20,
};

/** Modern twilight pixel palette — richer depths, softer outlines */
export const PALETTE = {
  outline: '#1a1420',
  outlineSoft: '#2a2438',
  shadow: 'rgba(20,12,32,0.4)',

  // Overworld grass — dusk-tinted verdant
  grass1: '#7cbc48',
  grass2: '#68a438',
  grass3: '#4a8830',
  grass4: '#98d058',
  grassDither: '#5a9838',
  grassShade: '#3a7028',
  flower1: '#f8e060',
  flower2: '#f868a0',
  flower3: '#f0f0f8',
  flowerBlue: '#78c8f8',

  // Hedges / cuttable bushes
  bushLight: '#70d048',
  bushMid: '#48b030',
  bushDark: '#288820',
  bushShadow: '#186018',
  bushHighlight: '#a0f068',

  // Stone / cliff walls
  wallTop: '#e0c890',
  wallFace: '#c8a868',
  wallDark: '#886838',
  wallLine: '#604828',
  wallMoss: '#58a040',
  wallHighlight: '#f0e0b0',

  // Water — clearer cyan depth
  water1: '#38a0f0',
  water2: '#58b8f8',
  waterDeep: '#1870c8',
  waterSpark: '#e8f8ff',
  waterEdge: '#2888d0',
  waterFoam: '#b0e0f8',

  // Rocks
  rock: '#b0a8a8',
  rockLight: '#d8d0d0',
  rockDark: '#706868',
  rockMoss: '#58a038',

  // Dirt / cobble paths — softer, less harsh checker
  path: '#d8b468',
  pathDark: '#c0a050',
  pathLine: '#a08040',
  pathHighlight: '#ecd090',
  pathEdge: '#987838',

  // Dungeon floors
  floor: '#a0a0a8',
  floorLight: '#c0c0c8',
  floorDark: '#707078',
  floorGrout: '#505058',
  floorAccent: '#888890',

  // Dungeon walls
  dungWall: '#987858',
  dungWallDark: '#685038',
  dungWallLight: '#c0a070',
  dungWallTop: '#d8b888',
  dungWallShadow: '#403028',

  sand: '#f0d078',
  sandDark: '#d0b050',
  sandGrain: '#b88838',

  // Trees
  treeCanopy: '#289828',
  treeLight: '#50c040',
  treeDark: '#187018',
  treeTrunk: '#986838',
  treeTrunkDark: '#684828',
  treeTrunkLight: '#b88850',

  // Houses exterior
  roof: '#d84828',
  roofDark: '#982018',
  roofLight: '#f07040',
  roofEdge: '#781810',
  building: '#f8e8c0',
  buildingDark: '#d0c090',
  buildingLine: '#a88850',
  buildingWindow: '#68b8e8',
  buildingDoor: '#784828',

  fenceWood: '#d0a050',
  fenceDark: '#987038',

  // Hero — vivid green tunic
  heroTunic: '#30b828',
  heroTunicDark: '#209020',
  heroTunicLight: '#58e048',
  heroSkin: '#f8c888',
  heroSkinShadow: '#e09858',
  heroHair: '#f08030',
  heroBoots: '#784828',
  heroBelt: '#f8d840',
  heroShield: '#f0f0f8',
  heroShieldRim: '#3070d0',
  heroShieldFace: '#b0c0e0',
  heroHat: '#30b828',
  heroHatDark: '#209020',
  heroHatLight: '#58e048',

  // Sword
  swordBlade: '#f0f8ff',
  swordEdge: '#98b0d8',
  swordGuard: '#f8d840',
  swordHilt: '#986838',
  swordGlow: '#68f0f8',

  heart: '#f83848',
  heartDark: '#c01828',
  heartEmpty: '#484850',
  heartShine: '#ffb0b8',

  rupee: '#38f040',
  rupeeLight: '#98f898',
  rupeeDark: '#20b028',
  rupeeBlue: '#40a0f8',
  rupeeRed: '#f84848',

  gold: '#f8d840',
  goldDark: '#d0a020',
  goldLight: '#fff090',

  crystal: '#80f0f8',
  crystalDark: '#40b0d0',

  ghost: '#b0c0f0',
  pot: '#d88848',
  potLight: '#f0a868',
  potDark: '#986038',
  potRim: '#f8e0b0',
  potShine: '#fff0d0',
  potBand: '#b86838',

  // Indoor hut
  wood1: '#d0a860',
  wood2: '#c09050',
  wood3: '#a87840',
  woodLine: '#886030',
  woodHighlight: '#e8c878',
  plaster: '#f0e0c0',
  plasterDark: '#d8c8a0',
  plasterLine: '#b8a070',
  plasterShadow: '#988060',
  rugRed: '#b03038',
  rugDark: '#801828',
  rugGold: '#e0b040',
  hearth: '#585048',
  hearthGlow: '#f87830',

  // HUD — deep twilight green
  uiBlack: '#000000',
  uiGreen: '#0c2818',
  uiGreenDark: '#081810',
  uiGreenLight: '#1a4830',
  uiBorder: '#e8e8d8',
  uiBorderDim: '#a8a898',
  uiText: '#f8f8f0',
  uiTextGold: '#f8d848',
  uiBox: '#000000',
  uiBoxInner: '#143828',

  dialogBg: '#f8ecd0',
  dialogBorder: '#886838',
  dialogBorderLight: '#fff8e8',
  dialogText: '#201810',

  // Ambient
  duskWash: 'rgba(88,40,120,0.08)',
  duskHorizon: 'rgba(200,80,40,0.06)',
};

export const PLAYER_SPEED = 1.75;
export const ENEMY_SPEED = 0.75;
export const SWORD_DURATION = 16;
export const SWORD_ACTIVE_FROM = 2;
export const SWORD_ACTIVE_TO = 11;
export const HURT_DURATION = 36;
export const KNOCKBACK_DURATION = 14;
export const KNOCKBACK_FORCE = 2.5;
export const TRANSITION_DURATION = 32;
export const SWORD_BEAM_SPEED = 3.5;
export const CHEST_PAUSE = 56;
export const PLAYFIELD_TOP = 16;
