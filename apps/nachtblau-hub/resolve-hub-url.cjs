/**
 * Gemeinsame Hub-URL für Bazzite/Linux und Windows.
 * Windows fällt auf linux.html zurück, solange windows.html auf dem Webspace fehlt (404).
 */
function resolveHubUrl({ platform, envUrl, cfg = {}, failedPreferred = false } = {}) {
  if (envUrl) return envUrl;
  const preferred = cfg[`${platform}Url`];
  const fallbacks = [
    cfg.linuxUrl,
    cfg.url,
    "https://launcher.nachtblau-interactive.com/",
  ].filter(Boolean);

  if (failedPreferred) {
    return fallbacks.find((url) => url && url !== preferred) || fallbacks[0];
  }
  return preferred || fallbacks[0];
}

function isWindowsEntrypoint(url) {
  if (!url) return false;
  return /\/windows(\.html?)?(\?|#|$)/i.test(url);
}

module.exports = { resolveHubUrl, isWindowsEntrypoint };
