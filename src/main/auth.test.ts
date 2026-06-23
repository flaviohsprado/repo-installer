import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginAzure } from './auth'
import { exec } from 'child_process'
import util from 'util'

vi.mock('child_process', async () => {
  const util = await import('util')
  const mExec: any = vi.fn()
  mExec[util.promisify.custom] = vi.fn()
  return {
    exec: mExec,
    default: { exec: mExec }
  }
})

describe('loginAzure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when az login succeeds', async () => {
    const customExec = (exec as any)[util.promisify.custom]
    customExec.mockResolvedValue({ stdout: 'success', stderr: '' })

    const result = await loginAzure()
    expect(customExec).toHaveBeenCalledWith('az login')
    expect(result).toBe(true)
  })

  it('should return false when az login fails', async () => {
    const customExec = (exec as any)[util.promisify.custom]
    customExec.mockRejectedValue(new Error('Login failed'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await loginAzure()
    expect(customExec).toHaveBeenCalledWith('az login')
    expect(result).toBe(false)

    consoleSpy.mockRestore()
  })
})

