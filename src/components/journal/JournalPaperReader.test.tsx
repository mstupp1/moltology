import React from 'react'
import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { JournalPaperReader } from './JournalPaperReader'
import { INITIAL_JOURNAL_PAPERS } from '@/lib/journal-data'

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

  it('switches reader themes', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    render(<JournalPaperReader paper={paper} />)

    const parchment = screen.getByRole('button', { name: /Parchment/i })
    expect(parchment).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(parchment)
    expect(parchment).toHaveAttribute('aria-pressed', 'true')
  })

  it('adjusts the sheet font size', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    render(<JournalPaperReader paper={paper} />)

    const sheet = screen.getByTestId('paper-sheet')
    const increase = screen.getByRole('button', { name: /Increase font size/i })
    const decrease = screen.getByRole('button', { name: /Decrease font size/i })

    fireEvent.click(increase)
    expect(sheet).toHaveStyle({ fontSize: '18px' })

    fireEvent.click(decrease)
    fireEvent.click(decrease)
    expect(sheet).toHaveStyle({ fontSize: '16px' })
  })

  it('does not exceed font size bounds', () => {
    const paper = INITIAL_JOURNAL_PAPERS[0]
    render(<JournalPaperReader paper={paper} />)

    const sheet = screen.getByTestId('paper-sheet')
    const increase = screen.getByRole('button', { name: /Increase font size/i })
    const decrease = screen.getByRole('button', { name: /Decrease font size/i })

    for (let i = 0; i < 10; i += 1) fireEvent.click(increase)
    expect(sheet).toHaveStyle({ fontSize: '22px' })

    for (let i = 0; i < 15; i += 1) fireEvent.click(decrease)
    expect(sheet).toHaveStyle({ fontSize: '14px' })
  })
})
