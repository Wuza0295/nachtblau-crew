import { TILES } from './constants.js';

function parseMap(rows, theme = 'overworld') {
  const map = [];
  for (let y = 0; y < rows.length; y++) {
    map[y] = [];
    for (let x = 0; x < rows[y].length; x++) {
      map[y][x] = charToTile(rows[y][x], theme);
    }
  }
  return map;
}

function charToTile(c, theme) {
  const lookup = {
    W: TILES.WALL,
    '.': theme === 'dungeon' ? TILES.FLOOR : TILES.GRASS,
    B: TILES.BUSH,
    '~': TILES.WATER,
    R: TILES.ROCK,
    T: TILES.TREE,
    P: TILES.POT,
    C: TILES.CHEST,
    S: TILES.STAIRS,
    D: TILES.DOOR_LOCKED,
    O: TILES.DOOR_OPEN,
    F: TILES.FLOOR,
    '=': TILES.BRIDGE,
    A: TILES.SAND,
    '#': TILES.FENCE,
    '?': TILES.SIGN,
  };
  return lookup[c] ?? TILES.GRASS;
}

const border = 'WWWWWWWWWWWWWWWW';
const mid = 'W..............W';

export const OVERWORLD = {
  theme: 'overworld',
  startRoom: '1,1',
  startPos: { x: 8, y: 10 },
  rooms: {
    '0,0': {
      name: 'Eiswald',
      map: parseMap([
        border,
        'WTTTTTTTTTTTTTTW',
        'WT....BB....BBTW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT..TT....TT..TW',
        'WT............TW',
        'WT....BB....BBTW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT..TT....TT..TW',
        'WT............TW',
        'WTTTTTTTTTTTTTTW',
        border,
      ]),
      enemies: [
        { type: 'frostling', x: 5, y: 5 },
        { type: 'frostling', x: 10, y: 8 },
        { type: 'snowbat', x: 12, y: 4 },
      ],
    },
    '1,0': {
      name: 'Schneefeld',
      map: parseMap([
        border, mid,
        'W..BB....BB....W',
        'W..............W',
        'W....TT..TT....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        'W....BB..BB....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        mid, border,
      ]),
      enemies: [
        { type: 'frostling', x: 8, y: 4 },
        { type: 'snowbat', x: 3, y: 9 },
        { type: 'frostling', x: 12, y: 7 },
      ],
      sign: 'Der Nordwind wird stärker. Vorsicht im Gletscher!',
    },
    '2,0': {
      name: 'Gefrorener See',
      map: parseMap([
        border,
        'W~~~~~~~~~~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~....~~~~~W',
        border,
      ]),
      enemies: [{ type: 'snowbat', x: 8, y: 6 }, { type: 'snowbat', x: 4, y: 10 }],
      items: [{ type: 'crystal_shard', x: 8, y: 3, value: 5 }],
    },
    '0,1': {
      name: 'Frostheim',
      map: parseMap([
        border,
        'W####....####..W',
        'W#..#....#..#..W',
        'W#..#....#..#..W',
        'W####....####..W',
        'W..............W',
        'W..?...........W',
        'W..............W',
        'W..BB....BB....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        mid, border,
      ]),
      items: [{ type: 'heart', x: 12, y: 5 }],
      sign: 'Willkommen in Frostheim! Die Frost-Krone liegt tief im Gletscher.',
    },
    '1,1': {
      name: 'Wächterhütte',
      map: parseMap([
        border, 'W..............W',
        'W..WWWW..WWWW..W',
        'W..W..W..W..W..W',
        'W..W..W..W..W..W',
        'W..WWWW..WWWW..W',
        'W..............W',
        'W....C.........W',
        'W..............W',
        'W..BB....BB....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        border,
      ]),
      chest: { x: 5, y: 7, item: 'heart_container', opened: false },
      enemies: [{ type: 'frostling', x: 11, y: 9 }],
    },
    '2,1': {
      name: 'Gletscherspalte',
      map: parseMap([
        border,
        'W..TT....TT....W',
        'W..TT....TT....W',
        'W..............W',
        'W....RR..RR....W',
        'W....RR..RR....W',
        'W..............W',
        'W......SS......W',
        'W......SS......W',
        'W..............W',
        'W..BB....BB....W',
        'W..............W',
        mid, border,
      ]),
      enemies: [{ type: 'guard', x: 8, y: 5 }],
      stairs: { x: 7, y: 7, target: 'dungeon', room: '0,0', entry: { x: 8, y: 10 } },
      sign: '↓ Treppe — Gletscher-Dungeon',
    },
    '0,2': {
      name: 'Südhang',
      map: parseMap([
        border,
        'WTTTTTTTTTTTTTTW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT....TT....TTTW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT....TT....TTTW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WTTTTTTTTTTTTTTW',
        border,
      ]),
      enemies: [
        { type: 'frostling', x: 4, y: 6 },
        { type: 'snowbat', x: 11, y: 9 },
        { type: 'guard', x: 8, y: 3 },
      ],
    },
    '1,2': {
      name: 'Kristallpfad',
      map: parseMap([
        border, mid,
        'W..AA....AA....W',
        'W..AA....AA....W',
        'W..............W',
        'W....TT..TT....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        'W....BB..BB....W',
        'W..............W',
        mid, border,
      ]),
      enemies: [{ type: 'frostling', x: 7, y: 7 }, { type: 'snowbat', x: 12, y: 5 }],
      chest: { x: 4, y: 5, item: 'sword_upgrade', opened: false },
    },
    '2,2': {
      name: 'Eisruinen',
      map: parseMap([
        border,
        'WRRRR....RRRR..W',
        'WR..R....R..R..W',
        'WR..R....R..R..W',
        'WRRRR....RRRR..W',
        'W..............W',
        'W......SS......W',
        'W......SS......W',
        'W..............W',
        'W..BB....BB....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        border,
      ]),
      enemies: [
        { type: 'guard', x: 8, y: 4 },
        { type: 'guard', x: 4, y: 9 },
        { type: 'frostling', x: 12, y: 7 },
      ],
      stairs: { x: 7, y: 5, target: 'dungeon', room: '1,1', entry: { x: 8, y: 10 } },
      sign: 'Die Ruinen führen zum Thronsaal des Frost-Titanen.',
    },
  },
};

