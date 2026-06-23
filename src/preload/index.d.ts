import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runInstallerStep: (stepName: string) => Promise<number>
      onLogReceived: (callback: (log: string) => void) => void
      loginAzure: () => Promise<boolean>
      checkRequirements: () => Promise<{ name: string; installed: boolean; version?: string }[]>
      installRequirement: (name: string) => Promise<boolean>
    }
  }
}
