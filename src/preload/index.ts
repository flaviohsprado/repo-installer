import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  runInstallerStep: (command: string, args: string[], cwd?: string) =>
    ipcRenderer.invoke('run-installer-step', command, args, cwd),
  onLogReceived: (callback: (log: string) => void) =>
    ipcRenderer.on('log-received', (_event, log) => callback(log)),
  loginAzure: () => ipcRenderer.invoke('login-azure'),
  checkRequirements: () => ipcRenderer.invoke('check-requirements'),
  checkRequirement: (name: string) => ipcRenderer.invoke('check-requirement', name),
  installRequirement: (name: string, options?: { elevated?: boolean }) =>
    ipcRenderer.invoke('install-requirement', name, options),
  onInstallLog: (callback: (payload: { name: string; chunk: string }) => void) =>
    ipcRenderer.on('install-log', (_event, payload) => callback(payload)),
  runRequirementAction: (actionId: string) =>
    ipcRenderer.invoke('run-requirement-action', actionId),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  pathExists: (path: string) => ipcRenderer.invoke('path-exists', path),
  platform: process.platform
}

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
