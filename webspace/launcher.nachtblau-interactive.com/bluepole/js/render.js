import { W, H, HORIZON, FOV, CAM_HEIGHT, TRACK_SIZE, NB } from './constants.js?v=8';
import {
  drawKartRear, drawKartBillboard, drawQuestionBox,
  drawBananaSprite, drawShellSprite, drawItemIcon, drawCharFace, drawNbBadge,
} from './sprites.js?v=8';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  return { canvas, ctx, skyCache: null, groundBuf: null };
}

function ensureSky(r, trackId) {
  if (r.skyCache?.id === trackId) return r.skyCache.canvas;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = HORIZON;
  const g = c.getContext('2d');

  const grad = g.createLinearGradient(0, 0, 0, HORIZON);
  grad.addColorStop(0, '#02060c');
  grad.addColorStop(0.35, NB.mid);
  grad.addColorStop(0.75, NB.blue);
  grad.addColorStop(1, '#1a5080');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, HORIZON);

  // cyan atmosphere glow
  const glow = g.createRadialGradient(W * 0.78, 28, 4, W * 0.78, 28, 90);
  glow.addColorStop(0, 'rgba(94,234,255,0.4)');
  glow.addColorStop(1, 'rgba(94,234,255,0)');
  g.fillStyle = glow;
  g.fillRect(W * 0.55, 0, W * 0.45, HORIZON);

  // crescent moon (logo)
  g.fillStyle = NB.moon;
  g.beginPath();
  g.arc(W * 0.82, 32, 18, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = NB.blue;
  g.beginPath();
  g.arc(W * 0.84, 28, 15, 0, Math.PI * 2);
  g.fill();

  // stars
  g.fillStyle = 'rgba(212,240,255,0.85)';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 97 + 13) % W;
    const sy = (i * 53 + 7) % (HORIZON - 24);
    if (Math.hypot(sx - W * 0.82, sy - 32) < 28) continue;
    const sz = i % 7 === 0 ? 2 : 1;
    g.fillRect(sx, sy, sz, sz);
  }

  // soft cloud bands
  g.fillStyle = 'rgba(168,230,255,0.08)';
  for (const [cx, cy, cw, ch] of [[40, 70, 120, 16], [200, 55, 140, 18], [400, 80, 100, 14], [520, 60, 90, 12]]) {
    g.beginPath();
    g.ellipse(cx + cw / 2, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2);
    g.fill();
  }

  // city / hill silhouette
  g.fillStyle = '#061018';
  g.beginPath();
  g.moveTo(0, HORIZON);
  for (let x = 0; x <= W; x += 8) {
    const hh = 12 + Math.sin(x * 0.04) * 6 + ((x * 17) % 14);
    g.lineTo(x, HORIZON - hh);
  }
  g.lineTo(W, HORIZON);
  g.fill();

  // neon skyline accents
  g.fillStyle = NB.cyan;
  g.globalAlpha = 0.25;
  for (let i = 0; i < 12; i++) {
    const x = 30 + i * 52;
    const h = 8 + (i * 7) % 16;
    g.fillRect(x, HORIZON - h - 4, 3, h);
  }
  g.globalAlpha = 1;

  r.skyCache = { id: trackId, canvas: c };
  return c;
}

