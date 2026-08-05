import { TILES } from './constants.js';

function parseMap(rows, theme = 'overworld') {
  const map = [];
  for (let y = 0; y < rows.length; y++) {
    map[y] = [];
    for (let x = 0; x < rows[y].length; x++) map[y][x] = charToTile(rows[y][x], theme);
  }
  return map;
}

function charToTile(c, theme) {
  const lookup = {
    W: theme === 'dungeon' ? TILES.WALL : TILES.BUSH,
    '.': theme === 'dungeon' ? TILES.FLOOR : TILES.GRASS,
    B: TILES.BUSH, '~': TILES.WATER, R: TILES.ROCK, T: TILES.TREE, P: TILES.POT,
    C: TILES.CHEST, S: TILES.STAIRS, D: TILES.DOOR_LOCKED, O: TILES.DOOR_OPEN,
    F: TILES.FLOOR, '=': TILES.BRIDGE, A: TILES.SAND, '#': TILES.FENCE, '?': TILES.SIGN,
    '+': TILES.COBBLESTONE,
    X: TILES.CRACKED,
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
    '-1,0': {
      name: 'Westhang',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WTTTTTTTTTTTTTTW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT....TT....TTTW',
        'WT............TW',
        'WT..P....P....TW',
        'WT............TW',
        'WT....BB....B..W',
        'WT..TT....TT..TW',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 5, y: 6 }, { type: 'slime', x: 10, y: 8 }],
      items: [{ type: 'rupee', x: 8, y: 4, value: 3 }],
    },
    '-1,1': {
      name: 'Einsame Hütte',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..####........W',
        'W..#..#........W',
        'W..#..#........W',
        'W..####........W',
        'W..............W',
        'W....C.........W',
        'W..?...........W',
        'W..............W',
        'W..BB....BB....W',
        'W..P....P......W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'bat', x: 11, y: 7 }],
      chest: { x: 5, y: 6, item: 'heart_container', opened: false },
      sign: 'Im Osten liegt die Schattenkrypta. Rüste dich im Norden!',
    },
    '-1,2': {
      name: 'Totenmarsch',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WAA..AA..AA..AAW',
        'WA............AW',
        'WA..RR....RR..AW',
        'WA............AW',
        'WA..BB....BB..AW',
        'WA............AW',
        'WA..TT....TT..AW',
        'WA............AW',
        'WA..P....P....AW',
        'WA....BB....BBAW',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'wraith', x: 7, y: 5 }, { type: 'ghost', x: 4, y: 9 }],
      items: [{ type: 'heart', x: 10, y: 6 }],
    },
    '0,0': {
      name: 'Nebelwald',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WTTTTTTTTTTTTTTW',
        'WT....BB....BBTW',
        'WT..TT....TT..TW',
        'WT............TW',
        'WT....C.......TW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT....TT....TTTW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WTTTTTTTTTTTTTTW',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 4, y: 7 }, { type: 'slime', x: 11, y: 5 }],
      chest: { x: 5, y: 5, item: 'heart_container', opened: false },
    },
    '1,0': {
      name: 'Sonnenau',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..BB....BB....W',
        'W..............W',
        'W....TT..TT....W',
        'W..............W',
        'W....C.........W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        'W....BB..BB....W',
        'W..TT....TT....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 3, y: 8 }, { type: 'bat', x: 12, y: 4 }],
      chest: { x: 5, y: 5, item: 'sword_upgrade', opened: false },
    },
    '2,0': {
      name: 'Kristallsee',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~..?......W',
        'W~~~~~....~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'bat', x: 8, y: 6 }, { type: 'bat', x: 4, y: 4 }],
      items: [{ type: 'rupee', x: 8, y: 3, value: 10 }],
      sign: 'Der Kristall wurde gestohlen — die Krypta liegt im Südosten.',
    },
    '3,0': {
      name: 'Windklippen',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WRRRR....RRRR..W',
        'WR..R....R..R..W',
        'WR..R....R..R..W',
        'WRRRR....RRRR..W',
        'W..............W',
        'W..?...........W',
        'W..............W',
        'W..BB....BB....W',
        'W..P....P......W',
        'W....TT..TT....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 8, y: 7 }, { type: 'bat', x: 5, y: 5 }],
      sign: 'Jenseits des Ödlands lauert das Schattenmoor.',
    },
    '0,1': {
      name: 'Kronendorf',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W####....####..W',
        'W#..#....#..#..W',
        'W#..#....#..#..W',
        'W####....####..W',
        'W......++......W',
        'W..?...++......W',
        'W......++......W',
        'W..BB..++..BB..W',
        'W..P...++P.....W',
        'W....++TT++....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      items: [{ type: 'heart', x: 12, y: 6 }],
      sign: 'Geh nach Osten zur Felsgrotte — oder südwärts zum Hafen.',
      npcs: [
        { type: 'elder', x: 3, y: 8, dir: 2, dialog: 'Die Twilight Crown war unser Licht. Ohne sie verblasst das Land…' },
        { type: 'merchant', x: 12, y: 8, dir: 2, dialog: 'Kaufe dir Zeit im Nebelwald — Schwert und Herzen zuerst!' },
        { type: 'child', x: 8, y: 10, dir: 0, dialog: 'Es gibt drei Eingänge in die Schattenkrypta! Findest du sie alle?' },
      ],
    },
    '1,1': {
      name: 'Heimathof',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..BBBB..BBBB..W',
        'W..B..B..B..B..W',
        'W..B..B..B..B..W',
        'W..BBBB..BBBB..W',
        'W......++......W',
        'W......++......W',
        'W......++......W',
        'W..BB..++..BB..W',
        'W..P...++P.....W',
        'W....++TT++....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 10, y: 8 }],
    },
    '2,1': {
      name: 'Felsgrotte',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..TT....TT....W',
        'W..TT....TT....W',
        'W..............W',
        'W....RR..RR....W',
        'W....RR..RR....W',
        'W..............W',
        'W......SS......W',
        'W......SS......W',
        'W..BB....BB....W',
        'W..P....P......W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 8, y: 5 }],
      stairs: { x: 7, y: 7, target: 'dungeon', dungeonId: 'schattenkrypta', room: '0,0', entry: { x: 8, y: 10 } },
    },
    '3,1': {
      name: 'Ödland',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..AA....AA....W',
        'W..AA....AA....W',
        'W..............W',
        'W....RR..RR....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        'W....TT..TT....W',
        'W..BB....BB....W',
        'W....RR..RR....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 5, y: 6 }, { type: 'soldier', x: 10, y: 8 }],
      items: [{ type: 'rupee', x: 8, y: 4, value: 8 }],
    },
    '0,2': {
      name: 'Sümpfe',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~..~~..~~..~~W',
        'W~....BB....BB~W',
        'W~..~~....~~..~W',
        'W~............~W',
        'W~..BB....BB..~W',
        'W~............~W',
        'W~..~~....~~..~W',
        'W~............~W',
        'W~....BB....BB~W',
        'W~..P....P....~W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 5, y: 5 }, { type: 'ghost', x: 10, y: 8 }, { type: 'wraith', x: 8, y: 7 }],
    },
    '1,2': {
      name: 'Dünenpfad',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..AA....AA....W',
        'W..AA....AA....W',
        'W..............W',
        'W....TT..TT....W',
        'W..............W',
        'W..P....P......W',
        'W..............W',
        'W....BB..BB....W',
        'W..TT....TT....W',
        'W....RR..RR....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 6, y: 6 }, { type: 'bat', x: 11, y: 8 }],
      items: [{ type: 'rupee', x: 4, y: 4, value: 5 }],
    },
    '2,2': {
      name: 'Verfallene Ruinen',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WRRRR....RRRR..W',
        'WR..R....R..R..W',
        'WR..R....R..R..W',
        'WRRRR....RRRR..W',
        'W..............W',
        'W......SS......W',
        'W......SS......W',
        'W..?...........W',
        'W..BB....BB....W',
        'W..P....P......W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 8, y: 4 }, { type: 'wraith', x: 4, y: 9 }],
      sign: 'Die Seitenkammer der Krypta — betritt die Stufen.',
      stairs: { x: 7, y: 5, target: 'dungeon', dungeonId: 'nebelkathedrale', room: '0,0', entry: { x: 8, y: 10 } },
    },
    '3,2': {
      name: 'Schattenmoor',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~..~~..~~..~~W',
        'W~..TT....TT..~W',
        'W~............~W',
        'W~..BB....BB..~W',
        'W~............~W',
        'W~..?.........~W',
        'W~............~W',
        'W~....RR....RR~W',
        'W~..P....P....~W',
        'W~............~W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'wraith', x: 6, y: 5 }, { type: 'wraith', x: 10, y: 7 }, { type: 'ghost', x: 8, y: 9 }],
      sign: 'Südost: Verlassene Mine — ein weiterer Weg in die Tiefe.',
    },
    '0,3': {
      name: 'Küstenweg',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~....~~~~~W',
        'W..............W',
        'W..BB....BB....W',
        'W..............W',
        'W..P....P......W',
        'W....TT..TT....W',
        'W..AA....AA....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'bat', x: 8, y: 5 }],
      items: [{ type: 'heart', x: 5, y: 7 }],
    },
    '1,3': {
      name: 'Fischerhafen',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~....~~~~~W',
        'W####....####..W',
        'W#..#....#..#..W',
        'W####....####..W',
        'W....++C++.....W',
        'W..?..++++.....W',
        'W..P..++++P....W',
        'W.....++++.....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 4, y: 10 }],
      chest: { x: 5, y: 7, item: 'heart_container', opened: false },
      npcs: [
        { type: 'fisher', x: 10, y: 9, dir: 2, dialog: 'Die Fischer beten für den Kristall. Im Osten liegt die Krypta.' },
      ],
      sign: 'Die Fischer beten für den Kristall.',
    },
    '2,3': {
      name: 'Sturmebene',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..AA....AA....W',
        'W..AA....AA....W',
        'W..............W',
        'W....RR..RR....W',
        'W....RR..RR....W',
        'W..............W',
        'W..TT....TT....W',
        'W..BB....BB....W',
        'W..P....P......W',
        'W....TT..TT....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 7, y: 6 }, { type: 'bat', x: 11, y: 5 }],
    },
    '3,3': {
      name: 'Verlassene Mine',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WRRRR....RRRR..W',
        'WR..R....R..R..W',
        'WRRRR....RRRR..W',
        'W..............W',
        'W..............W',
        'W......SS......W',
        'W......SS......W',
        'W..?...........W',
        'W..P....P......W',
        'W....RR..RR....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 8, y: 4 }, { type: 'ghost', x: 5, y: 8 }],
      sign: 'Dritter Eingang — Katakomben unten.',
      stairs: { x: 7, y: 6, target: 'dungeon', dungeonId: 'eisengrube', room: '0,0', entry: { x: 8, y: 10 } },
    },
  },
};

