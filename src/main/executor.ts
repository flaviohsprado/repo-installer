import { spawn } from 'child_process'

export function executeCommand(command: string, args: string[], cwd: string | undefined, onLog: (data: string) => void): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true, cwd })
    
    child.stdout.on('data', (data) => {
      onLog(data.toString())
    })
    
    child.stderr.on('data', (data) => {
      onLog(data.toString())
    })
    
    child.on('close', (code) => {
      resolve(code || 0)
    })
  })
}