export function renderMode7(r, track, camX, camY, camAngle) {
  const { ctx } = r;
  ctx.drawImage(ensureSky(r, track.id), 0, 0);

  const tctx = track.texture.getContext('2d');
  if (!track._pixels) {
    track._pixels = tctx.getImageData(0, 0, TRACK_SIZE, TRACK_SIZE).data;
  }
  const pixels = track._pixels;
  const gh = H - HORIZON;
  if (!r.groundBuf || r.groundBuf.width !== W) {
    r.groundBuf = ctx.createImageData(W, gh);
  }
  const od = r.groundBuf.data;
  const sin = Math.sin(camAngle);
  const cos = Math.cos(camAngle);
  const step = 1; // full-res Mode-7 sampling — less blocky

  for (let screenY = 0; screenY < gh; screenY++) {
    const row = screenY + 1;
    const distance = (CAM_HEIGHT * FOV) / row;
    const halfWidth = distance * 0.9;
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
  ctx.putImageData(r.groundBuf, 0, HORIZON);

  // horizon haze blend
  const haze = ctx.createLinearGradient(0, HORIZON - 8, 0, HORIZON + 28);
  haze.addColorStop(0, 'rgba(26,80,128,0)');
  haze.addColorStop(0.4, 'rgba(26,80,128,0.25)');
  haze.addColorStop(1, 'rgba(4,10,20,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, HORIZON - 8, W, 36);
}

export function project(camX, camY, camAngle, wx, wy) {
  const dx = wx - camX;
  const dy = wy - camY;
  const cos = Math.cos(-camAngle);
  const sin = Math.sin(-camAngle);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  if (ry < 10) return null;
  const scale = FOV / ry;
  const sx = W / 2 + rx * scale;
  const sy = HORIZON + (CAM_HEIGHT * FOV) / ry;
  if (sy < HORIZON - 6 || sy > H + 40) return null;
  return { x: sx, y: sy, scale, depth: ry };
}

export function drawKartSprite(ctx, kart, proj) {
  if (!proj) return;
  const s = Math.max(0.45, Math.min(2.8, 1400 / proj.depth));
  const turboTier = kart.miniTurbo > 0.5 ? 2 : kart.driftCharge > 1.35 ? 2 : kart.driftCharge > 0.7 ? 1 : 0;
  drawKartBillboard(ctx, proj.x, proj.y, s, {
    body: kart.color,
    accent: kart.accent,
    driver: kart.driver?.accent || '#f0c898',
    passenger: kart.passenger?.accent || '#e0b080',
    shrink: kart.shrink > 0 ? 0.55 : 1,
    drifting: kart.drifting,
    turboTier,
    invuln: kart.invuln > 0,
  });
}

export function drawPlayerKart(ctx, kart, steer = 0) {
  const lean = Math.max(-1, Math.min(1, steer + (kart.drifting ? kart.driftDir * 0.5 : 0)));
  const turboTier = kart.miniTurbo > 0.5 ? 2 : kart.driftCharge > 1.35 ? 2 : kart.driftCharge > 0.7 ? 1 : 0;
  drawKartRear(ctx, W / 2, H - 8, 2.45, {
    body: kart.color,
    accent: kart.accent,
    driver: kart.driver?.accent || '#f0c898',
    passenger: kart.passenger?.accent || '#e0b080',
    lean,
    shrink: kart.shrink > 0 ? 0.65 : 1,
    drifting: kart.drifting,
    turboTier,
    invuln: kart.invuln > 0,
  });
}

export function drawHazardSprite(ctx, h, proj) {
  if (!proj) return;
  const s = Math.max(5, Math.min(32, 1800 / proj.depth));
  if (h.type === 'banana') drawBananaSprite(ctx, proj.x, proj.y, s);
  else if (h.type === 'fake') drawQuestionBox(ctx, proj.x, proj.y, s * 0.9, 0, 9);
  else if (h.type === 'shell') drawShellSprite(ctx, proj.x, proj.y - s / 4, s, h.color);
  else if (h.type === 'boulder') {
    ctx.fillStyle = '#8a9bb0';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y - s / 2, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (h.type === 'fire') {
    ctx.fillStyle = '#ff7a45';
    ctx.shadowColor = '#ff7a45';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y - 4, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (h.type === 'wall') {
    ctx.fillStyle = 'rgba(94,234,255,0.55)';
    ctx.fillRect(proj.x - s, proj.y - s * 0.35, s * 2, s * 0.45);
  }
}

export function drawItemBox(ctx, box, proj, time) {
  if (!proj || !box.alive) return;
  const s = Math.max(6, Math.min(26, 1500 / proj.depth));
  drawQuestionBox(ctx, proj.x, proj.y, s, time, box.id);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(4,10,20,0.72)';
  ctx.strokeStyle = 'rgba(168,230,255,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

export function drawHUD(ctx, state) {
  const { player, countdown, raceTime, track } = state;

  panel(ctx, 12, 12, 128, 64);
  ctx.fillStyle = '#fff';
  ctx.font = '700 36px Orbitron,sans-serif';
  ctx.fillText(`${player.place}`, 24, 48);
  ctx.font = '600 11px Exo 2,sans-serif';
  ctx.fillStyle = NB.cyan;
  const suf = player.place === 1 ? 'ST' : player.place === 2 ? 'ND' : player.place === 3 ? 'RD' : 'TH';
  ctx.fillText(suf, 70, 28);
  ctx.fillStyle = NB.boost;
  ctx.fillText(`LAP ${Math.min(player.laps + 1, state.laps)}/${state.laps}`, 70, 44);
  ctx.fillStyle = NB.soft;
  ctx.fillText(formatTime(raceTime), 70, 60);

  drawNbBadge(ctx, 148, 16, 28);

  drawItemSlot(ctx, W - 148, 12, player.items[0], player.driver, player.activeSlot === 0);
  drawItemSlot(ctx, W - 78, 12, player.items[1], player.passenger, player.activeSlot === 1);

  if (player.drifting) {
    const t = Math.min(1, player.driftCharge / 1.35);
    panel(ctx, W / 2 - 70, H - 36, 140, 20);
    ctx.fillStyle = t > 0.99 ? NB.cyan : t > 0.5 ? NB.boost : '#ff7ab8';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 64, H - 30, 128 * t, 8, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '600 10px Exo 2,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t > 0.99 ? 'MINI-TURBO' : 'DRIFT', W / 2, H - 22);
    ctx.textAlign = 'left';
  }

  if (countdown > 0) {
    ctx.fillStyle = 'rgba(2,6,12,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    const n = Math.ceil(countdown);
    ctx.font = '800 72px Orbitron,sans-serif';
    if (n > 3) {
      ctx.fillStyle = NB.cyan;
      ctx.shadowColor = NB.cyan;
      ctx.shadowBlur = 24;
      ctx.fillText('GO', W / 2, H / 2 + 20);
    } else {
      ctx.fillStyle = n === 1 ? NB.danger : NB.boost;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 20;
      ctx.fillText(String(n), W / 2, H / 2 + 24);
    }
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  if (raceTime < 2.4 && countdown <= 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = NB.accent;
    ctx.font = '700 20px Orbitron,sans-serif';
    ctx.fillText(track.name.toUpperCase(), W / 2, HORIZON - 14);
    ctx.textAlign = 'left';
  }
}

function drawItemSlot(ctx, x, y, item, character, active) {
  ctx.fillStyle = active ? 'rgba(94,234,255,0.18)' : 'rgba(4,10,20,0.72)';
  ctx.strokeStyle = active ? NB.cyan : 'rgba(168,230,255,0.25)';
  ctx.lineWidth = active ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(x, y, 58, 54, 10);
  ctx.fill();
  ctx.stroke();
  if (item) drawItemIcon(ctx, x + 7, y + 4, 44, item);
  else if (character) drawCharFace(ctx, x + 9, y + 7, 40, character.color, character.accent);
}

export function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function drawMinimap(ctx, track, karts, player) {
  const size = 96;
  const ox = W - size - 14;
  const oy = H - size - 14;
  panel(ctx, ox - 6, oy - 6, size + 12, size + 12);
  ctx.fillStyle = '#0a1828';
  ctx.fillRect(ox, oy, size, size);
  const step = 10;
  ctx.fillStyle = '#2a4058';
  for (let y = 0; y < TRACK_SIZE; y += step) {
    for (let x = 0; x < TRACK_SIZE; x += step) {
      if (track.mask[y * TRACK_SIZE + x]) {
        ctx.fillRect(ox + (x / TRACK_SIZE) * size, oy + (y / TRACK_SIZE) * size, 2, 2);
      }
    }
  }
  // neon track hint
  ctx.fillStyle = NB.cyan;
  ctx.globalAlpha = 0.35;
  for (let y = 0; y < TRACK_SIZE; y += step * 2) {
    for (let x = 0; x < TRACK_SIZE; x += step * 2) {
      if (track.mask[y * TRACK_SIZE + x]) {
        ctx.fillRect(ox + (x / TRACK_SIZE) * size, oy + (y / TRACK_SIZE) * size, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
  for (const k of karts) {
    ctx.fillStyle = k.id === player.id ? NB.boost : k.color;
    const mx = ox + (k.x / TRACK_SIZE) * size;
    const my = oy + (k.y / TRACK_SIZE) * size;
    ctx.beginPath();
    ctx.arc(mx, my, k.id === player.id ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
