/**
 * Twilight Crown — Start- & Pausenmenü (ALttP-Stil, scharfe Pixel-Schrift)
 */

import { isFullscreen } from './display.js';
import { drawText, FONT } from './font.js';

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
}

export function getStartOptions() {
  return [
    { id: 'new', label: 'Neues Abenteuer' },
    { id: 'controls', label: 'Steuerung' },
    { id: 'lore', label: 'Die Legende' },
    { id: 'fullscreen', label: isFullscreen() ? 'Fenster' : 'Vollbild' },
  ];
}

export function getPauseOptions() {
  return [
    { id: 'resume', label: 'Fortsetzen' },
    { id: 'controls', label: 'Steuerung' },
    { id: 'fullscreen', label: isFullscreen() ? 'Fenster' : 'Vollbild' },
    { id: 'title', label: 'Zum Titel' },
  ];
}

export const START_OPTIONS = getStartOptions();
export const PAUSE_OPTIONS = getPauseOptions();

export function createMenuState(options) {
  return { index: 0, options: options || getStartOptions(), panel: null };
}

export function refreshMenuLabels(menu, kind = 'start') {
  if (!menu) return;
  const next = kind === 'pause' ? getPauseOptions() : getStartOptions();
  const prevId = menu.options?.[menu.index]?.id;
  menu.options = next;
  const idx = next.findIndex((o) => o.id === prevId);
  if (idx >= 0) menu.index = idx;
}

export function moveMenu(menu, dy) {
  if (!menu?.options?.length) return;
  if (menu.panel) return;
  const n = menu.options.length;
  menu.index = (menu.index + dy + n) % n;
}

export function currentOption(menu) {
  return menu?.options?.[menu.index] || null;
}

function drawStars(ctx, frame) {
  for (let i = 0; i < 42; i++) {
    const x = (i * 53 + 7) % 256;
    const y = (i * 29 + 11) % 128;
    const phase = (frame + i * 7) % 60;
    const bright = phase < 8 || phase > 52;
    const mid = phase > 20 && phase < 40;
    const color = bright ? '#fff8ff' : mid ? '#a8b0e0' : '#485078';
    px(ctx, x, y, bright && i % 5 === 0 ? 2 : 1, bright && i % 5 === 0 ? 2 : 1, color);
  }
}

function drawMoon(ctx, frame) {
  const mx = 214;
  const my = 28;
  const g = 0.08 + Math.sin(frame * 0.04) * 0.04;
  px(ctx, mx - 4, my - 10, 18, 18, `rgba(180,200,255,${g})`);
  px(ctx, mx, my - 7, 12, 12, '#d8e0f8');
  px(ctx, mx + 2, my - 5, 8, 8, '#e8f0ff');
  px(ctx, mx + 4, my - 4, 3, 3, '#b0b8d0');
}

function drawCrown(ctx, cx, cy, frame) {
  const bob = Math.sin(frame * 0.06) * 1.5;
  const y = cy + bob;
  const glow = 0.25 + Math.sin(frame * 0.09) * 0.2;

  px(ctx, cx - 18, y + 4, 36, 6, `rgba(248,208,72,${glow * 0.45})`);
  px(ctx, cx - 16, y + 2, 32, 4, `rgba(136,232,255,${glow * 0.35})`);

  px(ctx, cx - 14, y + 2, 28, 7, '#6a4810');
  px(ctx, cx - 13, y + 3, 26, 5, '#c89828');
  px(ctx, cx - 12, y + 4, 24, 3, '#f0d048');
  px(ctx, cx - 14, y + 2, 28, 1, '#181008');
  px(ctx, cx - 14, y + 8, 28, 1, '#181008');

  px(ctx, cx - 12, y - 4, 5, 8, '#c89828');
  px(ctx, cx - 11, y - 3, 3, 6, '#f8e070');
  px(ctx, cx - 3, y - 9, 6, 13, '#f0d048');
  px(ctx, cx - 2, y - 8, 4, 11, '#fff0a0');
  px(ctx, cx + 7, y - 4, 5, 8, '#c89828');
  px(ctx, cx + 8, y - 3, 3, 6, '#f8e070');

  const pulse = (frame + 10) % 30 < 15;
  px(ctx, cx - 1, y - 11, 2, 3, pulse ? '#88e8ff' : '#4888c8');
  px(ctx, cx - 10, y - 5, 2, 2, pulse ? '#f868a8' : '#a03868');
  px(ctx, cx + 9, y - 5, 2, 2, pulse ? '#88e8ff' : '#4888c8');
  px(ctx, cx - 1, y + 4, 2, 2, '#88e8ff');
}

