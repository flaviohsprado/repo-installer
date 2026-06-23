import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { isDockerDaemonRunning, isDockerInstalled } from './docker'

const execAsync = promisify(exec)

export type RequirementStatus = 'ok' | 'missing' | 'needs-action'

export interface RequirementResult {
   name: string
   status: RequirementStatus
   installed: boolean
   version?: string
   message?: string
   actionId?: string
   actionLabel?: string
}

const javaCommand =
   process.platform === 'darwin'
      ? '"$(/usr/libexec/java_home -v 1.8)/bin/java" -version'
      : 'java -version'

async function checkCommand(
   name: string,
   command: string,
   versionCheck?: (output: string) => boolean
): Promise<RequirementResult> {
   try {
      const { stdout, stderr } = await execAsync(command)
      const output = stdout.trim() || stderr.trim()
      if (versionCheck && !versionCheck(output)) {
         return { name, status: 'missing', installed: false }
      }
      return { name, status: 'ok', installed: true, version: output.split('\n')[0] }
   } catch {
      return { name, status: 'missing', installed: false }
   }
}

async function checkDocker(): Promise<RequirementResult> {
   const name = 'Docker'
   if (!(await isDockerInstalled())) {
      return { name, status: 'missing', installed: false }
   }
   let version: string | undefined
   try {
      const { stdout } = await execAsync('docker --version')
      version = stdout.trim()
   } catch {
      version = undefined
   }
   if (await isDockerDaemonRunning()) {
      return { name, status: 'ok', installed: true, version }
   }
   return {
      name,
      status: 'needs-action',
      installed: true,
      version,
      message: 'Docker está instalado, mas o daemon não está em execução.',
      actionId: 'open-docker',
      actionLabel: 'Abrir Docker Desktop'
   }
}

const CHECKS: { name: string; check: () => Promise<RequirementResult> }[] = [
   { name: 'Git', check: () => checkCommand('Git', 'git --version') },
   {
      name: 'Java (1.8)',
      check: () => checkCommand('Java (1.8)', javaCommand, (out) => out.includes('1.8.'))
   },
   { name: 'Docker', check: checkDocker },
   { name: 'Taskfile', check: () => checkCommand('Taskfile', 'task --version') },
   { name: 'Azure CLI', check: () => checkCommand('Azure CLI', 'az --version') }
]

export async function checkRequirements(): Promise<RequirementResult[]> {
   return Promise.all(CHECKS.map((c) => c.check()))
}

export async function checkRequirement(name: string): Promise<RequirementResult> {
   const found = CHECKS.find((c) => c.name === name)
   return found ? found.check() : { name, status: 'missing', installed: false }
}
