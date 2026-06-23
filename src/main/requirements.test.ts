import { describe, it, expect } from 'vitest'
import { checkRequirements } from './requirements'

describe('checkRequirements', () => {
  it('returns an array of requirement results', async () => {
    const results = await checkRequirements()
    expect(results).toHaveLength(4)
    expect(results.map(r => r.name)).toEqual(['Git', 'Java', 'Docker', 'Taskfile'])
  })
})
