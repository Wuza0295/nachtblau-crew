import { W, H, HORIZON, FOV, CAM_HEIGHT, TRACK_SIZE } from './constants.js';
import {
  drawKartRear, drawKartBillboard, drawQuestionBox,
  drawBananaSprite, drawShellSprite, drawItemIcon, drawCharFace,
} from './sprites.js';

/**
 * SNES Mode-7 ground + SMK-style sprites/HUD.
 */

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx, skyCache: null, groundBuf: null };
}

function ensureSky(r, trackId) {
  if (r.skyCache?.id === trackId) return r.skyCache.canvas;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = HORIZON;
  const g = c.getContext('2d');
  const skies = {
    kronenring: ['#5a80d0', '#88b0e8', '#c8e0f8'],
    nebelpass: ['#486878', '#7898a8', '#b0c8d0'],
    schattenstadt: ['#403060', '#684888', '#a070a0'],
  };
  const s = skies[trackId] || skies.kronenring;
  const grad = g.createLinearGradient(0, 0, 0, HORIZON);
  grad.addColorStop(0, s[0]);
  grad.addColorStop(0.55, s[1]);
  grad.addColorStop(1, s[2]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, HORIZON);

  // SMK-style chunky clouds
  g.fillStyle = 'rgba(255,255,255,0.85)';
  const clouds = [
    [20, 28, 50, 14], [90, 18, 60, 16], [180, 30, 44, 12],
    [240, 16, 55, 15], [40, 50, 36, 10], [200, 48, 48, 11],
  ];
  for (const [cx, cy, cw, ch] of clouds) {
    g.fillRect(cx, cy, cw, ch);
    g.fillRect(cx + 8, cy - 6, cw * 0.55, ch);
  }
  // hills silhouette
  g.fillStyle = trackId === 'schattenstadt' ? '#2a1840' : '#3a8840';
  g.beginPath();
  g.moveTo(0, HORIZON);
  for (let x = 0; x <= W; x += 16) {
    const h = 8 + ((x * 17) % 20);
    g.lineTo(x, HORIZON - h);
  }
  g.lineTo(W, HORIZON);
  g.fill();

  r.skyCache = { id: trackId, canvas: c };
  return c;
}

export function renderMode7(r, track, camX, camY, camAngle) {
  const { ctx } = r;
  const sky = ensureSky(r, track.id);
  ctx.drawImage(sky, 0, 0);

  const tex = track.texture;
  const tctx = tex.getContext('2d');
  if (!track._pixels) {
    track._pixels = tctx.getImageData(0, 0, TRACK_SIZE, TRACK_SIZE).data;
  }
  const pixels = track._pixels;
  if (!r.groundBuf || r.groundBuf.width !== W) {
    r.groundBuf = ctx.createImageData(W, H - HORIZON);
  }
  const out = r.groundBuf;
  const od = out.data;
  const sin = Math.sin(camAngle);
  const cos = Math.cos(camAngle);

  const step = 2;
  for (let screenY = 0; screenY < H - HORIZON; screenY++) {
    const row = screenY + 1;
    const distance = (CAM_HEIGHT * FOV) / row;
    const halfWidth = distance * 0.92;
    const rowStart = screenY * W * 4;

    for (let screenX = 0; screenX < W; screenX += step) {
      const pan = (screenX / W) * 2 - 1;
      const worldX = camX + (cos * distance - sin * pan * halfWidth);
      const worldY = camY + (sin * distance + cos * pan * halfWidth);

      let ix = Math.floor(worldX) % TRACK_SIZE;
      let iy = Math.floor(worldY) % TRACK_SIZE;
      if (ix < 0) ix += TRACK_SIZE;
      if (iy < 0) iy += TRACK_SIZE;
      const pi = (iy * TRACK_SIZE + ix) * 4;
      const pr = pixels[pi];
      const pg = pixels[pi + 1];
      const pb = pixels[pi + 2];
      for (let k = 0; k < step && screenX + k < W; k++) {
        const oi = rowStart + (screenX + k) * 4;
        od[oi] = pr;
        od[oi + 1] = pg;
        od[oi + 2] = pb;
        od[oi + 3] = 255;
      }
    }
  }
  ctx.putImageData(out, 0, HORIZON);
}

export function project(camX, camY, camAngle, wx, wy) {
  const dx = wx - camX;
  const dy = wy - camY;
  const cos = Math.cos(-camAngle);
  const sin = Math.sin(-camAngle);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  if (ry < 8) return null;
  const scale = FOV / ry;
  const sx = W / 2 + rx * scale;
  const sy = HORIZON + (CAM_HEIGHT * FOV) / ry;
  if (sy < HORIZON - 4 || sy > H + 30) return null;
  return { x: sx, y: sy, scale, depth: ry };
}

export function drawKartSprite(ctx, kart, proj) {
  if (!proj) return;
  const s = Math.max(0.4, Math.min(2.8, 900 / proj.depth));
  const turboTier = kart.miniTurbo > 0.5 ? 2 : kart.driftCharge > 1.35 ? 2 : kart.driftCharge > 0.7 ? 1 : 0;
  drawKartBillboard(ctx, proj.x, proj.y, s, {
    body: kart.color,
    accent: kart.accent,
    driver: kart.driver?.accent || '#e8b878',
    passenger: kart.passenger?.accent || '#c4a070',
    lean: 0,
    shrink: kart.shrink > 0 ? 0.55 : 1,
    flash: false,
    drifting: kart.drifting,
    turboTier,
    invuln: kart.invuln > 0,
  });
}

