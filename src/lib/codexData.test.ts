import { describe, it, expect } from 'vitest'
import { CODEX_VOLUMES, CANONICAL_SCRIPTURES } from './codexData'

describe('Codex Data Integrity', () => {
  it('defines valid volumes metadata', () => {
    expect(CODEX_VOLUMES.length).toBeGreaterThan(0)
    const volumeIds = CODEX_VOLUMES.map(v => v.id)
    expect(volumeIds).toContain('01_manifesto')
    expect(volumeIds).toContain('02_doctrine')
  })

  it('contains scripture items with valid structure', () => {
    expect(CANONICAL_SCRIPTURES).toBeDefined()
    expect(CANONICAL_SCRIPTURES.length).toBeGreaterThan(0)
    
    const item = CANONICAL_SCRIPTURES[0]
    expect(item.id).toBeDefined()
    expect(item.title).toBeDefined()
    expect(item.verses).toBeDefined()
    expect(Array.isArray(item.verses)).toBe(true)
  })
})
