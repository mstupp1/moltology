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

  it('ensures all INITIAL_CHANGELOGS have valid schema and are sorted chronologically', () => {
    const validCategories = new Set(['Feature', 'Improvement', 'Fix', 'Performance', 'Security', 'Design'])

    for (let i = 0; i < INITIAL_CHANGELOGS.length; i++) {
      const entry = INITIAL_CHANGELOGS[i]
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/)
      expect(entry.title).toBeTruthy()
      expect(entry.summary).toBeTruthy()
      expect(entry.content).toBeTruthy()
      expect(validCategories.has(entry.category)).toBe(true)
      expect(new Date(entry.releasedAt).getTime()).not.toBeNaN()

      if (i > 0) {
        const prev = INITIAL_CHANGELOGS[i - 1]
        expect(new Date(prev.releasedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(entry.releasedAt).getTime()
        )
      }
    }
  })
})
