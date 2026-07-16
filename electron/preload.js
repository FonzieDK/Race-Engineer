const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("raceEngineer", {
  restartApp: () => ipcRenderer.invoke("race-engineer:restart"),
});
