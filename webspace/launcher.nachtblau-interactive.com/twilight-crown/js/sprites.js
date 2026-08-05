import { TILE, TILES, PALETTE, DIR } from './constants.js';
import { drawText } from './font.js';

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

/** Modern pixel grass — soft dither, tufts, sparse flowers */
function grassGround(ctx, px0, py0, tx, ty) {
  px(ctx, px0, py0, TILE, TILE, PALETTE.grass1);
  const seed = ((tx * 17 + ty * 31) >>> 0) % 100;

  // Soft checker dither (less noisy than before)
  if ((tx + ty) % 2 === 0) {
    px(ctx, px0 + 1, py0 + 1, 2, 1, PALETTE.grass2);
    px(ctx, px0 + 9, py0 + 5, 2, 1, PALETTE.grass2);
    px(ctx, px0 + 5, py0 + 11, 2, 1, PALETTE.grassDither);
  } else {
    px(ctx, px0 + 5, py0 + 3, 2, 1, PALETTE.grass3);
    px(ctx, px0 + 12, py0 + 8, 2, 1, PALETTE.grass2);
  }
  // Subtle shade corner
  if (seed % 4 === 0) px(ctx, px0 + 12, py0 + 12, 3, 3, PALETTE.grassShade);

  // Tufts
  if (seed % 6 === 0) {
    px(ctx, px0 + 3, py0 + 7, 1, 3, PALETTE.grass3);
    px(ctx, px0 + 4, py0 + 6, 1, 4, PALETTE.grass4);
    px(ctx, px0 + 5, py0 + 7, 1, 3, PALETTE.grass3);
  }
  if (seed % 8 === 0) {
    px(ctx, px0 + 10, py0 + 2, 1, 3, PALETTE.grass2);
    px(ctx, px0 + 11, py0 + 1, 1, 4, PALETTE.grass4);
  }
  // Flowers — rarer, slightly larger blooms
  if (seed % 14 === 0) {
    px(ctx, px0 + 6, py0 + 5, 2, 2, PALETTE.flower1);
    px(ctx, px0 + 7, py0 + 5, 1, 1, '#fff8c0');
  }
  if (seed % 19 === 0) {
    px(ctx, px0 + 11, py0 + 9, 2, 2, PALETTE.flower2);
  }
  if (seed % 23 === 0) {
    px(ctx, px0 + 3, py0 + 10, 2, 2, PALETTE.flowerBlue);
  }
}

/**
 * ALttP shrub / hedge — rounded lobes + neighbor blend
 * (avoids flat green cubes).
 */
