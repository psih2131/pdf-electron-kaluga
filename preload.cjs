const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kaluga', {
  printKp: () => ipcRenderer.send('print-kp'),
  saveImage: (payload) => ipcRenderer.invoke('save-image', payload),
  imageSrc: (name) => `kp-img://local/${encodeURIComponent(name)}`,
  savePdf: (id) => ipcRenderer.invoke('save-pdf', id),
  pdfExists: (id) => ipcRenderer.invoke('pdf-exists', id),
  deletePdf: (id) => ipcRenderer.invoke('delete-pdf', id),
  downloadPdf: (payload) => ipcRenderer.invoke('download-pdf', payload)
})
