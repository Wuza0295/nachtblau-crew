const keys = {};
const justPressed = new Set();

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
}

export function isDown(code) {
  return !!keys[code];
}

export function wasPressed(code) {
  return justPressed.has(code);
}

export function clearPressed() {
  justPressed.clear();
}

export function getMovement() {
  let dx = 0;
  let dy = 0;
  if (isDown('ArrowUp') || isDown('KeyW')) dy -= 1;
  if (isDown('ArrowDown') || isDown('KeyS')) dy += 1;
  if (isDown('ArrowLeft') || isDown('KeyA')) dx -= 1;
  if (isDown('ArrowRight') || isDown('KeyD')) dx += 1;
  if (dx && dy) {
    dx *= 0.707;
    dy *= 0.707;
  }
  return { dx, dy };
}