function drawBush(ctx, px0, py0, tx = 0, ty = 0, map = null) {
  const at = (x, y) => {
    if (!map || y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;
    return map[y][x] === TILES.BUSH || map[y][x] === TILES.TREE;
  };
  const n = at(tx, ty - 1);
  const s = at(tx, ty + 1);
  const e = at(tx + 1, ty);
  const w = at(tx - 1, ty);

  // Grass peeking under rounded base
  grassGround(ctx, px0, py0, tx, ty);

  const left = w ? 0 : 2;
  const right = e ? TILE : TILE - 2;
  const top = n ? 0 : 3;
  const bot = s ? TILE : 13;

  // Soft shadow
  if (!s) px(ctx, px0 + left + 1, py0 + 13, right - left - 2, 2, PALETTE.bushShadow);

  // Main body
  px(ctx, px0 + left, py0 + top, right - left, bot - top, PALETTE.bushMid);
  px(ctx, px0 + left + 1, py0 + top + (n ? 0 : 1), Math.max(2, right - left - 2), 3, PALETTE.bushLight);

  // Round off exposed corners (cut to grass)
  if (!n && !w) {
    px(ctx, px0 + left, py0 + top, 2, 2, PALETTE.grass1);
    px(ctx, px0 + left, py0 + top + 2, 1, 1, PALETTE.grass1);
  }
  if (!n && !e) {
    px(ctx, px0 + right - 2, py0 + top, 2, 2, PALETTE.grass1);
    px(ctx, px0 + right - 1, py0 + top + 2, 1, 1, PALETTE.grass1);
  }
  if (!s && !w) {
    px(ctx, px0 + left, py0 + bot - 2, 2, 2, PALETTE.grass1);
  }
  if (!s && !e) {
    px(ctx, px0 + right - 2, py0 + bot - 2, 2, 2, PALETTE.grass1);
  }

  // Scalloped top bumps
  if (!n) {
    px(ctx, px0 + 3, py0 + 1, 4, 3, PALETTE.bushMid);
    px(ctx, px0 + 9, py0 + 2, 4, 2, PALETTE.bushMid);
    px(ctx, px0 + 4, py0 + 1, 2, 2, PALETTE.bushHighlight);
    px(ctx, px0 + 10, py0 + 2, 2, 1, PALETTE.bushHighlight);
  }

  // Leaf depth
  px(ctx, px0 + 3, py0 + 7, 3, 3, PALETTE.bushDark);
  px(ctx, px0 + 9, py0 + 8, 3, 2, PALETTE.bushDark);
  px(ctx, px0 + 6, py0 + 5, 3, 2, PALETTE.bushHighlight);

  // Soft edge only where exposed
  if (!w) px(ctx, px0 + left, py0 + top + 2, 1, bot - top - 4, PALETTE.bushDark);
  if (!e) px(ctx, px0 + right - 1, py0 + top + 2, 1, bot - top - 4, PALETTE.bushDark);
}

function isBuildingAt(map, x, y) {
  const t = map?.[y]?.[x];
  return t === TILES.FENCE || t === TILES.HOUSE_DOOR;
}

/**
 * ALttP-style house roof — only on the top row of a building cluster
 * (so a 3×2 block reads as ONE house, not six mini-huts).
 */
function drawBuildingRoof(ctx, px0, py0, tx, ty, map) {
  const w = isBuildingAt(map, tx - 1, ty);
  const e = isBuildingAt(map, tx + 1, ty);
  const left = w ? 0 : 1;
  const right = e ? TILE : TILE - 1;
  const width = right - left;

  // Peak ridge
  px(ctx, px0 + left, py0, width, 2, PALETTE.roofEdge);
  px(ctx, px0 + left, py0 + 1, width, 6, PALETTE.roofDark);
  px(ctx, px0 + left + (w ? 0 : 1), py0 + 2, Math.max(2, width - (w || e ? 0 : 2)), 4, PALETTE.roof);
  // Tile rows
  px(ctx, px0 + left, py0 + 3, width, 1, PALETTE.roofLight);
  px(ctx, px0 + left, py0 + 5, width, 1, PALETTE.roofDark);
  // Gable tips on exposed ends
  if (!w) {
    px(ctx, px0 + 1, py0 + 1, 2, 2, PALETTE.roofLight);
    px(ctx, px0, py0 + 2, 1, 5, PALETTE.outline);
  }
  if (!e) {
    px(ctx, px0 + 13, py0 + 1, 2, 2, PALETTE.roofLight);
    px(ctx, px0 + 15, py0 + 2, 1, 5, PALETTE.outline);
  }
  px(ctx, px0 + left, py0 + 7, width, 1, PALETTE.outline);
  // Chimney on west-ish top tiles
  if (!w && (tx % 3 === 0)) {
    px(ctx, px0 + 3, py0 - 2, 3, 4, PALETTE.buildingDark);
    px(ctx, px0 + 3, py0 - 3, 3, 1, PALETTE.outline);
    px(ctx, px0 + 4, py0 - 4, 1, 1, '#686868');
  }
}

/**
 * House wall — continuous facade. Never draws fake doors
 * (only TILES.HOUSE_DOOR is an entrance).
 */
function drawBuildingWall(ctx, px0, py0, tx, ty, map = null) {
  grassGround(ctx, px0, py0, tx, ty);

  const n = isBuildingAt(map, tx, ty - 1);
  const s = isBuildingAt(map, tx, ty + 1);
  const e = isBuildingAt(map, tx + 1, ty);
  const w = isBuildingAt(map, tx - 1, ty);
  const isTop = !n;
  const isFront = !s;

  const wallTop = isTop ? 7 : 1;
  const left = w ? 0 : 1;
  const right = e ? TILE : TILE - 1;

  px(ctx, px0 + left, py0 + wallTop, right - left, TILE - wallTop, PALETTE.building);
  px(ctx, px0 + left, py0 + wallTop, right - left, 1, PALETTE.buildingDark);
  if (!w) px(ctx, px0 + 1, py0 + wallTop, 2, TILE - wallTop, PALETTE.buildingDark);
  if (!e) px(ctx, px0 + 13, py0 + wallTop, 2, TILE - wallTop, PALETTE.buildingDark);
  px(ctx, px0 + left + 1, py0 + wallTop + 2, Math.max(2, right - left - 2), 1, PALETTE.buildingLine);

  // Windows only — doors are HOUSE_DOOR tiles
  if (isFront) {
    px(ctx, px0 + 4, py0 + 8, 8, 5, PALETTE.buildingWindow);
    px(ctx, px0 + 5, py0 + 9, 6, 3, '#3878a8');
    px(ctx, px0 + 7, py0 + 9, 1, 3, PALETTE.buildingLine);
    px(ctx, px0 + 5, py0 + 10, 6, 1, PALETTE.buildingLine);
    px(ctx, px0 + 6, py0 + 9, 1, 1, '#a0d8f8');
  } else if (!isTop) {
    px(ctx, px0 + 5, py0 + 4, 6, 5, PALETTE.buildingWindow);
    px(ctx, px0 + 6, py0 + 5, 4, 3, '#3878a8');
    px(ctx, px0 + 7, py0 + 5, 1, 3, PALETTE.buildingLine);
    px(ctx, px0 + 6, py0 + 5, 1, 1, '#a0d8f8');
  }

  px(ctx, px0 + left, py0 + 14, right - left, 2, PALETTE.wallDark);
  if (!w) px(ctx, px0 + 1, py0 + wallTop, 1, TILE - wallTop, PALETTE.outlineSoft);
  if (!e) px(ctx, px0 + 14, py0 + wallTop, 1, TILE - wallTop, PALETTE.outlineSoft);
  if (isFront) px(ctx, px0 + left, py0 + 15, right - left, 1, PALETTE.outlineSoft);
}

/** Soft dirt path with grass fringes — less harsh checker */
function drawCobblestone(ctx, px0, py0, tx, ty, map = null) {
  const isPath = (x, y) => map?.[y]?.[x] === TILES.COBBLESTONE;
  const seed = (tx * 13 + ty * 7) % 5;

  // Soft base — muted variation instead of hard checker
  px(ctx, px0, py0, TILE, TILE, seed < 2 ? PALETTE.path : PALETTE.pathDark);
  px(ctx, px0 + 1, py0 + 1, 6, 5, PALETTE.pathHighlight);
  px(ctx, px0 + 8, py0 + 3, 5, 4, seed % 2 ? PALETTE.path : PALETTE.pathDark);
  px(ctx, px0 + 3, py0 + 9, 6, 4, PALETTE.pathDark);
  // Soft seams
  px(ctx, px0 + 7, py0 + 2, 1, 12, 'rgba(120,80,40,0.35)');
  px(ctx, px0 + 2, py0 + 7, 12, 1, 'rgba(120,80,40,0.35)');
  if (seed === 0) px(ctx, px0 + 4, py0 + 4, 2, 1, PALETTE.pathEdge);
  if (seed === 3) px(ctx, px0 + 10, py0 + 11, 2, 1, PALETTE.pathHighlight);

  // Grass fringe where path meets overworld grass
  if (map) {
    if (!isPath(tx, ty - 1) && map[ty - 1]?.[tx] === TILES.GRASS) {
      px(ctx, px0, py0, TILE, 2, PALETTE.grass1);
      px(ctx, px0 + 2, py0, 2, 1, PALETTE.grass4);
      px(ctx, px0 + 9, py0, 2, 1, PALETTE.grass2);
    }
    if (!isPath(tx, ty + 1) && map[ty + 1]?.[tx] === TILES.GRASS) {
      px(ctx, px0, py0 + 14, TILE, 2, PALETTE.grass1);
      px(ctx, px0 + 4, py0 + 14, 2, 1, PALETTE.grass3);
    }
    if (!isPath(tx - 1, ty) && map[ty]?.[tx - 1] === TILES.GRASS) {
      px(ctx, px0, py0, 2, TILE, PALETTE.grass1);
      px(ctx, px0, py0 + 5, 1, 2, PALETTE.grass4);
    }
    if (!isPath(tx + 1, ty) && map[ty]?.[tx + 1] === TILES.GRASS) {
      px(ctx, px0 + 14, py0, 2, TILE, PALETTE.grass1);
      px(ctx, px0 + 15, py0 + 8, 1, 2, PALETTE.grass2);
    }
  }
}

/** Dungeon floor — cool gray tile checker like ALttP interiors */
function drawStoneFloor(ctx, px0, py0, tx, ty) {
  const light = (tx + ty) % 2 === 0;
  px(ctx, px0, py0, TILE, TILE, light ? PALETTE.floorLight : PALETTE.floor);
  px(ctx, px0 + 1, py0 + 1, 6, 6, light ? PALETTE.floor : PALETTE.floorDark);
  px(ctx, px0 + 9, py0 + 1, 6, 6, light ? PALETTE.floorDark : PALETTE.floorAccent);
  px(ctx, px0 + 1, py0 + 9, 6, 6, light ? PALETTE.floorAccent : PALETTE.floorLight);
  px(ctx, px0 + 9, py0 + 9, 6, 6, light ? PALETTE.floor : PALETTE.floorDark);
  px(ctx, px0 + 7, py0, 2, TILE, PALETTE.floorGrout);
  px(ctx, px0, py0 + 7, TILE, 2, PALETTE.floorGrout);
}

/** Warm wooden floorboards — ALttP house interior */
function drawWoodFloor(ctx, px0, py0, tx, ty) {
  const alt = (tx + ty) % 2 === 0;
  px(ctx, px0, py0, TILE, TILE, alt ? PALETTE.wood1 : PALETTE.wood2);
  px(ctx, px0, py0 + 5, TILE, 1, PALETTE.woodLine);
  px(ctx, px0, py0 + 10, TILE, 1, PALETTE.woodLine);
  if (alt) {
    px(ctx, px0 + 2, py0 + 1, 3, 1, PALETTE.woodHighlight);
    px(ctx, px0 + 11, py0 + 7, 1, 1, PALETTE.wood3);
  } else {
    px(ctx, px0 + 7, py0 + 2, 4, 1, PALETTE.woodHighlight);
    px(ctx, px0 + 3, py0 + 12, 1, 1, PALETTE.wood3);
  }

  // Center rug — edge tiles get border, fill tiles get pattern
  if (tx >= 5 && tx <= 10 && ty >= 5 && ty <= 8) {
    const left = tx === 5;
    const right = tx === 10;
    const top = ty === 5;
    const bot = ty === 8;
    px(ctx, px0, py0, TILE, TILE, PALETTE.rugRed);
    px(ctx, px0 + 2, py0 + 2, 12, 12, PALETTE.rugDark);
    if (!left && !right && !top && !bot) {
      px(ctx, px0 + 4, py0 + 4, 8, 8, PALETTE.rugRed);
      if ((tx + ty) % 2 === 0) px(ctx, px0 + 6, py0 + 6, 4, 4, PALETTE.rugGold);
    } else {
      // Border fringe
      if (top) px(ctx, px0, py0, TILE, 2, PALETTE.rugGold);
      if (bot) px(ctx, px0, py0 + 14, TILE, 2, PALETTE.rugGold);
      if (left) px(ctx, px0, py0, 2, TILE, PALETTE.rugGold);
      if (right) px(ctx, px0 + 14, py0, 2, TILE, PALETTE.rugGold);
    }
  }
}

/** Plaster house wall with wood trim */
function drawHouseWall(ctx, px0, py0, tx, ty, map = null) {
  px(ctx, px0, py0, TILE, TILE, PALETTE.plasterShadow);
  px(ctx, px0 + 1, py0 + 1, TILE - 2, TILE - 2, PALETTE.plaster);
  px(ctx, px0 + 1, py0 + 1, TILE - 2, 3, PALETTE.plasterDark);
  // Wood beam
  px(ctx, px0, py0 + 5, TILE, 2, PALETTE.wood3);
  px(ctx, px0, py0 + 5, TILE, 1, PALETTE.woodHighlight);
  // Occasional window or hearth facing the room
  const n = map?.[ty - 1]?.[tx] === TILES.HOUSE_WALL;
  const sWood = map?.[ty + 1]?.[tx] === TILES.WOOD_FLOOR;
  if (!n && sWood && tx >= 6 && tx <= 9) {
    // Fireplace on north wall
    px(ctx, px0 + 3, py0 + 8, 10, 7, PALETTE.hearth);
    px(ctx, px0 + 5, py0 + 10, 6, 4, '#201818');
    px(ctx, px0 + 6, py0 + 11, 4, 2, PALETTE.hearthGlow);
    px(ctx, px0 + 7, py0 + 10, 2, 1, '#f8d030');
  } else if ((tx + ty) % 5 === 2 && sWood) {
    px(ctx, px0 + 4, py0 + 8, 8, 5, '#68a0c8');
    px(ctx, px0 + 5, py0 + 9, 6, 3, '#406888');
    px(ctx, px0 + 7, py0 + 9, 1, 3, PALETTE.plasterLine);
  }
  px(ctx, px0, py0, TILE, 1, PALETTE.outline);
  px(ctx, px0, py0 + TILE - 1, TILE, 1, PALETTE.outline);
  px(ctx, px0, py0, 1, TILE, PALETTE.outline);
  px(ctx, px0 + TILE - 1, py0, 1, TILE, PALETTE.outline);
}

function isIndoorMap(map) {
  if (!map?.length) return false;
  for (let y = 0; y < Math.min(4, map.length); y++) {
    for (let x = 0; x < map[y].length; x++) {
      const t = map[y][x];
      if (t === TILES.WOOD_FLOOR || t === TILES.HOUSE_WALL) return true;
    }
  }
  return false;
}

function drawGround(ctx, px0, py0, x, y, map) {
  if (isIndoorMap(map)) drawWoodFloor(ctx, px0, py0, x, y);
  else grassGround(ctx, px0, py0, x, y);
}

/** House exit — doorway with outdoor light */
function drawHouseExit(ctx, px0, py0, tx, ty) {
  drawWoodFloor(ctx, px0, py0, tx, ty);
  // Door frame
  px(ctx, px0 + 1, py0, 14, TILE, PALETTE.wood3);
  px(ctx, px0 + 3, py0 + 1, 10, TILE - 1, '#3a2810');
  // Open doorway — glimpse of grass outside
  px(ctx, px0 + 4, py0 + 2, 8, 12, PALETTE.grass1);
  px(ctx, px0 + 5, py0 + 4, 2, 1, PALETTE.flower1);
  px(ctx, px0 + 9, py0 + 8, 2, 1, PALETTE.flower2);
  px(ctx, px0 + 4, py0 + 12, 8, 2, PALETTE.path);
  // Frame highlight
  px(ctx, px0 + 3, py0 + 1, 1, 13, PALETTE.woodHighlight);
  px(ctx, px0 + 12, py0 + 1, 1, 13, PALETTE.wood3);
  px(ctx, px0 + 3, py0 + 1, 10, 1, PALETTE.outline);
}

/** Thick brown dungeon wall with top ledge */
function drawDungeonWall(ctx, px0, py0, tx, ty) {
  px(ctx, px0, py0, TILE, TILE, PALETTE.dungWallShadow);
  // Top ledge
  px(ctx, px0, py0, TILE, 4, PALETTE.dungWallTop);
  px(ctx, px0 + 1, py0 + 1, TILE - 2, 2, PALETTE.dungWallLight);
  // Face
  px(ctx, px0 + 1, py0 + 4, TILE - 2, TILE - 5, PALETTE.dungWall);
  // Brick seams
  px(ctx, px0 + 1, py0 + 8, TILE - 2, 1, PALETTE.dungWallDark);
  px(ctx, px0 + 8, py0 + 4, 1, TILE - 5, PALETTE.dungWallDark);
  if ((tx + ty) % 2 === 0) {
    px(ctx, px0 + 3, py0 + 5, 3, 2, PALETTE.dungWallLight);
  } else {
    px(ctx, px0 + 10, py0 + 10, 3, 2, PALETTE.dungWallDark);
  }
  px(ctx, px0, py0, TILE, 1, PALETTE.outline);
  px(ctx, px0, py0 + TILE - 1, TILE, 1, PALETTE.outline);
  px(ctx, px0, py0, 1, TILE, PALETTE.outline);
  px(ctx, px0 + TILE - 1, py0, 1, TILE, PALETTE.outline);
}

function drawHeartUnit(ctx, x, y, fill) {
  const empty = fill === 0;
  const half = fill === 1;
  const c = empty ? PALETTE.heartEmpty : PALETTE.heart;
  const dark = empty ? '#383840' : PALETTE.heartDark;

  if (half) {
    // Right half heart
    px(ctx, x + 5, y, 3, 2, c);
    px(ctx, x + 4, y + 2, 5, 3, c);
    px(ctx, x + 5, y + 5, 3, 2, c);
    px(ctx, x + 6, y + 7, 1, 1, c);
    px(ctx, x + 5, y + 1, 1, 1, PALETTE.heartShine);
    return;
  }

  // Full / empty heart with outline
  px(ctx, x + 1, y, 3, 2, c);
  px(ctx, x + 5, y, 3, 2, c);
  px(ctx, x, y + 2, 9, 3, c);
  px(ctx, x + 1, y + 5, 7, 2, c);
  px(ctx, x + 2, y + 7, 5, 1, c);
  px(ctx, x + 3, y + 8, 3, 1, c);
  if (!empty) {
    px(ctx, x + 2, y + 1, 1, 1, PALETTE.heartShine);
    px(ctx, x, y + 2, 1, 2, dark);
  }
}

export function drawTile(ctx, tile, x, y, frame = 0, layer = 'full', map = null) {
  if (layer === 'overhead') {
    drawTileOverhead(ctx, tile, x, y, map);
    return;
  }
  drawTileBase(ctx, tile, x, y, frame, map);
  if (layer === 'full') drawTileOverhead(ctx, tile, x, y, map);
}

function drawTileOverhead(ctx, tile, x, y, map = null) {
  const px0 = x * TILE;
  const py0 = y * TILE;

  if (tile === TILES.TREE) {
    // Rounded layered canopy
    px(ctx, px0 + 2, py0 + 1, 12, 3, PALETTE.treeLight);
    px(ctx, px0, py0 + 3, 16, 8, PALETTE.treeCanopy);
    px(ctx, px0 + 1, py0 + 4, 6, 5, PALETTE.treeDark);
    px(ctx, px0 + 8, py0 + 5, 6, 5, PALETTE.treeLight);
    px(ctx, px0 + 5, py0 + 3, 6, 4, PALETTE.treeLight);
    px(ctx, px0 + 4, py0 + 8, 4, 2, PALETTE.treeDark);
    px(ctx, px0 + 3, py0 + 2, 2, 1, '#78e058');
    px(ctx, px0 + 10, py0 + 6, 2, 1, '#78e058');
    // Soft outline
    px(ctx, px0 + 2, py0, 12, 1, PALETTE.outlineSoft);
    px(ctx, px0, py0 + 3, 1, 8, PALETTE.outlineSoft);
    px(ctx, px0 + 15, py0 + 3, 1, 8, PALETTE.outlineSoft);
    px(ctx, px0 + 2, py0 + 11, 12, 1, PALETTE.outlineSoft);
  } else if (tile === TILES.FENCE) {
    // Roof only on northern edge of a house cluster → one house, not many mini-huts
    if (!isBuildingAt(map, x, y - 1)) {
      drawBuildingRoof(ctx, px0, py0, x, y, map);
    }
  } else if (tile === TILES.HOUSE_DOOR) {
    // Peak strip above door if this door is on the top row (rare 1-row hut)
    if (!isBuildingAt(map, x, y - 1)) {
      drawBuildingRoof(ctx, px0, py0, x, y, map);
    }
  }
}

function drawTileBase(ctx, tile, x, y, frame = 0, map = null) {
  const px0 = x * TILE;
  const py0 = y * TILE;

  switch (tile) {
    case TILES.GRASS:
      grassGround(ctx, px0, py0, x, y);
      break;

    case TILES.WALL:
      drawDungeonWall(ctx, px0, py0, x, y);
      break;

    case TILES.WATER: {
      const wave = Math.floor(frame / 8) % 4;
      px(ctx, px0, py0, TILE, TILE, wave < 2 ? PALETTE.water1 : PALETTE.water2);
      px(ctx, px0 + 1, py0 + 2, TILE - 2, TILE - 3, PALETTE.waterDeep);
      const isWater = (tx, ty) => map?.[ty]?.[tx] === TILES.WATER;
      if (map) {
        if (!isWater(x, y - 1)) px(ctx, px0, py0, TILE, 2, PALETTE.waterFoam);
        if (!isWater(x, y + 1)) px(ctx, px0, py0 + TILE - 2, TILE, 2, PALETTE.waterEdge);
        if (!isWater(x - 1, y)) px(ctx, px0, py0, 2, TILE, PALETTE.waterFoam);
        if (!isWater(x + 1, y)) px(ctx, px0 + TILE - 2, py0, 2, TILE, PALETTE.waterEdge);
      }
      px(ctx, px0 + 2 + wave * 2, py0 + 5, 4, 1, PALETTE.waterSpark);
      px(ctx, px0 + 8, py0 + 9 + (wave % 2), 3, 1, 'rgba(255,255,255,0.45)');
      px(ctx, px0 + 4, py0 + 12, 2, 1, 'rgba(180,220,255,0.3)');
      break;
    }

    case TILES.BUSH:
      drawBush(ctx, px0, py0, x, y, map);
      break;

    case TILES.ROCK: {
      grassGround(ctx, px0, py0, x, y);
      px(ctx, px0 + 2, py0 + 5, 12, 9, PALETTE.rockDark);
      px(ctx, px0 + 3, py0 + 4, 10, 9, PALETTE.rock);
      px(ctx, px0 + 4, py0 + 5, 5, 4, PALETTE.rockLight);
      px(ctx, px0 + 9, py0 + 9, 3, 2, PALETTE.rockDark);
      if ((x + y) % 3 === 0) px(ctx, px0 + 5, py0 + 10, 3, 2, PALETTE.rockMoss);
      px(ctx, px0 + 3, py0 + 4, 10, 1, PALETTE.outline);
      px(ctx, px0 + 2, py0 + 5, 1, 8, PALETTE.outline);
      px(ctx, px0 + 13, py0 + 5, 1, 8, PALETTE.outline);
      break;
    }

    case TILES.TREE: {
      grassGround(ctx, px0, py0, x, y);
      px(ctx, px0 + 6, py0 + 9, 4, 7, PALETTE.treeTrunk);
      px(ctx, px0 + 7, py0 + 10, 2, 5, PALETTE.treeTrunkDark);
      px(ctx, px0 + 6, py0 + 9, 1, 3, PALETTE.treeTrunkLight);
      px(ctx, px0 + 5, py0 + 14, 6, 2, PALETTE.shadow);
      break;
    }

    case TILES.FLOOR:
      drawStoneFloor(ctx, px0, py0, x, y);
      break;

    case TILES.WOOD_FLOOR:
      drawWoodFloor(ctx, px0, py0, x, y);
      break;

    case TILES.HOUSE_WALL:
      drawHouseWall(ctx, px0, py0, x, y, map);
      break;

    case TILES.DOOR_LOCKED: {
      drawStoneFloor(ctx, px0, py0, x, y);
      // Door frame
      px(ctx, px0 + 2, py0, 12, TILE, PALETTE.dungWallDark);
      px(ctx, px0 + 3, py0 + 1, 10, TILE - 2, PALETTE.dungWall);
      px(ctx, px0 + 4, py0 + 2, 8, TILE - 4, '#402818');
      // Lock
      px(ctx, px0 + 7, py0 + 6, 2, 3, PALETTE.gold);
      px(ctx, px0 + 6, py0 + 5, 4, 2, PALETTE.goldDark);
      px(ctx, px0 + 2, py0, 12, 1, PALETTE.outline);
      break;
    }

    case TILES.DOOR_OPEN: {
      drawStoneFloor(ctx, px0, py0, x, y);
      px(ctx, px0 + 2, py0, 12, TILE, PALETTE.dungWallDark);
      px(ctx, px0 + 4, py0 + 1, 8, TILE - 1, '#181010');
      px(ctx, px0 + 5, py0 + 2, 6, 4, '#080808');
      break;
    }

    case TILES.HOUSE_DOOR: {
      // Open doorway — dark interior + warm light (clearly enterable)
      // Adjacent HH tiles merge into one wide opening.
      grassGround(ctx, px0, py0, x, y);
      const leftDoor = map?.[y]?.[x - 1] === TILES.HOUSE_DOOR;
      const rightDoor = map?.[y]?.[x + 1] === TILES.HOUSE_DOOR;
      const e = isBuildingAt(map, x + 1, y);
      const w = isBuildingAt(map, x - 1, y);

      // Wall stubs only on outer edges (not between double doors)
      if (!leftDoor && (w || e || isBuildingAt(map, x, y - 1))) {
        px(ctx, px0, py0 + 1, 3, 15, PALETTE.building);
        px(ctx, px0, py0 + 1, 3, 1, PALETTE.buildingDark);
        px(ctx, px0, py0 + 14, 3, 2, PALETTE.wallDark);
      }
      if (!rightDoor && (w || e || isBuildingAt(map, x, y - 1))) {
        px(ctx, px0 + 13, py0 + 1, 3, 15, PALETTE.building);
        px(ctx, px0 + 13, py0 + 1, 3, 1, PALETTE.buildingDark);
        px(ctx, px0 + 13, py0 + 14, 3, 2, PALETTE.wallDark);
      }

      const openL = leftDoor ? 0 : 3;
      const openR = rightDoor ? TILE : 13;
      const openW = openR - openL;

      // Frame
      px(ctx, px0 + openL, py0 + 1, openW, 14, PALETTE.buildingDoor);
      if (!leftDoor) px(ctx, px0 + openL, py0 + 1, 1, 14, PALETTE.woodHighlight);
      if (!rightDoor) px(ctx, px0 + openR - 1, py0 + 1, 1, 14, PALETTE.woodHighlight);
      px(ctx, px0 + openL, py0 + 1, openW, 1, PALETTE.woodHighlight);

      // Open interior
      const innL = leftDoor ? 0 : openL + 1;
      const innR = rightDoor ? TILE : openR - 1;
      px(ctx, px0 + innL, py0 + 2, innR - innL, 12, '#181010');
      px(ctx, px0 + innL + 1, py0 + 3, Math.max(2, innR - innL - 2), 9, '#100808');
      // Warm lamp glow
      if (!leftDoor && !rightDoor) {
        px(ctx, px0 + 6, py0 + 4, 4, 3, 'rgba(248,180,60,0.35)');
        px(ctx, px0 + 7, py0 + 5, 2, 2, '#f0a030');
      } else if (leftDoor && !rightDoor) {
        px(ctx, px0 + 2, py0 + 4, 6, 3, 'rgba(248,180,60,0.3)');
        px(ctx, px0 + 4, py0 + 5, 3, 2, '#f0a030');
      } else if (!leftDoor && rightDoor) {
        px(ctx, px0 + 8, py0 + 4, 6, 3, 'rgba(248,180,60,0.3)');
        px(ctx, px0 + 9, py0 + 5, 3, 2, '#f0a030');
      }
      // Threshold
      px(ctx, px0 + innL, py0 + 13, innR - innL, 2, PALETTE.path);
      px(ctx, px0 + innL + 1, py0 + 14, Math.max(2, innR - innL - 2), 1, PALETTE.pathHighlight);
      // Frame outline
      if (!leftDoor) px(ctx, px0 + openL, py0 + 1, 1, 14, PALETTE.outlineSoft);
      if (!rightDoor) px(ctx, px0 + openR - 1, py0 + 1, 1, 14, PALETTE.outlineSoft);
      px(ctx, px0 + openL, py0 + 1, openW, 1, PALETTE.outlineSoft);
      break;
    }

    case TILES.STAIRS: {
      if (isIndoorMap(map)) {
        drawHouseExit(ctx, px0, py0, x, y);
      } else {
        drawStoneFloor(ctx, px0, py0, x, y);
        for (let i = 0; i < 5; i++) {
          const c = i % 2 === 0 ? PALETTE.dungWallLight : PALETTE.dungWallDark;
          px(ctx, px0 + 2, py0 + 1 + i * 3, TILE - 4, 3, c);
          px(ctx, px0 + 2, py0 + 1 + i * 3, TILE - 4, 1, PALETTE.outline);
        }
      }
      break;
    }

    case TILES.CHEST: {
      drawGround(ctx, px0, py0, x, y, map);
      // Wooden chest body
      px(ctx, px0 + 2, py0 + 7, 12, 7, '#885828');
      px(ctx, px0 + 3, py0 + 8, 10, 5, '#a87038');
      // Lid
      px(ctx, px0 + 2, py0 + 4, 12, 4, '#a04018');
      px(ctx, px0 + 3, py0 + 5, 10, 2, '#c85828');
      // Lock plate
      px(ctx, px0 + 6, py0 + 9, 4, 3, PALETTE.gold);
      px(ctx, px0 + 7, py0 + 10, 2, 1, PALETTE.goldDark);
      px(ctx, px0 + 2, py0 + 4, 12, 1, PALETTE.outline);
      px(ctx, px0 + 2, py0 + 13, 12, 1, PALETTE.outline);
      break;
    }

    case TILES.POT: {
      drawGround(ctx, px0, py0, x, y, map);
      // ALttP clay jar — round belly, rim, highlight
      px(ctx, px0 + 5, py0 + 13, 6, 2, PALETTE.shadow);
      px(ctx, px0 + 4, py0 + 6, 8, 8, PALETTE.potDark);
      px(ctx, px0 + 5, py0 + 5, 6, 9, PALETTE.pot);
      px(ctx, px0 + 6, py0 + 6, 4, 6, PALETTE.potLight);
      px(ctx, px0 + 6, py0 + 7, 2, 3, PALETTE.potShine);
      // Rim
      px(ctx, px0 + 5, py0 + 4, 6, 2, PALETTE.potRim);
      px(ctx, px0 + 6, py0 + 3, 4, 2, PALETTE.potRim);
      px(ctx, px0 + 7, py0 + 2, 2, 1, PALETTE.potShine);
      // Band
      px(ctx, px0 + 5, py0 + 9, 6, 1, PALETTE.potBand);
      px(ctx, px0 + 4, py0 + 5, 1, 8, PALETTE.outline);
      px(ctx, px0 + 11, py0 + 5, 1, 8, PALETTE.outline);
      px(ctx, px0 + 5, py0 + 13, 6, 1, PALETTE.outline);
      break;
    }

    case TILES.BRIDGE: {
      px(ctx, px0, py0, TILE, TILE, PALETTE.water1);
      px(ctx, px0, py0 + 3, TILE, 10, PALETTE.fenceWood);
      for (let i = 0; i < 4; i++) {
        px(ctx, px0 + i * 4, py0 + 3, 2, 10, PALETTE.fenceDark);
      }
      px(ctx, px0, py0 + 3, TILE, 1, PALETTE.outline);
      px(ctx, px0, py0 + 12, TILE, 1, PALETTE.outline);
      // Rail posts
      px(ctx, px0, py0 + 2, 2, 3, PALETTE.fenceDark);
      px(ctx, px0 + 14, py0 + 2, 2, 3, PALETTE.fenceDark);
      break;
    }

    case TILES.SAND: {
      px(ctx, px0, py0, TILE, TILE, (x + y) % 2 === 0 ? PALETTE.sand : PALETTE.sandDark);
      if ((x * 3 + y) % 4 === 0) px(ctx, px0 + 5, py0 + 6, 2, 1, PALETTE.sandGrain);
      if ((x * 5 + y) % 6 === 0) px(ctx, px0 + 10, py0 + 3, 2, 1, PALETTE.sandGrain);
      if ((x + y * 2) % 5 === 0) px(ctx, px0 + 3, py0 + 11, 3, 1, PALETTE.sandGrain);
      break;
    }

    case TILES.COBBLESTONE:
      drawCobblestone(ctx, px0, py0, x, y, map);
      break;

    case TILES.CRACKED: {
      drawStoneFloor(ctx, px0, py0, x, y);
      // Cracked block — bombable
      px(ctx, px0 + 2, py0 + 2, 12, 12, PALETTE.dungWall);
      px(ctx, px0 + 3, py0 + 3, 10, 10, PALETTE.dungWallDark);
      px(ctx, px0 + 4, py0 + 5, 2, 6, '#282018');
      px(ctx, px0 + 8, py0 + 3, 4, 3, '#282018');
      px(ctx, px0 + 7, py0 + 9, 5, 3, '#181010');
      px(ctx, px0 + 2, py0 + 2, 12, 1, PALETTE.outline);
      break;
    }

    case TILES.FENCE:
      drawBuildingWall(ctx, px0, py0, x, y, map);
      break;

    case TILES.SIGN: {
      grassGround(ctx, px0, py0, x, y);
      // Post
      px(ctx, px0 + 7, py0 + 8, 2, 7, PALETTE.fenceDark);
      px(ctx, px0 + 7, py0 + 8, 1, 7, '#a87838');
      // Board
      px(ctx, px0 + 2, py0 + 2, 12, 8, PALETTE.fenceDark);
      px(ctx, px0 + 3, py0 + 3, 10, 6, '#e0c070');
      px(ctx, px0 + 3, py0 + 3, 10, 1, '#f0d890');
      // Text lines
      px(ctx, px0 + 5, py0 + 5, 6, 1, '#684828');
      px(ctx, px0 + 5, py0 + 7, 6, 1, '#684828');
      // Nail
      px(ctx, px0 + 7, py0 + 4, 2, 1, '#886028');
      px(ctx, px0 + 2, py0 + 2, 12, 1, PALETTE.outline);
      px(ctx, px0 + 2, py0 + 9, 12, 1, PALETTE.outline);
      px(ctx, px0 + 2, py0 + 2, 1, 8, PALETTE.outline);
      px(ctx, px0 + 13, py0 + 2, 1, 8, PALETTE.outline);
      break;
    }

    default:
      px(ctx, px0, py0, TILE, TILE, '#ff00ff');
  }
}

/** Green-tunic hero — modern crisp ALttP silhouette */
export function drawPlayer(ctx, px0, py0, dir, frame, state, invincible = 0) {
  if (invincible > 0 && frame % 8 < 4) return;

  const x = Math.floor(px0);
  const y = Math.floor(py0);
  const walkCycle = state === 'walk' || state === 'carry' ? (Math.floor(frame / 5) % 4) : 0;
  const bob = state === 'walk' && (walkCycle === 1 || walkCycle === 3) ? 1 : 0;
  const hurt = state === 'hurt' && frame % 4 < 2;
  const attack = state === 'attack';
  const itemGet = state === 'itemget';
  const yy = y - bob;

  px(ctx, x + 3, y + 15, 10, 2, PALETTE.shadow);

  // Shield
  if (!itemGet) {
    if (dir === DIR.RIGHT) {
      px(ctx, x, yy + 6, 4, 8, PALETTE.heroShieldRim);
      px(ctx, x + 1, yy + 7, 3, 6, PALETTE.heroShield);
      px(ctx, x + 1, yy + 8, 2, 2, '#ffffff');
      px(ctx, x + 1, yy + 11, 2, 1, PALETTE.heroShieldRim);
    } else if (dir === DIR.DOWN) {
      px(ctx, x + 1, yy + 8, 4, 6, PALETTE.heroShieldRim);
      px(ctx, x + 2, yy + 9, 3, 4, PALETTE.heroShield);
      px(ctx, x + 2, yy + 10, 2, 1, '#ffffff');
    } else if (dir === DIR.LEFT) {
      px(ctx, x + 12, yy + 6, 4, 8, PALETTE.heroShieldRim);
      px(ctx, x + 12, yy + 7, 3, 6, PALETTE.heroShield);
      px(ctx, x + 13, yy + 8, 2, 2, '#ffffff');
    }
  }

  // Legs
  if (walkCycle === 1) {
    px(ctx, x + 3, yy + 12, 4, 4, PALETTE.heroBoots);
    px(ctx, x + 9, yy + 11, 4, 5, PALETTE.heroBoots);
  } else if (walkCycle === 3) {
    px(ctx, x + 3, yy + 11, 4, 5, PALETTE.heroBoots);
    px(ctx, x + 9, yy + 12, 4, 4, PALETTE.heroBoots);
  } else {
    px(ctx, x + 4, yy + 12, 3, 4, PALETTE.heroBoots);
    px(ctx, x + 9, yy + 12, 3, 4, PALETTE.heroBoots);
  }

  // Body tunic
  px(ctx, x + 4, yy + 7, 8, 6, PALETTE.heroTunic);
  px(ctx, x + 5, yy + 8, 6, 4, PALETTE.heroTunicDark);
  px(ctx, x + 5, yy + 7, 6, 2, PALETTE.heroTunicLight);
  px(ctx, x + 5, yy + 11, 6, 1, PALETTE.heroBelt);
  px(ctx, x + 7, yy + 11, 2, 1, PALETTE.gold);
  // Arms
  px(ctx, x + 3, yy + 8, 2, 3, PALETTE.heroSkin);
  px(ctx, x + 11, yy + 8, 2, 3, PALETTE.heroSkin);

  if (itemGet) {
    px(ctx, x + 2, yy + 2, 3, 3, PALETTE.heroSkin);
    px(ctx, x + 11, yy + 2, 3, 3, PALETTE.heroSkin);
    px(ctx, x + 5, yy - 1, 6, 2, PALETTE.heroHatDark);
    px(ctx, x + 4, yy, 8, 4, PALETTE.heroHat);
    px(ctx, x + 5, yy + 4, 6, 3, PALETTE.heroSkin);
    px(ctx, x + 6, yy + 5, 1, 1, PALETTE.outline);
    px(ctx, x + 9, yy + 5, 1, 1, PALETTE.outline);
  } else if (dir === DIR.DOWN) {
    px(ctx, x + 7, yy - 2, 2, 2, PALETTE.heroHatDark);
    px(ctx, x + 5, yy, 6, 2, PALETTE.heroHatDark);
    px(ctx, x + 4, yy + 1, 8, 3, PALETTE.heroHat);
    px(ctx, x + 5, yy + 2, 6, 2, PALETTE.heroHatLight);
    px(ctx, x + 5, yy + 4, 6, 3, PALETTE.heroSkin);
    px(ctx, x + 5, yy + 4, 2, 2, PALETTE.heroHair);
    px(ctx, x + 9, yy + 4, 2, 2, PALETTE.heroHair);
    px(ctx, x + 6, yy + 5, 1, 1, PALETTE.outline);
    px(ctx, x + 9, yy + 5, 1, 1, PALETTE.outline);
    px(ctx, x + 7, yy + 6, 2, 1, '#f89080');
  } else if (dir === DIR.UP) {
    px(ctx, x + 7, yy - 2, 2, 2, PALETTE.heroHatDark);
    px(ctx, x + 4, yy, 8, 5, PALETTE.heroHat);
    px(ctx, x + 5, yy + 1, 6, 3, PALETTE.heroHatLight);
    px(ctx, x + 5, yy + 5, 6, 2, PALETTE.heroTunicLight);
  } else if (dir === DIR.LEFT) {
    px(ctx, x + 1, yy - 1, 5, 2, PALETTE.heroHatDark);
    px(ctx, x + 2, yy, 8, 4, PALETTE.heroHat);
    px(ctx, x + 2, yy + 2, 4, 3, PALETTE.heroHair);
    px(ctx, x + 5, yy + 4, 5, 3, PALETTE.heroSkin);
    px(ctx, x + 4, yy + 5, 1, 1, PALETTE.outline);
  } else {
    px(ctx, x + 10, yy - 1, 5, 2, PALETTE.heroHatDark);
    px(ctx, x + 6, yy, 8, 4, PALETTE.heroHat);
    px(ctx, x + 10, yy + 2, 4, 3, PALETTE.heroHair);
    px(ctx, x + 6, yy + 4, 5, 3, PALETTE.heroSkin);
    px(ctx, x + 11, yy + 5, 1, 1, PALETTE.outline);
  }

  if (!attack && !itemGet) {
    px(ctx, x + 3, yy + 1, 1, 12, PALETTE.outlineSoft);
    px(ctx, x + 12, yy + 1, 1, 12, PALETTE.outlineSoft);
  }
  px(ctx, x + 4, yy + 14, 8, 1, PALETTE.outlineSoft);

  if (hurt) {
    px(ctx, x + 2, yy, 12, 15, 'rgba(255,255,255,0.5)');
  }
}

export function drawHeldItem(ctx, px0, py0, itemType, frame) {
  const x = Math.floor(px0) + 4;
  const y = Math.floor(py0) - 12 + Math.sin(frame * 0.2);
  if (itemType === 'heart_container') {
    drawHeartUnit(ctx, x, y, 2);
    px(ctx, x + 2, y - 2, 5, 2, PALETTE.gold);
  } else if (itemType === 'sword_upgrade') {
    px(ctx, x + 3, y, 2, 12, PALETTE.swordGlow);
    px(ctx, x + 5, y - 1, 2, 14, PALETTE.crystal);
    px(ctx, x + 2, y + 5, 6, 2, PALETTE.swordGuard);
  } else if (itemType === 'small_key' || itemType === 'big_key') {
    px(ctx, x + 2, y + 1, 4, 4, PALETTE.gold);
    px(ctx, x + 5, y + 3, 6, 2, PALETTE.goldDark);
  } else if (itemType === 'bombs') {
    px(ctx, x + 2, y + 3, 6, 6, '#383838');
    px(ctx, x + 3, y + 2, 4, 2, '#f87030');
  } else if (itemType === 'dungeon_map' || itemType === 'compass') {
    px(ctx, x + 1, y + 1, 8, 10, '#f0d898');
    px(ctx, x + 2, y + 2, 6, 8, '#c84828');
  } else if (itemType === 'aether_crystal') {
    px(ctx, x + 2, y, 6, 10, PALETTE.crystal);
    px(ctx, x + 3, y + 2, 4, 6, '#f8ffff');
  } else {
    px(ctx, x + 2, y + 2, 6, 6, PALETTE.gold);
  }
}

export function drawCarriedPot(ctx, px0, py0, dir) {
  const x = Math.floor(px0);
  const y = Math.floor(py0);
  const offsets = {
    [DIR.UP]: { x: 4, y: -6 },
    [DIR.DOWN]: { x: 4, y: -10 },
    [DIR.LEFT]: { x: -4, y: -8 },
    [DIR.RIGHT]: { x: 8, y: -8 },
  };
  const o = offsets[dir];
  px(ctx, x + o.x, y + o.y, 8, 9, PALETTE.pot);
  px(ctx, x + o.x + 1, y + o.y + 1, 6, 6, PALETTE.potLight);
  px(ctx, x + o.x + 1, y + o.y, 6, 2, PALETTE.potRim);
  px(ctx, x + o.x, y + o.y, 8, 9, PALETTE.outline);
}

export function drawThrownPot(ctx, pot) {
  const x = Math.floor(pot.x);
  const y = Math.floor(pot.y);
  const spin = pot.frame % 4;
  px(ctx, x + (spin > 1 ? 1 : 0), y, 10, 10, PALETTE.pot);
  px(ctx, x + 1 + (spin > 1 ? 1 : 0), y + 2, 6, 6, PALETTE.potLight);
  px(ctx, x, y, 10, 10, PALETTE.outline);
}

export function drawSwordBeam(ctx, beam) {
  const x = Math.floor(beam.x);
  const y = Math.floor(beam.y);
  const pulse = beam.frame % 6 < 3;
  const core = beam.power > 1 ? PALETTE.swordGlow : PALETTE.swordBlade;
  const glow = beam.power > 1 ? 'rgba(88,232,248,0.45)' : 'rgba(255,255,255,0.35)';
  px(ctx, x - 1, y - 1, beam.width + 2, beam.height + 2, glow);
  if (beam.dir === DIR.UP || beam.dir === DIR.DOWN) {
    px(ctx, x + 3, y, 4, beam.height, pulse ? core : PALETTE.swordEdge);
    px(ctx, x + 4, y + 1, 2, beam.height - 2, '#ffffff');
  } else {
    px(ctx, x, y + 3, beam.width, 4, pulse ? core : PALETTE.swordEdge);
    px(ctx, x + 1, y + 4, beam.width - 2, 2, '#ffffff');
  }
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color.replace('ALPHA', String(alpha));
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
  }
}

