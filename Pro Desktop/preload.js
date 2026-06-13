const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openApp: (url, title) => ipcRenderer.send('open-app', { url, title }),
  windowControl: (action) => ipcRenderer.send('window-control', action)
});