function drawTownSilhouette(ctx, frame) {
  px(ctx, 0, 188, 256, 36, '#06040e');
  px(ctx, 0, 178, 70, 20, '#0c0818');
  px(ctx, 50, 172, 90, 28, '#0a0814');
  px(ctx, 160, 170, 96, 30, '#0c0818');

  const baseY = 178;
  px(ctx, 28, baseY - 10, 22, 14, '#080610');
  px(ctx, 26, baseY - 14, 26, 5, '#080610');
  px(ctx, 36, baseY - 18, 6, 5, '#080610');
  px(ctx, 108, baseY - 28, 20, 32, '#080610');
  px(ctx, 104, baseY - 34, 28, 8, '#080610');
  px(ctx, 114, baseY - 42, 8, 10, '#080610');
  px(ctx, 116, baseY - 46, 4, 5, '#080610');
  px(ctx, 190, baseY - 12, 28, 16, '#080610');
  px(ctx, 188, baseY - 16, 32, 5, '#080610');
  px(ctx, 210, baseY - 26, 10, 20, '#080610');
  px(ctx, 118, 200, 20, 24, '#100c1c');
  px(ctx, 122, 198, 12, 26, '#141020');

  [
    [34, baseY - 4], [42, baseY - 4],
    [114, baseY - 18], [118, baseY - 12], [122, baseY - 18],
    [198, baseY - 6], [206, baseY - 6], [213, baseY - 18],
  ].forEach(([wx, wy], i) => {
    const on = ((frame + i * 11) % 50) < 38;
    px(ctx, wx, wy, 2, 2, on ? '#f0c048' : '#3a2810');
  });
}

function drawMotes(ctx, frame) {
  for (let i = 0; i < 12; i++) {
    const x = (i * 61 + frame * (0.15 + (i % 3) * 0.05)) % 256;
    const y = 100 + ((i * 37 + frame * 0.08) % 90);
    const a = 0.25 + ((frame + i * 9) % 40) / 80;
    px(ctx, x, y, 1, 1, `rgba(248,220,120,${a})`);
  }
}

function drawPanel(ctx, x, y, w, h) {
  px(ctx, x + 3, y + 3, w, h, 'rgba(0,0,0,0.45)');
  px(ctx, x, y, w, h, 'rgba(10,8,28,0.94)');
  ctx.strokeStyle = '#c89828';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = '#68c8e8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  [[x + 2, y + 2], [x + w - 5, y + 2], [x + 2, y + h - 5], [x + w - 5, y + h - 5]]
    .forEach(([jx, jy]) => {
      px(ctx, jx, jy, 3, 3, '#f0d048');
      px(ctx, jx + 1, jy + 1, 1, 1, '#88e8ff');
    });
}

function drawHeartCursor(ctx, x, y, frame) {
  const bob = Math.sin(frame * 0.2) * 1;
  const hx = Math.floor(x);
  const hy = Math.floor(y + bob);
  px(ctx, hx + 1, hy, 2, 1, '#f05070');
  px(ctx, hx + 4, hy, 2, 1, '#f05070');
  px(ctx, hx, hy + 1, 7, 3, '#f05070');
  px(ctx, hx + 1, hy + 4, 5, 1, '#f05070');
  px(ctx, hx + 2, hy + 5, 3, 1, '#e03858');
  px(ctx, hx + 3, hy + 6, 1, 1, '#c02848');
  px(ctx, hx + 1, hy + 1, 1, 1, '#ffb0c0');
}

function drawOptions(ctx, options, index, ox, oy, frame) {
  options.forEach((opt, i) => {
    const selected = i === index;
    const y = oy + i * 14;
    if (selected) {
      px(ctx, ox - 14, y - 2, 156, 11, 'rgba(72,48,140,0.55)');
      px(ctx, ox - 14, y - 2, 156, 1, 'rgba(136,232,255,0.25)');
      drawHeartCursor(ctx, ox - 12, y, frame);
    }
    drawText(ctx, opt.label, ox + 4, y, {
      color: selected ? '#fff8e0' : '#a8b0d0',
      scale: 1,
      shadow: '#080610',
    });
  });
}

function drawTitleLogo(ctx, frame) {
  drawCrown(ctx, 128, 28, frame);
  drawText(ctx, 'TWILIGHT', 128, 48, { color: '#a8f0ff', scale: 2, align: 'center', shadow: '#081028' });
  drawText(ctx, 'CROWN', 128, 68, { color: '#f8e070', scale: 2, align: 'center', shadow: '#281808' });
  drawText(ctx, '- Krone der Dämmerung -', 128, 90, { color: '#d0c0e8', scale: 1, align: 'center' });
}

