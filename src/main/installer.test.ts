import { EventEmitter } from 'node:events'
import { describe, expect, test, vi } from 'vitest'

vi.mock('node:child_process', () => {
   const mock = {
      spawn: vi.fn(() => {
         const child = new EventEmitter() as EventEmitter & {
            stdout: EventEmitter
            stderr: EventEmitter
         }
         child.stdout = new EventEmitter()
         child.stderr = new EventEmitter()
         setTimeout(() => {
            child.stdout.emit('data', Buffer.from('installing...'))
            child.emit('close', 0)
         }, 0)
         return child
      }),
      exec: vi.fn((_cmd: string, optsOrCb: unknown, cb?: unknown) => {
         const fn = typeof optsOrCb === 'function' ? optsOrCb : cb
         if (typeof fn === 'function')
            (fn as (e: null, r: object) => void)(null, { stdout: '', stderr: '' })
      })
   }
   return { ...mock, default: mock }
})

import { installRequirement } from './installer'

describe('installer', () => {
   test('installRequirement streams logs and returns success on exit code 0', async () => {
      const logs: string[] = []
      const result = await installRequirement('Git', {}, (chunk) => logs.push(chunk))
      expect(result.status).toBe('success')
      expect(logs.join('')).toContain('installing')
   })

   test('installRequirement returns error for an unknown package', async () => {
      const result = await installRequirement('Unknown')
      expect(result.status).toBe('error')
   })
})
