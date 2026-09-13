import { describe, expect, it } from 'vitest'
import { cleanJwks } from './clean-jwks'

describe('cleanJwks', () => {
  it('runs without throwing and returns a stats object', async () => {
    const res = await cleanJwks()
    expect(res).toBeDefined()
    expect(typeof res.total).toBe('number')
    expect(typeof res.pruned).toBe('number')
    expect(res.pruned).toBeLessThanOrEqual(res.total)
  })
})
