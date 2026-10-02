const { contextBridge, ipcRenderer } = require("electron");

/**
 * The only bridge between the renderer and the desktop shell.
 *
 * contextIsolation is on and nodeIntegration is off, so this is a fixed,
 * named surface rather than a general escape hatch: each method forwards one
 * IPC message and nothing else crosses over.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  /** @param {() => void} [callback] */
  minimize: (callback) => {
    ipcRenderer.send("window-minimize");
    callback?.();
  },
  /** @param {() => void} [callback] */
  maximize: (callback) => {
    ipcRenderer.send("window-maximize");
    callback?.();
  },
  /** @param {() => void} [callback] */
  close: (callback) => {
    ipcRenderer.send("window-close");
    callback?.();
  },
  /** @returns {Promise<string>} */
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  /**
   * @param {string} url
   * @param {() => void} [callback]
   */
  openExternal: (url, callback) => {
    ipcRenderer.send("open-external", url);
    callback?.();
  },
});