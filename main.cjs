const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Auto-updater event listeners
autoUpdater.on('update-available', () => {
  console.log('Update available. Downloading...');
});
autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded. Restarting app to apply update...');
  autoUpdater.quitAndInstall();
});
autoUpdater.on('error', (err) => {
  let message = err == null ? 'unknown' : (err.stack || err).toString();
  dialog.showErrorBox('Could not auto-update!', 'There was an error communicating with GitHub. Please make sure the GitHub Release is PUBLIC and not a Draft.\n\nError: ' + message);
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
    win.loadURL('http://localhost:5174');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Automatically check for updates if running in production mode
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
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
