import { describe, it, expect } from 'vitest'
import { mergePaths } from './fix-path'

describe('mergePaths', () => {
   it('merges shell, current and fallback paths without duplicates', () => {
      const result = mergePaths('/opt/homebrew/bin:/usr/bin', '/usr/bin:/bin', [
         '/usr/local/bin',
         '/bin'
      ])
      expect(result).toBe('/opt/homebrew/bin:/usr/bin:/bin:/usr/local/bin')
   })

   it('ignores empty segments', () => {
      expect(mergePaths('', '/usr/bin', [])).toBe('/usr/bin')
      expect(mergePaths('', '', [])).toBe('')
   })

   it('keeps the shell path entries first (priority)', () => {
      const result = mergePaths('/opt/homebrew/bin', '/usr/bin', ['/sbin'])
      expect(result.split(':')[0]).toBe('/opt/homebrew/bin')
   })
})
