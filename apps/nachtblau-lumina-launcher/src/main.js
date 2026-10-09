'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const auth = require('./auth');
const { launchMinecraft } = require('./launch');
const { setupAutoUpdater } = require('./updater');
const { notifyDiscord } = require('./discord-notify');

// On Fedora Atomic/Bazzite (and similar), chrome-sandbox cannot be SUID.
// Disable Chromium's SUID sandbox only when the helper is unusable.
if (process.platform === 'linux') {
  const sandboxPath = path.join(path.dirname(process.execPath), 'chrome-sandbox');
  let disable = false;
  try {
    if (fs.existsSync('/run/ostree-booted')) {
      disable = true;
    } else {
      const st = fs.statSync(sandboxPath);
      disable = (st.mode & 0o4000) === 0;
    }
  } catch {
    disable = true;
  }
  if (disable) {
    app.commandLine.appendSwitch('no-sandbox');
  }

  // Wayland + Electron: MSA BrowserWindows often stay blank under native Wayland.
  // Prefer X11/XWayland unless explicitly overridden (NACHTBLAU_OZONE=wayland).
  const onWayland =
    Boolean(process.env.WAYLAND_DISPLAY) ||
    process.env.XDG_SESSION_TYPE === 'wayland';
  if (onWayland) {
    const ozone = (process.env.NACHTBLAU_OZONE || 'x11').toLowerCase();
    app.commandLine.appendSwitch('ozone-platform-hint', ozone);
  }
  if (
    process.env.NACHTBLAU_DISABLE_GPU === '1' ||
    process.env.ELECTRON_DISABLE_GPU === '1' ||
    (onWayland && process.env.NACHTBLAU_FORCE_GPU !== '1')
  ) {
    // Softens blank Chromium views on some Atomic/Bazzite GPU stacks.
    app.disableHardwareAcceleration();
  }
}

/** @type {BrowserWindow | null} */
let mainWindow = null;

/** @type {object | null} MCLC authorization object */
let currentAuth = null;

/** @type {{ name: string, uuid: string } | null} */
let currentProfile = null;

let launching = false;

/** @type {{ check: () => Promise<object> } | null} */
let updaterApi = null;

function loadServerConfig() {
  const candidates = [
    path.join(process.resourcesPath || '', 'config', 'server.json'),
    path.join(__dirname, '..', 'config', 'server.json'),
  ];
  let cfg = {
    name: 'NachtBlau Lumina',
    host: '192.168.178.33',
    publicHost: 'drake-intra.tun.ply.gg',
    port: 58820,
    lanPort: 25565,
    version: '1.21.11',
    discord: 'https://discord.gg/uJ25M5xf',
    updateFeed: 'https://launcher.nachtblau-interactive.com/downloads',
  };
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        cfg = { ...cfg, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
        break;
      }
    } catch {
      /* try next */
    }
  }
  if (process.env.NACHTBLAU_SERVER_HOST) {
    cfg.host = process.env.NACHTBLAU_SERVER_HOST;
  }
  if (process.env.NACHTBLAU_SERVER_PORT) {
    cfg.port = Number(process.env.NACHTBLAU_SERVER_PORT) || cfg.port;
  }
  if (process.env.NACHTBLAU_PUBLIC_HOST) {
    cfg.publicHost = process.env.NACHTBLAU_PUBLIC_HOST;
  }
  return cfg;
}

/** Öffentlicher Join-Target für Status-APIs (playit), nie still Port 25565 annehmen. */
function pickStatusTarget(server) {
  const host = server.publicHost || server.host || 'drake-intra.tun.ply.gg';
  const port = Number(server.port);
  return {
    statusHost: host,
    statusPort: Number.isFinite(port) && port > 0 ? port : 58820,
  };
}

