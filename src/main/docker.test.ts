import { describe, it, expect, vi, beforeEach } from 'vitest'

const execMock = vi.fn()
vi.mock('child_process', () => {
  const mock = {
    exec: (cmd: string, optsOrCb: unknown, cb?: unknown) => {
      const callback = typeof optsOrCb === 'function' ? optsOrCb : cb
      if (typeof callback === 'function') {
        return execMock(cmd, callback)
      }
    }
  }
  return { ...mock, default: mock }
})

import { isDockerInstalled, isDockerDaemonRunning } from './docker'

describe('docker helpers', () => {
  beforeEach(() => execMock.mockReset())

  it('isDockerInstalled returns true when docker --version succeeds', async () => {
    execMock.mockImplementation((_cmd, optsOrCb, cb?) => {
      const callback = typeof optsOrCb === 'function' ? optsOrCb : cb
      if (typeof callback === 'function') callback(null, { stdout: 'Docker version 27', stderr: '' })
    })
    expect(await isDockerInstalled()).toBe(true)
  })

  it('isDockerInstalled returns false when command fails', async () => {
    execMock.mockImplementation((_cmd, optsOrCb, cb?) => {
      const callback = typeof optsOrCb === 'function' ? optsOrCb : cb
      if (typeof callback === 'function') callback(new Error('not found'), { stdout: '', stderr: '' })
    })
    expect(await isDockerInstalled()).toBe(false)
  })

  it('isDockerDaemonRunning returns false when docker info fails', async () => {
    execMock.mockImplementation((_cmd, optsOrCb, cb?) => {
      const callback = typeof optsOrCb === 'function' ? optsOrCb : cb
      if (typeof callback === 'function') callback(new Error('daemon down'), { stdout: '', stderr: '' })
    })
    expect(await isDockerDaemonRunning()).toBe(false)
  })
})
