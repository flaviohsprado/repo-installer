import { expect, test, vi, describe } from 'vitest'
import { installRequirement } from './installer'
import * as cp from 'child_process'

vi.mock('child_process', () => ({
  exec: vi.fn((cmd, options, callback) => {
    const cb = typeof options === 'function' ? options : callback
    if (typeof cb === 'function') {
      cb(null, { stdout: '', stderr: '' })
    }
  })
}))

describe('installer', () => {
  test('installRequirement returns true on success', async () => {
    const result = await installRequirement('Git')
    expect(result).toBe(true)
  })
})
