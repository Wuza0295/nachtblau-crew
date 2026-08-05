/**
 * Twilight Crown — Display: Integer-Scale (scharf) + Vollbild
 */

const GAME_W = 256;
const GAME_H = 224;

function availableSize() {
  const fs = !!document.fullscreenElement
    || !!document.webkitFullscreenElement;
  const pad = fs ? 0 : 12;
  const vv = window.visualViewport;
  const aw = Math.floor((vv?.width ?? window.innerWidth) - pad * 2);
  const ah = Math.floor((vv?.height ?? window.innerHeight) - pad * 2);
  return {
    w: Math.max(GAME_W, aw),
    h: Math.max(GAME_H, ah),
    fullscreen: fs,
  };
}

/**
 * Immer ganzzahlige Skalierung → pixelperfekt, keine unscharfe Schrift.
 * Letterboxing auf dem Dämmerungs-Hintergrund ist beabsichtigt.
 */
export function fitDisplay() {
  const wrap = document.getElementById('game-wrapper');
  const canvas = document.getElementById('game');
  if (!wrap || !canvas) return;

  const { w: maxW, h: maxH, fullscreen } = availableSize();
  const scale = Math.max(1, Math.floor(Math.min(maxW / GAME_W, maxH / GAME_H)));
  const width = scale * GAME_W;
  const height = scale * GAME_H;

  wrap.style.width = `${width}px`;
  wrap.style.height = `${height}px`;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  document.body.classList.toggle('is-fullscreen', fullscreen);
  document.body.dataset.scale = String(scale);

  const btn = document.getElementById('btn-fullscreen');
  if (btn) {
    btn.setAttribute('aria-pressed', fullscreen ? 'true' : 'false');
    btn.title = fullscreen ? 'Fenster (F)' : 'Vollbild (F)';
    btn.setAttribute('aria-label', fullscreen ? 'Fenster' : 'Vollbild');
  }
}

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

export async function setFullscreen(on) {
  try {
    if (on && !isFullscreen()) {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else if (!on && isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  } catch {
    /* iframe / gesture policy */
  }
  fitDisplay();
}

export async function toggleFullscreen() {
  await setFullscreen(!isFullscreen());
}

export function initDisplay() {
  fitDisplay();

  window.addEventListener('resize', fitDisplay);
  window.visualViewport?.addEventListener('resize', fitDisplay);
  window.visualViewport?.addEventListener('scroll', fitDisplay);
  window.addEventListener('orientationchange', () => {
    setTimeout(fitDisplay, 100);
    setTimeout(fitDisplay, 350);
  });

  document.addEventListener('fullscreenchange', fitDisplay);
  document.addEventListener('webkitfullscreenchange', fitDisplay);

  const btn = document.getElementById('btn-fullscreen');
  btn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      toggleFullscreen();
    }
  });
}
