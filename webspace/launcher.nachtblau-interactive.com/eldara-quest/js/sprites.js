import { TILE, TILES, PALETTE, DIR } from './constants.js';

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function grassGround(ctx, px0, py0, tx, ty) {
  px(ctx, px0, py0, TILE, TILE, PALETTE.grass1);
  const seed = tx * 17 + ty * 31;
  if (seed % 3 !== 0) px(ctx, px0 + 2, py0 + 3, 6, 5, PALETTE.grass2);
  if (seed % 4 === 0) px(ctx, px0 + 8, py0 + 1, 5, 4, PALETTE.grass3);
  if (seed % 5 === 1) px(ctx, px0 + 1, py0 + 9, 4, 3, PALETTE.grass4);
  if (seed % 7 === 2) px(ctx, px0 + 10, py0 + 8, 3, 2, PALETTE.grassShadow);
  if (seed % 11 === 0) px(ctx, px0 + 5, py0 + 5, 1, 1, PALETTE.flower1);
  if (seed % 13 === 0) px(ctx, px0 + 11, py0 + 3, 1, 1, PALETTE.flower2);
}

function drawHedge(ctx, px0, py0, tx, ty) {
  px(ctx, px0, py0 + 10, TILE, 6, PALETTE.grass1);
  px(ctx, px0 + 1, py0 + 7, TILE - 2, 9, PALETTE.hedgeFront);
  px(ctx, px0 + 2, py0 + 8, TILE - 4, 6, PALETTE.hedgeDark);
  px(ctx, px0 + 1, py0 + 1, TILE - 2, 7, PALETTE.hedgeMid);
  px(ctx, px0 + 2, py0, 5, 3, PALETTE.hedgeTop);
  px(ctx, px0 + 7, py0, 6, 3, PALETTE.hedgeTop);
  px(ctx, px0 + 3, py0 + 1, 3, 2, PALETTE.hedgeHighlight);
  px(ctx, px0 + 9, py0 + 2, 4, 2, PALETTE.hedgeHighlight);
  px(ctx, px0, py0 + 1, 1, TILE - 2, PALETTE.outline);
  px(ctx, px0 + TILE - 1, py0 + 1, 1, TILE - 2, PALETTE.outline);
  px(ctx, px0 + 1, py0 + TILE - 1, TILE - 2, 1, PALETTE.outline);
}

function drawBuildingRoof(ctx, px0, py0, tx) {
  px(ctx, px0, py0, TILE, 6, PALETTE.roofDark);
  px(ctx, px0 + 1, py0 + 1, TILE - 2, 4, PALETTE.roof);
  px(ctx, px0 + 2 + (tx % 2), py0 + 2, TILE - 4, 1, PALETTE.roofLight);
  px(ctx, px0 + 1, py0 + 4, TILE - 2, 1, PALETTE.roofDark);
  px(ctx, px0, py0, TILE, 1, PALETTE.outline);
  px(ctx, px0, py0 + 5, TILE, 1, PALETTE.outline);
}

function drawBuildingWall(ctx, px0, py0, tx, ty) {
  grassGround(ctx, px0, py0, tx, ty);
  px(ctx, px0, py0 + 6, TILE, 10, PALETTE.building);
  px(ctx, px0 + 1, py0 + 7, 3, 8, PALETTE.buildingDark);
  px(ctx, px0 + 12, py0 + 7, 3, 8, PALETTE.buildingDark);
  px(ctx, px0 + 5, py0 + 8, 6, 4, PALETTE.buildingWindow);
  px(ctx, px0 + 6, py0 + 9, 4, 2, PALETTE.buildingLine);
  px(ctx, px0, py0 + 14, TILE, 2, PALETTE.wallDark);
  px(ctx, px0, py0 + 6, 1, 10, PALETTE.outline);
  px(ctx, px0 + TILE - 1, py0 + 6, 1, 10, PALETTE.outline);
  px(ctx, px0 + 1, py0 + 15, TILE - 2, 1, PALETTE.outline);
}

function drawCobblestone(ctx, px0, py0, tx, ty) {
  const base = (tx + ty) % 2 === 0 ? PALETTE.path : PALETTE.pathDark;
  px(ctx, px0, py0, TILE, TILE, base);
  px(ctx, px0 + 2, py0 + 2, 5, 5, (tx + ty) % 2 === 0 ? PALETTE.pathDark : PALETTE.path);
  px(ctx, px0 + 9, py0 + 2, 5, 5, (tx + ty) % 2 === 0 ? PALETTE.path : PALETTE.pathDark);
  px(ctx, px0 + 2, py0 + 9, 5, 5, (tx + ty) % 2 === 0 ? PALETTE.path : PALETTE.pathDark);
  px(ctx, px0 + 9, py0 + 9, 5, 5, (tx + ty) % 2 === 0 ? PALETTE.pathDark : PALETTE.path);
  px(ctx, px0 + 7, py0, 2, TILE, PALETTE.pathLine);
  px(ctx, px0, py0 + 7, TILE, 2, PALETTE.pathLine);
  const seed = tx * 13 + ty * 7;
  if (seed % 5 === 0) px(ctx, px0 + 4, py0 + 4, 2, 2, PALETTE.pathDark);
  if (seed % 8 === 0) px(ctx, px0 + 10, py0 + 10, 2, 2, PALETTE.pathLine);
}