/** Arc slash like ALttP — blade sweeps through frames */
export function drawSword(ctx, px0, py0, dir, frame, power = 1) {
  const x = Math.floor(px0);
  const y = Math.floor(py0);
  const t = Math.min(frame / 12, 1);
  const powered = power > 1;
  const blade = powered ? PALETTE.swordGlow : PALETTE.swordBlade;
  const edge = powered ? PALETTE.crystal : PALETTE.swordEdge;

  // Arc positions: wind-up → mid → extend
  const arcs = {
    [DIR.UP]: [
      { x: 14, y: 4, w: 6, h: 3 },
      { x: 8, y: -2, w: 4, h: 8 },
      { x: 5, y: -8, w: 4, h: 12 },
      { x: 2, y: -4, w: 5, h: 6 },
    ],
    [DIR.DOWN]: [
      { x: -4, y: 8, w: 6, h: 3 },
      { x: 4, y: 12, w: 4, h: 8 },
      { x: 6, y: 14, w: 4, h: 12 },
      { x: 10, y: 10, w: 5, h: 6 },
    ],
    [DIR.LEFT]: [
      { x: 4, y: -2, w: 3, h: 6 },
      { x: -4, y: 2, w: 8, h: 4 },
      { x: -10, y: 5, w: 12, h: 4 },
      { x: -6, y: 10, w: 6, h: 5 },
    ],
    [DIR.RIGHT]: [
      { x: 8, y: -2, w: 3, h: 6 },
      { x: 12, y: 2, w: 8, h: 4 },
      { x: 14, y: 5, w: 12, h: 4 },
      { x: 12, y: 10, w: 6, h: 5 },
    ],
  };

  const steps = arcs[dir];
  const idx = Math.min(steps.length - 1, Math.floor(t * steps.length));
  const s = steps[idx];

  // Soft slash trail
  px(ctx, x + s.x - 1, y + s.y - 1, s.w + 2, s.h + 2, powered ? 'rgba(88,232,248,0.35)' : 'rgba(255,255,255,0.3)');
  px(ctx, x + s.x, y + s.y, s.w, s.h, edge);
  px(ctx, x + s.x + 1, y + s.y + 1, Math.max(1, s.w - 2), Math.max(1, s.h - 2), blade);

  // Guard flash near hand
  if (idx >= 1) {
    const hx = dir === DIR.LEFT ? x + 2 : dir === DIR.RIGHT ? x + 10 : x + 6;
    const hy = dir === DIR.UP ? y + 4 : dir === DIR.DOWN ? y + 10 : y + 8;
    px(ctx, hx, hy, 3, 3, PALETTE.swordGuard);
  }
}