export function drawPlayerKart(ctx, kart, steer = 0) {
  const x = W / 2;
  const y = H - 18;
  const lean = Math.max(-1, Math.min(1, steer + (kart.drifting ? kart.driftDir * 0.6 : 0)));
  const turboTier = kart.miniTurbo > 0.5 ? 2 : kart.driftCharge > 1.35 ? 2 : kart.driftCharge > 0.7 ? 1 : 0;
  drawKartRear(ctx, x, y, 2.35, {
    body: kart.color,
    accent: kart.accent,
    driver: kart.driver?.accent || '#f0c898',
    passenger: kart.passenger?.accent || '#d0b090',
    lean,
    shrink: kart.shrink > 0 ? 0.65 : 1,
    drifting: kart.drifting,
    turboTier,
    invuln: kart.invuln > 0,
  });
}

export function drawHazardSprite(ctx, h, proj) {
  if (!proj) return;
  const s = Math.max(4, Math.min(28, 1400 / proj.depth));
  if (h.type === 'banana') drawBananaSprite(ctx, proj.x, proj.y, s);
  else if (h.type === 'fake') drawQuestionBox(ctx, proj.x, proj.y, s * 0.9, 0, 9);
  else if (h.type === 'shell') drawShellSprite(ctx, proj.x, proj.y - s / 4, s, h.color);
  else if (h.type === 'boulder') {
    ctx.fillStyle = '#8a9bb0';
    ctx.fillRect(proj.x - s * 0.6, proj.y - s, s * 1.2, s);
  } else if (h.type === 'fire') {
    ctx.fillStyle = '#ff7a45';
    ctx.fillRect(proj.x - s / 3, proj.y - s / 2, s * 0.66, s / 2);
  } else if (h.type === 'wall') {
    ctx.fillStyle = 'rgba(61,220,132,0.75)';
    ctx.fillRect(proj.x - s, proj.y - s * 0.4, s * 2, s * 0.5);
  }
}

export function drawItemBox(ctx, box, proj, time) {
  if (!proj || !box.alive) return;
  const s = Math.max(5, Math.min(22, 1200 / proj.depth));
  drawQuestionBox(ctx, proj.x, proj.y, s, time, box.id);
}

export function drawHUD(ctx, state) {
  const { player, countdown, raceTime, track } = state;

  // SMK-style place number
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(4, 4, 78, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(`${player.place}`, 10, 32);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#ffe566';
  const suf = player.place === 1 ? 'ST' : player.place === 2 ? 'ND' : player.place === 3 ? 'RD' : 'TH';
  ctx.fillText(suf, 40, 20);
  ctx.fillStyle = '#c8e0ff';
  ctx.fillText(`LAP ${Math.min(player.laps + 1, state.laps)}/${state.laps}`, 40, 34);

  // Timer
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(4, 48, 70, 14);
  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.fillText(formatTime(raceTime), 8, 58);

  // Double Dash item slots with faces
  drawItemSlot(ctx, 218, 6, player.items[0], player.driver, player.activeSlot === 0);
  drawItemSlot(ctx, 268, 6, player.items[1], player.passenger, player.activeSlot === 1);

  // Drift meter
  if (player.drifting) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(110, 222, 100, 8);
    const t = Math.min(1, player.driftCharge / 1.35);
    ctx.fillStyle = t > 0.99 ? '#7ec8ff' : t > 0.5 ? '#ffe566' : '#ff7ab8';
    ctx.fillRect(110, 222, 100 * t, 8);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(t > 0.99 ? 'TURBO!' : 'DRIFT', 148, 220);
  }

  if (countdown > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    const n = Math.ceil(countdown);
    if (n > 3) {
      ctx.fillStyle = '#3ddc84';
      ctx.font = 'bold 42px monospace';
      ctx.fillText('GO!', W / 2, H / 2 + 10);
    } else {
      ctx.fillStyle = n === 1 ? '#ff5a5a' : '#ffe566';
      ctx.font = 'bold 56px monospace';
      ctx.fillText(String(n), W / 2, H / 2 + 16);
    }
    ctx.textAlign = 'left';
  }

  if (raceTime < 2.2 && countdown <= 0) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(track.name.toUpperCase(), W / 2, HORIZON - 8);
    ctx.textAlign = 'left';
  }
}

function drawItemSlot(ctx, x, y, item, character, active) {
  ctx.fillStyle = active ? 'rgba(255,220,80,0.35)' : 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, 44, 40);
  ctx.strokeStyle = active ? '#ffe566' : '#8868b0';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, 43, 39);

  if (item) {
    drawItemIcon(ctx, x + 4, y + 2, 36, item);
  } else if (character) {
    drawCharFace(ctx, x + 10, y + 6, 24, character.color, character.accent);
  }
}

export function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function drawMinimap(ctx, track, karts, player) {
  const size = 58;
  const ox = W - size - 5;
  const oy = H - size - 5;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(ox - 2, oy - 2, size + 4, size + 4);
  ctx.fillStyle = '#2a9840';
  ctx.fillRect(ox, oy, size, size);
  const step = 12;
  ctx.fillStyle = '#707088';
  for (let y = 0; y < TRACK_SIZE; y += step) {
    for (let x = 0; x < TRACK_SIZE; x += step) {
      if (track.mask[y * TRACK_SIZE + x]) {
        ctx.fillRect(ox + (x / TRACK_SIZE) * size, oy + (y / TRACK_SIZE) * size, 2, 2);
      }
    }
  }
  for (const k of karts) {
    ctx.fillStyle = k.id === player.id ? '#ffe566' : k.color;
    const mx = ox + (k.x / TRACK_SIZE) * size;
    const my = oy + (k.y / TRACK_SIZE) * size;
    ctx.fillRect(mx - 1, my - 1, 3, 3);
  }
}
