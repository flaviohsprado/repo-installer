import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function isDockerInstalled(): Promise<boolean> {
   try {
      await execAsync('docker --version')
      return true
   } catch {
      return false
   }
}

export async function isDockerDaemonRunning(): Promise<boolean> {
   try {
      await execAsync('docker info')
      return true
   } catch {
      return false
   }
}

export async function openDockerDesktop(): Promise<void> {
   if (process.platform === 'darwin') {
      await execAsync('open -a Docker')
   } else {
      await execAsync('start "" "%ProgramFiles%\\Docker\\Docker\\Docker Desktop.exe"')
   }
}
