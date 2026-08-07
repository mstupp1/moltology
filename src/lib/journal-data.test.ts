import { describe, it, expect } from 'vitest'
import {
  INITIAL_JOURNAL_PAPERS,
  INITIAL_JOURNAL_EDITORIAL_BOARD,
  JOURNAL_META,
  getJournalPaperBySlug,
} from './journal-data'

describe('Journal Data Integrity', () => {
  it('defines journal metadata', () => {
    expect(JOURNAL_META.name).toBe('THE BENTHIC COMPENDIUM')
    expect(JOURNAL_META.volume).toBe('VOL. I')
    expect(JOURNAL_META.issue).toBe('NO. 1')
  })

  it('contains at least one peer-reviewed paper', () => {
    expect(INITIAL_JOURNAL_PAPERS.length).toBeGreaterThan(0)
    const paper = INITIAL_JOURNAL_PAPERS[0]
    expect(paper.slug).toBeDefined()
    expect(paper.title.length).toBeGreaterThan(0)
    expect(paper.abstract.length).toBeGreaterThan(0)
    expect(paper.doi).toContain('BEN-COMP')
    expect(paper.authors.length).toBeGreaterThan(0)
  })

  it('retrieves papers by slug', () => {
    const paper = getJournalPaperBySlug('carcinization-and-the-real-abyss')
    expect(paper).toBeDefined()
    expect(paper?.category).toBe('EMPIRICAL DOCTRINE')
    expect(getJournalPaperBySlug('does-not-exist')).toBeUndefined()
  })

  it('has four scientific sections with tables', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    expect(paper.sections.length).toBe(4)

    const tables = paper.sections.flatMap((s) =>
      s.blocks.filter((b) => b.type === 'table')
    )
    expect(tables.length).toBe(4)

    for (const table of tables) {
      if (table.type === 'table') {
        expect(table.headers.length).toBeGreaterThan(0)
        expect(table.rows.length).toBeGreaterThan(0)
        expect(table.rows[0].length).toBe(table.headers.length)
      }
    }
  })

  it('has seven integration notes and references', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    expect(paper.integrationNotes.length).toBe(7)
    expect(paper.references.length).toBeGreaterThanOrEqual(5)
    expect(paper.citation).toContain('The Benthic Compendium')
  })

  it('has a defined editorial board', () => {
    expect(INITIAL_JOURNAL_EDITORIAL_BOARD.length).toBeGreaterThan(0)
    for (const member of INITIAL_JOURNAL_EDITORIAL_BOARD) {
      expect(member.name).toBeDefined()
      expect(member.role).toBeDefined()
    }
  })
})
