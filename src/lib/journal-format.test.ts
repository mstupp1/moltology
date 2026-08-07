import { describe, it, expect } from 'vitest'
import {
  convertScienceMath,
  extractFeedTags,
  formatJournalInline,
} from './journal-format'

describe('convertScienceMath', () => {
  it('converts subscripted chemical formulas', () => {
    expect(convertScienceMath('$CaCO_3$')).toBe('CaCO\u2083')
    expect(convertScienceMath('$H_2S$')).toBe('H\u2082S')
    expect(convertScienceMath('$CH_4$')).toBe('CH\u2084')
    expect(convertScienceMath('$CO_2$')).toBe('CO\u2082')
  })

  it('converts superscripted ions', () => {
    expect(convertScienceMath('$Mg^{2+}$')).toBe('Mg\u00B2\u207A')
    expect(convertScienceMath('$Ca^{2+}/Mg^{2+}$')).toBe('Ca\u00B2\u207A/Mg\u00B2\u207A')
  })

  it('converts pm and temperature notation', () => {
    expect(convertScienceMath('$\\pm 15\\text{--}30^\\circ\\text{C}$')).toBe('\u00B1 15\u201330\u00B0C')
    expect(convertScienceMath('$\\pm 0.5^\\circ\\text{C}$')).toBe('\u00B1 0.5\u00B0C')
  })

  it('converts text segments and molecular nitrogen/oxygen', () => {
    expect(convertScienceMath('$N_2$')).toBe('N\u2082')
    expect(convertScienceMath('$O_2$')).toBe('O\u2082')
  })

  it('strips dollar delimiters and normalizes tilde spacing', () => {
    expect(convertScienceMath('$Ca^{2+}$')).toBe('Ca\u00B2\u207A')
  })
})

describe('extractFeedTags', () => {
  it('extracts feed tags and strips them from display text', () => {
    const { text, feeds } = extractFeedTags(
      'Carcinization is convergent. [FEEDS: SCRIPTURE]'
    )
    expect(feeds).toEqual(['SCRIPTURE'])
    expect(text).toBe('Carcinization is convergent.')
  })

  it('handles slashed feed labels', () => {
    const { feeds } = extractFeedTags('Text [FEEDS: LITURGY/STAGES]')
    expect(feeds).toEqual(['LITURGY/STAGES'])
  })

  it('returns empty feeds and trimmed text when absent', () => {
    const { text, feeds } = extractFeedTags('  Plain paragraph with no tag.  ')
    expect(feeds).toEqual([])
    expect(text).toBe('Plain paragraph with no tag.')
  })

  it('extracts multiple feeds', () => {
    const { feeds } = extractFeedTags('Text [FEEDS: A] more [FEEDS: B]')
    expect(feeds).toEqual(['A', 'B'])
  })
})

describe('formatJournalInline', () => {
  it('renders bold and math into html string', () => {
    const html = formatJournalInline('$H_2S$ and **chemosynthesis**')
    expect(html).toContain('H\u2082S')
    expect(html).toContain('<strong class="text-[#e8f6ff] font-bold">chemosynthesis</strong>')
  })

  it('accepts a custom bold class for paper themes', () => {
    const html = formatJournalInline('**carcinization**', 'font-bold')
    expect(html).toContain('<strong class="font-bold">carcinization</strong>')
  })
})
