const STORAGE_KEY = 'nb-gbr-theme';
const COLORS = { dark: '#0a0e14', light: '#ffffff' };

export function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = COLORS[mode] || COLORS.dark;
}

export function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
  return next;
}

function init() {
  let mode = localStorage.getItem(STORAGE_KEY);
  if (mode !== 'light' && mode !== 'dark') {
    mode = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  applyTheme(mode);
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

init();
