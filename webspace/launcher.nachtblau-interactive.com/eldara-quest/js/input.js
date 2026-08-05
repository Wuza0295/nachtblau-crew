const keys = {};
const justPressed = new Set();
const virtualHeld = { up: false, down: false, left: false, right: false };
const virtualPressed = new Set();

export const ACTION = {
  ATTACK: 'attack',
  ITEM: 'item',
  INTERACT: 'interact',
  CONFIRM: 'confirm',
  STAIRS: 'stairs',
};

const ACTION_BINDINGS = {
  [ACTION.ATTACK]: ['Space', 'KeyX', 'Gamepad_A'],
  [ACTION.ITEM]: ['KeyZ', 'KeyC', 'Gamepad_B'],
  [ACTION.INTERACT]: ['KeyE', 'Gamepad_X'],
  [ACTION.CONFIRM]: ['Enter', 'Gamepad_Start'],
  [ACTION.STAIRS]: ['ArrowDown', 'Gamepad_Y'],
};

let touchEnabled = false;
let gamepadIndex = null;
const DEADZONE = 0.38;

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
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
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
    if (gamepadIndex === e.gamepad.index) gamepadIndex = null;
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

function getGamepad() {
  if (gamepadIndex === null) return null;
  const pads = navigator.getGamepads?.();
  return pads?.[gamepadIndex] ?? null;
}

function pollGamepadMovement() {
  const gp = getGamepad();
  if (!gp) return { dx: 0, dy: 0 };

  let dx = gp.axes[0] ?? 0;
  let dy = gp.axes[1] ?? 0;
  if (Math.abs(dx) < DEADZONE) dx = 0;
  if (Math.abs(dy) < DEADZONE) dy = 0;

  if (gp.buttons[12]?.pressed) dy = -1;
  if (gp.buttons[13]?.pressed) dy = 1;
  if (gp.buttons[14]?.pressed) dx = -1;
  if (gp.buttons[15]?.pressed) dx = 1;

  if (dx && dy) {
    dx *= 0.707;
    dy *= 0.707;
  }
  return { dx, dy };
}

function pollGamepadPressed() {
  const gp = getGamepad();
  if (!gp) return;
  const map = [
    [0, 'Gamepad_A'],
    [1, 'Gamepad_B'],
    [2, 'Gamepad_X'],
    [3, 'Gamepad_Y'],
    [9, 'Gamepad_Start'],
  ];
  for (const [idx, code] of map) {
    if (gp.buttons[idx]?.pressed && !keys[code]) justPressed.add(code);
    keys[code] = !!gp.buttons[idx]?.pressed;
  }
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

  if (dx && dy && !gpMove.dx) {
    dx *= 0.707;
    dy *= 0.707;
  }
  return { dx, dy };
}

export function isTouchActive() {
  return touchEnabled;
}
