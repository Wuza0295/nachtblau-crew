const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");

/** Immer Webspace — eine Quelle für PC, Android und Browser. */
function hubUrl() {
  if (process.env.NACHTBLAU_HUB_URL) return process.env.NACHTBLAU_HUB_URL;
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "hub-url.json"), "utf8"),
    );
    if (cfg.url) return cfg.url;
  } catch {
    /* fall through */
  }
  return "https://launcher.nachtblau-interactive.com/";
}

let mainWindow;

function createWindow() {
  const url = hubUrl();
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
