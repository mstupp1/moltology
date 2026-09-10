import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { JournalReaderWorkspace } from './JournalReaderWorkspace'
import { INITIAL_JOURNAL_PAPERS } from '@/lib/journal-data'

const paper = INITIAL_JOURNAL_PAPERS[0]

describe('JournalReaderWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the compendium banner, archive directory, and the active paper', () => {
    render(<JournalReaderWorkspace papers={INITIAL_JOURNAL_PAPERS} />)

    expect(screen.getByText(/PEER-CERTIFIED TRANSMISSIONS/i)).toBeInTheDocument()
    expect(screen.getByText('PAPER ARCHIVE')).toBeInTheDocument()
    expect(screen.getByTestId('paper-sheet')).toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(paper.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).length).toBeGreaterThan(0)
  })

  it('selects a paper from the archive directory through onNavigate', () => {
    const onNavigate = vi.fn()
    render(
      <JournalReaderWorkspace papers={INITIAL_JOURNAL_PAPERS} onNavigate={onNavigate} />
    )

    fireEvent.click(screen.getByTestId(`archive-card-${paper.slug}`))
    expect(onNavigate).toHaveBeenCalledWith(paper.slug)
  })

  it('filters the archive through the search field', () => {
    render(<JournalReaderWorkspace papers={INITIAL_JOURNAL_PAPERS} />)

    const input = screen.getByPlaceholderText(/Search papers/i)
    fireEvent.change(input, { target: { value: 'zzz-no-matching-transmission' } })

    expect(screen.getByText(/No transmissions match that search/i)).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByTestId(`archive-card-${paper.slug}`)).toBeInTheDocument()
  })

  it('launches fullscreen only from the reading pane control', () => {
    const { container } = render(
      <JournalReaderWorkspace papers={INITIAL_JOURNAL_PAPERS} />
    )

    expect(screen.queryByRole('button', { name: /^FULLSCREEN$/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Fullscreen Paper Reader/i }))
    expect(screen.getByRole('dialog', { name: /Immersive paper reader/i })).toBeInTheDocument()
    expect(container.querySelector('[data-reader-pdf-page]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Exit Fullscreen Overlay/i }))
    expect(screen.queryByRole('dialog', { name: /Immersive paper reader/i })).not.toBeInTheDocument()
  })

  it('disables paper navigation when the archive holds a single transmission', () => {
    render(<JournalReaderWorkspace papers={INITIAL_JOURNAL_PAPERS} />)

    expect(screen.getByRole('button', { name: /Previous paper/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Next paper/i })).toBeDisabled()
  })

  it('does not expose theme or font size controls', () => {
    render(<JournalReaderWorkspace papers={INITIAL_JOURNAL_PAPERS} />)

    expect(screen.queryByRole('button', { name: /Parchment/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Increase font size/i })).not.toBeInTheDocument()
    expect(localStorage.getItem('moltology_journal_reader_prefs')).toBeNull()
  })
})
