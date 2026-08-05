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
  const dungeon = theme === 'dungeon';
  const indoor = theme === 'indoor';
  const lookup = {
    W: indoor ? TILES.HOUSE_WALL : (dungeon ? TILES.WALL : TILES.BUSH),
    '.': indoor ? TILES.WOOD_FLOOR : (dungeon ? TILES.FLOOR : TILES.GRASS),
    B: TILES.BUSH, '~': TILES.WATER, R: TILES.ROCK, T: TILES.TREE, P: TILES.POT,
    C: TILES.CHEST, S: TILES.STAIRS, D: TILES.DOOR_LOCKED, O: TILES.DOOR_OPEN,
    F: TILES.FLOOR, '=': TILES.BRIDGE, A: TILES.SAND, '#': TILES.FENCE, '?': TILES.SIGN,
    '+': TILES.COBBLESTONE,
    X: TILES.CRACKED,
    H: TILES.HOUSE_DOOR,
  };
  return lookup[c] ?? (indoor ? TILES.WOOD_FLOOR : TILES.GRASS);
}

/** Cozy ALttP-style hut — wood floor, plaster walls, exit at south. */
function makeHut(extra = {}) {
  return {
    indoor: true,
    map: parseMap([
      'WWWWWWWWWWWWWWWW',
      'W..............W',
      'W..............W',
      'W..............W',
      'W....C.........W',
      'W..............W',
      'W......P.......W',
      'W..............W',
      'W..............W',
      'W..............W',
      'W..............W',
      'W......SS......W',
      'W..............W',
      'WWWWWWWWWWWWWWWW',
    ], 'indoor'),
    ...extra,
  };
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
        'W..####........W',
        'W..#HH#........W',
        'W..............W',
        'W..............W',
        'W..............W',
        'W..?...........W',
        'W..............W',
        'W..BB....BB....W',
        'W..P....P......W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'bat', x: 11, y: 7 }],
      sign: 'Im Osten liegt die Schattenkrypta. Rüste dich im Norden!',
      stairs: { x: 4, y: 4, target: 'overworld', room: '90,0', entry: { x: 8, y: 10 }, kind: 'door' },
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
      name: 'Dämmerwald',
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
      name: 'Abendau',
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
      name: 'Zwielichtsee',
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
      sign: 'Der Kronenkristall fehlt — die Schattenkrypta liegt im Südosten.',
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
        'WWWWWW++WWWWWWWW',
        'W......++......W',
        'W####..++..####W',
        'W####..++..####W',
        'W#HH#..++..#HH#W',
        'W......++......W',
        '++++++.++.++++++',
        'W..?..++++.....W',
        'W......++......W',
        'WBB....++....BBW',
        'WP.....++.....PW',
        'W....++++++++..W',
        'W......++......W',
        'WWWWWW++WWWWWWWW'
      ]),
      items: [{ type: 'heart', x: 12, y: 7 }],
      sign: 'Osten: Kronenhof. Norden: Dämmerwald. Süden: Schattenmoore.',
      stairs: [
        { x: 2, y: 4, target: 'overworld', room: '100,0', entry: { x: 8, y: 10 }, kind: 'door' },
        { x: 12, y: 4, target: 'overworld', room: '110,0', entry: { x: 8, y: 10 }, kind: 'door' },
      ],
      npcs: [
        { type: 'elder', x: 5, y: 8, dir: 2, dialog: 'Als die Twilight Crown erlosch, fiel ewige Dämmerung über Kronendorf. Drei Schattenkrypten halten ihr Licht gefangen!' },
        { type: 'merchant', x: 11, y: 8, dir: 2, dialog: 'Nimm Schwert und Herzen aus dem Norden — dann wag dich in die Krypta im Osten, Held der Dämmerung.' },
        { type: 'child', x: 8, y: 9, dir: 0, dialog: 'Drück A vor mir! Schattenkrypta, Nebelkathedrale, Eisengrube — dort schläft die Krone!' },
      ],
    },
    '1,1': {
      name: 'Kronenhof',
      map: parseMap([
        'WWWWWW++++WWWWWW',
        'W......++......W',
        'W..####++BBBB..W',
        'W..####++B..B..W',
        'W..#HH#++B..B..W',
        '++++++++++++++++',
        '++++++++++++++++',
        '++++++++++++++++',
        'W......++......W',
        'W..BB..++..BB..W',
        'W..P.?++..P....W',
        'W....++TT++....W',
        'W......++......W',
        'WWWWWW++++WWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 10, y: 9 }],
      sign: 'Westen: Kronendorf · Osten: Felsgrotte · Norden: Abendau · Süden: Dünen',
      stairs: { x: 4, y: 4, target: 'overworld', room: '120,0', entry: { x: 8, y: 10 }, kind: 'door' },
    },
    '2,1': {
      name: 'Felsgrotte',
      map: parseMap([
        'WWWWWW++WWWWWWWW',
        'W......++......W',
        'W..TT..++..TT..W',
        'W..TT..++..TT..W',
        'W......++......W',
        'W++++RR++RR++++W',
        '++++++RR++RR++++',
        'W......SS......W',
        'W......SS......W',
        'W..BB..++..BB..W',
        'W..P...++..P...W',
        'W......++......W',
        'W......++......W',
        'WWWWWW++WWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 5, y: 4 }, { type: 'bat', x: 11, y: 4 }],
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
      name: 'Schattenmoore',
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
        { type: 'fisher', x: 10, y: 9, dir: 2, dialog: 'Wir beten zur Krone der Dämmerung. Im Osten wartet ihre Krypta.' },
      ],
      sign: 'Die Fischer beten zur Twilight Crown.',
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

    // —— Erweiterte Welt (Ring um die Kernkarte) ——
    '-2,0': {
      name: 'Westwald',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WTTTTTTTTTTTTTTW',
        'WT....BB....BBTW',
        'WT..TT....TT..TW',
        'WT............TW',
        'WT....P..P....TW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT....TT..TT..TW',
        'WT..C.........TW',
        'WT............TW',
        'WTTTTTTTTTTTTTTW',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 5, y: 6 }, { type: 'bat', x: 10, y: 8 }],
      chest: { x: 4, y: 10, item: 'bombs', opened: false },
    },
    '-2,1': {
      name: 'Apfelgarten',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..TT..TT..TT..W',
        'W..............W',
        'W..BB......BB..W',
        'W......++......W',
        'W..P...++...P..W',
        'W......++......W',
        'W..?...++......W',
        'W......++......W',
        'W..TT......TT..W',
        'W..............W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 4, y: 5 }, { type: 'slime', x: 11, y: 9 }],
      items: [{ type: 'rupee', x: 8, y: 4, value: 5 }],
      sign: 'Goldene Äpfel im Zwielicht — der Kronenhof liegt im Osten.',
      npcs: [
        { type: 'child', x: 10, y: 7, dir: 2, dialog: 'Im Westen lauert der Dämmergeist… wenn die Krone ruft!' },
      ],
    },
    '-2,2': {
      name: 'Nebelbruch',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~..~~..~~..~~W',
        'W~..TT....TT..~W',
        'W~............~W',
        'W~..BB....BB..~W',
        'W~............~W',
        'W~....RR......~W',
        'W~............~W',
        'W~..P....P....~W',
        'W~............~W',
        'W~~..........~~W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'ghost', x: 6, y: 6 }, { type: 'wraith', x: 10, y: 8 }],
      items: [{ type: 'heart', x: 8, y: 5 }],
    },
    '4,0': {
      name: 'Adlerhorst',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WRRRR....RRRR..W',
        'WR............RW',
        'WR..TT....TT..RW',
        'WR............RW',
        'WR....C.......RW',
        'WR............RW',
        'WR..BB....BB..RW',
        'WR............RW',
        'WR..P....P....RW',
        'WRRRR....RRRR..W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'bat', x: 5, y: 5 }, { type: 'bat', x: 11, y: 7 }, { type: 'soldier', x: 8, y: 9 }],
      chest: { x: 6, y: 6, item: 'heart_container', opened: false },
    },
    '4,1': {
      name: 'Östliche Steppe',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WAA..AA..AA..AAW',
        'WA............AW',
        'WA..RR....RR..AW',
        'WA............AW',
        'WA....++++....AW',
        'WA....++++....AW',
        'WA..P.++++.P..AW',
        'WA............AW',
        'WA..BB....BB..AW',
        'WA............AW',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 5, y: 6 }, { type: 'soldier', x: 11, y: 8 }],
      items: [{ type: 'rupee', x: 8, y: 4, value: 10 }],
      sign: 'Weiter östlich: der Adlerhorst. Zurück westlich: das Ödland.',
    },
    '4,2': {
      name: 'Dornenfeld',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WBBBBBB..BBBBBBW',
        'WB............BW',
        'WB..TT....TT..BW',
        'WB............BW',
        'WB..BB....BB..BW',
        'WB............BW',
        'WB..P....P....BW',
        'WB............BW',
        'WB..RR....RR..BW',
        'WB............BW',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 4, y: 7 }, { type: 'slime', x: 11, y: 5 }, { type: 'bat', x: 8, y: 9 }],
    },
    '4,3': {
      name: 'Knochenstrand',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WAA..........AAW',
        'WA~~~~~~~~~~~~AW',
        'WA~~~~====~~~~AW',
        'WA~~~~~~~~~~~~AW',
        'WAA..........AAW',
        'W..RR......RR..W',
        'W..............W',
        'W..?...........W',
        'W..P....P......W',
        'W....TT..TT....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'wraith', x: 7, y: 8 }, { type: 'ghost', x: 11, y: 10 }],
      sign: 'Hier strandeten einst Schiffe der Twilight Crown.',
      items: [{ type: 'rupee', x: 8, y: 8, value: 20 }],
    },
    '0,-1': {
      name: 'Nordpass',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WRRR........RRRW',
        'WR............RW',
        'WR..TT....TT..RW',
        'WR............RW',
        'W......++......W',
        'W......++......W',
        'W..P...++...P..W',
        'W......++......W',
        'W..BB......BB..W',
        'W..............W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 5, y: 5 }, { type: 'bat', x: 11, y: 7 }],
    },
    '1,-1': {
      name: 'Hochwiese',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W..BB....BB....W',
        'W..............W',
        'W....TT..TT....W',
        'W..............W',
        'W......++......W',
        'W..C...++......W',
        'W......++......W',
        'W..P...++...P..W',
        'W..............W',
        'W..BB......BB..W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 4, y: 8 }, { type: 'slime', x: 12, y: 5 }],
      chest: { x: 4, y: 7, item: 'bombs', opened: false },
    },
    '2,-1': {
      name: 'Kristallgrat',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~....~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~....~~~~~W',
        'W..............W',
        'W..RR......RR..W',
        'W..............W',
        'W..?...........W',
        'W..P....P......W',
        'W....TT..TT....W',
        'W..............W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'bat', x: 6, y: 6 }, { type: 'bat', x: 10, y: 8 }],
      sign: 'Vom Grat siehst du die ganze Welt der Dämmerung.',
      items: [{ type: 'heart', x: 8, y: 5 }],
    },
    '3,-1': {
      name: 'Windturm',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W....######....W',
        'W....#....#....W',
        'W....#....#....W',
        'W....######....W',
        'W......++......W',
        'W......++......W',
        'W..BB..++..BB..W',
        'W......++......W',
        'W..P.......P...W',
        'W..............W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 5, y: 8 }, { type: 'wraith', x: 11, y: 9 }],
      npcs: [
        { type: 'elder', x: 8, y: 7, dir: 2, dialog: 'Der Wind trägt Zwielicht… die Twilight Crown ruft aus der Tiefe.' },
      ],
    },
    '-1,-1': {
      name: 'Dämmerlichtung',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'WTTTT......TTTTW',
        'WT............TW',
        'WT..BB....BB..TW',
        'WT............TW',
        'WT......C.....TW',
        'WT............TW',
        'WT..P......P..TW',
        'WT............TW',
        'WT....TT..TT..TW',
        'WT............TW',
        'WTTTT......TTTTW',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'ghost', x: 5, y: 7 }, { type: 'ghost', x: 11, y: 5 }],
      chest: { x: 7, y: 5, item: 'bombs', opened: false },
    },
    '0,4': {
      name: 'Südklippe',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~..........~~W',
        'W~~~~......~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W..............W',
        'W..BB......BB..W',
        'W..............W',
        'W..P....P......W',
        'W....RR..RR....W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'bat', x: 8, y: 8 }],
      items: [{ type: 'rupee', x: 5, y: 9, value: 5 }],
    },
    '1,4': {
      name: 'Muschelstrand',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WAA..........AAW',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~====~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'WAA....++....AAW',
        'W......++......W',
        'W..?...++......W',
        'W......++......W',
        'W####..++..####W',
        'W#..#......#..#W',
        'W####......####W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 4, y: 7 }],
      sign: 'Südlich endet die Karte — kehre um, Held.',
      npcs: [
        { type: 'fisher', x: 11, y: 8, dir: 2, dialog: 'Die See ist grau… seit die Twilight Crown erlosch.' },
      ],
    },
    '2,4': {
      name: 'Wrackbucht',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~..RRRR..~~~~W',
        'W~...R..R....~~W',
        'W~...RRRR....~~W',
        'W~~..........~~W',
        'W~~~~====~~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W..............W',
        'W..P....C...P..W',
        'W..............W',
        'W..BB......BB..W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'wraith', x: 6, y: 9 }, { type: 'soldier', x: 11, y: 10 }],
      chest: { x: 8, y: 9, item: 'heart_container', opened: false },
    },
    '3,4': {
      name: 'Salzwüste',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'WAA..AA..AA..AAW',
        'WA............AW',
        'WA..RR....RR..AW',
        'WA............AW',
        'WA....BB......AW',
        'WA............AW',
        'WA..P....P....AW',
        'WA............AW',
        'WA..TT....TT..AW',
        'WA............AW',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'soldier', x: 5, y: 6 }, { type: 'soldier', x: 10, y: 8 }, { type: 'bat', x: 8, y: 4 }],
      items: [{ type: 'rupee', x: 8, y: 10, value: 15 }],
    },
    '-1,4': {
      name: 'Schilfgürtel',
      map: parseMap([
        'WWWWWWWWWWWWWWWW',
        'W..............W',
        'W~~..~~..~~..~~W',
        'W~..BB....BB..~W',
        'W~............~W',
        'W~..TT....TT..~W',
        'W~............~W',
        'W~....P..P....~W',
        'W~............~W',
        'W~~..........~~W',
        'W~~~~~~~~~~~~~~W',
        'W~~~~~~~~~~~~~~W',
        'W..............W',
        'WWWWWWWWWWWWWWWW'
      ]),
      enemies: [{ type: 'slime', x: 5, y: 5 }, { type: 'ghost', x: 10, y: 7 }],
    },

    // —— Innenräume (weit auseinander, damit carveRoomExits sie nicht verbindet) ——
    '90,0': {
      name: 'Einsame Hütte (Innen)',
      ...makeHut({
        chest: { x: 5, y: 4, item: 'heart_container', opened: false },
        stairs: { x: 7, y: 11, target: 'overworld', room: '-1,1', entry: { x: 4, y: 5 }, kind: 'door' },
        npcs: [
          { type: 'elder', x: 10, y: 5, dir: 2, dialog: 'Ruhe dich aus, Held. Draußen wartet die Dämmerung.' },
        ],
      }),
    },
    '100,0': {
      name: 'Ältesten-Haus',
      ...makeHut({
        chest: { x: 5, y: 4, item: 'rupee_blue', opened: false },
        stairs: { x: 7, y: 11, target: 'overworld', room: '0,1', entry: { x: 2, y: 5 }, kind: 'door' },
        npcs: [
          { type: 'elder', x: 10, y: 6, dir: 2, dialog: 'In meinem Haus findest du Ruhe — und manchmal einen Rubin.' },
        ],
      }),
    },
    '110,0': {
      name: 'Kaufmanns-Haus',
      ...makeHut({
        items: [{ type: 'rupee', x: 4, y: 7, value: 5 }],
        stairs: { x: 7, y: 11, target: 'overworld', room: '0,1', entry: { x: 12, y: 5 }, kind: 'door' },
        npcs: [
          { type: 'merchant', x: 9, y: 5, dir: 2, dialog: 'Willkommen! Draußen verkaufe ich Rat — hier gibt\'s Tee.' },
        ],
      }),
    },
    '120,0': {
      name: 'Kronenhof-Haus',
      ...makeHut({
        chest: { x: 5, y: 4, item: 'heart', opened: false },
        stairs: { x: 7, y: 11, target: 'overworld', room: '1,1', entry: { x: 4, y: 5 }, kind: 'door' },
        npcs: [
          { type: 'child', x: 10, y: 6, dir: 2, dialog: 'Mama sagt, die Twilight Crown leuchtet wieder, wenn du mutig bist!' },
        ],
      }),
    },
  },
};

