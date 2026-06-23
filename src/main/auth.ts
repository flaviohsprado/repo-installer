import { exec } from 'node:child_process'
import { promisify } from 'node:util'

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
