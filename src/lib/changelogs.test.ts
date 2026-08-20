import { describe, it, expect } from 'vitest'
import { getPublicChangelogs, getChangelogBySlug } from './changelogs'
import { INITIAL_CHANGELOGS } from './changelogs-data'

describe('Changelogs API & Seed Data', () => {
  it('contains seed changelog entries with slugs', () => {
    expect(INITIAL_CHANGELOGS.length).toBeGreaterThan(0)
    expect(INITIAL_CHANGELOGS[0].slug).toBeDefined()
    expect(INITIAL_CHANGELOGS[0].slug).toMatch(/^[a-z0-9-]+$/)
    expect(INITIAL_CHANGELOGS[0].version).toBeDefined()
    expect(INITIAL_CHANGELOGS[0].title).toBeDefined()
  })

  it('returns an array from getPublicChangelogs', async () => {
    const changelogs = await getPublicChangelogs()
    expect(Array.isArray(changelogs)).toBe(true)
  })

  it('exposes getChangelogBySlug function', () => {
    expect(typeof getChangelogBySlug).toBe('function')
  })
})
