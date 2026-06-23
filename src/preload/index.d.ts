import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runInstallerStep: (command: string, args: string[], cwd?: string) => Promise<number>
      onLogReceived: (callback: (log: string) => void) => void
      loginAzure: () => Promise<boolean>
      checkRequirements: () => Promise<{ name: string; installed: boolean; version?: string }[]>
      installRequirement: (name: string) => Promise<boolean>
      selectDirectory: () => Promise<string | null>
    }
  }
}
