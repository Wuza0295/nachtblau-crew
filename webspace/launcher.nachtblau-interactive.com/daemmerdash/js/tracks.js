import { TRACK_SIZE } from './constants.js';

/**
 * Procedural SNES Mario-Kart-style tracks.
 */

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function buildRoadMask(kind) {
  const size = TRACK_SIZE;
  const mask = new Uint8Array(size * size);
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let on = false;
      const dx = x - cx;
      const dy = y - cy;

      if (kind === 'kronenring') {
        // Wider oval — more SMK-like road width
        const rx = Math.abs(dx) / 340;
        const ry = Math.abs(dy) / 260;
        const e = Math.sqrt(rx * rx + ry * ry);
        on = e > 0.62 && e < 1.12;
      } else if (kind === 'nebelpass') {
        const a = dist2(x, y, cx - 170, cy) < 210 * 210 && dist2(x, y, cx - 170, cy) > 100 * 100;
        const b = dist2(x, y, cx + 170, cy) < 210 * 210 && dist2(x, y, cx + 170, cy) > 100 * 100;
        const bridge = Math.abs(dy) < 52 && Math.abs(dx) < 230;
        on = a || b || bridge;
      } else if (kind === 'schattenstadt') {
        const outer =
          x > 110 && x < size - 110 && y > 130 && y < size - 130 &&
          !(x > 240 && x < size - 240 && y > 260 && y < size - 260);
        const cutA = x > 380 && x < 640 && y > 300 && y < 420;
        const cutB = x > 380 && x < 640 && y > 600 && y < 720;
        on = outer && !cutA && !cutB;
        if (Math.abs(dx) < 65 && y > 190 && y < size - 190) on = true;
        if (Math.abs(dy) < 65 && x > 170 && x < size - 170) on = true;
        if (x < 150 || x > size - 150 || y < 170 || y > size - 170) on = false;
      }
      mask[y * size + x] = on ? 1 : 0;
    }
  }
  return mask;
}

function edgeDist(mask, x, y, size) {
  if (!mask[y * size + x]) return 0;
  for (let r = 1; r <= 14; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) return r;
        if (!mask[ny * size + nx]) return r;
      }
    }
  }
  return 15;
}

function paintTexture(kind, mask) {
  const size = TRACK_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;

  // SMK-inspired palettes (original, not Nintendo assets)
  const palettes = {
    kronenring: {
      grass: [48, 168, 48], grass2: [32, 136, 32], grass3: [64, 184, 56],
      road: [96, 96, 104], road2: [80, 80, 88],
      edge: [240, 240, 240], curbR: [200, 40, 40], curbW: [240, 240, 240],
      center: [240, 220, 80], dirt: [160, 120, 60],
    },
    nebelpass: {
      grass: [72, 96, 120], grass2: [56, 80, 104], grass3: [88, 112, 136],
      road: [72, 76, 92], road2: [60, 64, 80],
      edge: [200, 210, 220], curbR: [180, 60, 60], curbW: [220, 220, 230],
      center: [180, 200, 220], dirt: [90, 100, 120],
    },
    schattenstadt: {
      grass: [56, 48, 72], grass2: [40, 36, 56], grass3: [72, 56, 88],
      road: [88, 84, 96], road2: [72, 68, 80],
      edge: [220, 180, 80], curbR: [160, 40, 120], curbW: [240, 200, 100],
      center: [220, 180, 80], dirt: [100, 80, 60],
    },
  };
  const p = palettes[kind] || palettes.kronenring;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const road = mask[y * size + x];
      let r, g, b;

      if (road) {
        const ed = edgeDist(mask, x, y, size);
        if (ed <= 3) {
          // Red/white curb like SMK
          const stripe = ((x + y) >> 3) & 1;
          const c = stripe ? p.curbR : p.curbW;
          r = c[0]; g = c[1]; b = c[2];
        } else if (ed <= 5) {
          r = p.edge[0]; g = p.edge[1]; b = p.edge[2];
        } else {
          // Asphalt checker — SMK road feel
          const checker = ((x >> 3) ^ (y >> 3)) & 1;
          const base = checker ? p.road : p.road2;
          r = base[0]; g = base[1]; b = base[2];
          // dashed center-ish marks near mid-ring
          if (ed > 8 && ed < 11 && ((x + y * 2) % 40) < 8) {
            r = p.center[0]; g = p.center[1]; b = p.center[2];
          }
        }
      } else {
        // Checker grass like Mario Circuit
        const tile = ((x >> 4) ^ (y >> 4)) & 1;
        const fine = ((x >> 3) ^ (y >> 3)) & 1;
        let base = tile ? p.grass : p.grass2;
        if (fine && tile) base = p.grass3;
        const noise = ((x * 17 + y * 31) & 7) - 3;
        r = clamp(base[0] + noise, 0, 255);
        g = clamp(base[1] + noise, 0, 255);
        b = clamp(base[2] + noise, 0, 255);
        // flowers / pebbles
        const deco = ((x * 13) ^ (y * 7)) % 89;
        if (deco === 0) { r = 255; g = 80; b = 120; }
        else if (deco === 1) { r = 255; g = 220; b = 60; }
        else if (deco === 2) { r = 255; g = 255; b = 255; }
      }
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Start/finish zebra
  const finishY = size / 2 + 230;
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = i % 2 ? '#111' : '#f4f4f4';
    ctx.fillRect(size / 2 - 100 + i * 10, finishY, 10, 40);
  }

  // Decorative pipes / barriers near track (SMK vibe)
  ctx.fillStyle = '#2a9a40';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const px = size / 2 + Math.cos(a) * 400;
    const py = size / 2 + Math.sin(a) * 310;
    if (!mask[(py | 0) * size + (px | 0)]) {
      ctx.fillStyle = '#38b848';
      ctx.fillRect(px - 6, py - 14, 12, 20);
      ctx.fillStyle = '#50d060';
      ctx.fillRect(px - 8, py - 18, 16, 8);
    }
  }

  return canvas;
}

