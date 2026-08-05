import { TRACK_SIZE, NB } from './constants.js?v=8';

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
  for (let r = 1; r <= 16; r++) {
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
  return 18;
}

/** Modern night-circuit textures — dark asphalt + cyan neon edges */
function paintTexture(kind, mask) {
  const size = TRACK_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;

  const themes = {
    kronenring: {
      off: [8, 18, 28], off2: [6, 14, 22],
      road: [28, 34, 42], road2: [22, 28, 36],
      neon: [94, 234, 255], neonSoft: [58, 143, 212],
      line: [220, 230, 240],
    },
    nebelpass: {
      off: [12, 20, 28], off2: [10, 16, 24],
      road: [32, 38, 48], road2: [26, 32, 40],
      neon: [120, 200, 220], neonSoft: [70, 130, 160],
      line: [200, 220, 230],
    },
    schattenstadt: {
      off: [14, 10, 24], off2: [10, 8, 20],
      road: [34, 30, 44], road2: [28, 24, 38],
      neon: [168, 230, 255], neonSoft: [100, 80, 180],
      line: [230, 210, 255],
    },
  };
  const p = themes[kind] || themes.kronenring;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let r, g, b;
      if (mask[y * size + x]) {
        const ed = edgeDist(mask, x, y, size);
        if (ed <= 2) {
          // neon curb
          const pulse = ((x + y) >> 2) & 1;
          const c = pulse ? p.neon : p.neonSoft;
          r = c[0]; g = c[1]; b = c[2];
        } else if (ed <= 4) {
          r = 18; g = 24; b = 32;
        } else {
          const checker = ((x >> 4) ^ (y >> 4)) & 1;
          const base = checker ? p.road : p.road2;
          // subtle wet sheen
          const sheen = ((x * 3 + y * 5) & 31) === 0 ? 12 : 0;
          r = clamp(base[0] + sheen, 0, 255);
          g = clamp(base[1] + sheen, 0, 255);
          b = clamp(base[2] + sheen + 4, 0, 255);
          if (ed > 9 && ed < 12 && ((x + y * 3) % 36) < 10) {
            r = p.line[0] * 0.55; g = p.line[1] * 0.55; b = p.line[2] * 0.7;
          }
        }
      } else {
        const tile = ((x >> 5) ^ (y >> 5)) & 1;
        const base = tile ? p.off : p.off2;
        const n = ((x * 19 + y * 23) & 7) - 3;
        r = clamp(base[0] + n, 0, 255);
        g = clamp(base[1] + n, 0, 255);
        b = clamp(base[2] + n, 0, 255);
        // sparse ground lights
        if (((x * 11) ^ (y * 17)) % 211 === 0) {
          r = 40; g = 90; b = 110;
        }
      }
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Start/finish light bar
  const finishY = size / 2 + 230;
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = i % 2 ? '#0a1018' : '#eef6ff';
    ctx.fillRect(size / 2 - 120 + i * 10, finishY, 10, 36);
  }
  ctx.fillStyle = NB.cyan;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(size / 2 - 120, finishY - 4, 240, 3);
  ctx.globalAlpha = 1;

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

export const TRACKS = [];

export function initTracks() {
  TRACKS.length = 0;
  const defs = [
    { id: 'kronenring', name: 'Kronenring', cup: 'Bluepole Cup' },
    { id: 'nebelpass', name: 'Nebelpass', cup: 'Bluepole Cup' },
    { id: 'schattenstadt', name: 'Schattenstadt', cup: 'Bluepole Cup' },
  ];
  for (const def of defs) {
    const mask = buildRoadMask(def.id);
    const texture = paintTexture(def.id, mask);
    const waypoints = waypointsFor(def.id);
    const startWp = waypoints[0];
    const next = waypoints[1];
    const angle = Math.atan2(next.y - startWp.y, next.x - startWp.x);
    const itemBoxes = waypoints.filter((_, i) => i % 3 === 1).map((w) => ({
      x: w.x + (TRACK_SIZE / 2 - w.x) * 0.05,
      y: w.y + (TRACK_SIZE / 2 - w.y) * 0.05,
    }));
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