export const DUNGEON = {
  theme: 'dungeon',
  startRoom: '0,0',
  startPos: { x: 8, y: 10 },
  rooms: {
    '0,0': {
      name: 'Krypta-Eingang',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
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
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'slime', x: 5, y: 4 }, { type: 'slime', x: 10, y: 7 }],
      stairs: { x: 7, y: 7, target: 'overworld', room: '2,1', entry: { x: 8, y: 9 } },
    },
    '1,0': {
      name: 'Steinkorridor',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
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
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'bat', x: 4, y: 6 }, { type: 'soldier', x: 11, y: 5 }],
      door: { x: 7, y: 3, keyRequired: true },
    },
    '2,0': {
      name: 'Schatzkammer',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
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
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'wraith', x: 8, y: 7 }],
      items: [{ type: 'rupee', x: 6, y: 2, value: 25 }],
      chest: { x: 5, y: 2, item: 'small_key', opened: false },
    },
    '0,1': {
      name: 'Seitenkammer',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF....PP.....FW',
        'WFF....PP.....FW',
        'WFF...........FW',
        'WFF....C......FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF....SS.....FW',
        'WFF....SS.....FW',
        'WFFFFFFFFFFFFFFW',
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'ghost', x: 5, y: 5 }, { type: 'soldier', x: 10, y: 8 }],
      chest: { x: 5, y: 6, item: 'big_key', opened: false },
    },
    '1,1': {
      name: 'Wächterhalle',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF....RR.....FW',
        'WFF....RR.....FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'soldier', x: 5, y: 5 }, { type: 'soldier', x: 11, y: 5 }, { type: 'wraith', x: 8, y: 8 }],
      chest: { x: 11, y: 5, item: 'dungeon_map', opened: false },
    },
    '2,1': {
      name: 'Arkane Kammer',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF....??.....FW',
        'WFF....??.....FW',
        'WFF...........FW',
        'WFF....C......FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'ghost', x: 4, y: 7 }, { type: 'ghost', x: 11, y: 7 }],
      chest: { x: 5, y: 6, item: 'compass', opened: false },
      sign: 'Der Thronsaal liegt im Südosten — der Boss braucht den Großen Schlüssel.',
    },
    '0,2': {
      name: 'Katakomben',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF....RR.....FW',
        'WFF....RR.....FW',
        'WFF...........FW',
        'WFF....PP.....FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF....SS.....FW',
        'WFF....SS.....FW',
        'WFFFFFFFFFFFFFFW',
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'wraith', x: 6, y: 6 }, { type: 'wraith', x: 10, y: 6 }],
      items: [{ type: 'rupee', x: 8, y: 5, value: 15 }],
      stairs: { x: 7, y: 9, target: 'overworld', room: '3,3', entry: { x: 8, y: 8 } },
    },
    '1,2': {
      name: 'Vorhof',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
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
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'soldier', x: 4, y: 7 }, { type: 'soldier', x: 11, y: 7 }, { type: 'wraith', x: 8, y: 5 }],
      door: { x: 7, y: 3, keyRequired: true },
    },
    '2,2': {
      name: 'Thronsaal',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
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
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'boss', x: 8, y: 6 }],
      chest: { x: 8, y: 3, item: 'aether_crystal', opened: false, requiresBoss: true },
      bossRoom: true,
      requiresBigKey: true,
    },
  },
};

