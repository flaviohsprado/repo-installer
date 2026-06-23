import { ElectronAPI } from '@electron-toolkit/preload'

type RequirementStatus = 'ok' | 'missing' | 'needs-action'

interface RequirementResult {
  name: string
  status: RequirementStatus
  installed: boolean
  version?: string
  message?: string
  actionId?: string
  actionLabel?: string
}

interface InstallResult {
  status: 'success' | 'error' | 'needs-action'
  message?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runInstallerStep: (command: string, args: string[], cwd?: string) => Promise<number>
      onLogReceived: (callback: (log: string) => void) => void
      loginAzure: () => Promise<boolean>
      checkRequirements: () => Promise<RequirementResult[]>
      checkRequirement: (name: string) => Promise<RequirementResult>
      installRequirement: (
        name: string,
        options?: { elevated?: boolean }
      ) => Promise<InstallResult>
      onInstallLog: (callback: (payload: { name: string; chunk: string }) => void) => void
      runRequirementAction: (actionId: string) => Promise<boolean>
      selectDirectory: () => Promise<string | null>
      pathExists: (path: string) => Promise<boolean>
      platform: NodeJS.Platform
    }
  }
}
