const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("raceEngineer", {
  restartApp: () => ipcRenderer.invoke("race-engineer:restart"),
  toggleFullscreen: () => ipcRenderer.invoke("race-engineer:toggle-fullscreen"),
  openOverlay: (screenName) => ipcRenderer.invoke("race-engineer:open-overlay", screenName),
  setOverlayLocked: (locked) => ipcRenderer.invoke("race-engineer:set-overlay-locked", Boolean(locked)),
  setOverlayOpacity: (opacity) => ipcRenderer.invoke("race-engineer:set-overlay-opacity", Number(opacity)),
  toggleOverlayFullscreen: () => ipcRenderer.invoke("race-engineer:toggle-overlay-fullscreen"),
  closeOverlay: () => ipcRenderer.invoke("race-engineer:close-overlay"),
  getStartupEnabled: () => ipcRenderer.invoke("race-engineer:get-startup-enabled"),
  setStartupEnabled: (enabled) => ipcRenderer.invoke("race-engineer:set-startup-enabled", Boolean(enabled)),
  onFullscreenChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, isFullscreen) => callback(Boolean(isFullscreen));
    ipcRenderer.on("race-engineer:fullscreen-changed", listener);
    return () => ipcRenderer.removeListener("race-engineer:fullscreen-changed", listener);
  },
  onOverlayLockChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, locked) => callback(Boolean(locked));
    ipcRenderer.on("race-engineer:overlay-lock-changed", listener);
    return () => ipcRenderer.removeListener("race-engineer:overlay-lock-changed", listener);
  },
  onOverlayScreenChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, screenName) => callback(String(screenName || ""));
    ipcRenderer.on("race-engineer:overlay-screen-changed", listener);
    return () => ipcRenderer.removeListener("race-engineer:overlay-screen-changed", listener);
  },
  onOverlayFullscreenChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, isFullscreen) => callback(Boolean(isFullscreen));
    ipcRenderer.on("race-engineer:overlay-fullscreen-changed", listener);
    return () => ipcRenderer.removeListener("race-engineer:overlay-fullscreen-changed", listener);
  },
});
