/**
 * Gemeinsame Hub-URL für Bazzite/Linux und Windows.
 * Bidirektionaler Fallback: Windows → linux.html (falls 404),
 * Bazzite → windows.html bzw. Web-Root — damit beim OS-Wechsel immer Inhalt da ist.
 */
function resolveHubUrl({ platform, envUrl, cfg = {}, failedPreferred = false } = {}) {
  if (envUrl) return envUrl;
  const preferred = cfg[`${platform}Url`];
  const webRoot = cfg.url || "https://launcher.nachtblau-interactive.com/";

  /** Reihenfolge der Ausweich-URLs je Plattform (ohne preferred). */
  const fallbackOrder =
    platform === "windows"
      ? [cfg.linuxUrl, webRoot, cfg.androidUrl]
      : platform === "linux"
        ? [cfg.windowsUrl, webRoot, cfg.androidUrl]
        : [webRoot, cfg.linuxUrl, cfg.windowsUrl];

  const fallbacks = fallbackOrder.filter(
    (url) => url && url !== preferred,
  );

  if (failedPreferred) {
    return fallbacks[0] || webRoot;
  }
  return preferred || fallbacks[0] || webRoot;
}

function isWindowsEntrypoint(url) {
  if (!url) return false;
  return /\/windows(\.html?)?(\?|#|$)/i.test(url);
}

function isLinuxEntrypoint(url) {
  if (!url) return false;
  return /\/linux(\.html?)?(\?|#|$)/i.test(url);
}

module.exports = { resolveHubUrl, isWindowsEntrypoint, isLinuxEntrypoint };