function drawStoneFloor(ctx, px0, py0, tx, ty) {
  const light = (tx + ty) % 2 === 0;
  px(ctx, px0, py0, TILE, TILE, light ? PALETTE.floorLight : PALETTE.floor);
  px(ctx, px0 + 1, py0 + 1, 6, 6, light ? PALETTE.floor : PALETTE.floorDark);
  px(ctx, px0 + 9, py0 + 1, 6, 6, light ? PALETTE.floorDark : PALETTE.floorLight);
  px(ctx, px0 + 1, py0 + 9, 6, 6, light ? PALETTE.floorDark : PALETTE.floorLight);
  px(ctx, px0 + 9, py0 + 9, 6, 6, light ? PALETTE.floor : PALETTE.floorDark);
  px(ctx, px0 + 7, py0, 2, TILE, PALETTE.floorGrout);
  px(ctx, px0, py0 + 7, TILE, 2, PALETTE.floorGrout);
}

function drawHeartUnit(ctx, x, y, fill) {
  if (fill === 0) {
    px(ctx, x + 1, y + 1, 4, 4, PALETTE.uiBlack);
    px(ctx, x, y + 3, 8, 4, PALETTE.uiBlack);
    px(ctx, x + 1, y + 5, 6, 2, PALETTE.uiBlack);
    px(ctx, x + 2, y + 2, 2, 2, PALETTE.heartEmpty);
    px(ctx, x + 1, y + 4, 6, 2, PALETTE.heartEmpty);
    return;
  }
  const c = fill === 2 ? PALETTE.heart : PALETTE.heartDark;
  if (fill === 1) {
    px(ctx, x + 4, y + 1, 4, 6, c);
    px(ctx, x + 4, y + 3, 8, 4, c);
    px(ctx, x + 5, y + 5, 6, 2, c);
  } else {
    px(ctx, x + 1, y + 1, 4, 4, c);
    px(ctx, x, y + 3, 8, 4, c);
    px(ctx, x + 1, y + 5, 6, 2, c);
  }
  px(ctx, x + 1, y, 2, 1, PALETTE.outline);
  px(ctx, x + 5, y, 2, 1, PALETTE.outline);
}

export function drawTile(ctx, tile, x, y, frame = 0, layer = 'full') {
  if (layer === 'overhead') {
    drawTileOverhead(ctx, tile, x, y);
    return;
  }
  drawTileBase(ctx, tile, x, y, frame);
  if (layer === 'full') drawTileOverhead(ctx, tile, x, y);
}

function drawTileOverhead(ctx, tile, x, y) {
  const px0 = x * TILE;
  const py0 = y * TILE;

  if (tile === TILES.TREE) {
    px(ctx, px0 + 1, py0 + 1, TILE - 2, 10, PALETTE.treeCanopy);
    px(ctx, px0 + 3, py0 + 2, TILE - 6, 8, PALETTE.treeLight);
    px(ctx, px0 + 4, py0 + 3, 4, 4, PALETTE.treeDark);
    px(ctx, px0 + 9, py0 + 4, 3, 3, PALETTE.treeLight);
    px(ctx, px0 + 5, py0 + 5, 2, 2, PALETTE.treeDark);
    px(ctx, px0 + 1, py0 + 1, TILE - 2, 1, PALETTE.outline);
    px(ctx, px0 + 1, py0 + 1, 1, 9, PALETTE.outline);
    px(ctx, px0 + TILE - 2, py0 + 1, 1, 9, PALETTE.outline);
  } else if (tile === TILES.FENCE) {
    drawBuildingRoof(ctx, px0, py0, x);
  }
}