export function drawEnemy(ctx, enemy, frame) {
  const x = Math.floor(enemy.x);
  const y = Math.floor(enemy.y);
  const hurt = enemy.hurtTimer > 0 && frame % 4 < 2;

  px(ctx, x + 2, y + 13, 12, 2, PALETTE.shadow);

  switch (enemy.type) {
    case 'slime': {
      const bounce = Math.abs(Math.sin(frame * 0.22)) * 2;
      const squish = bounce > 1.2 ? 1 : 0;
      const body = hurt ? '#fff' : '#48d038';
      const dark = hurt ? '#ddd' : '#289820';
      px(ctx, x + 2 - squish, y + 6 + bounce, 12 + squish * 2, 8 - squish, body);
      px(ctx, x + 3, y + 5 + bounce, 10, 3, body);
      px(ctx, x + 4, y + 8 + bounce, 8, 4, dark);
      px(ctx, x + 3, y + 7 + bounce, 3, 2, '#88f070');
      px(ctx, x + 5, y + 9 + bounce, 2, 2, PALETTE.outline);
      px(ctx, x + 9, y + 9 + bounce, 2, 2, PALETTE.outline);
      px(ctx, x + 7, y + 11 + bounce, 2, 1, '#186018');
      break;
    }
    case 'bat': {
      const wing = Math.sin(frame * 0.45) > 0;
      const body = hurt ? '#fff' : '#7048b0';
      const wingC = hurt ? '#fff' : '#9068d0';
      px(ctx, x + 5, y + 5, 6, 6, body);
      px(ctx, x + 6, y + 6, 4, 4, hurt ? '#fff' : '#583898');
      if (wing) {
        px(ctx, x, y + 2, 5, 6, wingC);
        px(ctx, x + 11, y + 2, 5, 6, wingC);
        px(ctx, x + 1, y + 3, 3, 2, '#402868');
        px(ctx, x + 12, y + 3, 3, 2, '#402868');
      } else {
        px(ctx, x + 1, y + 7, 4, 3, wingC);
        px(ctx, x + 11, y + 7, 4, 3, wingC);
      }
      px(ctx, x + 6, y + 7, 1, 1, '#f8f060');
      px(ctx, x + 9, y + 7, 1, 1, '#f8f060');
      break;
    }
    case 'soldier': {
      // Darknut-ish armored
      px(ctx, x + 3, y + 4, 10, 10, hurt ? '#fff' : '#484860');
      px(ctx, x + 4, y + 5, 8, 8, hurt ? '#fff' : '#303048');
      px(ctx, x + 5, y + 2, 6, 4, PALETTE.heroSkin);
      px(ctx, x + 4, y + 1, 8, 2, '#686880');
      px(ctx, x + 6, y + 3, 1, 1, PALETTE.outline);
      px(ctx, x + 9, y + 3, 1, 1, PALETTE.outline);
      // Spear tip
      px(ctx, x + 12, y + 6, 4, 2, PALETTE.swordEdge);
      px(ctx, x + 5, y + 8, 6, 2, '#886828');
      break;
    }
    case 'ghost': {
      const float = Math.sin(frame * 0.12) * 2;
      ctx.globalAlpha = 0.75;
      px(ctx, x + 3, y + 2 + float, 10, 12, hurt ? '#fff' : PALETTE.ghost);
      px(ctx, x + 4, y + 4 + float, 8, 6, hurt ? '#fff' : '#8090d0');
      // Wavy bottom
      px(ctx, x + 3, y + 12 + float, 3, 2, hurt ? '#fff' : PALETTE.ghost);
      px(ctx, x + 7, y + 13 + float, 3, 2, hurt ? '#fff' : PALETTE.ghost);
      px(ctx, x + 11, y + 12 + float, 2, 2, hurt ? '#fff' : PALETTE.ghost);
      px(ctx, x + 5, y + 6 + float, 2, 2, PALETTE.outline);
      px(ctx, x + 9, y + 6 + float, 2, 2, PALETTE.outline);
      ctx.globalAlpha = 1;
      break;
    }
    case 'wraith': {
      const drift = Math.sin(frame * 0.1) * 2;
      ctx.globalAlpha = frame % 20 < 2 ? 0.45 : 0.85;
      px(ctx, x + 2, y + 2 + drift, 12, 12, hurt ? '#fff' : '#481868');
      px(ctx, x + 4, y + 4 + drift, 8, 8, hurt ? '#fff' : '#683088');
      px(ctx, x + 5, y + 6 + drift, 2, 2, '#ff4068');
      px(ctx, x + 9, y + 6 + drift, 2, 2, '#ff4068');
      px(ctx, x + 6, y + 10 + drift, 4, 2, '#301040');
      ctx.globalAlpha = 1;
      break;
    }
    case 'boss': {
      const pulse = Math.sin(frame * 0.08) * 2;
      px(ctx, x, y + 1 + pulse, 16, 14, hurt ? '#fff' : '#381040');
      px(ctx, x + 2, y + 3 + pulse, 12, 10, hurt ? '#fff' : '#582860');
      px(ctx, x + 4, y + 1 + pulse, 8, 4, PALETTE.crystal);
      px(ctx, x + 5, y + 2 + pulse, 6, 2, PALETTE.crystalDark);
      px(ctx, x + 4, y + 7 + pulse, 3, 3, '#ff3060');
      px(ctx, x + 9, y + 7 + pulse, 3, 3, '#ff3060');
      px(ctx, x + 6, y + 11 + pulse, 4, 2, '#200828');
      const hpPct = enemy.hp / enemy.maxHp;
      px(ctx, x, y - 5, 16, 3, '#200818');
      px(ctx, x, y - 5, Math.max(1, 16 * hpPct), 3, '#c848c8');
      break;
    }
    case 'mist_boss': {
      const drift = Math.sin(frame * 0.15) * 3;
      ctx.globalAlpha = 0.7 + Math.sin(frame * 0.2) * 0.2;
      px(ctx, x + 1, y + 1 + drift, 14, 14, hurt ? '#fff' : '#3868a0');
      px(ctx, x + 3, y + 3 + drift, 10, 10, hurt ? '#fff' : '#78b0f0');
      px(ctx, x + 5, y + 5 + drift, 6, 6, '#c0e0ff');
      px(ctx, x + 5, y + 7 + drift, 2, 2, '#f8f8ff');
      px(ctx, x + 9, y + 7 + drift, 2, 2, '#f8f8ff');
      ctx.globalAlpha = 1;
      const hpPct = enemy.hp / enemy.maxHp;
      px(ctx, x, y - 5, 16, 3, '#102040');
      px(ctx, x, y - 5, Math.max(1, 16 * hpPct), 3, '#68a8f8');
      break;
    }
    case 'iron_boss': {
      const pulse = Math.sin(frame * 0.06);
      px(ctx, x, y + 1 + pulse, 16, 14, hurt ? '#fff' : '#505058');
      px(ctx, x + 2, y + 3 + pulse, 12, 10, hurt ? '#fff' : '#707078');
      px(ctx, x + 4, y + 5 + pulse, 8, 6, hurt ? '#fff' : '#909098');
      // Glowing eyes
      px(ctx, x + 3, y + 3 + pulse, 4, 3, '#ff5820');
      px(ctx, x + 9, y + 3 + pulse, 4, 3, '#ff5820');
      px(ctx, x + 4, y + 4 + pulse, 2, 1, '#ffd040');
      px(ctx, x + 10, y + 4 + pulse, 2, 1, '#ffd040');
      px(ctx, x, y + 1 + pulse, 16, 1, PALETTE.outline);
      const hpPct = enemy.hp / enemy.maxHp;
      px(ctx, x, y - 5, 16, 3, '#282018');
      px(ctx, x, y - 5, Math.max(1, 16 * hpPct), 3, '#f87838');
      break;
    }
  }
}

