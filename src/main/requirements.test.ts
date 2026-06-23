import { describe, expect, it } from 'vitest'
import { checkRequirement, checkRequirements } from './requirements'

describe('checkRequirements', () => {
   it('returns 5 results with the expected names and a status field', async () => {
      const results = await checkRequirements()
      expect(results).toHaveLength(5)
      expect(results.map((r) => r.name)).toEqual([
         'Git',
         'Java (1.8)',
         'Docker',
         'Taskfile',
         'Azure CLI'
      ])
      for (const r of results) {
         expect(['ok', 'missing', 'needs-action']).toContain(r.status)
      }
   })

   it('checkRequirement returns a missing result for an unknown name', async () => {
      const r = await checkRequirement('Unknown')
      expect(r).toEqual({ name: 'Unknown', status: 'missing', installed: false })
   })
})