const dFloor = [
  'WWWWWWWWWWWWWWWW',
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
  'WWWWWWWWWWWWWWWW',
];

export const DUNGEON_NEBEL = {
  theme: 'dungeon',
  id: 'nebelkathedrale',
  cols: 3,
  rows: 2,
  startRoom: '0,0',
  startPos: { x: 8, y: 10 },
  rooms: {
    '0,0': {
      name: 'Nebel-Eingang',
      map: parseMap([...dFloor], 'dungeon'),
      enemies: [{ type: 'ghost', x: 6, y: 5 }, { type: 'slime', x: 10, y: 7 }],
      stairs: { x: 7, y: 9, target: 'overworld', room: '2,2', entry: { x: 8, y: 7 } },
    },
    '1,0': {
      name: 'Nebelhalle',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFW',
        'WFF....DD.....FW',
        'WFF....DD.....FW',
        'WFF...........FW',
        'WFF....C......FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'wraith', x: 5, y: 6 }, { type: 'ghost', x: 11, y: 6 }],
      door: { x: 7, y: 2, keyRequired: true },
      chest: { x: 5, y: 5, item: 'dungeon_map', opened: false },
    },
    '2,0': {
      name: 'Nebelschatz',
      map: parseMap([...dFloor], 'dungeon'),
      enemies: [{ type: 'wraith', x: 8, y: 6 }],
      chest: { x: 5, y: 4, item: 'big_key', opened: false },
      items: [{ type: 'small_key', x: 10, y: 5, collected: false }],
    },
    '0,1': {
      name: 'Nebelkammer',
      map: parseMap([...dFloor], 'dungeon'),
      enemies: [{ type: 'ghost', x: 4, y: 5 }, { type: 'soldier', x: 11, y: 7 }],
      chest: { x: 10, y: 5, item: 'compass', opened: false },
    },
    '1,1': {
      name: 'Nebelvorhof',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFW',
        'WFF...........FW',
        'WFF....XX.....FW',
        'WFF....XX.....FW',
        'WFF...........FW',
        'WFF....C......FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      enemies: [{ type: 'soldier', x: 8, y: 7 }],
      chest: { x: 5, y: 6, item: 'bombs', opened: false },
    },
    '2,1': {
      name: 'Nebelthron',
      map: parseMap([...dFloor], 'dungeon'),
      requiresBigKey: true,
      bossRoom: true,
      enemies: [{ type: 'mist_boss', x: 8, y: 6 }],
      chest: { x: 8, y: 4, item: 'sword_upgrade', opened: false, requiresBoss: true },
    },
  },
};

