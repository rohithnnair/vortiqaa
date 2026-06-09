const { contextBridge, ipcRenderer } = require('electron');

/* Expose safe APIs to the renderer (contextIsolation = true) */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Renders the current page using the active @media print CSS and saves the
   * result as a PDF to the user's Downloads folder.  Returns { success, path }
   * or { success: false, error }.
   */
  savePDF: (filename) => ipcRenderer.invoke('save-pdf', filename),
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
