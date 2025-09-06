const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
  run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
  get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
  all: (sql, params) => ipcRenderer.invoke('db:all', sql, params),
  // A specific handler for the migration, which will be more complex
  exportIndexedDB: () => ipcRenderer.invoke('migration:export-indexeddb'),
  importToSqlite: (data) => ipcRenderer.invoke('migration:import-sqlite', data),
  // Transactional handlers
  createContract: (data) => ipcRenderer.invoke('contracts:create', data),
  deleteContract: (contractId) => ipcRenderer.invoke('contracts:delete', contractId),
  payInstallment: (data) => ipcRenderer.invoke('installments:pay', data),
});