function drawTileBase(ctx, tile, x, y, frame = 0) {
  const px0 = x * TILE;
  const py0 = y * TILE;

  switch (tile) {
    case TILES.GRASS:
      grassGround(ctx, px0, py0, x, y);
      break;

    case TILES.WALL: {
      px(ctx, px0, py0, TILE, TILE, PALETTE.wallDark);
      px(ctx, px0 + 1, py0 + 1, TILE - 2, 3, PALETTE.wallTop);
      px(ctx, px0 + 1, py0 + 4, TILE - 2, TILE - 5, PALETTE.wallFace);
      px(ctx, px0 + 2, py0 + 5, 5, 4, PALETTE.wallLine);
      px(ctx, px0 + 9, py0 + 5, 5, 4, PALETTE.wallLine);
      px(ctx, px0 + 2, py0 + 10, 5, 3, PALETTE.wallLine);
      px(ctx, px0 + 9, py0 + 10, 5, 3, PALETTE.wallLine);
      if ((x + y) % 3 === 0) px(ctx, px0 + 4, py0 + 7, 2, 2, PALETTE.wallMoss);
      px(ctx, px0, py0, TILE, 1, PALETTE.outline);
      px(ctx, px0, py0 + TILE - 1, TILE, 1, PALETTE.outline);
      px(ctx, px0, py0, 1, TILE, PALETTE.outline);
      px(ctx, px0 + TILE - 1, py0, 1, TILE, PALETTE.outline);
      break;
    }

    case TILES.WATER: {
      const wave = frame % 32 < 16;
      px(ctx, px0, py0, TILE, TILE, wave ? PALETTE.water1 : PALETTE.water2);
      px(ctx, px0 + 1, py0 + 1, TILE - 2, TILE - 2, PALETTE.waterDeep);
      px(ctx, px0 + 2 + (frame % 10), py0 + 4 + (frame % 5), 3, 1, PALETTE.waterSpark);
      px(ctx, px0 + 8, py0 + 9 + (frame % 7), 4, 1, 'rgba(255,255,255,0.35)');
      break;
    }

    case TILES.BUSH:
      drawHedge(ctx, px0, py0, x, y);
      break;

    case TILES.ROCK: {
      grassGround(ctx, px0, py0, x, y);
      px(ctx, px0 + 2, py0 + 5, TILE - 4, TILE - 7, PALETTE.rock);
      px(ctx, px0 + 4, py0 + 6, TILE - 8, TILE - 9, PALETTE.rockLight);
      px(ctx, px0 + 3, py0 + 8, 3, 2, PALETTE.rockDark);
      px(ctx, px0 + 2, py0 + 5, TILE - 4, 1, PALETTE.outline);
      break;
    }

    case TILES.TREE: {
      grassGround(ctx, px0, py0, x, y);
      px(ctx, px0 + 6, py0 + 9, 4, 7, PALETTE.treeTrunk);
      px(ctx, px0 + 7, py0 + 10, 2, 5, PALETTE.treeTrunkDark);
      px(ctx, px0 + 5, py0 + 14, 6, 2, PALETTE.shadow);
      break;
    }

    case TILES.FLOOR:
      drawStoneFloor(ctx, px0, py0, x, y);
      break;

    case TILES.DOOR_LOCKED: {
      drawStoneFloor(ctx, px0, py0, x, y);
      px(ctx, px0 + 3, py0 + 1, TILE - 6, TILE - 2, PALETTE.roofDark);
      px(ctx, px0 + 4, py0 + 2, TILE - 8, TILE - 4, PALETTE.buildingDark);
      px(ctx, px0 + 7, py0 + 7, 2, 2, PALETTE.gold);
      px(ctx, px0 + 3, py0 + 1, TILE - 6, TILE - 2, PALETTE.outline);
      break;
    }

    case TILES.DOOR_OPEN:
      drawStoneFloor(ctx, px0, py0, x, y);
      px(ctx, px0 + 3, py0 + 1, TILE - 6, TILE - 2, PALETTE.waterDeep);
      break;

    case TILES.STAIRS: {
      drawStoneFloor(ctx, px0, py0, x, y);
      for (let i = 0; i < 4; i++) {
        px(ctx, px0 + 2, py0 + 2 + i * 3, TILE - 4, 3, i % 2 === 0 ? PALETTE.floorDark : PALETTE.floorGrout);
      }
      break;
    }

    case TILES.CHEST: {
      grassGround(ctx, px0, py0, x, y);
      px(ctx, px0 + 2, py0 + 7, TILE - 4, 7, PALETTE.roofDark);
      px(ctx, px0 + 3, py0 + 5, TILE - 6, 4, PALETTE.roof);
      px(ctx, px0 + 4, py0 + 6, TILE - 8, 2, PALETTE.gold);
      px(ctx, px0 + 2, py0 + 5, TILE - 4, 9, PALETTE.outline);
      break;
    }

    case TILES.POT: {
      grassGround(ctx, px0, py0, x, y);
      px(ctx, px0 + 4, py0 + 5, 8, 9, '#3868c8');
      px(ctx, px0 + 5, py0 + 6, 6, 6, '#5088e8');
      px(ctx, px0 + 5, py0 + 4, 6, 2, '#2858a0');
      px(ctx, px0 + 6, py0 + 7, 4, 2, '#78a8f0');
      px(ctx, px0 + 4, py0 + 5, 8, 9, PALETTE.outline);
      break;
    }

    case TILES.BRIDGE: {
      px(ctx, px0, py0, TILE, TILE, PALETTE.water1);
      px(ctx, px0, py0 + 4, TILE, 8, PALETTE.fenceWood);
      for (let i = 0; i < 4; i++) {
        px(ctx, px0 + i * 4, py0 + 4, 2, 8, PALETTE.fenceDark);
      }
      px(ctx, px0, py0 + 4, TILE, 1, PALETTE.outline);
      px(ctx, px0, py0 + 11, TILE, 1, PALETTE.outline);
      break;
    }

    case TILES.SAND: {
      px(ctx, px0, py0, TILE, TILE, (x + y) % 2 === 0 ? PALETTE.sand : PALETTE.sandDark);
      if ((x * 3 + y) % 4 === 0) px(ctx, px0 + 5, py0 + 6, 2, 1, PALETTE.sandGrain);
      if ((x * 5 + y) % 6 === 0) px(ctx, px0 + 10, py0 + 3, 2, 1, PALETTE.sandGrain);
      break;
    }

    case TILES.COBBLESTONE:
      drawCobblestone(ctx, px0, py0, x, y);
      break;

    case TILES.CRACKED: {
      drawStoneFloor(ctx, px0, py0, x, y);
      px(ctx, px0 + 2, py0 + 2, TILE - 4, TILE - 4, '#484848');
      px(ctx, px0 + 4, py0 + 5, 3, 5, '#282828');
      px(ctx, px0 + 9, py0 + 3, 4, 4, '#282828');
      px(ctx, px0 + 6, py0 + 9, 5, 3, '#282828');
      px(ctx, px0 + 2, py0 + 2, TILE - 4, TILE - 4, PALETTE.outline);
      break;
    }

    case TILES.FENCE:
      drawBuildingWall(ctx, px0, py0, x, y);
      break;

    case TILES.SIGN: {
      grassGround(ctx, px0, py0, x, y);
      px(ctx, px0 + 7, py0 + 8, 2, 7, PALETTE.fenceDark);
      px(ctx, px0 + 3, py0 + 3, TILE - 6, 6, PALETTE.building);
      px(ctx, px0 + 4, py0 + 4, TILE - 8, 4, PALETTE.path);
      px(ctx, px0 + 3, py0 + 3, TILE - 6, 6, PALETTE.outline);
      break;
    }

    default:
      px(ctx, px0, py0, TILE, TILE, '#ff00ff');
  }
}

