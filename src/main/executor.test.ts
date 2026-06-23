import { describe, it, expect, vi } from 'vitest'
import { executeCommand } from './executor'

describe('executor', () => {
  it('executes a command and returns exit code 0', async () => {
    const onLog = vi.fn()
    const code = await executeCommand('echo', ['hello'], onLog)
    expect(code).toBe(0)
    expect(onLog).toHaveBeenCalledWith(expect.stringContaining('hello'))
  })
})
