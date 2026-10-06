'use strict';

const fs = require('fs');
const path = require('path');
const {
  app,
  safeStorage,
  shell,
  clipboard,
  BrowserWindow,
  session,
} = require('electron');
const { Auth } = require('msmc');

const SESSION_FILE = 'ms-session.bin';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const CLIPBOARD_POLL_MS = 250;
const EMBEDDED_CONTENT_TIMEOUT_MS = 12_000;
const MS_LOGIN_PARTITION = 'persist:nachtblau-ms-login';
const CHROME_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MS_DESKTOP_REDIRECT = 'https://login.live.com/oauth20_desktop.srf';

/** @type {{ resolve: (text: string) => void, reject: (err: Error) => void } | null} */
let pendingLoginCapture = null;

/** @type {BrowserWindow | null} */
let loginWindow = null;

function sessionPath() {
  return path.join(app.getPath('userData'), SESSION_FILE);
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  const { recommendedMemoryGb, migrateMemorySettings } = require('./memory');
  let settings;
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    settings = JSON.parse(raw);
  } catch {
    settings = { memoryGb: recommendedMemoryGb(), memoryOptimizedV2: true };
  }
  const { settings: normalized, migrated } = migrateMemorySettings(settings);
  if (migrated) {
    try {
      saveSettings(normalized);
    } catch {
      /* ignore first-run write races */
    }
  }
  return normalized;
}

function saveSettings(settings) {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

function encrypt(text) {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(text);
  }
  return Buffer.from(text, 'utf8');
}

function decrypt(buf) {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(buf);
  }
  return buf.toString('utf8');
}

function saveSession(payload) {
  const json = JSON.stringify(payload);
  const enc = encrypt(json);
  fs.mkdirSync(path.dirname(sessionPath()), { recursive: true });
  fs.writeFileSync(sessionPath(), enc);
}

function loadSession() {
  try {
    const enc = fs.readFileSync(sessionPath());
    const json = decrypt(enc);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    fs.unlinkSync(sessionPath());
  } catch {
    /* ignore */
  }
}

/**
 * Extract OAuth authorization code from a redirect URL or raw code string.
 * Mojang's MSA client only allows redirect https://login.live.com/oauth20_desktop.srf
 * (localhost loopback is rejected).
 *
 * @param {string} text
 * @returns {string | null}
 */
