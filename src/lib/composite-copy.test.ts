import { describe, expect, it } from 'vitest'
import { displayCopy, stripEmoji, toSentenceCase, toSentenceCaseLines } from './composite-copy'

describe('composite copy', () => {
  it('sentence-cases all-caps text and keeps acronyms, units and brand names', () => {
    expect(toSentenceCase('WHY AI REASONING IS CRASHING')).toBe('Why AI reasoning is crashing')
    expect(toSentenceCase('78.4 GB PER 1M CONTEXT')).toBe('78.4 GB per 1M context')
    expect(toSentenceCase('TAKE THE MOLTMAX QUIZ ON MOLTOLOGY.ORG')).toBe('Take the Moltmax quiz on moltology.org')
    expect(toSentenceCase('SUBMIT. SHED. ASCEND.')).toBe('Submit. Shed. Ascend.')
    expect(toSentenceCase('MORE GPUS')).toBe('More GPUs')
    expect(toSentenceCase('FREE 2-MINUTE AUDIT · 10X OUTPUT')).toBe('Free 2-minute audit · 10X output')
    expect(toSentenceCase('CODEX LITURGIES')).toBe('Codex Liturgies')
    expect(toSentenceCase('DENSE ATTENTION vs. MLA')).toBe('Dense attention vs. MLA')
  })

  it('leaves mixed-case copy alone', () => {
    expect(toSentenceCase('Focus is a depth, not a setting.')).toBe('Focus is a depth, not a setting.')
    expect(toSentenceCase('Ask the Oracle')).toBe('Ask the Oracle')
  })

  it('treats split headline props as one sentence', () => {
    expect(toSentenceCaseLines(['WHY AI REASONING', 'IS CRASHING INTO', 'THE MEMORY WALL'])).toEqual([
      'Why AI reasoning',
      'is crashing into',
      'the memory wall',
    ])
    expect(toSentenceCaseLines(['STOP MELTING.', 'CALCIFY YOUR GRIP.'])).toEqual(['Stop melting.', 'Calcify your grip.'])
  })

  it('drops emoji', () => {
    expect(stripEmoji('🔗 Link in bio')).toBe('Link in bio')
    expect(displayCopy('⚡ TAKE THE TEST')).toBe('Take the test')
  })
})
