const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pitwall", {
  restartApp: () => ipcRenderer.invoke("pitwall:restart"),
});
