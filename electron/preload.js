const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("raceEngineer", {
  restartApp: () => ipcRenderer.invoke("race-engineer:restart"),
  toggleFullscreen: () => ipcRenderer.invoke("race-engineer:toggle-fullscreen"),
  onFullscreenChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, isFullscreen) => callback(Boolean(isFullscreen));
    ipcRenderer.on("race-engineer:fullscreen-changed", listener);
    return () => ipcRenderer.removeListener("race-engineer:fullscreen-changed", listener);
  },
});
