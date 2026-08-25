const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kaluga', {
  printKp: () => ipcRenderer.send('print-kp'),
  saveImage: (payload) => ipcRenderer.invoke('save-image', payload),
  imageSrc: (name) => `kp-img://local/${encodeURIComponent(name)}`
})
