const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Silence all auto-updater logs and suppress dialogs completely
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

// Suppress all error dialogs from electron-updater
autoUpdater.on('error', (err) => {
  log.error('Auto-update error (silent):', err.message);
  // Do NOT show dialog — silently fail
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version);
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `Version ${info.version} is available. It will be downloaded in the background.`,
    buttons: ['OK']
  });
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded. Will install on next restart.');
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new update has been downloaded. Restart the app to apply it.',
    buttons: ['Restart Now', 'Later']
  }).then(({ response }) => {
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  log.info('App is up to date.');
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

  // Check for updates silently in production — errors are suppressed
  if (app.isPackaged) {
    // Delay check by 3 seconds to let the window load first
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('Update check failed (silent):', err.message);
      });
    }, 3000);
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

/* ── PDF export — uses Chromium's native renderer, no html2canvas hang ── */
ipcMain.handle('save-pdf', async (event, filename) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  try {
    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
    });
    const savePath = path.join(app.getPath('downloads'), filename);
    fs.writeFileSync(savePath, pdfBuffer);
    return { success: true, path: savePath };
  } catch (e) {
    log.error('save-pdf error:', e.message);
    return { success: false, error: e.message };
  }
});