function waypointsFor(kind) {
  const c = TRACK_SIZE / 2;
  if (kind === 'kronenring') {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: c + Math.cos(a) * 300, y: c + Math.sin(a) * 230 });
    }
    return pts;
  }
  if (kind === 'nebelpass') {
    return [
      { x: c - 170, y: c - 155 },
      { x: c - 40, y: c - 40 },
      { x: c + 170, y: c - 155 },
      { x: c + 170, y: c + 155 },
      { x: c + 40, y: c + 40 },
      { x: c - 170, y: c + 155 },
    ];
  }
  return [
    { x: c, y: c + 280 },
    { x: c + 280, y: c + 280 },
    { x: c + 280, y: c },
    { x: c + 280, y: c - 280 },
    { x: c, y: c - 280 },
    { x: c - 280, y: c - 280 },
    { x: c - 280, y: c },
    { x: c - 280, y: c + 280 },
  ];
}

/** @type {import('./tracks.js').Track[]} */
export const TRACKS = [];

export function initTracks() {
  if (TRACKS.length) {
    TRACKS.length = 0; // allow rebuild after visual updates
  }
  const defs = [
    { id: 'kronenring', name: 'Kronenring', cup: 'Dämmer-Cup' },
    { id: 'nebelpass', name: 'Nebelpass', cup: 'Dämmer-Cup' },
    { id: 'schattenstadt', name: 'Schattenstadt', cup: 'Dämmer-Cup' },
  ];
  for (const def of defs) {
    const mask = buildRoadMask(def.id);
    const texture = paintTexture(def.id, mask);
    const waypoints = waypointsFor(def.id);
    const startWp = waypoints[0];
    const next = waypoints[1];
    const angle = Math.atan2(next.y - startWp.y, next.x - startWp.x);
    const itemBoxes = waypoints.filter((_, i) => i % 3 === 1).map((w) => {
      // nudge boxes toward track center a bit
      const cx = TRACK_SIZE / 2;
      const cy = TRACK_SIZE / 2;
      return {
        x: w.x + (cx - w.x) * 0.05,
        y: w.y + (cy - w.y) * 0.05,
      };
    });
    TRACKS.push({
      ...def,
      mask,
      texture,
      waypoints,
      start: { x: startWp.x, y: startWp.y, angle },
      itemBoxes,
    });
  }
  return TRACKS;
}

export function isOnRoad(track, x, y) {
  const ix = Math.floor(x) & (TRACK_SIZE - 1);
  const iy = Math.floor(y) & (TRACK_SIZE - 1);
  return track.mask[iy * TRACK_SIZE + ix] === 1;
}

export function progressAlongTrack(track, x, y) {
  const wps = track.waypoints;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < wps.length; i++) {
    const d = dist2(x, y, wps[i].x, wps[i].y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best + (wps.length - bestD / (400 * 400));
}

export function raceProgress(track, kart) {
  return kart.laps * track.waypoints.length + progressAlongTrack(track, kart.x, kart.y);
}