export function drawPlayer(ctx, px0, py0, dir, frame, state, invincible = 0) {
  if (invincible > 0 && frame % 8 < 4) return;

  const x = Math.floor(px0);
  const y = Math.floor(py0);
  const walk = state === 'walk' || state === 'carry' ? (Math.floor(frame / 8) % 2) : 0;
  const hurt = state === 'hurt' && frame % 4 < 2;
  const attack = state === 'attack';

  px(ctx, x + 2, y + 15, 12, 2, PALETTE.shadow);

  if (dir === DIR.RIGHT) {
    px(ctx, x, y + 5, 4, 8, PALETTE.heroShieldRim);
    px(ctx, x + 1, y + 6, 3, 6, PALETTE.heroShield);
    px(ctx, x + 2, y + 7, 2, 4, '#c8d0e0');
  } else if (dir === DIR.LEFT) {
    px(ctx, x + 12, y + 5, 4, 8, PALETTE.heroShieldRim);
    px(ctx, x + 12, y + 6, 3, 6, PALETTE.heroShield);
    px(ctx, x + 12, y + 7, 2, 4, '#c8d0e0');
  }

  if (walk) {
    px(ctx, x + 3, y + 12, 4, 4, PALETTE.heroBoots);
    px(ctx, x + 9, y + 11, 4, 5, PALETTE.heroBoots);
  } else {
    px(ctx, x + 4, y + 12, 3, 4, PALETTE.heroBoots);
    px(ctx, x + 9, y + 12, 3, 4, PALETTE.heroBoots);
  }

  px(ctx, x + 3, y + 7, 10, 6, PALETTE.heroTunic);
  px(ctx, x + 4, y + 8, 8, 4, PALETTE.heroTunicDark);
  px(ctx, x + 5, y + 7, 6, 2, PALETTE.heroTunicLight);
  px(ctx, x + 5, y + 11, 6, 1, PALETTE.heroBelt);

  if (dir === DIR.DOWN) {
    px(ctx, x + 4, y + 1, 8, 4, PALETTE.heroHat);
    px(ctx, x + 5, y + 5, 6, 4, PALETTE.heroSkin);
    px(ctx, x + 4, y + 2, 2, 3, PALETTE.heroHair);
    px(ctx, x + 10, y + 2, 2, 3, PALETTE.heroHair);
    px(ctx, x + 6, y + 6, 1, 2, PALETTE.outline);
    px(ctx, x + 9, y + 6, 1, 2, PALETTE.outline);
    px(ctx, x + 7, y + 7, 2, 1, '#f8a8a8');
  } else if (dir === DIR.UP) {
    px(ctx, x + 4, y + 1, 8, 5, PALETTE.heroHat);
    px(ctx, x + 5, y + 2, 6, 3, PALETTE.heroTunicLight);
    px(ctx, x + 4, y + 1, 8, 5, PALETTE.outline);
  } else if (dir === DIR.LEFT) {
    px(ctx, x + 3, y + 1, 7, 4, PALETTE.heroHat);
    px(ctx, x + 3, y + 3, 4, 3, PALETTE.heroHair);
    px(ctx, x + 5, y + 5, 5, 4, PALETTE.heroSkin);
    px(ctx, x + 3, y + 6, 1, 2, PALETTE.outline);
  } else {
    px(ctx, x + 6, y + 1, 7, 4, PALETTE.heroHat);
    px(ctx, x + 9, y + 3, 4, 3, PALETTE.heroHair);
    px(ctx, x + 6, y + 5, 5, 4, PALETTE.heroSkin);
    px(ctx, x + 12, y + 6, 1, 2, PALETTE.outline);
  }

  if (!attack && dir !== DIR.UP) {
    px(ctx, x + 4, y + 1, 1, 12, PALETTE.outline);
    px(ctx, x + 11, y + 1, 1, 12, PALETTE.outline);
  }
  px(ctx, x + 3, y + 13, 10, 1, PALETTE.outline);

  if (hurt) {
    px(ctx, x + 2, y, 12, 15, 'rgba(255,255,255,0.6)');
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
  px(ctx, x + o.x, y + o.y, 8, 9, '#3868c8');
  px(ctx, x + o.x + 1, y + o.y + 1, 6, 6, '#5088e8');
  px(ctx, x + o.x + 1, y + o.y, 6, 2, '#2858a0');
  px(ctx, x + o.x, y + o.y, 8, 9, PALETTE.outline);
}

export function drawThrownPot(ctx, pot) {
  const x = Math.floor(pot.x);
  const y = Math.floor(pot.y);
  const spin = pot.frame % 4;
  px(ctx, x, y, 10, 10, '#3868c8');
  px(ctx, x + 1 + (spin > 1 ? 1 : 0), y + 2, 6, 6, '#5088e8');
  px(ctx, x, y, 10, 10, PALETTE.outline);
}

export function drawSwordBeam(ctx, beam) {
  const x = Math.floor(beam.x);
  const y = Math.floor(beam.y);
  const pulse = beam.frame % 6 < 3;
  const core = beam.power > 1 ? PALETTE.crystal : '#f8f8ff';
  const glow = beam.power > 1 ? 'rgba(136,232,255,0.45)' : 'rgba(255,255,255,0.35)';
  px(ctx, x - 1, y - 1, beam.width + 2, beam.height + 2, glow);
  if (beam.dir === DIR.UP || beam.dir === DIR.DOWN) {
    px(ctx, x + 3, y, 4, beam.height, pulse ? core : '#d8e0f0');
    px(ctx, x + 4, y + 1, 2, beam.height - 2, '#ffffff');
  } else {
    px(ctx, x, y + 3, beam.width, 4, pulse ? core : '#d8e0f0');
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

export function drawSword(ctx, px0, py0, dir, frame, power = 1) {
  const x = Math.floor(px0);
  const y = Math.floor(py0);
  const progress = frame / 12;
  const len = power > 1 ? 16 : 12;
  const t = Math.min(progress * 1.5, 1);

  const offsets = {
    [DIR.UP]:    { sx: 7, sy: -len, ex: 9, ey: 0 },
    [DIR.DOWN]:  { sx: 7, sy: 16, ex: 9, ey: 16 + len },
    [DIR.LEFT]:  { sx: -len, sy: 7, ex: 0, ey: 9 },
    [DIR.RIGHT]: { sx: 16, sy: 7, ex: 16 + len, ey: 9 },
  };
  const o = offsets[dir];
  const sx = x + o.sx + (dir === DIR.LEFT ? (1 - t) * 4 : dir === DIR.RIGHT ? -(1 - t) * 4 : 0);
  const sy = y + o.sy + (dir === DIR.UP ? (1 - t) * 4 : dir === DIR.DOWN ? -(1 - t) * 4 : 0);
  const ex = x + o.ex;
  const ey = y + o.ey;

  px(ctx, sx - 2, sy - 2, Math.abs(ex - sx) + 6, Math.abs(ey - sy) + 6, 'rgba(255,255,255,0.25)');
  px(ctx, sx, Math.min(sy, ey), dir === DIR.UP || dir === DIR.DOWN ? 2 : Math.abs(ex - sx), dir === DIR.UP || dir === DIR.DOWN ? Math.abs(ey - sy) : 2, '#d8e0f0');
  px(ctx, ex - 1, ey - 1, 3, 3, '#f8f8ff');
  if (power > 1) {
    px(ctx, ex - 2, ey - 2, 5, 5, 'rgba(136,232,255,0.5)');
  }
}

export function drawEnemy(ctx, enemy, frame) {
  const x = Math.floor(enemy.x);
  const y = Math.floor(enemy.y);
  const hurt = enemy.hurtTimer > 0 && frame % 4 < 2;

  px(ctx, x + 2, y + 13, 12, 2, PALETTE.shadow);

  switch (enemy.type) {
    case 'slime': {
      const bounce = Math.sin(frame * 0.15) * 2;
      px(ctx, x + 2, y + 4 + bounce, 12, 10, hurt ? '#fff' : '#48a848');
      px(ctx, x + 4, y + 6 + bounce, 8, 6, hurt ? '#fff' : '#288028');
      px(ctx, x + 5, y + 7 + bounce, 2, 2, PALETTE.outline);
      px(ctx, x + 9, y + 7 + bounce, 2, 2, PALETTE.outline);
      px(ctx, x + 2, y + 4 + bounce, 12, 10, PALETTE.outline);
      break;
    }
    case 'bat': {
      const wing = Math.sin(frame * 0.3) > 0;
      px(ctx, x + 5, y + 6, 6, 6, hurt ? '#fff' : '#584898');
      if (wing) {
        px(ctx, x + 1, y + 4, 4, 6, hurt ? '#fff' : '#7868b8');
        px(ctx, x + 11, y + 4, 4, 6, hurt ? '#fff' : '#7868b8');
      } else {
        px(ctx, x + 2, y + 8, 3, 3, hurt ? '#fff' : '#7868b8');
        px(ctx, x + 11, y + 8, 3, 3, hurt ? '#fff' : '#7868b8');
      }
      px(ctx, x + 6, y + 7, 1, 2, PALETTE.outline);
      break;
    }
    case 'soldier': {
      px(ctx, x + 3, y + 4, 10, 10, hurt ? '#fff' : '#383850');
      px(ctx, x + 5, y + 6, 6, 6, hurt ? '#fff' : '#282838');
      px(ctx, x + 5, y + 2, 6, 4, PALETTE.heroSkin);
      px(ctx, x + 4, y + 1, 8, 12, PALETTE.outline);
      px(ctx, x + 6, y + 3, 1, 2, PALETTE.outline);
      px(ctx, x + 9, y + 3, 1, 2, PALETTE.outline);
      px(ctx, x + 5, y + 5, 2, 3, PALETTE.crystalDark);
      break;
    }
    case 'ghost': {
      const float = Math.sin(frame * 0.12) * 2;
      ctx.globalAlpha = 0.8;
      px(ctx, x + 3, y + 3 + float, 10, 11, hurt ? '#fff' : PALETTE.ghost);
      px(ctx, x + 5, y + 5 + float, 6, 5, hurt ? '#fff' : '#8898d8');
      px(ctx, x + 5, y + 6 + float, 2, 2, PALETTE.outline);
      px(ctx, x + 9, y + 6 + float, 2, 2, PALETTE.outline);
      ctx.globalAlpha = 1;
      break;
    }
    case 'wraith': {
      const drift = Math.sin(frame * 0.1) * 2;
      const flicker = frame % 20 < 2 ? 0.5 : 0.9;
      ctx.globalAlpha = flicker;
      px(ctx, x + 2, y + 2 + drift, 12, 12, hurt ? '#fff' : '#482868');
      px(ctx, x + 4, y + 4 + drift, 8, 8, hurt ? '#fff' : '#683888');
      px(ctx, x + 5, y + 6 + drift, 2, 2, '#ff4868');
      px(ctx, x + 9, y + 6 + drift, 2, 2, '#ff4868');
      ctx.globalAlpha = 1;
      break;
    }
    case 'boss': {
      const pulse = Math.sin(frame * 0.08) * 2;
      px(ctx, x + 1, y + 2 + pulse, 14, 12, hurt ? '#fff' : '#401848');
      px(ctx, x + 3, y + 4 + pulse, 10, 8, hurt ? '#fff' : '#682868');
      px(ctx, x + 5, y + 1 + pulse, 6, 3, PALETTE.crystal);
      px(ctx, x + 4, y + 6 + pulse, 3, 3, '#ff4868');
      px(ctx, x + 9, y + 6 + pulse, 3, 3, '#ff4868');
      px(ctx, x + 1, y + 2 + pulse, 14, 12, PALETTE.outline);
      const hpPct = enemy.hp / enemy.maxHp;
      px(ctx, x, y - 4, 16, 3, '#200818');
      px(ctx, x, y - 4, 16 * hpPct, 3, '#c848c8');
      break;
    }
    case 'mist_boss': {
      const drift = Math.sin(frame * 0.15) * 3;
      ctx.globalAlpha = 0.75 + Math.sin(frame * 0.2) * 0.15;
      px(ctx, x + 2, y + 2 + drift, 12, 12, hurt ? '#fff' : '#4868a8');
      px(ctx, x + 4, y + 4 + drift, 8, 8, hurt ? '#fff' : '#88b8f8');
      px(ctx, x + 5, y + 6 + drift, 2, 2, '#f8f8ff');
      px(ctx, x + 9, y + 6 + drift, 2, 2, '#f8f8ff');
      ctx.globalAlpha = 1;
      const hpPct = enemy.hp / enemy.maxHp;
      px(ctx, x, y - 4, 16, 3, '#102040');
      px(ctx, x, y - 4, 16 * hpPct, 3, '#68a8f8');
      break;
    }
    case 'iron_boss': {
      const pulse = Math.sin(frame * 0.06) * 1;
      px(ctx, x, y + 1 + pulse, 16, 13, hurt ? '#fff' : '#585860');
      px(ctx, x + 2, y + 3 + pulse, 12, 9, hurt ? '#fff' : '#787880');
      px(ctx, x + 4, y + 5 + pulse, 8, 5, hurt ? '#fff' : '#9898a0');
      px(ctx, x + 3, y + 2 + pulse, 4, 3, '#ff6838');
      px(ctx, x + 9, y + 2 + pulse, 4, 3, '#ff6838');
      px(ctx, x, y + 1 + pulse, 16, 13, PALETTE.outline);
      const hpPct = enemy.hp / enemy.maxHp;
      px(ctx, x, y - 4, 16, 3, '#282018');
      px(ctx, x, y - 4, 16 * hpPct, 3, '#f87838');
      break;
    }
  }
}

export function drawNpc(ctx, npc) {
  const x = Math.floor(npc.x);
  const y = Math.floor(npc.y);
  const dir = npc.dir ?? DIR.DOWN;
  const small = npc.type === 'child';
  const oy = small ? 3 : 0;
  const bodyY = y + 6 + oy;

  px(ctx, x + 3, y + (small ? 12 : 14), 10, 2, PALETTE.shadow);

  switch (npc.type) {
    case 'elder':
      px(ctx, x + 4, bodyY, 8, 6, '#c83848');
      px(ctx, x + 5, bodyY + 1, 6, 4, '#a82838');
      px(ctx, x + 5, y + 2 + oy, 6, 4, PALETTE.heroSkin);
      px(ctx, x + 4, y + 1 + oy, 8, 3, '#d8d8e8');
      if (dir === DIR.DOWN) {
        px(ctx, x + 6, y + 4 + oy, 1, 1, PALETTE.outline);
        px(ctx, x + 9, y + 4 + oy, 1, 1, PALETTE.outline);
      }
      break;
    case 'merchant':
      px(ctx, x + 3, y + 1 + oy, 10, 3, '#785828');
      px(ctx, x + 5, y + 4 + oy, 6, 4, PALETTE.heroSkin);
      px(ctx, x + 4, bodyY, 8, 6, '#c84838');
      px(ctx, x + 5, y + 11 + oy, 2, 3, PALETTE.heroBoots);
      px(ctx, x + 9, y + 11 + oy, 2, 3, PALETTE.heroBoots);
      break;
    case 'child':
      px(ctx, x + 5, y + 5 + oy, 6, 4, PALETTE.heroSkin);
      px(ctx, x + 4, y + 4 + oy, 8, 3, '#4888d8');
      px(ctx, x + 5, y + 8 + oy, 6, 4, '#48a848');
      px(ctx, x + 5, y + 12 + oy, 2, 2, PALETTE.heroBoots);
      px(ctx, x + 9, y + 12 + oy, 2, 2, PALETTE.heroBoots);
      break;
    case 'fisher':
      px(ctx, x + 5, y + 2 + oy, 6, 4, PALETTE.heroSkin);
      px(ctx, x + 4, y + 1 + oy, 8, 3, '#684828');
      px(ctx, x + 4, bodyY, 8, 6, '#3868a8');
      px(ctx, x + 5, y + 11 + oy, 2, 3, PALETTE.heroBoots);
      px(ctx, x + 9, y + 11 + oy, 2, 3, PALETTE.heroBoots);
      break;
    default:
      px(ctx, x + 4, bodyY, 8, 6, '#888888');
  }
}

export function drawItem(ctx, item, frame) {
  const x = item.x * TILE + 4;
  const y = item.y * TILE + 4 + Math.sin(frame * 0.1) * 2;

  if (item.type === 'heart') {
    drawHeartUnit(ctx, x, y, 2);
  } else if (item.type === 'rupee') {
    px(ctx, x + 3, y, 2, 9, PALETTE.rupeeDark);
    px(ctx, x + 1, y + 2, 6, 5, PALETTE.rupee);
    px(ctx, x + 3, y + 2, 2, 5, PALETTE.rupeeLight);
    px(ctx, x + 2, y + 1, 4, 7, PALETTE.outline);
  } else if (item.type === 'key' || item.type === 'small_key') {
    px(ctx, x + 2, y + 2, 4, 4, PALETTE.gold);
    px(ctx, x + 5, y + 4, 5, 2, PALETTE.goldDark);
    px(ctx, x + 8, y + 2, 2, 4, PALETTE.gold);
  }
}

export function drawBossProjectile(ctx, p) {
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  px(ctx, x, y, p.size, p.size, '#ff4868');
  px(ctx, x + 1, y + 1, p.size - 2, p.size - 2, '#ff8898');
}

export function drawDungeonMap(ctx, dungeonId, prog, roomX, roomY) {
  const meta = { schattenkrypta: [3, 3], nebelkathedrale: [3, 2], eisengrube: [3, 2] }[dungeonId] || [3, 3];
  const [cols, rows] = meta;
  const ox = 200;
  const oy = 18;
  const cell = 5;
  px(ctx, ox - 2, oy - 2, cols * cell + 4, rows * cell + 4, 'rgba(0,0,0,0.6)');
  for (let ry = 0; ry < rows; ry++) {
    for (let rx = 0; rx < cols; rx++) {
      const key = `${rx},${ry}`;
      const explored = prog.explored.has(key);
      const here = rx === roomX && ry === roomY;
      const color = here ? '#f8d830' : explored ? '#58a828' : '#283018';
      px(ctx, ox + rx * cell, oy + ry * cell, cell - 1, cell - 1, color);
      if (prog.compass && ry === rows - 1 && rx === cols - 1) {
        px(ctx, ox + rx * cell + 1, oy + ry * cell + 1, 2, 2, '#ff4868');
      }
    }
  }
}

function drawRupeeIcon(ctx, x, y) {
  px(ctx, x + 2, y, 2, 7, PALETTE.rupeeDark);
  px(ctx, x, y + 2, 6, 4, PALETTE.rupee);
  px(ctx, x + 2, y + 2, 2, 4, PALETTE.rupeeLight);
}

export function drawHUD(ctx, player, roomName, rupees, extras = {}) {
  const { smallKeys = 0, bombs = 0, bigKey = false } = extras;
  px(ctx, 0, 0, 256, 16, PALETTE.uiGreen);
  px(ctx, 0, 15, 256, 1, PALETTE.hedgeDark);

  px(ctx, 4, 2, 12, 12, PALETTE.uiBlack);
  px(ctx, 3, 1, 14, 14, PALETTE.uiBorder);
  px(ctx, 4, 2, 12, 12, '#103010');
  if (player.swordPower > 1) {
    px(ctx, 6, 4, 2, 8, '#e8f0ff');
    px(ctx, 8, 3, 2, 10, '#88e8ff');
    px(ctx, 9, 5, 2, 6, '#c8f8ff');
  } else {
    px(ctx, 6, 5, 2, 6, '#d8e0f0');
    px(ctx, 8, 4, 2, 8, '#a8b0c0');
  }

  drawRupeeIcon(ctx, 22, 4);
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = '8px monospace';
  ctx.fillText(String(rupees).padStart(3, '0'), 32, 11);

  if (smallKeys > 0) {
    px(ctx, 54, 4, 4, 4, PALETTE.gold);
    px(ctx, 58, 6, 3, 2, PALETTE.goldDark);
    ctx.fillText(String(smallKeys), 64, 11);
  }
  if (bigKey) {
    px(ctx, 76, 3, 5, 6, PALETTE.gold);
    px(ctx, 77, 4, 3, 4, '#f8f8ff');
  }
  if (bombs > 0) {
    px(ctx, 90, 5, 6, 6, '#484848');
    px(ctx, 91, 4, 4, 2, '#f87838');
    ctx.fillText(String(bombs), 98, 11);
  }

  ctx.fillStyle = PALETTE.uiText;
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('— LIFE —', 208, 5);
  ctx.textAlign = 'left';

  const containers = Math.ceil(player.maxHp / 2);
  let hx = 256 - 8 - containers * 9;
  for (let i = 0; i < containers; i++) {
    const filled = Math.min(2, Math.max(0, player.hp - i * 2));
    drawHeartUnit(ctx, hx + i * 9, 5, filled);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(roomName, 128, 14);
  ctx.textAlign = 'left';
}

export function drawMessage(ctx, text, alpha) {
  px(ctx, 12, 84, 232, 52, `rgba(248,232,184,${0.95 * alpha})`);
  ctx.strokeStyle = `rgba(136,104,48,${alpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 84, 232, 52);
  ctx.strokeStyle = `rgba(248,248,248,${alpha})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 86, 228, 48);

  ctx.fillStyle = `rgba(24,24,24,${alpha})`;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  const lines = text.length > 34 ? [text.slice(0, 34), text.slice(34, 68), text.slice(68)] : [text];
  lines.filter(Boolean).forEach((line, i) => ctx.fillText(line, 128, 102 + i * 10));
  ctx.textAlign = 'left';
}

export function drawTransition(ctx, progress, direction) {
  const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  if (direction === 'left') {
    ctx.fillRect(0, 0, 256 * (1 - progress), 224);
  } else if (direction === 'right') {
    ctx.fillRect(256 * progress, 0, 256 * (1 - progress), 224);
  } else if (direction === 'up') {
    ctx.fillRect(0, 0, 256, 224 * (1 - progress));
  } else if (direction === 'down') {
    ctx.fillRect(0, 224 * progress, 256, 224 * (1 - progress));
  } else {
    ctx.fillRect(0, 0, 256, 224);
  }
}