export function drawNpc(ctx, npc, frame = 0, showHint = false) {
  const x = Math.floor(npc.x);
  const y = Math.floor(npc.y);
  const dir = npc.dir ?? DIR.DOWN;
  const small = npc.type === 'child';
  const oy = small ? 2 : 0;
  const bob = Math.floor(Math.sin((frame + x) * 0.1) * 1);

  px(ctx, x + 3, y + (small ? 13 : 15), 10, 2, PALETTE.shadow);

  if (showHint) {
    const hy = y - 10 + bob;
    px(ctx, x + 5, hy, 6, 6, '#f8f0d0');
    px(ctx, x + 6, hy + 1, 4, 4, '#f8d030');
    px(ctx, x + 7, hy + 2, 2, 2, '#181808');
    px(ctx, x + 7, hy + 5, 2, 1, '#181808');
  }

  switch (npc.type) {
    case 'elder': {
      // Robe
      px(ctx, x + 3, y + 7 + oy, 10, 8, '#a02838');
      px(ctx, x + 4, y + 8 + oy, 8, 6, '#c03848');
      px(ctx, x + 5, y + 9 + oy, 6, 1, '#f0d048');
      // Head + beard
      px(ctx, x + 5, y + 3 + oy, 6, 5, PALETTE.heroSkin);
      px(ctx, x + 4, y + 2 + oy, 8, 3, '#f0f0f8');
      px(ctx, x + 5, y + 6 + oy, 6, 3, '#e8e8f0');
      if (dir === DIR.DOWN) {
        px(ctx, x + 6, y + 5 + oy, 1, 1, PALETTE.outline);
        px(ctx, x + 9, y + 5 + oy, 1, 1, PALETTE.outline);
      }
      px(ctx, x + 4, y + 14 + oy, 3, 2, PALETTE.heroBoots);
      px(ctx, x + 9, y + 14 + oy, 3, 2, PALETTE.heroBoots);
      break;
    }
    case 'merchant': {
      px(ctx, x + 3, y + 1 + oy, 10, 4, '#684018');
      px(ctx, x + 4, y + 2 + oy, 8, 2, '#886028');
      px(ctx, x + 5, y + 4 + oy, 6, 3, PALETTE.heroSkin);
      px(ctx, x + 4, y + 7 + oy, 8, 7, '#c84828');
      px(ctx, x + 5, y + 8 + oy, 6, 2, PALETTE.gold);
      px(ctx, x + 6, y + 5 + oy, 1, 1, PALETTE.outline);
      px(ctx, x + 9, y + 5 + oy, 1, 1, PALETTE.outline);
      px(ctx, x + 4, y + 14 + oy, 3, 2, PALETTE.heroBoots);
      px(ctx, x + 9, y + 14 + oy, 3, 2, PALETTE.heroBoots);
      break;
    }
    case 'child': {
      px(ctx, x + 5, y + 4 + oy, 6, 3, PALETTE.heroSkin);
      px(ctx, x + 4, y + 3 + oy, 8, 2, '#4890e0');
      px(ctx, x + 5, y + 7 + oy, 6, 5, '#48b038');
      px(ctx, x + 6, y + 5 + oy, 1, 1, PALETTE.outline);
      px(ctx, x + 9, y + 5 + oy, 1, 1, PALETTE.outline);
      px(ctx, x + 5, y + 12 + oy, 2, 2, PALETTE.heroBoots);
      px(ctx, x + 9, y + 12 + oy, 2, 2, PALETTE.heroBoots);
      break;
    }
    case 'fisher': {
      px(ctx, x + 4, y + 7 + oy, 8, 7, '#2868a0');
      px(ctx, x + 5, y + 3 + oy, 6, 4, PALETTE.heroSkin);
      px(ctx, x + 4, y + 2 + oy, 8, 2, '#385868');
      px(ctx, x + 12, y + 4 + oy, 3, 1, '#885828');
      px(ctx, x + 14, y + 2 + oy, 1, 5, '#a0a0a0');
      break;
    }
    default:
      px(ctx, x + 4, y + 7, 8, 7, '#8860a0');
      px(ctx, x + 5, y + 3, 6, 4, PALETTE.heroSkin);
  }
}

