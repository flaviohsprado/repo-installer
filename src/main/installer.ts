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

export async function installRequirement(name: string): Promise<boolean> {
  const isMac = process.platform === 'darwin'
  const commands = isMac ? macCommands : winCommands
  const command = commands[name]

  if (!command) return false

  try {
    if (isMac && command.includes('--cask')) {
      const script = `osascript -e 'Tell application (path to frontmost application as text) to display dialog "O Darvin Installer precisa de privilégios de Administrador para instalar pacotes de sistema (${name}).\n\nPor favor, informe a senha do seu Mac:" default answer "" with hidden answer with title "Permissão Necessária"' -e 'text returned of result'`
      try {
        const { stdout: pass } = await execAsync(script)
        const password = pass.trim()
        if (password) {
          await new Promise<void>((resolve, reject) => {
            const child = cp.spawn('sudo', ['-S', '-v'])
            child.stdin.write(password + '\n')
            child.stdin.end()
            child.on('close', (code) => {
              if (code === 0) resolve()
              else reject(new Error('Senha incorreta'))
            })
          })
        }
      } catch (e) {
        console.warn('Usuário cancelou ou senha incorreta', e)
        return false
      }
    }

    await execAsync(command)
    return true
  } catch (error) {
    console.error(`Failed to install ${name}:`, error)
    return false
  }
}
