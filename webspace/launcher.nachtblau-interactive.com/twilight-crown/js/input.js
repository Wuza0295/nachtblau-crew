const keys = {};
const justPressed = new Set();
const virtualHeld = { up: false, down: false, left: false, right: false };
const virtualPressed = new Set();

export const ACTION = {
  ATTACK: 'attack',
  ITEM: 'item',
  INTERACT: 'interact',
  CONFIRM: 'confirm',
  PAUSE: 'pause',
  STAIRS: 'stairs',
};

/** SNES/Xbox-style layout mapped for ALttP feel */
const ACTION_BINDINGS = {
  [ACTION.ATTACK]: ['Space', 'KeyX', 'Gamepad_A', 'Gamepad_RB'],
  [ACTION.ITEM]: ['KeyZ', 'KeyC', 'Gamepad_B', 'Gamepad_LB'],
  [ACTION.INTERACT]: ['KeyE', 'Gamepad_X', 'Gamepad_Select'],
  [ACTION.CONFIRM]: ['Enter', 'Gamepad_A'],
  [ACTION.PAUSE]: ['Escape', 'Gamepad_Start', 'KeyP'],
  [ACTION.STAIRS]: ['ArrowDown', 'Gamepad_Y'],
};

let touchEnabled = false;
let gamepadIndex = null;
let prevPadButtons = {};
const DEADZONE = 0.32;

function pressAction(action) {
  virtualPressed.add(action);
}

function setVirtualDir(dir, active) {
  virtualHeld[dir] = active;
}

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) justPressed.add(e.code);
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  window.addEventListener('gamepadconnected', (e) => {
    gamepadIndex = e.gamepad.index;
  });
  window.addEventListener('gamepaddisconnected', (e) => {
    if (gamepadIndex === e.gamepad.index) {
      gamepadIndex = null;
      prevPadButtons = {};
    }
  });

  initTouchControls();
}

function initTouchControls() {
  const root = document.getElementById('touch-controls');
  if (!root) return;

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch || window.matchMedia('(max-width: 900px)').matches) {
    root.classList.add('visible');
    touchEnabled = true;
  }

  const bindBtn = (el, onDown, onUp) => {
    const down = (e) => { e.preventDefault(); onDown(); };
    const up = (e) => { e.preventDefault(); onUp(); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  };

  root.querySelectorAll('[data-dir]').forEach((btn) => {
    const dir = btn.dataset.dir;
    bindBtn(btn, () => setVirtualDir(dir, true), () => setVirtualDir(dir, false));
  });

  root.querySelectorAll('[data-action]').forEach((btn) => {
    const action = btn.dataset.action;
    bindBtn(btn, () => pressAction(action), () => {});
  });
}

function resolveGamepad() {
  const pads = navigator.getGamepads?.();
  if (!pads) return null;

  if (gamepadIndex !== null && pads[gamepadIndex]) {
    return pads[gamepadIndex];
  }

  for (let i = 0; i < pads.length; i++) {
    if (pads[i]) {
      gamepadIndex = i;
      return pads[i];
    }
  }
  return null;
}

function pollGamepadMovement() {
  const gp = resolveGamepad();
  if (!gp) return { dx: 0, dy: 0 };

  let dx = gp.axes[0] ?? 0;
  let dy = gp.axes[1] ?? 0;

  // Right stick ignored for movement (ALttP is left-stick / d-pad)
  if (Math.abs(dx) < DEADZONE) dx = 0;
  if (Math.abs(dy) < DEADZONE) dy = 0;

  // Digital snap when mostly axial
  if (Math.abs(dx) > Math.abs(dy) * 1.6) dy = 0;
  else if (Math.abs(dy) > Math.abs(dx) * 1.6) dx = 0;

  // D-pad overrides stick when pressed
  if (gp.buttons[12]?.pressed) { dx = 0; dy = -1; }
  if (gp.buttons[13]?.pressed) { dx = 0; dy = 1; }
  if (gp.buttons[14]?.pressed) { dx = -1; dy = 0; }
  if (gp.buttons[15]?.pressed) { dx = 1; dy = 0; }

  // Normalize diagonals from stick
  if (dx && dy && Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
  } else if (dx && dy) {
    dx *= 0.707;
    dy *= 0.707;
  }

  // Soft clamp
  dx = Math.max(-1, Math.min(1, dx));
  dy = Math.max(-1, Math.min(1, dy));
  return { dx, dy };
}

