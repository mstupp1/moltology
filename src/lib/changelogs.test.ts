import { describe, it, expect } from 'vitest'
import { getPublicChangelogs } from './changelogs'
import { INITIAL_CHANGELOGS } from './changelogs-data'

describe('Changelogs API & Data Fallbacks', () => {
  it('contains seed changelog entries', () => {
    expect(INITIAL_CHANGELOGS.length).toBeGreaterThan(0)
    expect(INITIAL_CHANGELOGS[0].version).toBeDefined()
    expect(INITIAL_CHANGELOGS[0].title).toBeDefined()
  })

  it('returns valid public changelog entries (fallback to seed if DB uninitialized)', async () => {
    const changelogs = await getPublicChangelogs()
    expect(Array.isArray(changelogs)).toBe(true)
    expect(changelogs.length).toBeGreaterThan(0)
    expect(changelogs[0]).toHaveProperty('title')
    expect(changelogs[0]).toHaveProperty('category')
  })
})
