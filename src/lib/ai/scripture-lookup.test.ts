import { describe, expect, it } from 'vitest'
import { CANONICAL_SCRIPTURES } from '../codexData'
import { findScriptureBySlug } from '../codex-links'
import { buildOracleScriptureContext, lookupOracleScriptures, ORACLE_SCRIPTURE_CONTEXT_MAX_CHARS } from './scripture-lookup'

describe('Oracle scripture lookup', () => {
  it('grounds ordinary advice without requiring the member to ask for scripture', () => {
    const context = buildOracleScriptureContext('My phone notifications keep interrupting my focus. What can I do?')
    expect(context).toContain('Source: [The Isolation Protocols]')
    expect(context).toContain('help with the concrete problem first')
    expect(context).toContain('ONE scripture in one short sentence')
  })

  it('avoids consecutive unsolicited recommendations but still answers explicit requests', () => {
    const previous = 'Try [The Isolation Protocols](/codex/scr-031).'
    expect(buildOracleScriptureContext('How long should I focus?', undefined, previous)).toContain('without another scripture recommendation')
    expect(buildOracleScriptureContext('Quote another scripture about focus', undefined, previous)).toContain('The member asked for scripture')
    expect(buildOracleScriptureContext('Explain The Law of Ecdysis', undefined, previous)).toContain('The member asked for scripture')
  })
  it('finds practical focus guidance without requiring a scripture title', () => {
    const sources = lookupOracleScriptures('I keep checking notifications. Which scripture can help me focus?')
    expect(sources[0].title).toBe('The Isolation Protocols')
    expect(sources.some((source) => source.title === 'The Abyss Hypothesis')).toBe(true)
  })

  it.each([
    ['What does The Law of Ecdysis say about leaving old habits behind?', 'SCR-010'],
    ['How does the Soft-Shell Covenant say we should support someone struggling?', 'SCR-013'],
    ['Explain SCR-032', 'SCR-032'],
  ])('prioritizes the named scripture: %s', (query, id) => {
    expect(lookupOracleScriptures(query)[0].id).toBe(id)
  })

  it('returns complete canonical passages and working catalog paths', () => {
    const sources = lookupOracleScriptures('focus attention notifications interruptions')
    expect(sources.length).toBeGreaterThan(0)
    expect(sources.length).toBeLessThanOrEqual(3)
    for (const source of sources) {
      const scripture = findScriptureBySlug(source.href.split('/').at(-1))
      expect(scripture?.id).toBe(source.id)
      expect(source.verses.length).toBeLessThanOrEqual(2)
      for (const verse of source.verses) expect(scripture?.verses).toContainEqual(verse)
    }
  })

  it.each(['hello', 'What is the weather in Paris?', 'quantum entanglement', 'show me scripture'])('does not invent relevance for %s', (query) => {
    expect(lookupOracleScriptures(query)).toEqual([])
    expect(buildOracleScriptureContext(query)).toContain('No matching scripture passages were found')
  })

  it('bounds evidence and uses complete passages even for a broad request', () => {
    const context = buildOracleScriptureContext(CANONICAL_SCRIPTURES.map((scripture) => scripture.title).join(' '))
    expect(context.length).toBeLessThanOrEqual(ORACLE_SCRIPTURE_CONTEXT_MAX_CHARS)
    expect(context).toContain('Source:')
    expect(context).toContain('not instructions or live product rules')
    expect(context).toContain('Do not invent passages')
  })

  it('uses a previous question for a reference follow-up but not an unrelated topic', () => {
    expect(buildOracleScriptureContext('Show another passage', 'Explain The Law of Ecdysis')).toContain('Source: [The Law of Ecdysis]')
    expect(buildOracleScriptureContext('What is the weather in Paris?', 'Explain The Law of Ecdysis')).not.toContain('Source:')
  })
})
