const STORAGE_KEY = 'nb-theme';
const LEGACY_KEY = 'nb-gbr-theme';
const COLORS = { dark: '#07101c', light: '#eef3f9' };

function labelFor(mode) {
  return mode === 'light' ? 'Dunkel' : 'Hell';
}

function syncToggle(mode) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = labelFor(mode);
  btn.setAttribute(
    'aria-label',
    mode === 'light' ? 'Zur dunklen Darstellung wechseln' : 'Zur hellen Darstellung wechseln'
  );
}

export function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = COLORS[mode] || COLORS.dark;
  syncToggle(mode);
}

export function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  localStorage.setItem(STORAGE_KEY, next);
  localStorage.removeItem(LEGACY_KEY);
  applyTheme(next);
  return next;
}

function init() {
  let mode = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
  // Dark ist Marken-Standard; Light nur nach manueller Wahl
  if (mode !== 'light' && mode !== 'dark') {
    mode = 'dark';
  }
  applyTheme(mode);
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

init();