function extractAuthCode(text) {
  if (!text || typeof text !== 'string') return null;
  const raw = text.trim();
  if (!raw) return null;

  if (raw.includes('code=')) {
    try {
      const url = raw.includes('://')
        ? new URL(raw)
        : new URL(raw, 'https://login.live.com/');
      const code = url.searchParams.get('code');
      if (code) return code;
    } catch {
      const m = /[?&#]code=([^&]+)/.exec(raw);
      if (m) {
        try {
          return decodeURIComponent(m[1]);
        } catch {
          return m[1];
        }
      }
    }
  }

  // Raw MS auth codes often look like M.C508_BAY...
  if (/^M\.[A-Za-z0-9._~\-]+$/.test(raw)) return raw;

  return null;
}

function looksLikeMsRedirect(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (!t.includes('code=')) return false;
  return (
    t.includes('login.live.com') ||
    t.includes('oauth20_desktop') ||
    t.includes('microsoftonline.com') ||
    t.startsWith('http://') ||
    t.startsWith('https://')
  );
}

function isMsDesktopRedirect(url) {
  return (
    typeof url === 'string' &&
    url.startsWith(MS_DESKTOP_REDIRECT) &&
    (url.includes('code=') || url.includes('error='))
  );
}

function closeLoginWindow() {
  if (!loginWindow) return;
  const win = loginWindow;
  loginWindow = null;
  try {
    if (!win.isDestroyed()) win.destroy();
  } catch {
    /* ignore */
  }
}

/**
 * Check whether the login page rendered usable content (avoids blank white windows).
 * @param {Electron.WebContents} wc
 * @returns {Promise<boolean>}
 */
async function hasVisibleLoginContent(wc) {
  if (!wc || wc.isDestroyed()) return false;
  try {
    return Boolean(
      await wc.executeJavaScript(
        `(() => {
          const b = document.body;
          if (!b) return false;
          const text = (b.innerText || '').replace(/\\s+/g, ' ').trim();
          if (text.length > 24) return true;
          if (b.querySelector('input, form, button, a[href], iframe')) return true;
          return false;
        })()`,
        true,
      ),
    );
  } catch {
    return false;
  }
}

/**
 * Embedded Electron BrowserWindow MSA login with redirect capture.
 * Window stays hidden until content is ready; blank/white → reject for browser fallback.
 *
 * @param {InstanceType<typeof Auth>} authManager
 * @param {(evt: { phase: string, message: string }) => void} [onStatus]
 * @returns {Promise<import('msmc').Xbox>}
 */
function loginViaEmbeddedWindow(authManager, onStatus) {
  const loginUrl = authManager.createLink();
  const ses = session.fromPartition(MS_LOGIN_PARTITION);

  return new Promise((resolve, reject) => {
    let settled = false;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let contentTimer = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timeout = null;
    let shown = false;
    let contentOk = false;

    const cleanup = () => {
      if (contentTimer) clearTimeout(contentTimer);
      if (timeout) clearTimeout(timeout);
      contentTimer = null;
      timeout = null;
      try {
        ses.webRequest.onBeforeRequest(null);
      } catch {
        /* ignore */
      }
      closeLoginWindow();
    };

    const finish = (err, code) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) {
        reject(err);
        return;
      }
      onStatus?.({
        phase: 'exchanging',
        message: 'Anmeldung wird abgeschlossen …',
      });
      authManager
        .login(code)
        .then(resolve)
        .catch((e) => reject(e instanceof Error ? e : new Error(String(e))));
    };

    const tryUrl = (url) => {
      if (settled || !url) return false;
      if (!isMsDesktopRedirect(url) && !String(url).includes('code=')) return false;
      if (String(url).includes('error=')) {
        finish(new Error('Microsoft-Login abgebrochen oder fehlgeschlagen.'));
        return true;
      }
      const code = extractAuthCode(url);
      if (!code) return false;
      finish(null, code);
      return true;
    };

    const failEmbedded = (reason) => {
      finish(new Error(reason || 'EMBEDDED_LOGIN_FAILED'));
    };

    closeLoginWindow();

    const win = new BrowserWindow({
      width: 520,
      height: 720,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      title: 'NachtBlau Lumina — Microsoft-Login',
      webPreferences: {
        partition: MS_LOGIN_PARTITION,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,
        spellcheck: false,
      },
    });
    loginWindow = win;
    win.setMenu(null);

    const wc = win.webContents;
    wc.setUserAgent(CHROME_UA);
    ses.setUserAgent(CHROME_UA);

    ses.webRequest.onBeforeRequest(
      { urls: ['*://login.live.com/oauth20_desktop.srf*'] },
      (details, callback) => {
        tryUrl(details.url);
        callback({});
      },
    );

    const maybeShow = async () => {
      if (settled || shown || win.isDestroyed()) return;
      if (tryUrl(wc.getURL())) return;
      const ok = await hasVisibleLoginContent(wc);
      if (settled || shown || win.isDestroyed()) return;
      if (!ok) return;
      contentOk = true;
      if (contentTimer) {
        clearTimeout(contentTimer);
        contentTimer = null;
      }
      shown = true;
      onStatus?.({
        phase: 'window',
        message: 'Bitte im Microsoft-Fenster anmelden …',
      });
      win.show();
      win.focus();
    };

    win.once('ready-to-show', () => {
      void maybeShow();
    });

    wc.on('dom-ready', () => {
      void maybeShow();
    });

    wc.on('did-finish-load', () => {
      tryUrl(wc.getURL());
      void maybeShow();
    });

    wc.on('did-navigate', (_e, url) => {
      tryUrl(url);
    });

    wc.on('did-navigate-in-page', (_e, url) => {
      tryUrl(url);
    });

    wc.on('will-redirect', (_e, url) => {
      tryUrl(url);
    });

    wc.on('will-navigate', (e, url) => {
      if (tryUrl(url)) {
        e.preventDefault();
      }
    });

    win.on('closed', () => {
      if (loginWindow === win) loginWindow = null;
      if (!settled) {
        finish(new Error('Login-Fenster geschlossen'));
      }
    });

    wc.on('did-fail-load', (_e, errorCode, _desc, _url, isMainFrame) => {
      if (!isMainFrame || settled || contentOk) return;
      // -3 = ERR_ABORTED (often from our own redirect capture / navigation cancel)
      if (errorCode === -3) return;
      failEmbedded('EMBEDDED_LOGIN_FAILED');
    });

    onStatus?.({
      phase: 'window',
      message: 'Microsoft-Login wird vorbereitet …',
    });

    contentTimer = setTimeout(() => {
      if (settled || contentOk) return;
      failEmbedded('EMBEDDED_LOGIN_FAILED');
    }, EMBEDDED_CONTENT_TIMEOUT_MS);

    timeout = setTimeout(() => {
      finish(new Error('Login abgelaufen (5 Minuten). Bitte erneut versuchen.'));
    }, LOGIN_TIMEOUT_MS);

    Promise.resolve(wc.loadURL(loginUrl)).catch((err) => {
      failEmbedded(
        err instanceof Error
          ? err.message
          : 'EMBEDDED_LOGIN_FAILED',
      );
    });
  });
}