function tcpReachable(host, port, timeoutMs = 3500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => finish(true));
    socket.on('timeout', () => finish(false));
    socket.on('error', () => finish(false));
  });
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    title: 'NachtBlau Lumina Launcher',
    backgroundColor: '#030510',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function tryRestoreSession() {
  try {
    const restored = await auth.restoreSession();
    if (restored) {
      currentAuth = restored.mclc;
      currentProfile = restored.profile;
      return { ok: true, profile: restored.profile };
    }
    return { ok: false };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

app.whenReady().then(async () => {
  createWindow();

  const restored = await tryRestoreSession();
  if (restored.ok) {
    send('auth:changed', { loggedIn: true, profile: restored.profile });
  }

  const serverCfg = loadServerConfig();
  updaterApi = setupAutoUpdater({
    send,
    feedUrl: serverCfg.updateFeed,
    getServerConfig: loadServerConfig,
  });
  setTimeout(() => {
    updaterApi?.check().catch(() => {});
  }, 2500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('config:get', () => {
  const server = loadServerConfig();
  const {
    pickConnectHost,
    pickConnectPort,
    maxAllowedMemoryGb,
    recommendedMemoryGb,
    clampMemoryGb,
  } = require('./launch');
  const { statusHost, statusPort } = pickStatusTarget(server);
  const settings = auth.loadSettings();
  const memoryMaxGb = maxAllowedMemoryGb();
  const memoryRecommendedGb = recommendedMemoryGb();
  const memoryGb = clampMemoryGb(settings.memoryGb);
  if (memoryGb !== settings.memoryGb) {
    settings.memoryGb = memoryGb;
    auth.saveSettings(settings);
  }
  return {
    server,
    connectHost: pickConnectHost(server),
    connectPort: pickConnectPort(server),
    statusHost,
    statusPort,
    settings,
    memoryMaxGb,
    memoryRecommendedGb,
    profile: currentProfile,
    loggedIn: Boolean(currentAuth && currentProfile),
    appVersion: app.getVersion(),
    packaged: app.isPackaged,
  };
});

ipcMain.handle('server:probe', async () => {
  const server = loadServerConfig();
  const { pickConnectHost, pickConnectPort } = require('./launch');
  const connectHost = pickConnectHost(server);
  const connectPort = pickConnectPort(server);
  const { statusHost, statusPort } = pickStatusTarget(server);
  const [connectOk, statusOk] = await Promise.all([
    tcpReachable(connectHost, connectPort),
    statusHost === connectHost && statusPort === connectPort
      ? Promise.resolve(null)
      : tcpReachable(statusHost, statusPort),
  ]);
  return {
    connectHost,
    connectPort,
    connectOk: Boolean(connectOk),
    statusHost,
    statusPort,
    statusOk: statusOk == null ? Boolean(connectOk) : Boolean(statusOk),
  };
});

ipcMain.handle('update:check', async () => {
  if (!updaterApi) return { ok: false, error: 'Updater nicht bereit' };
  return updaterApi.check();
});

ipcMain.handle('update:download', async () => {
  if (!updaterApi?.download) return { ok: false, error: 'Updater nicht bereit' };
  return updaterApi.download();
});

ipcMain.handle('update:install', async () => {
  if (!updaterApi?.install) return { ok: false, error: 'Updater nicht bereit' };
  return updaterApi.install();
});

ipcMain.handle('auth:login', async () => {
  try {
    const result = await auth.loginWithMicrosoft((evt) => {
      send('auth:status', {
        phase: evt.phase,
        message: evt.message || 'Login öffnet sich im Browser…',
      });
    });
    currentAuth = result.mclc;
    currentProfile = result.profile;
    send('auth:changed', { loggedIn: true, profile: result.profile });
    send('auth:status', { phase: 'done', message: 'Angemeldet' });
    return { ok: true, profile: result.profile };
  } catch (err) {
    const message = String(err?.message || err);
    send('auth:status', { phase: 'error', message });
    return { ok: false, error: message };
  }
});

ipcMain.handle('auth:submitRedirect', (_evt, text) => {
  return auth.submitLoginRedirect(text);
});

ipcMain.handle('auth:cancel', () => {
  auth.cancelLogin('Login abgebrochen');
  return { ok: true };
});

ipcMain.handle('auth:logout', () => {
  auth.logout();
  currentAuth = null;
  currentProfile = null;
  send('auth:changed', { loggedIn: false, profile: null });
  return { ok: true };
});

ipcMain.handle('settings:setMemory', (_evt, memoryGb) => {
  const { clampMemoryGb } = require('./launch');
  const settings = auth.loadSettings();
  settings.memoryGb = clampMemoryGb(memoryGb);
  auth.saveSettings(settings);
  return settings;
});

ipcMain.handle('shell:openExternal', async (_evt, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    await shell.openExternal(url);
    return { ok: true };
  }
  return { ok: false, error: 'Ungültige URL' };
});

ipcMain.handle('game:launch', async () => {
  if (launching) {
    return { ok: false, error: 'Start läuft bereits …' };
  }
  if (!currentAuth) {
    return { ok: false, error: 'Bitte zuerst mit Microsoft anmelden.' };
  }

  const server = loadServerConfig();
  const settings = auth.loadSettings();
  launching = true;
  send('launch:status', { phase: 'starting', message: 'Minecraft wird vorbereitet …' });

  notifyDiscord(server, {
    title: 'Join-Absicht',
    description: currentProfile?.name
      ? `**${currentProfile.name}** startet Minecraft und verbindet zu NachtBlau Lumina.`
      : 'Ein Spieler startet Minecraft und verbindet zu NachtBlau Lumina.',
    color: 0x8ef4ff,
    fields: [
      {
        name: 'Host',
        value: `${require('./launch').pickConnectHost(server)}:${require('./launch').pickConnectPort(server)}`,
        inline: true,
      },
      { name: 'Launcher', value: `v${app.getVersion()}`, inline: true },
    ],
  }).catch(() => {});

  try {
    await launchMinecraft({
      authorization: currentAuth,
      server,
      memoryGb: settings.memoryGb,
      onProgress: (evt) => {
        send('launch:status', {
          phase: evt.type,
          message: evt.message || '',
          progress: evt.progress,
        });
      },
    });
    return { ok: true };
  } catch (err) {
    const message = String(err?.message || err);
    send('launch:status', { phase: 'error', message });
    return { ok: false, error: message };
  } finally {
    launching = false;
  }
});
