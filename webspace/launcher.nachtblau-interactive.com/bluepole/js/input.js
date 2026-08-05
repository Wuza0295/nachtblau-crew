/** Keyboard + touch input */

const down = new Set();
const pressed = new Set();

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    const code = e.code;
    if (!down.has(code)) pressed.add(code);
    down.add(code);
  });
  window.addEventListener('keyup', (e) => {
    down.delete(e.code);
  });

  const touch = document.getElementById('touch-controls');
  if (touch) {
    touch.querySelectorAll('button[data-key]').forEach((btn) => {
      const code = btn.getAttribute('data-key');
      const on = (e) => {
        e.preventDefault();
        if (!down.has(code)) pressed.add(code);
        down.add(code);
      };
      const off = (e) => {
        e.preventDefault();
        down.delete(code);
      };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off);
      btn.addEventListener('touchcancel', off);
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
      btn.addEventListener('mouseleave', off);
    });
  }

  // Show touch on coarse pointers
  if (window.matchMedia('(pointer: coarse)').matches) {
    touch?.classList.remove('hidden');
  }

  canvas?.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas?.addEventListener('click', () => canvas.focus());
  // autofocus for keyboard
  setTimeout(() => canvas?.focus(), 50);
}

export function isDown(code) {
  return down.has(code);
}

export function wasPressed(code) {
  if (pressed.has(code)) {
    pressed.delete(code);
    return true;
  }
  return false;
}

export function clearPressed() {
  pressed.clear();
}

export function steerAxis() {
  let s = 0;
  if (isDown('ArrowLeft') || isDown('KeyA')) s -= 1;
  if (isDown('ArrowRight') || isDown('KeyD')) s += 1;
  return s;
}

export function throttle() {
  if (isDown('ArrowUp') || isDown('KeyW')) return 1;
  if (isDown('ArrowDown') || isDown('KeyS')) return -0.45;
  // hold gas by default on touch races via accel button only — desktop: require W/Up
  return 0;
}

export function isDrifting() {
  return isDown('ShiftLeft') || isDown('ShiftRight') || isDown('KeyC');
}
