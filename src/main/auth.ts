import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function loginAzure(): Promise<boolean> {
  try {
    await execAsync('az login')
    return true
  } catch (error) {
    console.error('Azure login failed:', error)
    return false
  }
}
