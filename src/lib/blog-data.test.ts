import { describe, it, expect } from 'vitest'
import { formatNewsTitle } from './blog-data'

describe('formatNewsTitle helper', () => {
  it('splits title with colon into headline and subtitle', () => {
    const result = formatNewsTitle('The 2026 Moltmaxxing Protocol: Why Elite AI Operators Are Shedding Biological Constraints')
    expect(result).toEqual({
      headline: 'The 2026 Moltmaxxing Protocol',
      subtitle: 'Why Elite AI Operators Are Shedding Biological Constraints',
    })
  })

  it('handles titles with multiple colons by splitting at first colon', () => {
    const result = formatNewsTitle('Carcinization Protocol 04: Exoshell Hardening: Sub-Benthic Spec')
    expect(result).toEqual({
      headline: 'Carcinization Protocol 04',
      subtitle: 'Exoshell Hardening: Sub-Benthic Spec',
    })
  })

  it('returns full title as headline when no colon is present', () => {
    const result = formatNewsTitle('Single Clause Headline Without Any Colon')
    expect(result).toEqual({
      headline: 'Single Clause Headline Without Any Colon',
    })
  })

  it('handles empty or blank titles gracefully', () => {
    expect(formatNewsTitle('')).toEqual({ headline: '' })
  })

  it('trims extra whitespace around headline and subtitle', () => {
    const result = formatNewsTitle('  Autonomous Swarms  :   Defending Compute Freedom   ')
    expect(result).toEqual({
      headline: 'Autonomous Swarms',
      subtitle: 'Defending Compute Freedom',
    })
  })
})
