const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Auto-updater configuration - silent mode to avoid error dialogs
autoUpdater.autoDownload = false;
autoUpdater.logger = null;

// Auto-updater event listeners
autoUpdater.on('update-available', () => {
  console.log('Update available.');
});
autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded. Restarting app to apply update...');
  autoUpdater.quitAndInstall();
});
autoUpdater.on('error', (err) => {
  // Silently log - do not show error dialog to user
  console.error('Auto-update error (silent):', err.message);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: "Vortiqaa Management System",
    backgroundColor: '#020617',
    autoHideMenuBar: true
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5177');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Automatically check for updates if running in production mode
  if (app.isPackaged) {
    try {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('Update check failed (silent):', err.message);
      });
    } catch (err) {
      console.error('Update check error (silent):', err.message);
    }
  }

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
