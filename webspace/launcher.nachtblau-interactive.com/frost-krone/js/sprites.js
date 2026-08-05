import { TILE, TILES, PALETTE, DIR } from './constants.js';

export function drawTile(ctx, tile, x, y, frame = 0) {
  const px = x * TILE;
  const py = y * TILE;

  switch (tile) {
    case TILES.GRASS:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.snow1 : PALETTE.snow2;
      ctx.fillRect(px, py, TILE, TILE);
      if ((x * 3 + y) % 5 === 0) {
        ctx.fillStyle = PALETTE.snow3;
        ctx.fillRect(px + 4, py + 6, 2, 2);
      }
      break;

    case TILES.WALL:
      ctx.fillStyle = PALETTE.wallDark;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = PALETTE.wallDark;
      ctx.fillRect(px + 2, py + 2, TILE - 4, 2);
      break;

    case TILES.WATER:
      ctx.fillStyle = frame % 30 < 15 ? PALETTE.ice1 : PALETTE.ice2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(px + 2 + (frame % 8), py + 4, 4, 1);
      ctx.fillStyle = 'rgba(200,240,255,0.2)';
      ctx.fillRect(px + 6, py + 8, 3, 1);
      break;

    case TILES.BUSH:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.snow1 : PALETTE.snow2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PALETTE.bush;
      ctx.fillRect(px + 2, py + 4, TILE - 4, TILE - 6);
      ctx.fillStyle = PALETTE.bushDark;
      ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 10);
      ctx.fillRect(px + 3, py + 3, 3, 3);
      ctx.fillRect(px + 10, py + 3, 3, 3);
      break;

    case TILES.ROCK:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.snow1 : PALETTE.snow2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PALETTE.rock;
      ctx.fillRect(px + 3, py + 5, TILE - 6, TILE - 8);
      ctx.fillStyle = PALETTE.rockDark;
      ctx.fillRect(px + 5, py + 7, TILE - 10, TILE - 12);
      ctx.fillStyle = '#c0e0f8';
      ctx.fillRect(px + 4, py + 5, 3, 2);
      break;

    case TILES.TREE:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.snow1 : PALETTE.snow2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PALETTE.treeDark;
      ctx.fillRect(px + 6, py + 10, 4, 6);
      ctx.fillStyle = PALETTE.tree;
      ctx.fillRect(px + 2, py + 2, TILE - 4, 10);
      ctx.fillStyle = '#a0d8f0';
      ctx.fillRect(px + 4, py + 3, 2, 3);
      ctx.fillRect(px + 10, py + 5, 2, 2);
      break;

    case TILES.FLOOR:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.floor : PALETTE.floorDark;
      ctx.fillRect(px, py, TILE, TILE);
      if ((x + y) % 3 === 0) {
        ctx.fillStyle = 'rgba(160,220,255,0.3)';
        ctx.fillRect(px + 3, py + 5, 2, 2);
      }
      break;

    case TILES.DOOR_LOCKED:
      ctx.fillStyle = PALETTE.floor;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#406888';
      ctx.fillRect(px + 3, py + 2, TILE - 6, TILE - 4);
      ctx.fillStyle = PALETTE.crystal;
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;

    case TILES.DOOR_OPEN:
      ctx.fillStyle = PALETTE.floor;
      ctx.fillRect(px, py, TILE, TILE);
      break;

    case TILES.STAIRS:
      ctx.fillStyle = PALETTE.floorDark;
      ctx.fillRect(px, py, TILE, TILE);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#6888a8' : '#506878';
        ctx.fillRect(px + 2, py + 2 + i * 3, TILE - 4, 3);
      }
      break;

    case TILES.CHEST:
      ctx.fillStyle = PALETTE.floor;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#4060a0';
      ctx.fillRect(px + 2, py + 6, TILE - 4, 8);
      ctx.fillStyle = '#5080c0';
      ctx.fillRect(px + 3, py + 4, TILE - 6, 4);
      ctx.fillStyle = PALETTE.crystal;
      ctx.fillRect(px + 6, py + 8, 4, 3);
      break;

    case TILES.POT:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.snow1 : PALETTE.snow2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#6090c0';
      ctx.fillRect(px + 4, py + 5, 8, 9);
      ctx.fillStyle = '#80b8e8';
      ctx.fillRect(px + 5, py + 6, 6, 3);
      ctx.fillStyle = '#4878b0';
      ctx.fillRect(px + 5, py + 4, 6, 2);
      break;

    case TILES.BRIDGE:
      ctx.fillStyle = PALETTE.ice1;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#7090b0';
      ctx.fillRect(px, py + 4, TILE, 8);
      ctx.fillStyle = '#506880';
      for (let i = 0; i < 4; i++) ctx.fillRect(px + i * 4, py + 4, 2, 8);
      break;

    case TILES.SAND:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.sand : PALETTE.sandDark;
      ctx.fillRect(px, py, TILE, TILE);
      if ((x + y) % 4 === 0) {
        ctx.fillStyle = PALETTE.crystal;
        ctx.fillRect(px + 6, py + 6, 2, 2);
      }
      break;

    case TILES.FENCE:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.snow1 : PALETTE.snow2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PALETTE.fence;
      ctx.fillRect(px + 2, py + 4, TILE - 4, 2);
      ctx.fillRect(px + 6, py + 2, 4, TILE - 4);
      break;

    case TILES.SIGN:
      ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.snow1 : PALETTE.snow2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#406888';
      ctx.fillRect(px + 7, py + 8, 2, 6);
      ctx.fillStyle = '#6098c0';
      ctx.fillRect(px + 3, py + 3, TILE - 6, 6);
      break;

    default:
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(px, py, TILE, TILE);
  }
}