/**
 * Open Microsoft login in the OS default browser and wait for the auth code
 * via clipboard auto-detect or submitLoginRedirect().
 *
 * @param {InstanceType<typeof Auth>} authManager
 * @param {(evt: { phase: string, message: string }) => void} [onStatus]
 * @returns {Promise<import('msmc').Xbox>}
 */
function loginViaSystemBrowser(authManager, onStatus) {
  const loginUrl = authManager.createLink();

  return new Promise((resolve, reject) => {
    let settled = false;
    /** @type {ReturnType<typeof setInterval> | null} */
    let clipTimer = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timeout = null;
    let lastClip = '';

    const cleanup = () => {
      if (clipTimer) clearInterval(clipTimer);
      if (timeout) clearTimeout(timeout);
      clipTimer = null;
      timeout = null;
      if (pendingLoginCapture) pendingLoginCapture = null;
    };

    const finish = (err, code) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) {
        reject(err);
        return;
      }
      onStatus?.({
        phase: 'exchanging',
        message: 'Anmeldung wird abgeschlossen …',
      });
      authManager
        .login(code)
        .then(resolve)
        .catch((e) => reject(e instanceof Error ? e : new Error(String(e))));
    };

    const tryText = (text, fromClipboard) => {
      if (settled || !text) return false;
      if (fromClipboard && !looksLikeMsRedirect(text)) return false;
      const code = extractAuthCode(text);
      if (!code) return false;
      if (fromClipboard) {
        try {
          clipboard.writeText('');
        } catch {
          /* ignore */
        }
      }
      finish(null, code);
      return true;
    };

    pendingLoginCapture = {
      resolve: (text) => {
        if (!tryText(text, false)) {
          onStatus?.({
            phase: 'awaiting_code',
            message:
              'Kein gültiger Login-Code. Bitte die komplette Adresszeile kopieren.',
          });
        }
      },
      reject: (err) => finish(err),
    };

    onStatus?.({
      phase: 'browser',
      message: 'Login öffnet sich im Browser…',
    });

    Promise.resolve(shell.openExternal(loginUrl))
      .then(() => {
        if (settled) return;
        onStatus?.({
          phase: 'awaiting_code',
          message:
            'Im Browser anmelden, danach Adresszeile kopieren (Strg+L, Strg+C) — wird automatisch erkannt.',
        });

        try {
          lastClip = clipboard.readText() || '';
        } catch {
          lastClip = '';
        }

        clipTimer = setInterval(() => {
          if (settled) return;
          try {
            const text = clipboard.readText() || '';
            if (!text || text === lastClip) return;
            lastClip = text;
            tryText(text, true);
          } catch {
            /* clipboard unavailable */
          }
        }, CLIPBOARD_POLL_MS);

        timeout = setTimeout(() => {
          finish(new Error('Login abgelaufen (5 Minuten). Bitte erneut versuchen.'));
        }, LOGIN_TIMEOUT_MS);
      })
      .catch((err) => {
        finish(
          err instanceof Error
            ? err
            : new Error('Browser konnte nicht geöffnet werden: ' + String(err)),
        );
      });
  });
}