function pollGamepadPressed() {
  const gp = resolveGamepad();
  if (!gp) return;

  // Standard mapping + shoulders + select
  const map = [
    [0, 'Gamepad_A'],
    [1, 'Gamepad_B'],
    [2, 'Gamepad_X'],
    [3, 'Gamepad_Y'],
    [4, 'Gamepad_LB'],
    [5, 'Gamepad_RB'],
    [8, 'Gamepad_Select'],
    [9, 'Gamepad_Start'],
    [12, 'Gamepad_DpadUp'],
    [13, 'Gamepad_DpadDown'],
    [14, 'Gamepad_DpadLeft'],
    [15, 'Gamepad_DpadRight'],
  ];

  for (const [idx, code] of map) {
    const pressed = !!gp.buttons[idx]?.pressed;
    const wasDown = !!prevPadButtons[code];
    if (pressed && !wasDown) justPressed.add(code);
    keys[code] = pressed;
    prevPadButtons[code] = pressed;
  }
}

/** Short rumble on supporting pads (hit / bomb). */
export function rumble(durationMs = 80, weak = 0.4, strong = 0.7) {
  const gp = resolveGamepad();
  const actuator = gp?.vibrationActuator;
  if (!actuator?.playEffect) return;
  try {
    actuator.playEffect('dual-rumble', {
      startDelay: 0,
      duration: durationMs,
      weakMagnitude: weak,
      strongMagnitude: strong,
    });
  } catch {
    /* ignore unsupported pads */
  }
}

export function isGamepadConnected() {
  return !!resolveGamepad();
}

export function isDown(code) {
  return !!keys[code];
}

export function wasPressed(code) {
  return justPressed.has(code);
}

export function wasActionPressed(action) {
  if (virtualPressed.has(action)) return true;
  const bindings = ACTION_BINDINGS[action] || [];
  return bindings.some((code) => wasPressed(code));
}

/** Edge-triggered vertical menu navigation (−1 / 0 / +1). */
export function getMenuNav() {
  pollGamepadPressed();
  if (wasPressed('ArrowUp') || wasPressed('KeyW') || wasPressed('Gamepad_DpadUp')) return -1;
  if (wasPressed('ArrowDown') || wasPressed('KeyS') || wasPressed('Gamepad_DpadDown')) return 1;
  return 0;
}

export function clearPressed() {
  justPressed.clear();
  virtualPressed.clear();
}

export function getMovement() {
  pollGamepadPressed();

  let dx = 0;
  let dy = 0;

  if (isDown('ArrowUp') || isDown('KeyW') || virtualHeld.up) dy -= 1;
  if (isDown('ArrowDown') || isDown('KeyS') || virtualHeld.down) dy += 1;
  if (isDown('ArrowLeft') || isDown('KeyA') || virtualHeld.left) dx -= 1;
  if (isDown('ArrowRight') || isDown('KeyD') || virtualHeld.right) dx += 1;

  const gpMove = pollGamepadMovement();
  if (gpMove.dx || gpMove.dy) {
    dx = gpMove.dx;
    dy = gpMove.dy;
  }

  if (dx && dy && !(gpMove.dx || gpMove.dy)) {
    dx *= 0.707;
    dy *= 0.707;
  }
  return { dx, dy };
}

export function isTouchActive() {
  return touchEnabled;
}
