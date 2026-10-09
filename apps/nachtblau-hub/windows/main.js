const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { resolveHubUrl, isWindowsEntrypoint } = require("../resolve-hub-url.cjs");

function readHubConfig() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "hub-url.json"), "utf8"),
    );
  } catch {
    return {};
  }
}

/** Immer Webspace — Windows-Einstieg (gleiche Quelle wie Bazzite/Android/Browser). */
function hubUrl(failedPreferred = false) {
  return resolveHubUrl({
    platform: "windows",
    envUrl: process.env.NACHTBLAU_HUB_URL,
    cfg: readHubConfig(),
    failedPreferred,
  });
}

let mainWindow;
let usedFallback = false;

function createWindow() {
  const url = hubUrl(false);
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#030510",
    title: "NachtBlau Hub",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, _desc, validatedURL) => {
      if (usedFallback) return;
      if (errorCode === -3) return; // aborted
      if (!isWindowsEntrypoint(validatedURL) && !/\/windows/i.test(validatedURL || "")) {
        return;
      }
      const fallback = hubUrl(true);
      if (!fallback || fallback === validatedURL) return;
      usedFallback = true;
      console.warn(
        `[NachtBlau Hub] ${validatedURL} nicht erreichbar (${errorCode}) — Fallback ${fallback}`,
      );
      mainWindow.loadURL(fallback);
    },
  );

  // HTTP-404 liefert oft did-navigate statt did-fail-load
  mainWindow.webContents.on("did-navigate", (_event, navUrl, httpResponseCode) => {
    if (usedFallback) return;
    if (httpResponseCode < 400) return;
    if (!isWindowsEntrypoint(navUrl) && !/\/windows/i.test(navUrl || "")) return;
    const fallback = hubUrl(true);
    if (!fallback || fallback === navUrl) return;
    usedFallback = true;
    console.warn(
      `[NachtBlau Hub] ${navUrl} HTTP ${httpResponseCode} — Fallback ${fallback}`,
    );
    mainWindow.loadURL(fallback);
  });

  mainWindow.loadURL(url);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("open-external", async (_event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle("open-game-window", async (_event, url, gameId) => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: `NachtBlau — ${gameId}`,
    backgroundColor: "#030510",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  const abs = /^https?:\/\//i.test(url) ? url : new URL(url, hubUrl()).href;
  await win.loadURL(abs);
});

ipcMain.handle("update-game", async () => ({
  success: true,
  message: "Inhalt kommt live vom Webspace — Seite neu laden (Ctrl+R).",
}));

ipcMain.handle("open-folder", async () => {
  await shell.openExternal(hubUrl());
});