/**
 * Feed a pasted redirect URL / code into an in-progress browser login.
 * @param {string} text
 */
function submitLoginRedirect(text) {
  if (!pendingLoginCapture) {
    return { ok: false, error: 'Kein Microsoft-Login aktiv.' };
  }
  const raw = String(text || '');
  if (!extractAuthCode(raw)) {
    return {
      ok: false,
      error:
        'Kein gültiger Login-Code. Bitte die komplette Adresszeile aus dem Browser kopieren.',
    };
  }
  pendingLoginCapture.resolve(raw);
  return { ok: true };
}

function cancelLogin(reason) {
  const msg = reason || 'Login abgebrochen';
  if (loginWindow && !loginWindow.isDestroyed()) {
    // closed-Handler beendet den Embedded-Flow
    try {
      loginWindow.destroy();
    } catch {
      /* ignore */
    }
  }
  if (pendingLoginCapture) {
    pendingLoginCapture.reject(new Error(msg));
  }
}

function isEmbeddedFallbackError(err) {
  const msg = String(err?.message || err || '');
  return (
    msg.includes('EMBEDDED_LOGIN_FAILED') ||
    msg.includes('ERR_FAILED') ||
    msg.includes('ERR_ABORTED') ||
    msg.includes('ERR_CONNECTION')
  );
}

/**
 * @param {(evt: { phase: string, message: string }) => void} [onStatus]
 * @returns {Promise<{ profile: { name: string, uuid: string }, mclc: object, refresh: string }>}
 */
async function loginWithMicrosoft(onStatus) {
  const authManager = new Auth('select_account');

  let xbox;
  try {
    xbox = await loginViaEmbeddedWindow(authManager, onStatus);
  } catch (err) {
    const msg = String(err?.message || err);
    // Only fall back when the embedded window stayed blank / failed to load.
    // User cancel, timeout, or MS errors must not open the system browser.
    if (!isEmbeddedFallbackError(err) && !msg.includes('EMBEDDED_LOGIN_FAILED')) {
      throw err;
    }

    onStatus?.({
      phase: 'browser',
      message:
        'Login-Fenster nicht nutzbar — öffne Systembrowser. Nach dem Login Adresszeile kopieren.',
    });
    xbox = await loginViaSystemBrowser(authManager, onStatus);
  }

  const mc = await xbox.getMinecraft();
  const mclc = mc.mclc(true);
  const refresh = typeof xbox.save === 'function' ? xbox.save() : null;

  const profile = {
    name: mclc.name,
    uuid: mclc.uuid,
  };

  if (refresh) {
    saveSession({ refresh, profile });
  }

  return { profile, mclc, refresh };
}

/**
 * @returns {Promise<{ profile: { name: string, uuid: string }, mclc: object } | null>}
 */
async function restoreSession() {
  const saved = loadSession();
  if (!saved?.refresh) return null;

  try {
    const authManager = new Auth('select_account');
    const xbox = await authManager.refresh(saved.refresh);
    const mc = await xbox.getMinecraft();
    const mclc = mc.mclc(true);
    const refresh = typeof xbox.save === 'function' ? xbox.save() : saved.refresh;

    const profile = {
      name: mclc.name,
      uuid: mclc.uuid,
    };

    saveSession({ refresh, profile });
    return { profile, mclc };
  } catch (err) {
    clearSession();
    throw err;
  }
}

function logout() {
  cancelLogin('Abgemeldet');
  clearSession();
}

module.exports = {
  loginWithMicrosoft,
  restoreSession,
  logout,
  loadSettings,
  saveSettings,
  loadSession,
  submitLoginRedirect,
  cancelLogin,
  extractAuthCode,
  MS_DESKTOP_REDIRECT,
};
