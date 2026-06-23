import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  runInstallerStep: (stepName: string) => ipcRenderer.invoke('run-installer-step', stepName),
  onLogReceived: (callback) => ipcRenderer.on('log-received', (_event, log) => callback(log)),
  loginAzure: () => ipcRenderer.invoke('login-azure'),
  checkRequirements: () => ipcRenderer.invoke('check-requirements'),
  installRequirement: (name) => ipcRenderer.invoke('install-requirement', name)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
