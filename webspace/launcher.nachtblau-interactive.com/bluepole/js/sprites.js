/**
 * Modern sleek kart sprites — gradients, soft shapes, neon accents.
 */

import { NB } from './constants.js?v=8';

const cache = new Map();

function shade(hex, amt) {
  const n = String(hex).replace('#', '');
  if (n.length < 6) return hex;
  const num = parseInt(n, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  return `#${(
    (Math.max(0, Math.min(255, r)) << 16) |
    (Math.max(0, Math.min(255, g)) << 8) |
    Math.max(0, Math.min(255, b))
  ).toString(16).padStart(6, '0')}`;
}

function paintKart(body, accent, skinL, skinR) {
  const key = `m:${body}:${accent}:${skinL}:${skinR}`;
  if (cache.has(key)) return cache.get(key);

  const W = 96;
  const H = 72;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');

  // soft shadow
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.ellipse(48, 66, 30, 5, 0, 0, Math.PI * 2);
  g.fill();

  // rear tires
  const tireGrad = g.createLinearGradient(0, 40, 0, 68);
  tireGrad.addColorStop(0, '#2a2a32');
  tireGrad.addColorStop(1, '#0a0a10');
  for (const tx of [10, 70]) {
    g.fillStyle = tireGrad;
    roundRect(g, tx, 42, 16, 22, 4);
    g.fill();
    g.fillStyle = '#5eeaff33';
    roundRect(g, tx + 4, 48, 8, 8, 2);
    g.fill();
  }

  // body shell
  const bodyGrad = g.createLinearGradient(20, 28, 76, 62);
  bodyGrad.addColorStop(0, shade(body, 40));
  bodyGrad.addColorStop(0.45, body);
  bodyGrad.addColorStop(1, shade(body, -50));
  g.fillStyle = bodyGrad;
  g.beginPath();
  g.moveTo(22, 52);
  g.quadraticCurveTo(20, 36, 30, 30);
  g.lineTo(66, 30);
  g.quadraticCurveTo(76, 36, 74, 52);
  g.quadraticCurveTo(70, 60, 48, 62);
  g.quadraticCurveTo(26, 60, 22, 52);
  g.closePath();
  g.fill();

  // accent hood stripe
  g.fillStyle = accent;
  g.globalAlpha = 0.85;
  g.beginPath();
  g.moveTo(40, 32);
  g.lineTo(56, 32);
  g.lineTo(54, 58);
  g.lineTo(42, 58);
  g.closePath();
  g.fill();
  g.globalAlpha = 1;

  // glass canopy
  const glass = g.createLinearGradient(34, 18, 62, 36);
  glass.addColorStop(0, 'rgba(168,230,255,0.55)');
  glass.addColorStop(1, 'rgba(12,30,56,0.65)');
  g.fillStyle = glass;
  g.beginPath();
  g.moveTo(34, 34);
  g.quadraticCurveTo(48, 14, 62, 34);
  g.quadraticCurveTo(48, 38, 34, 34);
  g.fill();
  g.strokeStyle = 'rgba(238,246,255,0.35)';
  g.lineWidth = 1.5;
  g.stroke();

  // spoiler
  g.fillStyle = shade(accent, -30);
  roundRect(g, 28, 24, 40, 5, 2);
  g.fill();
  g.fillStyle = NB.cyan;
  g.globalAlpha = 0.5;
  g.fillRect(30, 24, 36, 2);
  g.globalAlpha = 1;

  // riders (stylized heads)
  drawPilot(g, 38, 20, skinL, accent);
  drawPilot(g, 52, 20, skinR, body);

  // neon underglow
  g.fillStyle = NB.cyan;
  g.globalAlpha = 0.35;
  g.beginPath();
  g.ellipse(48, 60, 22, 3, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;

  // exhaust glow
  g.fillStyle = '#ffaa66';
  g.globalAlpha = 0.7;
  g.beginPath();
  g.arc(36, 58, 3, 0, Math.PI * 2);
  g.arc(60, 58, 3, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;

  cache.set(key, c);
  return c;
}

function drawPilot(g, x, y, skin, outfit) {
  // helmet
  const hg = g.createRadialGradient(x, y, 1, x, y, 9);
  hg.addColorStop(0, shade(outfit, 30));
  hg.addColorStop(1, shade(outfit, -40));
  g.fillStyle = hg;
  g.beginPath();
  g.arc(x, y, 8, 0, Math.PI * 2);
  g.fill();
  // visor
  g.fillStyle = 'rgba(10,20,40,0.75)';
  g.beginPath();
  g.ellipse(x, y + 1, 5, 3.5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(168,230,255,0.35)';
  g.fillRect(x - 3, y - 1, 6, 1.5);
  // neck / suit
  g.fillStyle = outfit;
  roundRect(g, x - 5, y + 7, 10, 8, 2);
  g.fill();
  // skin hint at chin
  g.fillStyle = skin;
  g.globalAlpha = 0.35;
  g.beginPath();
  g.arc(x, y + 4, 2, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function drawKartRear(ctx, x, y, scale, opts) {
  const {
    body = '#3a8fd4',
    accent = '#a8e6ff',
    driver = '#f0c898',
    passenger = '#e0b080',
    lean = 0,
    shrink = 1,
    drifting = false,
    turboTier = 0,
    invuln = false,
  } = opts;

  const sheet = paintKart(body, accent, passenger, driver);
  const s = Math.max(0.35, scale * shrink);
  const w = 96 * s;
  const h = 72 * s;
  const L = lean * w * 0.1;
  const dx = x - w / 2 + L;
  const dy = y - h + 4;

  ctx.save();
  if (invuln && ((performance.now() / 70) | 0) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }
  ctx.drawImage(sheet, dx, dy, w, h);
  ctx.restore();

  if (drifting || turboTier > 0) {
    const col = turboTier >= 2 ? NB.cyan : turboTier >= 1 ? NB.boost : '#ff7ab8';
    ctx.save();
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    const sy = y - 4;
    ctx.beginPath();
    ctx.arc(x - w * 0.42, sy, 4 * s, 0, Math.PI * 2);
    ctx.arc(x + w * 0.42, sy, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    if (turboTier >= 2) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - w * 0.38, sy - 14 * s, 3 * s, 12 * s);
      ctx.fillRect(x + w * 0.35, sy - 14 * s, 3 * s, 12 * s);
    }
    ctx.restore();
  }
}

export function drawKartBillboard(ctx, x, y, scale, opts) {
  drawKartRear(ctx, x, y, Math.max(0.4, scale), opts);
}

export function drawQuestionBox(ctx, x, y, scale, time, id = 0) {
  const s = Math.max(6, scale);
  const bob = Math.sin(time * 4 + id) * s * 0.15;
  const rot = Math.sin(time * 2 + id) * 0.15;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.rotate(rot);

  ctx.shadowColor = NB.cyan;
  ctx.shadowBlur = 10;
  const grd = ctx.createLinearGradient(-s / 2, -s, s / 2, 0);
  grd.addColorStop(0, '#1a3a6a');
  grd.addColorStop(0.5, '#3a8fd4');
  grd.addColorStop(1, '#a8e6ff');
  ctx.fillStyle = grd;
  roundRect(ctx, -s / 2, -s, s, s, s * 0.15);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(238,246,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.max(10, s * 0.55)}px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, -s / 2);
  ctx.restore();
}

export function drawBananaSprite(ctx, x, y, s) {
  ctx.fillStyle = '#f5e040';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.55, s * 0.28, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a9020';
  ctx.fillRect(x - 2, y - s * 0.4, 4, s * 0.25);
}

export function drawShellSprite(ctx, x, y, s, color) {
  const fill = color === 'red' ? '#e83850' : color === 'shadow' ? '#5060ff' : '#2ecc71';
  ctx.save();
  ctx.shadowColor = fill;
  ctx.shadowBlur = 8;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.1, s * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - s * 0.12, y - s * 0.25, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawItemIcon(ctx, x, y, size, item) {
  if (!item) return;
  const s = size * 0.5;
  const cx = x + size / 2;
  const cy = y + size / 2 + 2;
  if (item === 'banana') drawBananaSprite(ctx, cx, cy, s);
  else if (item === 'green' || item === 'red') drawShellSprite(ctx, cx, cy, s, item);
  else if (item === 'mushroom' || item === 'triple_mushroom') {
    ctx.fillStyle = '#e84878';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, s * 0.45, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5ebe0';
    ctx.fillRect(cx - s * 0.25, cy, s * 0.5, s * 0.35);
  } else if (item === 'star') {
    ctx.fillStyle = NB.boost;
    ctx.shadowColor = NB.boost;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (item === 'lightning') {
    ctx.fillStyle = NB.boost;
    ctx.font = `bold ${s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⚡', cx, cy + s * 0.25);
  } else if (item === 'special') {
    ctx.fillStyle = NB.cyan;
    ctx.shadowColor = NB.cyan;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = NB.mid;
    ctx.font = `bold ${s * 0.45}px Orbitron,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NB', cx, cy);
  } else if (item === 'fake') {
    drawQuestionBox(ctx, cx, cy + s / 4, s * 0.85, 0, 0);
  }
}

export function drawCharFace(ctx, x, y, size, color, accent) {
  const s = size;
  const grd = ctx.createRadialGradient(x + s / 2, y + s / 3, 2, x + s / 2, y + s / 2, s / 2);
  grd.addColorStop(0, shade(color, 30));
  grd.addColorStop(1, shade(color, -40));
  ctx.fillStyle = 'rgba(4,10,20,0.8)';
  roundRect(ctx, x, y, s, s, 8);
  ctx.fill();
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2, s * 0.36, 0, Math.PI * 2);
  ctx.fill();
  // visor
  ctx.fillStyle = 'rgba(10,20,40,0.7)';
  ctx.beginPath();
  ctx.ellipse(x + s / 2, y + s * 0.52, s * 0.22, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawNbBadge(ctx, x, y, size = 20) {
  ctx.save();
  ctx.fillStyle = NB.mid;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = NB.accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // moon
  ctx.fillStyle = NB.moon;
  ctx.beginPath();
  ctx.arc(x + size * 0.62, y + size * 0.32, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = NB.mid;
  ctx.beginPath();
  ctx.arc(x + size * 0.7, y + size * 0.28, size * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = NB.cyan;
  ctx.font = `bold ${size * 0.32}px Orbitron,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NB', x + size / 2, y + size * 0.72);
  ctx.restore();
}
