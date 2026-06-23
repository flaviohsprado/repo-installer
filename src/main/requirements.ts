import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function checkCommand(name: string, command: string, versionCheck?: (output: string) => boolean): Promise<{ name: string; installed: boolean; version?: string }> {
  try {
    const { stdout, stderr } = await execAsync(command)
    const output = stdout.trim() || stderr.trim()
    
    if (versionCheck && !versionCheck(output)) {
      return { name, installed: false }
    }

    return { name, installed: true, version: output.split('\n')[0] }
  } catch (error) {
    return { name, installed: false }
  }
}

export async function checkRequirements() {
  const checks = [
    checkCommand('Git', 'git --version'),
    checkCommand('Java (1.8)', 'java -version', (out) => out.includes('1.8.') || out.includes('1.8.0')),
    checkCommand('Docker', 'docker --version'),
    checkCommand('Taskfile', 'task --version'),
    checkCommand('Azure CLI', 'az --version')
  ]
  return Promise.all(checks)
}