/** Carve ALttP-style exits aligned to the center path (cols 7–8 / rows 6–7).
 *  Openings are wide enough for the 12×14 player hitbox (classic Zelda edge exits).
 *  See: gablaxian.com Zelda JS — trigger when Link reaches the screen edge on walkable tiles.
 */
function carveRoomExits(rooms, walkTile) {
  // Path-aligned: ++ sits at columns 7–8 in most rooms
  const NS = [6, 7, 8, 9];
  const EW = [5, 6, 7, 8, 9];
  const keep = new Set([
    TILES.STAIRS, TILES.CHEST, TILES.DOOR_LOCKED, TILES.DOOR_OPEN, TILES.HOUSE_DOOR,
  ]);
  const forceOpen = (map, x, y) => {
    if (!map[y] || map[y][x] === undefined) return;
    if (!keep.has(map[y][x])) map[y][x] = walkTile;
  };
  for (const key of Object.keys(rooms)) {
    if (rooms[key].indoor) continue;
    const [rx, ry] = key.split(',').map(Number);
    const map = rooms[key].map;
    if (!map?.length) continue;
    if (rooms[`${rx},${ry - 1}`]) {
      for (const x of NS) {
        forceOpen(map, x, 0);
        forceOpen(map, x, 1);
        forceOpen(map, x, 2);
      }
    }
    if (rooms[`${rx},${ry + 1}`]) {
      for (const x of NS) {
        forceOpen(map, x, 13);
        forceOpen(map, x, 12);
        forceOpen(map, x, 11);
      }
    }
    if (rooms[`${rx - 1},${ry}`]) {
      for (const y of EW) {
        forceOpen(map, 0, y);
        forceOpen(map, 1, y);
        forceOpen(map, 2, y);
      }
    }
    if (rooms[`${rx + 1},${ry}`]) {
      for (const y of EW) {
        forceOpen(map, 15, y);
        forceOpen(map, 14, y);
        forceOpen(map, 13, y);
      }
    }
  }
}

carveRoomExits(OVERWORLD.rooms, TILES.COBBLESTONE);

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

carveRoomExits(DUNGEON.rooms, TILES.FLOOR);
carveRoomExits(DUNGEON_NEBEL.rooms, TILES.FLOOR);
carveRoomExits(DUNGEON_EISEN.rooms, TILES.FLOOR);

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
  if (tile === TILES.HOUSE_DOOR) return false;
  return [TILES.WALL, TILES.HOUSE_WALL, TILES.WATER, TILES.ROCK, TILES.BUSH, TILES.DOOR_LOCKED,
    TILES.CHEST, TILES.POT, TILES.SIGN].includes(tile);
}

export function hasOverhead(tile) {
  return [TILES.TREE, TILES.FENCE, TILES.HOUSE_DOOR].includes(tile);
}

export function isDestructible(tile) {
  // Cracked walls need bombs (ALttP), not sword
  return [TILES.BUSH, TILES.POT].includes(tile);
}

export function isBombable(tile) {
  return tile === TILES.CRACKED;
}