export const DUNGEON_EISEN = {
  theme: 'dungeon',
  id: 'eisengrube',
  cols: 3,
  rows: 2,
  startRoom: '0,0',
  startPos: { x: 8, y: 10 },
  rooms: {
    '0,0': {
      name: 'Minen-Eingang',
      map: parseMap([...dFloor], 'dungeon'),
      enemies: [{ type: 'slime', x: 5, y: 5 }, { type: 'bat', x: 10, y: 6 }],
      stairs: { x: 7, y: 9, target: 'overworld', room: '3,3', entry: { x: 8, y: 8 } },
    },
    '1,0': {
      name: 'Erzstollen',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WFFFFFFFFFFFFFFW',
        'WFF....DD.....FW',
        'WFF....DD.....FW',
        'WFF...........FW',
        'WFF....XX.....FW',
        'WFF....XX.....FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFF...........FW',
        'WFFFFFFFFFFFFFFW',
        'WWWWWWWWWWWWWWWW'
      ], 'dungeon'),
      door: { x: 7, y: 2, keyRequired: true },
      enemies: [{ type: 'soldier', x: 6, y: 7 }, { type: 'soldier', x: 10, y: 7 }],
      chest: { x: 11, y: 5, item: 'dungeon_map', opened: false },
    },
    '2,0': {
      name: 'Schlüsselstollen',
      map: parseMap([...dFloor], 'dungeon'),
      enemies: [{ type: 'wraith', x: 8, y: 5 }],
      chest: { x: 5, y: 4, item: 'small_key', opened: false },
    },
    '0,1': {
      name: 'Werkstatt',
      map: parseMap([...dFloor], 'dungeon'),
      enemies: [{ type: 'bat', x: 5, y: 6 }, { type: 'bat', x: 11, y: 6 }],
      chest: { x: 5, y: 5, item: 'compass', opened: false },
      items: [{ type: 'small_key', x: 10, y: 7, collected: false }],
    },
    '1,1': {
      name: 'Minenvorhof',
      map: parseMap([...dFloor], 'dungeon'),
      enemies: [{ type: 'soldier', x: 5, y: 6 }, { type: 'wraith', x: 10, y: 6 }],
      chest: { x: 10, y: 5, item: 'big_key', opened: false },
    },
    '2,1': {
      name: 'Erzthron',
      map: parseMap([...dFloor], 'dungeon'),
      requiresBigKey: true,
      bossRoom: true,
      enemies: [{ type: 'iron_boss', x: 8, y: 6 }],
      chest: { x: 8, y: 4, item: 'heart_container', opened: false, requiresBoss: true },
    },
  },
};

