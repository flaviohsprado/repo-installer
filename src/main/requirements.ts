import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function checkCommand(name: string, command: string): Promise<{ name: string; installed: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync(command)
    return { name, installed: true, version: stdout.trim().split('\n')[0] }
  } catch (error) {
    return { name, installed: false }
  }
}

export async function checkRequirements() {
  const checks = [
    checkCommand('Git', 'git --version'),
    checkCommand('Java', 'java -version'),
    checkCommand('Docker', 'docker --version'),
    checkCommand('Taskfile', 'task --version'),
    checkCommand('Azure CLI', 'az --version')
  ]
  return Promise.all(checks)
}
