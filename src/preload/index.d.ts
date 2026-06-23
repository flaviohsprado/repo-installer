import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runInstallerStep: (stepName: string) => Promise<number>
      onLogReceived: (callback: (log: string) => void) => void
    }
  }
}