export const DUNGEONS = {
  schattenkrypta: { ...DUNGEON, id: 'schattenkrypta', cols: 3, rows: 3 },
  nebelkathedrale: DUNGEON_NEBEL,
  eisengrube: DUNGEON_EISEN,
};

export function getDungeonMeta(id) {
  return DUNGEONS[id] || DUNGEONS.schattenkrypta;
}

export function getRoomGrid(world, dungeonId = 'schattenkrypta') {
  const rooms = world === 'overworld' ? OVERWORLD.rooms : getDungeonMeta(dungeonId).rooms;
  const coords = Object.keys(rooms).map((k) => k.split(',').map(Number));
  return { minX: Math.min(...coords.map(c=>c[0])), maxX: Math.max(...coords.map(c=>c[0])),
    minY: Math.min(...coords.map(c=>c[1])), maxY: Math.max(...coords.map(c=>c[1])) };
}

export function isSolid(tile, localX = 8, localY = 14) {
  if (tile === TILES.TREE) {
    if (localY < 6) return false;
    return localX >= 5 && localX <= 10;
  }
  if (tile === TILES.FENCE) {
    if (localY < 6) return false;
    return true;
  }
  return [TILES.WALL, TILES.WATER, TILES.ROCK, TILES.BUSH, TILES.DOOR_LOCKED,
    TILES.CHEST, TILES.POT, TILES.SIGN].includes(tile);
}

export function hasOverhead(tile) {
  return [TILES.TREE, TILES.FENCE].includes(tile);
}

export function isDestructible(tile) {
  return [TILES.BUSH, TILES.POT, TILES.CRACKED].includes(tile);
}

export function isBombable(tile) {
  return tile === TILES.CRACKED;
}