export function drawItem(ctx, item, frame) {
  const x = item.x * TILE + 4;
  const y = item.y * TILE + 4 + Math.sin(frame * 0.12) * 2;

  if (item.type === 'heart') {
    drawHeartUnit(ctx, x, y, 2);
  } else if (item.type === 'rupee') {
    const c = item.value >= 20 ? PALETTE.rupeeRed : item.value >= 5 ? PALETTE.rupeeBlue : PALETTE.rupee;
    const cl = item.value >= 20 ? '#f88080' : item.value >= 5 ? '#80c0ff' : PALETTE.rupeeLight;
    const cd = item.value >= 20 ? '#a01818' : item.value >= 5 ? '#1860b0' : PALETTE.rupeeDark;
    px(ctx, x + 3, y, 2, 9, cd);
    px(ctx, x + 1, y + 2, 6, 5, c);
    px(ctx, x + 3, y + 2, 2, 5, cl);
  } else if (item.type === 'key' || item.type === 'small_key') {
    px(ctx, x + 2, y + 1, 4, 4, PALETTE.gold);
    px(ctx, x + 3, y + 2, 2, 2, PALETTE.goldLight);
    px(ctx, x + 5, y + 3, 5, 2, PALETTE.goldDark);
    px(ctx, x + 8, y + 2, 2, 4, PALETTE.gold);
    px(ctx, x + 8, y + 5, 2, 1, PALETTE.goldDark);
  } else if (item.type === 'bomb' || item.type === 'bombs') {
    px(ctx, x + 2, y + 3, 6, 6, '#383838');
    px(ctx, x + 3, y + 2, 4, 2, '#f87030');
    px(ctx, x + 4, y + 1, 2, 2, '#f8d030');
  }
}

