const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  startTracking: (data) => ipcRenderer.invoke('start-tracking', data),
  stopTracking: () => ipcRenderer.invoke('stop-tracking'),
  onScreenshot: (callback) => {
    ipcRenderer.removeAllListeners('screenshot-captured');
    ipcRenderer.on('screenshot-captured', (event, base64Image) => callback(base64Image));
  },
  getSystemIdleTime: () => ipcRenderer.invoke('get-system-idle-time'),
  getActivityStats: () => ipcRenderer.invoke('get-activity-stats'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body })
});