export function drawPlayer(ctx, px, py, dir, frame, state) {
  const x = Math.floor(px);
  const y = Math.floor(py);
  const walk = state === 'walk' ? (Math.floor(frame / 8) % 2) : 0;

  ctx.fillStyle = 'rgba(0,0,40,0.3)';
  ctx.fillRect(x + 3, y + 13, 10, 3);

  ctx.fillStyle = '#304868';
  if (walk) {
    ctx.fillRect(x + 4, y + 11, 3, 4);
    ctx.fillRect(x + 9, y + 10, 3, 5);
  } else {
    ctx.fillRect(x + 5, y + 11, 2, 4);
    ctx.fillRect(x + 9, y + 11, 2, 4);
  }

  ctx.fillStyle = PALETTE.heroBlue;
  ctx.fillRect(x + 4, y + 6, 8, 6);
  ctx.fillStyle = PALETTE.heroBlueDark;
  ctx.fillRect(x + 5, y + 7, 6, 4);
  ctx.fillStyle = '#a0e0ff';
  ctx.fillRect(x + 6, y + 8, 4, 1);

  ctx.fillStyle = PALETTE.heroSkin;
  ctx.fillRect(x + 5, y + 2, 6, 5);

  ctx.fillStyle = PALETTE.heroHair;
  if (dir === DIR.DOWN) {
    ctx.fillRect(x + 4, y + 1, 8, 3);
    ctx.fillRect(x + 4, y + 3, 2, 2);
    ctx.fillRect(x + 10, y + 3, 2, 2);
  } else if (dir === DIR.UP) {
    ctx.fillRect(x + 4, y + 1, 8, 4);
  } else if (dir === DIR.LEFT) {
    ctx.fillRect(x + 4, y + 1, 6, 3);
    ctx.fillRect(x + 4, y + 3, 3, 2);
  } else {
    ctx.fillRect(x + 6, y + 1, 6, 3);
    ctx.fillRect(x + 9, y + 3, 3, 2);
  }

  if (dir === DIR.DOWN) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 6, y + 4, 1, 2);
    ctx.fillRect(x + 9, y + 4, 1, 2);
  }

  if (state === 'hurt' && frame % 4 < 2) {
    ctx.fillStyle = 'rgba(200,240,255,0.6)';
    ctx.fillRect(x + 3, y + 1, 10, 14);
  }
}