export const DUNGEON = {
  theme: 'dungeon',
  startRoom: '0,0',
  startPos: { x: 8, y: 11 },
  rooms: {
    '0,0': {
      name: 'Gletschereingang',
      map: parseMap([
        border,
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF....PP.....FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF....SS.....FW',
        'WFF....SS.....FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        border,
      ], 'dungeon'),
      enemies: [{ type: 'frostling', x: 5, y: 4 }, { type: 'frostling', x: 10, y: 6 }],
      stairs: { x: 7, y: 7, target: 'overworld', room: '2,1', entry: { x: 8, y: 9 } },
    },
    '1,0': {
      name: 'Eiskorridor',
      map: parseMap([
        border,
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF....DD.....FW',
        'WFF....DD.....FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        border,
      ], 'dungeon'),
      enemies: [{ type: 'snowbat', x: 10, y: 5 }, { type: 'frostling', x: 4, y: 8 }],
      door: { x: 7, y: 3, keyRequired: true },
      sign: 'Die Eistür blockiert den Weg zur Schatzkammer.',
    },
    '2,0': {
      name: 'Kristallschatz',
      map: parseMap([
        border,
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF....CC.....FW',
        'WFF....CC.....FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        border,
      ], 'dungeon'),
      chest: { x: 5, y: 2, item: 'key', opened: false },
      items: [{ type: 'crystal_shard', x: 6, y: 2, value: 20 }],
      enemies: [{ type: 'guard', x: 8, y: 7 }],
    },
    '1,1': {
      name: 'Thron des Titanen',
      map: parseMap([
        border,
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        border,
      ], 'dungeon'),
      enemies: [{ type: 'titan', x: 8, y: 5 }],
      chest: { x: 8, y: 3, item: 'frost_crown', opened: false },
      stairs: { x: 7, y: 7, target: 'overworld', room: '2,2', entry: { x: 8, y: 7 } },
    },
  },
};

export function getRoomGrid(world) {
  const rooms = world === 'overworld' ? OVERWORLD.rooms : DUNGEON.rooms;
  const coords = Object.keys(rooms).map((k) => k.split(',').map(Number));
  const minX = Math.min(...coords.map((c) => c[0]));
  const maxX = Math.max(...coords.map((c) => c[0]));
  const minY = Math.min(...coords.map((c) => c[1]));
  const maxY = Math.max(...coords.map((c) => c[1]));
  return { minX, maxX, minY, maxY };
}

export function isSolid(tile) {
  return [
    TILES.WALL, TILES.WATER, TILES.ROCK, TILES.TREE,
    TILES.DOOR_LOCKED, TILES.FENCE, TILES.CHEST, TILES.POT,
    TILES.SIGN,
  ].includes(tile);
}

export function isDestructible(tile) {
  return [TILES.BUSH, TILES.POT].includes(tile);
}
