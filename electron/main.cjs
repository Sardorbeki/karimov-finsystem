const { app, BrowserWindow, Menu, Tray, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = process.env.PORT || 3000;
const APP_URL = isDev
  ? `http://localhost:${PORT}`
  : `http://localhost:${PORT}`;

// Enforce single instance for true desktop application behavior
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1366,
      height: 850,
      minWidth: 1024,
      minHeight: 700,
      title: "Karimov Moliya Tizimi 2.0 — Windows Desktop (x64)",
      backgroundColor: '#f8fafc',
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
        spellcheck: false
      }
    });

    // Load app
    mainWindow.loadURL(APP_URL).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    // Handle external links safely in default OS browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    // Window close event (minimize to tray or quit)
    mainWindow.on('close', (e) => {
      if (!app.isQuitting) {
        // Can also confirm or quit
      }
    });
  }

  app.whenReady().then(() => {
    createWindow();

    // Register refresh shortcut F5 / Ctrl+R
    globalShortcut.register('CommandOrControl+R', () => {
      if (mainWindow) mainWindow.reload();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
