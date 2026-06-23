import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function getJava8Home(): Promise<string | undefined> {
  if (process.platform === 'darwin') {
    try {
      const { stdout } = await execAsync('/usr/libexec/java_home -v 1.8')
      return stdout.trim()
    } catch {
      // openjdk@8 might not be symlinked, try standard brew path
      return '/usr/local/opt/openjdk@8'
    }
  }
  return undefined
}

export async function executeCommand(command: string, args: string[], cwd: string | undefined, onLog: (data: string) => void): Promise<number> {
  const javaHome = await getJava8Home()
  const env = { ...process.env }
  if (javaHome) {
    env.JAVA_HOME = javaHome
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true, cwd, env })
    
    child.stdout.on('data', (data) => onLog(data.toString()))
    child.stderr.on('data', (data) => onLog(data.toString()))
    
    child.on('close', (code) => resolve(code || 0))
  })
}
