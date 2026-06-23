import * as cp from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(cp.exec)

const macCommands: Record<string, string> = {
  'Git': 'brew install git',
  'Java (1.8)': 'brew install --cask zulu@8',
  'Docker': 'brew install --cask docker',
  'Taskfile': 'brew install go-task/tap/go-task',
  'Azure CLI': 'brew install azure-cli'
}

const winCommands: Record<string, string> = {
  'Git': 'winget install --id Git.Git -e --accept-source-agreements',
  'Java (1.8)': 'winget install ojdkbuild.openjdk.8 -e --accept-source-agreements',
  'Docker': 'winget install Docker.DockerDesktop -e --accept-source-agreements',
  'Taskfile': 'winget install --id GoTask.GoTask -e --accept-source-agreements',
  'Azure CLI': 'winget install -e --id Microsoft.AzureCLI --accept-source-agreements'
}

import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

export async function installRequirement(name: string): Promise<boolean> {
  const isMac = process.platform === 'darwin'
  const commands = isMac ? macCommands : winCommands
  const command = commands[name]

  if (!command) return false

  let askpassScriptPath: string | undefined

  try {
    const env = { ...process.env }

    if (isMac && command.includes('--cask')) {
      const askpassScript = `#!/bin/sh
osascript -e 'Tell application (path to frontmost application as text) to display dialog "O Darvin Installer precisa de privilégios de Administrador para instalar o pacote: ${name}.\\n\\nPor favor, informe a senha do seu Mac:" default answer "" with hidden answer with title "Permissão Necessária"' -e 'text returned of result'
`
      askpassScriptPath = path.join(os.tmpdir(), `darvin-askpass-${Date.now()}.sh`)
      fs.writeFileSync(askpassScriptPath, askpassScript)
      fs.chmodSync(askpassScriptPath, 0o700)
      env.SUDO_ASKPASS = askpassScriptPath
    }

    await execAsync(command, { env })

    if (askpassScriptPath) fs.unlinkSync(askpassScriptPath)
    return true
  } catch (error) {
    if (askpassScriptPath && fs.existsSync(askpassScriptPath)) fs.unlinkSync(askpassScriptPath)
    console.error(`Failed to install ${name}:`, error)
    return false
  }
}