export function drawBossProjectile(ctx, p) {
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  px(ctx, x, y, p.size, p.size, '#ff4068');
  px(ctx, x + 1, y + 1, Math.max(1, p.size - 2), Math.max(1, p.size - 2), '#ff8898');
}

export function drawDungeonMap(ctx, dungeonId, prog, roomX, roomY) {
  const meta = { schattenkrypta: [3, 3], nebelkathedrale: [3, 2], eisengrube: [3, 2] }[dungeonId] || [3, 3];
  const [cols, rows] = meta;
  const ox = 198;
  const oy = 18;
  const cell = 5;
  px(ctx, ox - 3, oy - 3, cols * cell + 6, rows * cell + 6, 'rgba(0,0,0,0.7)');
  px(ctx, ox - 2, oy - 2, cols * cell + 4, rows * cell + 4, PALETTE.uiGreenLight);
  for (let ry = 0; ry < rows; ry++) {
    for (let rx = 0; rx < cols; rx++) {
      const key = `${rx},${ry}`;
      const explored = prog.explored.has(key);
      const here = rx === roomX && ry === roomY;
      const color = here ? PALETTE.uiTextGold : explored ? '#48a020' : '#182010';
      px(ctx, ox + rx * cell, oy + ry * cell, cell - 1, cell - 1, color);
      if (prog.compass && ry === rows - 1 && rx === cols - 1) {
        px(ctx, ox + rx * cell + 1, oy + ry * cell + 1, 2, 2, '#ff4068');
      }
    }
  }
}

