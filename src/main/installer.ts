import { exec, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export interface InstallResult {
   status: 'success' | 'error' | 'needs-action'
   message?: string
}

const macCommands: Record<string, string> = {
   Git: 'brew install git',
   'Java (1.8)': 'brew install --cask zulu@8',
   Docker: 'brew install --cask docker',
   Taskfile: 'brew install go-task/tap/go-task',
   'Azure CLI': 'brew install azure-cli'
}

const winCommands: Record<string, string> = {
   Git: 'winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements',
   'Java (1.8)':
      'winget install --id ojdkbuild.openjdk.8.jre -e --accept-source-agreements --accept-package-agreements',
   Docker:
      'winget install --id Docker.DockerDesktop -e --accept-source-agreements --accept-package-agreements',
   Taskfile:
      'winget install --id Task.Task -e --accept-source-agreements --accept-package-agreements',
   'Azure CLI':
      'winget install --id Microsoft.AzureCLI -e --accept-source-agreements --accept-package-agreements'
}

function buildAskpassScript(name: string): string {
   return `#!/bin/sh
osascript -e 'Tell application (path to frontmost application as text) to display dialog "O Darvin Installer precisa de privilégios de Administrador para instalar o pacote: ${name}.\\n\\nPor favor, informe a senha do seu Mac:" default answer "" with hidden answer with title "Permissão Necessária"' -e 'text returned of result'
`
}

async function installElevatedWindows(
   command: string,
   onLog: (chunk: string) => void
): Promise<InstallResult> {
   onLog('\nSolicitando privilégios de administrador (UAC)...\n')
   const psCommand = `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-Command','${command.replace(/'/g, "''")}'`
   try {
      await execAsync(`powershell -NoProfile -Command "${psCommand.replace(/"/g, '\\"')}"`)
      onLog('Processo de instalação elevado finalizado.\n')
      return { status: 'success' }
   } catch {
      return { status: 'error', message: 'Instalação como administrador falhou ou foi cancelada.' }
   }
}

export async function installRequirement(
   name: string,
   options: { elevated?: boolean } = {},
   onLog: (chunk: string) => void = () => {}
): Promise<InstallResult> {
   const isMac = process.platform === 'darwin'
   const command = (isMac ? macCommands : winCommands)[name]
   if (!command) {
      return { status: 'error', message: `Sem comando de instalação para "${name}".` }
   }

   if (!isMac && options.elevated) {
      return installElevatedWindows(command, onLog)
   }

   let askpassScriptPath: string | undefined
   const env = { ...process.env }
   if (isMac && command.includes('--cask')) {
      askpassScriptPath = path.join(os.tmpdir(), `darvin-askpass-${Date.now()}.sh`)
      fs.writeFileSync(askpassScriptPath, buildAskpassScript(name))
      fs.chmodSync(askpassScriptPath, 0o700)
      env.SUDO_ASKPASS = askpassScriptPath
   }

   return new Promise<InstallResult>((resolve) => {
      const child = spawn(command, { shell: true, env })
      child.stdout?.on('data', (data) => onLog(data.toString()))
      child.stderr?.on('data', (data) => onLog(data.toString()))
      child.on('close', (code) => {
         if (askpassScriptPath && fs.existsSync(askpassScriptPath)) fs.unlinkSync(askpassScriptPath)
         if (code === 0) {
            resolve({ status: 'success' })
         } else {
            resolve({ status: 'error', message: `Instalação falhou com código ${code}.` })
         }
      })
      child.on('error', (err) => {
         if (askpassScriptPath && fs.existsSync(askpassScriptPath)) fs.unlinkSync(askpassScriptPath)
         resolve({ status: 'error', message: err.message })
      })
   })
}
