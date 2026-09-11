import { describe, expect, it } from 'vitest'
import { CANONICAL_SCRIPTURES } from './codexData'
import {
  codexScriptureLocation,
  findScriptureBySlug,
  isolationProtocolsSlug,
  normalizeScriptureSlug,
  scriptureSlugFromId,
} from './codex-links'

describe('codex scripture slugs', () => {
  it('turns catalog ids into lowercase path slugs', () => {
    expect(scriptureSlugFromId('SCR-010')).toBe('scr-010')
    expect(scriptureSlugFromId(' SCR-013 ')).toBe('scr-013')
    expect(normalizeScriptureSlug('SCR-010')).toBe('scr-010')
    expect(normalizeScriptureSlug('scr-013')).toBe('scr-013')
  })

  it('resolves known slugs from catalog ids in either case', () => {
    const byLower = findScriptureBySlug('scr-010')
    const byUpper = findScriptureBySlug('SCR-013')

    expect(byLower?.id).toBe('SCR-010')
    expect(byLower?.title).toBe('The Law of Ecdysis')
    expect(byUpper?.id).toBe('SCR-013')
    expect(byUpper?.title).toBe('The Soft-Shell Covenant')
    expect(codexScriptureLocation('SCR-010')).toEqual({
      to: '/codex/$slug',
      params: { slug: 'scr-010' },
    })
  })

  it('returns undefined for unknown or empty slugs', () => {
    expect(findScriptureBySlug('scr-999')).toBeUndefined()
    expect(findScriptureBySlug('not-a-scripture')).toBeUndefined()
    expect(findScriptureBySlug('')).toBeUndefined()
    expect(findScriptureBySlug('   ')).toBeUndefined()
    expect(findScriptureBySlug(undefined)).toBeUndefined()
  })

  it('gives every canonical scripture a unique resolvable slug', () => {
    const slugs = CANONICAL_SCRIPTURES.map((scripture) => scriptureSlugFromId(scripture.id))
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const scripture of CANONICAL_SCRIPTURES) {
      expect(findScriptureBySlug(scriptureSlugFromId(scripture.id))?.id).toBe(scripture.id)
    }
  })

  it('points isolation protocols at the liturgy leaf, not the vault index', () => {
    expect(isolationProtocolsSlug()).toBe('scr-031')
    expect(findScriptureBySlug(isolationProtocolsSlug())?.title).toBe('The Isolation Protocols')
  })
})
