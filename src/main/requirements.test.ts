import { describe, it, expect } from 'vitest'
import { checkRequirements } from './requirements'

describe('checkRequirements', () => {
  it('returns an array of requirement results', async () => {
    const results = await checkRequirements()
    expect(results).toHaveLength(5)
    expect(results.map(r => r.name)).toEqual(['Git', 'Java (1.8)', 'Docker', 'Taskfile', 'Azure CLI'])
  })
})