function drawRupeeIcon(ctx, x, y) {
  px(ctx, x + 2, y, 2, 8, PALETTE.rupeeDark);
  px(ctx, x, y + 2, 6, 4, PALETTE.rupee);
  px(ctx, x + 2, y + 2, 2, 4, PALETTE.rupeeLight);
}

function drawItemBox(ctx, x, y) {
  px(ctx, x, y, 20, 14, PALETTE.uiBorder);
  px(ctx, x + 1, y + 1, 18, 12, '#040c08');
  px(ctx, x + 2, y + 2, 16, 10, PALETTE.uiBoxInner);
  px(ctx, x + 2, y + 2, 16, 1, 'rgba(255,255,255,0.15)');
}

/** Crisp 5×7 letter baked as pixels (no tiny overlapping glyphs) */
function drawHudLetter(ctx, ch, x, y, color) {
  drawText(ctx, ch, x, y, { color, scale: 1, shadow: null });
}

export function drawHUD(ctx, player, roomName, rupees, extras = {}) {
  const { smallKeys = 0, bombs = 0, bigKey = false, lowHp = false, frame = 0 } = extras;

  px(ctx, 0, 0, 256, 16, PALETTE.uiGreen);
  px(ctx, 0, 0, 256, 1, PALETTE.uiGreenLight);
  px(ctx, 0, 15, 256, 1, PALETTE.uiGreenDark);
  px(ctx, 0, 1, 256, 1, 'rgba(255,255,255,0.06)');

  // B slot — bomb
  drawItemBox(ctx, 2, 1);
  drawHudLetter(ctx, 'B', 4, 4, PALETTE.uiTextGold);
  if (bombs > 0) {
    px(ctx, 12, 4, 7, 7, '#1a1a1a');
    px(ctx, 13, 5, 5, 5, '#303030');
    px(ctx, 14, 3, 3, 2, '#f87030');
    px(ctx, 15, 2, 2, 2, '#f8d030');
  }

  // A slot — sword
  drawItemBox(ctx, 24, 1);
  drawHudLetter(ctx, 'A', 26, 4, PALETTE.uiTextGold);
  if (player.swordPower > 1) {
    px(ctx, 34, 3, 2, 9, PALETTE.swordGlow);
    px(ctx, 36, 2, 2, 11, PALETTE.crystal);
    px(ctx, 35, 4, 3, 2, PALETTE.swordGuard);
  } else {
    px(ctx, 34, 4, 2, 8, PALETTE.swordBlade);
    px(ctx, 36, 3, 2, 9, PALETTE.swordEdge);
    px(ctx, 35, 5, 3, 2, PALETTE.swordGuard);
    px(ctx, 37, 2, 2, 2, PALETTE.swordBlade);
  }

  // Rupees
  drawRupeeIcon(ctx, 48, 4);
  drawText(ctx, String(Math.min(999, rupees)).padStart(3, '0'), 58, 4, {
    color: PALETTE.uiText,
    scale: 1,
    shadow: null,
  });

  // Keys
  px(ctx, 86, 4, 5, 5, PALETTE.gold);
  px(ctx, 87, 5, 3, 3, PALETTE.goldLight);
  px(ctx, 91, 6, 4, 2, PALETTE.goldDark);
  px(ctx, 91, 8, 1, 2, PALETTE.goldDark);
  drawText(ctx, String(smallKeys), 98, 4, { color: PALETTE.uiText, scale: 1, shadow: null });

  if (bigKey) {
    px(ctx, 108, 3, 6, 7, PALETTE.gold);
    px(ctx, 109, 4, 4, 5, PALETTE.goldLight);
    px(ctx, 110, 5, 2, 2, '#fff8c0');
  }

  // Bombs count
  px(ctx, 122, 4, 6, 6, '#1a1a1a');
  px(ctx, 123, 3, 4, 2, '#f87030');
  drawText(ctx, String(bombs).padStart(2, '0'), 132, 4, { color: PALETTE.uiText, scale: 1, shadow: null });

  drawText(ctx, '-LIFE-', 210, 2, {
    color: lowHp && frame % 20 < 10 ? '#f84858' : PALETTE.uiText,
    scale: 1,
    align: 'center',
    shadow: null,
  });

  const containers = Math.ceil(player.maxHp / 2);
  const hx = 256 - 6 - containers * 9;
  for (let i = 0; i < containers; i++) {
    const filled = Math.min(2, Math.max(0, player.hp - i * 2));
    drawHeartUnit(ctx, hx + i * 9, 6, filled);
  }
}

/** ALttP-style dialog — parchment at bottom; multi-page with ▼ */
export function drawMessage(ctx, text, alpha) {
  const lines = Array.isArray(text) ? text : [text];
  drawDialogBox(ctx, lines, alpha, false);
}

export function drawDialogBox(ctx, lines, alpha = 1, showAdvance = true) {
  const boxY = 156;
  const boxH = 58;
  // Soft shadow
  px(ctx, 10, boxY + 2, 240, boxH, `rgba(0,0,0,${0.35 * alpha})`);
  px(ctx, 8, boxY, 240, boxH, `rgba(248,236,208,${0.98 * alpha})`);
  ctx.strokeStyle = `rgba(136,104,56,${alpha})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(8.5, boxY + 0.5, 239, boxH - 1);
  ctx.strokeStyle = `rgba(255,248,232,${alpha})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(11.5, boxY + 3.5, 233, boxH - 7);
  ctx.strokeStyle = `rgba(88,64,32,${0.35 * alpha})`;
  ctx.strokeRect(13.5, boxY + 5.5, 229, boxH - 11);

  (lines || []).slice(0, 3).forEach((line, i) => {
    drawText(ctx, line, 18, boxY + 14 + i * 12, {
      color: `rgba(32,24,16,${alpha})`,
      scale: 1,
      shadow: null,
    });
  });

  if (showAdvance && alpha > 0.8) {
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      drawText(ctx, '▼', 228, boxY + 44, { color: `rgba(136,96,40,${alpha})`, scale: 1, shadow: null });
    }
  }
}

/** Soft dusk color-grade for overworld atmosphere */
export function drawAmbientWash(ctx, indoor = false) {
  if (indoor) {
    px(ctx, 0, 16, 256, 208, 'rgba(40,24,8,0.06)');
    return;
  }
  px(ctx, 0, 16, 256, 208, PALETTE.duskWash);
  px(ctx, 0, 180, 256, 44, PALETTE.duskHorizon);
  // Vignette corners
  px(ctx, 0, 16, 256, 8, 'rgba(0,0,0,0.12)');
  px(ctx, 0, 216, 256, 8, 'rgba(0,0,0,0.18)');
}

export function drawTransition(ctx, progress, direction) {
  // Soft vignette during fade (stairs); scroll transitions draw themselves
  if (direction === 'fade' || !direction) {
    const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, 256, 224);
    return;
  }
  // Legacy wipe fallback
  const alpha = 0.15;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, 256, 224);
}
