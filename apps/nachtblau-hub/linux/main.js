const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#030510",
    title: "NachtBlau Hub",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "www", "index.html"));
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
  await win.loadURL(url);
});

ipcMain.handle("update-game", async () => ({
  success: false,
  error: "Nutze pnpm hub:pull / hub:sync, um den Webspace-Stand zu übernehmen.",
}));

ipcMain.handle("open-folder", async () => {
  await shell.openPath(path.join(__dirname, "www"));
});