export function drawSword(ctx, px, py, dir, frame, power = 1) {
  const x = Math.floor(px);
  const y = Math.floor(py);
  const progress = frame / 12;
  const len = power > 1 ? 14 : 10;

  const offsets = {
    [DIR.UP]:    { sx: 7, sy: -len, ex: 9, ey: 0 },
    [DIR.DOWN]:  { sx: 7, sy: 16, ex: 9, ey: 16 + len },
    [DIR.LEFT]:  { sx: -len, sy: 7, ex: 0, ey: 9 },
    [DIR.RIGHT]: { sx: 16, sy: 7, ex: 16 + len, ey: 9 },
  };
  const o = offsets[dir];
  const t = Math.min(progress * 1.5, 1);
  const sx = x + o.sx + (dir === DIR.LEFT ? (1 - t) * 4 : dir === DIR.RIGHT ? -(1 - t) * 4 : 0);
  const sy = y + o.sy + (dir === DIR.UP ? (1 - t) * 4 : dir === DIR.DOWN ? -(1 - t) * 4 : 0);
  const ex = x + o.ex;
  const ey = y + o.ey;

  ctx.fillStyle = 'rgba(160,240,255,0.7)';
  if (dir === DIR.UP || dir === DIR.DOWN) {
    ctx.fillRect(sx, Math.min(sy, ey), 2, Math.abs(ey - sy));
  } else {
    ctx.fillRect(Math.min(sx, ex), sy, Math.abs(ex - sx), 2);
  }
  ctx.fillStyle = power > 1 ? '#c0f0ff' : '#a0d8f0';
  ctx.fillRect(ex - 1, ey - 1, 3, 3);
}

export function drawEnemy(ctx, enemy, frame) {
  const x = Math.floor(enemy.x);
  const y = Math.floor(enemy.y);
  const hurt = enemy.hurtTimer > 0 && frame % 4 < 2;

  ctx.fillStyle = 'rgba(0,0,40,0.3)';
  ctx.fillRect(x + 2, y + 13, 12, 3);

  switch (enemy.type) {
    case 'frostling': {
      const bounce = Math.sin(frame * 0.15) * 2;
      ctx.fillStyle = hurt ? '#fff' : '#60c0e8';
      ctx.fillRect(x + 2, y + 4 + bounce, 12, 10);
      ctx.fillStyle = hurt ? '#fff' : '#3088c0';
      ctx.fillRect(x + 4, y + 6 + bounce, 8, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 5, y + 7 + bounce, 2, 2);
      ctx.fillRect(x + 9, y + 7 + bounce, 2, 2);
      break;
    }
    case 'snowbat': {
      const wing = Math.sin(frame * 0.3) > 0;
      ctx.fillStyle = hurt ? '#fff' : '#5088c8';
      ctx.fillRect(x + 5, y + 6, 6, 6);
      ctx.fillStyle = hurt ? '#fff' : '#70a8e0';
      if (wing) {
        ctx.fillRect(x + 1, y + 4, 4, 6);
        ctx.fillRect(x + 11, y + 4, 4, 6);
      } else {
        ctx.fillRect(x + 2, y + 8, 3, 3);
        ctx.fillRect(x + 11, y + 8, 3, 3);
      }
      break;
    }
    case 'guard': {
      ctx.fillStyle = hurt ? '#fff' : '#2868a8';
      ctx.fillRect(x + 3, y + 4, 10, 10);
      ctx.fillStyle = hurt ? '#fff' : '#184878';
      ctx.fillRect(x + 5, y + 6, 6, 6);
      ctx.fillStyle = '#c0e8ff';
      ctx.fillRect(x + 5, y + 2, 6, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 6, y + 3, 1, 2);
      ctx.fillRect(x + 9, y + 3, 1, 2);
      break;
    }
    case 'titan': {
      const pulse = Math.sin(frame * 0.08) * 2;
      ctx.fillStyle = hurt ? '#fff' : '#184878';
      ctx.fillRect(x + 1, y + 2 + pulse, 14, 12);
      ctx.fillStyle = hurt ? '#fff' : '#2868a8';
      ctx.fillRect(x + 3, y + 4 + pulse, 10, 8);
      ctx.fillStyle = PALETTE.crystal;
      ctx.fillRect(x + 5, y + 1 + pulse, 6, 3);
      ctx.fillStyle = '#60c0ff';
      ctx.fillRect(x + 4, y + 6 + pulse, 3, 3);
      ctx.fillRect(x + 9, y + 6 + pulse, 3, 3);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 5, y + 7 + pulse, 1, 2);
      ctx.fillRect(x + 10, y + 7 + pulse, 1, 2);
      const hpPct = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#102040';
      ctx.fillRect(x, y - 4, 16, 3);
      ctx.fillStyle = '#60c0ff';
      ctx.fillRect(x, y - 4, 16 * hpPct, 3);
      break;
    }
  }
}

