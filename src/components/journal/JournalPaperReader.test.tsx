import React from 'react'
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JournalPaperReader } from './JournalPaperReader'
import { INITIAL_JOURNAL_PAPERS } from '@/lib/journal-data'
import { READER_FONT_SIZE } from '@/lib/paper-palette'

describe('JournalPaperReader', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the paper as a document sheet', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    render(<JournalPaperReader paper={paper} />)

    expect(screen.getByText(paper.title)).toBeInTheDocument()
    expect(screen.getByText(/Abstract/i)).toBeInTheDocument()
    expect(screen.getByText(/Table 1\./i)).toBeInTheDocument()
    expect(screen.getByText(/Recommended Citation/i)).toBeInTheDocument()
    expect(screen.getByText(/References/i)).toBeInTheDocument()
  })

  it('renders integration notes and doctrinal feed tags', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    render(<JournalPaperReader paper={paper} />)

    expect(screen.getAllByText(new RegExp(paper.integrationTitle, 'i')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/\[SCRIPTURE\]/i).length).toBeGreaterThan(0)
  })

  it('locks the sheet to the default paper theme and type scale without pickers', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    render(<JournalPaperReader paper={paper} />)

    expect(screen.queryByRole('button', { name: /Parchment/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Increase font size/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Decrease font size/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Paper Reader/i)).not.toBeInTheDocument()

    const sheet = screen.getByTestId('paper-sheet')
    expect(sheet).toHaveStyle({ fontSize: `${READER_FONT_SIZE.default}px` })
  })
})
