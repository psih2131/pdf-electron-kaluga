const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kaluga', {
  printKp: () => ipcRenderer.send('print-kp'),
  saveImage: (payload) => ipcRenderer.invoke('save-image', payload),
  imageSrc: (name) => `kp-img://local/${encodeURIComponent(name)}`,
  savePdf: (id) => ipcRenderer.invoke('save-pdf', id),
  pdfExists: (id) => ipcRenderer.invoke('pdf-exists', id),
  deletePdf: (id) => ipcRenderer.invoke('delete-pdf', id),
  downloadPdf: (payload) => ipcRenderer.invoke('download-pdf', payload),
  getSheetData: (range) => ipcRenderer.invoke('sheets-get-data', range),
  updateSheetData: (payload) => ipcRenderer.invoke('sheets-update-cell', payload),
  updateSheetDeliveryPrices: (value) => ipcRenderer.invoke('sheets-update-delivery', value),
  clearSheetColumnsDAndQ: () => ipcRenderer.invoke('sheets-clear-dq'),
  getSheetsSettings: () => ipcRenderer.invoke('sheets-settings-get'),
  saveSheetsSettings: (payload) => ipcRenderer.invoke('sheets-settings-save', payload),
  getGoogleCredentials: () => ipcRenderer.invoke('google-credentials-get'),
  saveGoogleCredentials: (jsonText) => ipcRenderer.invoke('google-credentials-save', jsonText),
  deleteGoogleCredentials: () => ipcRenderer.invoke('google-credentials-delete')
})