export function drawItem(ctx, item, frame) {
  const x = item.x * TILE + 4;
  const y = item.y * TILE + 4 + Math.sin(frame * 0.1) * 2;

  if (item.type === 'heart') {
    ctx.fillStyle = PALETTE.heart;
    ctx.fillRect(x + 2, y + 2, 4, 4);
    ctx.fillRect(x, y + 4, 8, 4);
    ctx.fillRect(x + 1, y + 6, 6, 2);
  } else if (item.type === 'crystal_shard') {
    ctx.fillStyle = PALETTE.crystal;
    ctx.fillRect(x + 3, y + 1, 2, 8);
    ctx.fillRect(x + 1, y + 3, 6, 4);
    ctx.fillStyle = '#a0f8ff';
    ctx.fillRect(x + 3, y + 3, 2, 4);
  } else if (item.type === 'key') {
    ctx.fillStyle = PALETTE.crystal;
    ctx.fillRect(x + 2, y + 2, 4, 4);
    ctx.fillRect(x + 5, y + 4, 4, 2);
    ctx.fillRect(x + 7, y + 2, 2, 4);
  }
}

export function drawHUD(ctx, player, roomName, shards, keys) {
  ctx.fillStyle = 'rgba(10,20,40,0.7)';
  ctx.fillRect(0, 0, 256, 16);

  for (let i = 0; i < player.maxHp; i++) {
    const hx = 4 + i * 10;
    if (i < player.hp) {
      ctx.fillStyle = PALETTE.heart;
      ctx.fillRect(hx + 1, 3, 4, 4);
      ctx.fillRect(hx, 5, 8, 4);
      ctx.fillRect(hx + 1, 7, 6, 2);
    } else {
      ctx.fillStyle = '#304050';
      ctx.fillRect(hx + 1, 3, 4, 4);
      ctx.fillRect(hx, 5, 8, 4);
    }
  }

  ctx.fillStyle = PALETTE.crystal;
  ctx.fillRect(198, 4, 3, 6);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '8px monospace';
  ctx.fillText(String(shards).padStart(3, '0'), 204, 11);

  if (keys > 0) {
    ctx.fillStyle = PALETTE.crystal;
    ctx.fillRect(230, 4, 4, 4);
    ctx.fillRect(234, 6, 3, 2);
    ctx.fillStyle = '#e8f4ff';
    ctx.fillText(String(keys), 240, 11);
  }

  ctx.fillStyle = 'rgba(200,240,255,0.8)';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(roomName, 128, 11);
  ctx.textAlign = 'left';
}

export function drawMessage(ctx, text, alpha) {
  ctx.fillStyle = `rgba(10,30,60,${0.8 * alpha})`;
  ctx.fillRect(20, 90, 216, 40);
  ctx.strokeStyle = `rgba(160,220,255,${alpha})`;
  ctx.strokeRect(20, 90, 216, 40);
  ctx.fillStyle = `rgba(232,244,255,${alpha})`;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 114);
  ctx.textAlign = 'left';
}

export function drawTransition(ctx, progress, direction) {
  const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
  ctx.fillStyle = `rgba(160,220,255,${alpha * 0.9})`;
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