export function drawStartMenu(ctx, menu, frame) {
  for (let y = 0; y < 224; y++) {
    const t = y / 224;
    let r; let g; let b;
    if (t < 0.45) {
      const u = t / 0.45;
      r = Math.floor(6 + u * 18);
      g = Math.floor(4 + u * 10);
      b = Math.floor(22 + u * 36);
    } else if (t < 0.72) {
      const u = (t - 0.45) / 0.27;
      r = Math.floor(24 + u * 70);
      g = Math.floor(14 + u * 20);
      b = Math.floor(58 + u * 20);
    } else {
      const u = (t - 0.72) / 0.28;
      r = Math.floor(94 + u * 40);
      g = Math.floor(34 + u * 10);
      b = Math.floor(48 - u * 20);
    }
    px(ctx, 0, y, 256, 1, `rgb(${r},${g},${b})`);
  }

  px(ctx, 0, 152, 256, 8, 'rgba(255,120,60,0.18)');
  px(ctx, 0, 160, 256, 14, 'rgba(160,48,120,0.22)');

  drawMoon(ctx, frame);
  drawStars(ctx, frame);
  drawMotes(ctx, frame);
  drawTownSilhouette(ctx, frame);
  px(ctx, 0, 0, 256, 12, 'rgba(0,0,0,0.35)');
  px(ctx, 0, 212, 256, 12, 'rgba(0,0,0,0.4)');

  drawTitleLogo(ctx, frame);

  if (menu.panel === 'controls') {
    drawPanel(ctx, 20, 102, 216, 104);
    drawText(ctx, 'Steuerung', 128, 112, { color: '#f0d048', scale: 1, align: 'center' });
    [
      'Bewegen   Stick / WASD',
      'A / Space Schwert & Reden',
      'B / Z     Item · Bombe',
      'Start/Esc Pause',
      'F         Vollbild',
    ].forEach((line, i) => {
      drawText(ctx, line, 32, 128 + i * FONT.lineHeight(1), { color: '#e8e0f8', scale: 1 });
    });
    drawText(ctx, 'A / Enter - zurück', 128, 186, { color: '#88e8ff', scale: 1, align: 'center' });
    return;
  }

  if (menu.panel === 'lore') {
    drawPanel(ctx, 12, 100, 232, 108);
    drawText(ctx, 'Die Legende', 128, 110, { color: '#f0d048', scale: 1, align: 'center' });
    [
      'Als die Twilight Crown erlosch,',
      'fiel Dämmerung über Kronendorf.',
      'Drei Schattenkrypten halten ihr',
      'Licht gefangen. Nur ein Held mit',
      'der Aether-Klinge kann die Krone',
      'wiedererwecken...',
    ].forEach((line, i) => {
      drawText(ctx, line, 24, 126 + i * FONT.lineHeight(1), { color: '#e8e0f8', scale: 1 });
    });
    drawText(ctx, 'A / Enter - zurück', 128, 190, { color: '#88e8ff', scale: 1, align: 'center' });
    return;
  }

  drawPanel(ctx, 40, 102, 176, 90);
  drawOptions(ctx, menu.options, menu.index, 68, 114, frame);

  if (frame % 48 < 30) {
    drawText(ctx, '↑↓ wählen  ·  A / Enter', 128, 206, {
      color: '#f0e8d0',
      scale: 1,
      align: 'center',
    });
  }
}

export function drawPauseMenu(ctx, menu, frame, stats = {}) {
  px(ctx, 0, 0, 256, 224, 'rgba(4,4,20,0.78)');
  drawPanel(ctx, 32, 20, 192, 184);

  drawText(ctx, 'TWILIGHT CROWN', 128, 32, { color: '#88e8ff', scale: 1, align: 'center' });
  drawText(ctx, '- Pause -', 128, 46, { color: '#c89828', scale: 1, align: 'center' });

  if (menu.panel === 'controls') {
    drawText(ctx, 'Steuerung', 128, 68, { color: '#f0d048', scale: 1, align: 'center' });
    [
      'A        Schwert / Reden',
      'B        Item / Bombe',
      'Start/Esc Pause',
      'F        Vollbild',
      'Stick    Bewegen',
    ].forEach((line, i) => {
      drawText(ctx, line, 48, 86 + i * FONT.lineHeight(1), { color: '#e0e0f0', scale: 1 });
    });
    drawText(ctx, 'A - zurück', 128, 170, { color: '#88e8ff', scale: 1, align: 'center' });
    return;
  }

  drawText(ctx, `Rubine ${String(stats.rupees ?? 0).padStart(3, '0')}`, 48, 66, { color: '#a8b0d0', scale: 1 });
  drawText(ctx, `Bomben ${String(stats.bombs ?? 0).padStart(2, '0')}`, 148, 66, { color: '#a8b0d0', scale: 1 });
  drawText(ctx, `Leben ${stats.hp ?? 0}/${stats.maxHp ?? 0}`, 48, 80, { color: '#a8b0d0', scale: 1 });

  drawCrown(ctx, 128, 100, frame);
  drawOptions(ctx, menu.options, menu.index, 68, 122, frame);
  drawText(ctx, 'Start / Esc - fortsetzen', 128, 186, { color: '#687098', scale: 1, align: 'center' });
}
