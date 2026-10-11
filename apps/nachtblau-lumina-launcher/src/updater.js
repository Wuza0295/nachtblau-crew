'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { app } = require('electron');
const {
  AppImageUpdater,
  RpmUpdater,
  NsisUpdater,
  MacUpdater,
} = require('electron-updater');
const { startWindowsApplyUpdate } = require('./windows-updater');
const { notifyDiscord } = require('./discord-notify');

const PKG_NAME = 'nachtblau-lumina-launcher';
const DOWNLOADS_HUB = 'https://launcher.nachtblau-interactive.com/downloads/';

function isOstreeBooted() {
  try {
    return fs.existsSync('/run/ostree-booted');
  } catch {
    return false;
  }
}

function readPackageType() {
  try {
    const identity = path.join(process.resourcesPath || '', 'package-type');
    if (!fs.existsSync(identity)) return null;
    return fs.readFileSync(identity, 'utf8').trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * RPM/DEB installs must not use AppImageUpdater — without APPIMAGE it
 * silently disables checkForUpdates (isUpdaterActive → false).
 */
function createPlatformUpdater() {
  if (process.platform === 'win32') return new NsisUpdater();
  if (process.platform === 'darwin') return new MacUpdater();

  if (process.env.APPIMAGE) return new AppImageUpdater();

  const pkgType = readPackageType();
  if (pkgType === 'rpm' || pkgType === 'deb' || pkgType === 'pacman') {
    if (pkgType === 'deb') {
      const { DebUpdater } = require('electron-updater');
      return new DebUpdater();
    }
    if (pkgType === 'pacman') {
      const { PacmanUpdater } = require('electron-updater');
      return new PacmanUpdater();
    }
    return new RpmUpdater();
  }

  // Custom RPM builds (pre-1.0.9) had no package-type → still use RpmUpdater.
  const execPath = (process.execPath || '').toLowerCase();
  const looksPackagedRpm =
    execPath.includes('/opt/nachtblau-lumina-launcher') ||
    execPath.includes('/usr/lib/opt/nachtblau-lumina-launcher') ||
    execPath.includes(`/${PKG_NAME}`);
  if (looksPackagedRpm) return new RpmUpdater();

  return new AppImageUpdater();
}

function installRpmOstree(rpmPath) {
  const quoted = String(rpmPath).replace(/'/g, `'\\''`);
  const script = [
    `set -euo pipefail`,
    `rpm-ostree uninstall --idempotent ${PKG_NAME} || true`,
    `rpm-ostree install --idempotent '${quoted}'`,
  ].join('; ');

  const runners = [];
  if (process.getuid && process.getuid() === 0) {
    runners.push(['bash', ['-lc', script]]);
  } else {
    runners.push(['pkexec', ['bash', '-lc', script]]);
    runners.push(['sudo', ['bash', '-lc', script]]);
  }

  let lastErr = 'rpm-ostree Install fehlgeschlagen';
  for (const [cmd, args] of runners) {
    try {
      const child = spawn(cmd, args, {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return new Promise((resolve) => {
        let stderr = '';
        child.stderr?.on('data', (buf) => {
          stderr += String(buf);
        });
        child.on('error', (err) => {
          resolve({ ok: false, error: String(err?.message || err) });
        });
        child.on('close', (code) => {
          if (code === 0) {
            resolve({ ok: true, method: 'rpm-ostree', needsReboot: true });
          } else {
            resolve({
              ok: false,
              error: (stderr || `Exit ${code}`).trim().slice(0, 240) || lastErr,
            });
          }
        });
      });
    } catch (err) {
      lastErr = String(err?.message || err);
    }
  }
  return Promise.resolve({ ok: false, error: lastErr });
}

/**
 * @param {{
 *   send: (channel: string, payload: object) => void,
 *   feedUrl?: string,
 *   getServerConfig?: () => object,
 * }} opts
 */
function setupAutoUpdater(opts) {
  const send = opts.send;
  const getServerConfig = opts.getServerConfig || (() => ({}));
  const feed =
    process.env.NACHTBLAU_UPDATE_FEED ||
    opts.feedUrl ||
    'https://launcher.nachtblau-interactive.com/downloads';

  const updater = createPlatformUpdater();

  // User entscheidet über Download/Install in der UI — kein stiller Hintergrund-Download.
  updater.autoDownload = false;
  // Windows portable: eigener Helper; Linux AppImage: quitAndInstall beim Quit ok.
  updater.autoInstallOnAppQuit = process.platform !== 'win32';
  updater.allowPrerelease = false;

  updater.setFeedURL({
    provider: 'generic',
    url: feed.replace(/\/$/, ''),
  });

  let pendingVersion = null;
  let downloadedFile = null;
  let downloading = false;
  let ready = false;
  let needsReboot = false;

  updater.on('checking-for-update', () => {
    send('update:status', {
      phase: 'checking',
      message: 'Suche Launcher-Update …',
      currentVersion: app.getVersion(),
    });
  });

  updater.on('update-available', (info) => {
    pendingVersion = info.version;
    ready = false;
    downloading = false;
    downloadedFile = null;
    needsReboot = false;
    send('update:status', {
      phase: 'available',
      message: `Update verfügbar: v${app.getVersion()} → v${info.version}`,
      version: info.version,
      currentVersion: app.getVersion(),
    });
    notifyDiscord(getServerConfig(), {
      title: 'Launcher-Update verfügbar',
      description: `Version **v${info.version}** steht bereit (aktuell v${app.getVersion()}).`,
      color: 0x5eeaff,
      fields: [
        { name: 'Plattform', value: process.platform, inline: true },
        { name: 'App', value: `v${app.getVersion()}`, inline: true },
      ],
    }).catch(() => {});
  });

  updater.on('update-not-available', () => {
    pendingVersion = null;
    ready = false;
    downloading = false;
    downloadedFile = null;
    needsReboot = false;
    send('update:status', {
      phase: 'idle',
      message: `Aktuell (v${app.getVersion()})`,
      version: app.getVersion(),
      currentVersion: app.getVersion(),
    });
  });

  updater.on('download-progress', (p) => {
    downloading = true;
    send('update:status', {
      phase: 'downloading',
      message: `Update wird geladen … ${Math.round(p.percent || 0)} %`,
      version: pendingVersion,
      currentVersion: app.getVersion(),
      progress: p.percent,
    });
  });

  updater.on('update-downloaded', (info) => {
    downloading = false;
    ready = true;
    pendingVersion = info.version;
    downloadedFile = info.downloadedFile || info.path || null;
    send('update:status', {
      phase: 'ready',
      message: `Update v${info.version} bereit — jetzt neu starten`,
      version: info.version,
      currentVersion: app.getVersion(),
      progress: 100,
    });
    notifyDiscord(getServerConfig(), {
      title: 'Launcher-Update geladen',
      description: `Update **v${info.version}** ist heruntergeladen und bereit zur Installation.`,
      color: 0x4ade80,
    }).catch(() => {});
  });

  updater.on('error', (err) => {
    downloading = false;
    send('update:status', {
      phase: 'error',
      message: String(err?.message || err),
      currentVersion: app.getVersion(),
      version: pendingVersion || undefined,
      hubUrl: DOWNLOADS_HUB,
    });
  });

  if (!app.isPackaged) {
    send('update:status', {
      phase: 'dev',
      message: `Dev v${app.getVersion()} (kein Auto-Update)`,
      version: app.getVersion(),
      currentVersion: app.getVersion(),
    });
    return {
      check: async () => ({ skipped: true, reason: 'dev' }),
      download: async () => ({ ok: false, error: 'Nur in gepackten Builds' }),
      install: async () => ({ ok: false, error: 'Nur in gepackten Builds' }),
    };
  }

  if (process.platform === 'linux' && !process.env.APPIMAGE && updater instanceof AppImageUpdater) {
    // Sollte durch createPlatformUpdater nicht mehr vorkommen — Fallback-Hinweis.
    send('update:status', {
      phase: 'error',
      message: `Auto-Update nicht aktiv (kein AppImage). Bitte neu von ${DOWNLOADS_HUB} installieren.`,
      currentVersion: app.getVersion(),
      hubUrl: DOWNLOADS_HUB,
    });
  }

  return {
    check: async () => {
      try {
        if (!updater.isUpdaterActive()) {
          send('update:status', {
            phase: 'error',
            message: `Auto-Update deaktiviert für dieses Paket. Neu installieren: ${DOWNLOADS_HUB}`,
            currentVersion: app.getVersion(),
            hubUrl: DOWNLOADS_HUB,
          });
          return { ok: false, error: 'updater-inactive', hubUrl: DOWNLOADS_HUB };
        }
        const result = await updater.checkForUpdates();
        if (result == null) {
          send('update:status', {
            phase: 'error',
            message: `Update-Prüfung übersprungen. Neu von ${DOWNLOADS_HUB} laden.`,
            currentVersion: app.getVersion(),
            hubUrl: DOWNLOADS_HUB,
          });
          return { ok: false, error: 'check-skipped', hubUrl: DOWNLOADS_HUB };
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, error: String(err?.message || err) };
      }
    },
    download: async () => {
      if (ready) {
        return { ok: true, alreadyReady: true, version: pendingVersion };
      }
      if (downloading) {
        return { ok: true, alreadyDownloading: true, version: pendingVersion };
      }
      try {
        downloading = true;
        send('update:status', {
          phase: 'downloading',
          message: 'Update wird geladen …',
          version: pendingVersion,
          currentVersion: app.getVersion(),
          progress: 0,
        });
        await updater.downloadUpdate();
        return { ok: true, version: pendingVersion };
      } catch (err) {
        downloading = false;
        return { ok: false, error: String(err?.message || err) };
      }
    },
    install: async () => {
      if (needsReboot) {
        return {
          ok: true,
          version: pendingVersion,
          method: 'rpm-ostree',
          needsReboot: true,
        };
      }
      if (!ready) {
        return { ok: false, error: 'Update noch nicht geladen' };
      }

      // Windows portable/ZIP: Wait→Replace→Relaunch-Hilfsskript
      if (process.platform === 'win32') {
        if (downloadedFile) {
          const result = startWindowsApplyUpdate({ packagePath: downloadedFile });
          if (result.ok) {
            notifyDiscord(getServerConfig(), {
              title: 'Launcher-Update wird installiert',
              description: `Windows Apply-Update gestartet → **v${pendingVersion}**.`,
              color: 0xd4a84a,
            }).catch(() => {});
            return { ok: true, version: pendingVersion, method: 'windows-helper' };
          }
        }
        setImmediate(() => {
          try {
            updater.quitAndInstall(false, true);
          } catch {
            app.quit();
          }
        });
        return { ok: true, version: pendingVersion, method: 'quitAndInstall-fallback' };
      }

      // Fedora Atomic / Bazzite: rpm-ostree statt dnf
      if (
        process.platform === 'linux' &&
        !process.env.APPIMAGE &&
        isOstreeBooted() &&
        downloadedFile &&
        String(downloadedFile).toLowerCase().endsWith('.rpm')
      ) {
        send('update:status', {
          phase: 'downloading',
          message: 'Installiere per rpm-ostree …',
          version: pendingVersion,
          currentVersion: app.getVersion(),
          progress: 100,
        });
        const ostree = await installRpmOstree(downloadedFile);
        if (!ostree.ok) {
          send('update:status', {
            phase: 'error',
            message: ostree.error || 'rpm-ostree fehlgeschlagen',
            version: pendingVersion,
            currentVersion: app.getVersion(),
            hubUrl: DOWNLOADS_HUB,
          });
          return ostree;
        }
        needsReboot = true;
        ready = true;
        send('update:status', {
          phase: 'reboot',
          message: `v${pendingVersion} gelayert — bitte neu starten (Reboot)`,
          version: pendingVersion,
          currentVersion: app.getVersion(),
          progress: 100,
          needsReboot: true,
        });
        notifyDiscord(getServerConfig(), {
          title: 'Launcher-Update gelayert',
          description: `rpm-ostree: **v${pendingVersion}** — Reboot nötig.`,
          color: 0xd4a84a,
        }).catch(() => {});
        return { ok: true, version: pendingVersion, method: 'rpm-ostree', needsReboot: true };
      }

      // Linux AppImage / klassisches RPM (dnf) / macOS
      setImmediate(() => {
        updater.quitAndInstall(false, true);
      });
      return { ok: true, version: pendingVersion, method: 'quitAndInstall' };
    },
  };
}

module.exports = { setupAutoUpdater };
