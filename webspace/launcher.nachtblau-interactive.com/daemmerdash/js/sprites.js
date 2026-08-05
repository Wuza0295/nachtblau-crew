/**
 * SNES Super-Mario-Kart-style pixel sprites (original NachtBlau cast).
 * Drawn procedurally at runtime — no Nintendo assets.
 */

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function shade(hex, amt) {
  const n = hex.replace('#', '');
  const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Classic SMK rear-view kart with two riders (Double Dash).
 * lean: -1..1 from steering / drift
 */
export function drawKartRear(ctx, x, y, scale, opts) {
  const {
    body = '#7ec8ff',
    accent = '#6b5cff',
    driver = '#e8b878',
    passenger = '#c4a070',
    lean = 0,
    shrink = 1,
    flash = false,
    drifting = false,
    turboTier = 0,
    invuln = false,
  } = opts;

  const s = scale * shrink;
  const L = lean * s * 3;
  const ox = x + L;
  const oy = y;
  const col = flash || (invuln && ((performance.now() / 50) | 0) % 2 === 0) ? '#ffffff' : body;
  const colD = shade(col, -30);
  const colL = shade(col === '#ffffff' ? body : col, 40);

  // shadow
  px(ctx, ox - s * 10, oy + s * 2, s * 20, s * 3, 'rgba(0,0,0,0.35)');

  // rear bumper / body
  px(ctx, ox - s * 9, oy - s * 6, s * 18, s * 8, col);
  px(ctx, ox - s * 8, oy - s * 5, s * 16, s * 2, colL);
  px(ctx, ox - s * 9, oy + s * 1, s * 18, s * 2, colD);

  // side pods
  px(ctx, ox - s * 11, oy - s * 4, s * 3, s * 5, colD);
  px(ctx, ox + s * 8, oy - s * 4, s * 3, s * 5, colD);

  // seat / cockpit
  px(ctx, ox - s * 6, oy - s * 9, s * 12, s * 4, '#2a2038');

  // passenger (left) + driver (right) — Double Dash
  drawRider(ctx, ox - s * 4, oy - s * 14, s, passenger, accent);
  drawRider(ctx, ox + s * 2, oy - s * 14, s, driver, body);

  // steering wheel hint
  px(ctx, ox - s * 1, oy - s * 8, s * 2, s * 1, '#1a1428');

  // rear wheels
  px(ctx, ox - s * 12, oy - s * 2, s * 4, s * 5, '#1a1a22');
  px(ctx, ox + s * 8, oy - s * 2, s * 4, s * 5, '#1a1a22');
  px(ctx, ox - s * 11, oy - s * 1, s * 2, s * 2, '#555');
  px(ctx, ox + s * 9, oy - s * 1, s * 2, s * 2, '#555');

  // exhaust / spoiler
  px(ctx, ox - s * 5, oy - s * 7, s * 10, s * 1, shade(accent, -20));

  // drift sparks / mini-turbo
  if (drifting || turboTier > 0) {
    const spark = turboTier >= 2 ? '#7ec8ff' : turboTier >= 1 ? '#ffe566' : '#ff7ab8';
    px(ctx, ox - s * 14, oy + s * 1, s * 3, s * 2, spark);
    px(ctx, ox + s * 11, oy + s * 1, s * 3, s * 2, spark);
    if (turboTier >= 2) {
      px(ctx, ox - s * 13, oy - s * 1, s * 2, s * 2, '#fff');
      px(ctx, ox + s * 11, oy - s * 1, s * 2, s * 2, '#fff');
    }
  }
}

function drawRider(ctx, x, y, s, skin, outfit) {
  // head
  px(ctx, x, y, s * 4, s * 4, skin);
  // eyes
  px(ctx, x + s * 1, y + s * 1, s * 1, s * 1, '#1a1020');
  px(ctx, x + s * 2.5, y + s * 1, s * 1, s * 1, '#1a1020');
  // body / torso
  px(ctx, x, y + s * 4, s * 4, s * 4, outfit);
  // arms
  px(ctx, x - s * 1, y + s * 5, s * 1, s * 2, skin);
  px(ctx, x + s * 4, y + s * 5, s * 1, s * 2, skin);
}

/**
 * Billboard kart for other racers — approximate rear/¾ view.
 */
export function drawKartBillboard(ctx, x, y, scale, opts) {
  drawKartRear(ctx, x, y, Math.max(0.35, scale), opts);
}

/** Spinning ? item box like SMK */
export function drawQuestionBox(ctx, x, y, scale, time, id = 0) {
  const s = Math.max(3, scale);
  const bob = Math.sin(time * 5 + id) * s * 0.25;
  const spin = ((time * 3 + id) % (Math.PI * 2));
  const squash = 0.7 + Math.abs(Math.cos(spin)) * 0.3;
  const w = s * squash;
  const h = s;
  const ox = x;
  const oy = y - bob;

  px(ctx, ox - w / 2, oy - h, w, h, '#e8a020');
  px(ctx, ox - w / 2 + 1, oy - h + 1, w - 2, h - 2, '#ffd040');
  // ?
  ctx.fillStyle = '#fff8d0';
  ctx.font = `bold ${Math.max(6, s * 0.7)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('?', ox, oy - h * 0.28);
  ctx.textAlign = 'left';
  // shine
  px(ctx, ox - w / 2 + 2, oy - h + 2, Math.max(1, w * 0.2), Math.max(1, h * 0.2), '#fff6a0');
}

export function drawBananaSprite(ctx, x, y, s) {
  px(ctx, x - s / 2, y - s / 2, s, s * 0.45, '#f5e642');
  px(ctx, x - s / 3, y - s / 2 - 1, s * 0.25, s * 0.25, '#3a8020');
}

export function drawShellSprite(ctx, x, y, s, color) {
  const fill = color === 'red' ? '#ff4040' : color === 'shadow' ? '#5040ff' : '#30d060';
  px(ctx, x - s / 2, y - s / 2, s, s * 0.7, fill);
  px(ctx, x - s / 4, y - s / 2 - 1, s / 2, s * 0.25, shade(fill, 40));
  px(ctx, x - s / 3, y - s / 4, s * 0.2, s * 0.2, '#fff');
}

export function drawItemIcon(ctx, x, y, size, item) {
  if (!item) return;
  const s = size * 0.55;
  const cx = x + size / 2;
  const cy = y + size / 2;
  if (item === 'banana') drawBananaSprite(ctx, cx, cy, s);
  else if (item === 'green' || item === 'red' || item === 'shadow') {
    drawShellSprite(ctx, cx, cy, s, item === 'green' ? 'green' : item === 'red' ? 'red' : 'shadow');
  } else if (item === 'mushroom' || item === 'triple_mushroom') {
    px(ctx, cx - s / 2, cy - s / 3, s, s * 0.55, '#ff5080');
    px(ctx, cx - s / 3, cy - s / 3, s * 0.25, s * 0.25, '#fff');
    px(ctx, cx - s / 3, cy, s * 0.66, s * 0.35, '#f0e0d0');
  } else if (item === 'star') {
    px(ctx, cx - s / 3, cy - s / 2, s * 0.66, s, '#ffe566');
  } else if (item === 'lightning') {
    px(ctx, cx - s / 4, cy - s / 2, s / 2, s, '#fff06a');
  } else if (item === 'special') {
    px(ctx, cx - s / 2, cy - s / 2, s, s, '#c9a0ff');
    px(ctx, cx - s / 4, cy - s / 4, s / 2, s / 2, '#fff');
  } else if (item === 'fake') {
    drawQuestionBox(ctx, cx, cy + s / 2, s, 0, 0);
  } else {
    px(ctx, cx - s / 2, cy - s / 2, s, s, '#aaa');
  }
}

/** Tiny face for character select / HUD slot */
export function drawCharFace(ctx, x, y, size, color, accent) {
  px(ctx, x, y, size, size, color);
  px(ctx, x + size * 0.2, y + size * 0.3, size * 0.15, size * 0.15, '#1a1020');
  px(ctx, x + size * 0.55, y + size * 0.3, size * 0.15, size * 0.15, '#1a1020');
  px(ctx, x + size * 0.25, y + size * 0.65, size * 0.5, size * 0.12, accent);
}
