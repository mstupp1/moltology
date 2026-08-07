import { describe, it, expect } from 'vitest'
import { getPublicChangelogs } from './changelogs'
import { INITIAL_CHANGELOGS } from './changelogs-data'

describe('Changelogs API & Seed Data', () => {
  it('contains seed changelog entries', () => {
    expect(INITIAL_CHANGELOGS.length).toBeGreaterThan(0)
    expect(INITIAL_CHANGELOGS[0].version).toBeDefined()
    expect(INITIAL_CHANGELOGS[0].title).toBeDefined()
  })

  it('returns an array from getPublicChangelogs', async () => {
    const changelogs = await getPublicChangelogs()
    expect(Array.isArray(changelogs)).toBe(true)
  })
})
