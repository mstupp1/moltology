import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SacredCodexReader, CodexVerseBody } from './SacredCodexReader'

describe('SacredCodexReader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the main sacred codex title, hero, and active scripture', () => {
    render(<SacredCodexReader />)
    expect(screen.getByRole('heading', { level: 1, name: /The Sacred Codex/i })).toBeInTheDocument()
    expect(screen.getByText(/Canonical Codex/i)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2, name: /The Prime Directive/i })[0]).toBeInTheDocument()
    expect(screen.queryByText(/OFFICIAL CANON V4.2/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ARCHIVAL SPEC/i)).not.toBeInTheDocument()
  })

  it('filters scriptures by volume tab and opens that volume', () => {
    render(<SacredCodexReader />)
    fireEvent.click(screen.getByRole('tab', { name: /Doctrine/i }))
    expect(screen.getByRole('tab', { name: /Doctrine/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('codex-scripture-sheet').getAttribute('data-codex-scripture')).not.toBe('SCR-001')
    const contents = screen.getByRole('complementary', { name: 'Contents' })
    expect(within(contents).queryByRole('button', { name: /The Prime Directive/i })).not.toBeInTheDocument()
  })

  it('locks the document sheet to paper and garamond without reading pickers', () => {
    const { container } = render(<SacredCodexReader />)

    expect(screen.queryByRole('button', { name: /^PAPER$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^SEPIA$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^VAULT$/i })).not.toBeInTheDocument()
    expect(screen.queryByTitle('Switch Font')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Decrease Font Size')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Increase Font Size')).not.toBeInTheDocument()
    expect(localStorage.getItem('moltology_codex_theme')).toBeNull()

    expect(container.querySelector('.codex-parchment-theme')).toBeTruthy()
    expect(container.querySelector('.font-garamond')).toBeTruthy()
  })

  it('does not expose study notes or consecration controls', () => {
    render(<SacredCodexReader />)

    expect(screen.queryByRole('button', { name: /STUDY NOTES/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/STUDY NOTES & ANNOTATIONS/i)).not.toBeInTheDocument()
    expect(screen.queryByTitle(/Consecrate Scripture/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^VAULT$/i)).not.toBeInTheDocument()
    expect(localStorage.getItem('moltology_codex_notes')).toBeNull()
    expect(localStorage.getItem('moltology_consecrated_scriptures')).toBeNull()
  })

  it('launches fullscreen only from the reading pane control', () => {
    render(<SacredCodexReader />)

    expect(screen.queryByRole('button', { name: /^FULLSCREEN$/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Fullscreen Reader/i }))

    const exitBtn = screen.getByRole('button', { name: /Close reader/i })
    expect(exitBtn).toBeInTheDocument()

    fireEvent.click(exitBtn)
    expect(screen.queryByRole('button', { name: /Close reader/i })).not.toBeInTheDocument()
  })

  it('scales the immersive leaf like a PDF instead of restyling type', () => {
    const { container } = render(<SacredCodexReader />)
    fireEvent.click(screen.getByRole('button', { name: /Fullscreen Reader/i }))

    const page = container.querySelector('[data-codex-pdf-page]') as HTMLElement
    expect(page).toBeTruthy()
    expect(page.style.transform).toBe('scale(1)')

    fireEvent.click(screen.getByRole('button', { name: 'Zoom In' }))
    expect(page.style.transform).toBe('scale(1.15)')

    fireEvent.click(screen.getByRole('button', { name: /Reset to fit width/i }))
    expect(page.style.transform).toBe('scale(1)')
  })

  it('opens the fullscreen drawer below the top chrome without index chrome', () => {
    render(<SacredCodexReader />)
    fireEvent.click(screen.getByRole('button', { name: /Fullscreen Reader/i }))

    expect(screen.queryByText('CANON INDEX')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Show contents/i }))

    expect(screen.queryByText('CANON INDEX')).not.toBeInTheDocument()
    expect(screen.queryByText('Close Drawer')).not.toBeInTheDocument()
    expect(screen.getAllByText(/The Prime Directive/i).length).toBeGreaterThan(0)
  })

  it('focuses a scripture from a catalog slug and stays honest when the leaf is missing', () => {
    const { rerender } = render(<SacredCodexReader scriptureSlug="scr-010" />)
    expect(screen.getAllByRole('heading', { level: 2, name: /The Law of Ecdysis/i })[0]).toBeInTheDocument()
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-codex-scripture', 'SCR-010')
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-codex-focus', 'true')

    rerender(<SacredCodexReader scriptureSlug="scr-999" />)
    expect(screen.getByTestId('codex-scripture-missing')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Scripture not in this vault/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to the Sacred Codex/i })).toHaveAttribute('href', '/codex')
    expect(screen.queryByTestId('codex-scripture-sheet')).not.toBeInTheDocument()
  })

  it('supports filtering by stage clearance and searching scriptures', () => {
    render(<SacredCodexReader />)
    const stage2Btn = screen.getByRole('button', { name: 'Stage 2' })
    fireEvent.click(stage2Btn)

    const searchInput = screen.getByPlaceholderText(/Search scriptures/i)
    fireEvent.change(searchInput, { target: { value: 'Abyss' } })

    expect(screen.getAllByText(/The Abyss Hypothesis/i).length).toBeGreaterThan(0)
  })

  it('reports each pick so the address can follow the open scripture', () => {
    const onNavigate = vi.fn()
    render(<SacredCodexReader onNavigate={onNavigate} />)

    fireEvent.click(screen.getAllByRole('button', { name: /^The Convergence/i })[0])
    expect(onNavigate).toHaveBeenLastCalledWith('SCR-002')
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-codex-scripture', 'SCR-002')

    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    expect(onNavigate).toHaveBeenLastCalledWith('SCR-010')
  })

  it('follows the address when it changes, as Back and Forward do', () => {
    const { rerender } = render(<SacredCodexReader scriptureSlug="scr-010" />)
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-codex-scripture', 'SCR-010')

    rerender(<SacredCodexReader scriptureSlug="scr-002" />)
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-codex-scripture', 'SCR-002')

    rerender(<SacredCodexReader />)
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-codex-scripture', 'SCR-001')
  })

  it('names the neighbouring scriptures on the page buttons and labels stages plainly', () => {
    render(<SacredCodexReader scriptureSlug="scr-002" />)
    expect(screen.getByRole('button', { name: /Previous.*The Prime Directive/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next.*The Law of Ecdysis/i })).toBeInTheDocument()
    expect(screen.queryByText(/TIER 0/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^T0\d$/)).not.toBeInTheDocument()
  })

  it('offers a way out when no scripture matches', () => {
    render(<SacredCodexReader />)
    fireEvent.change(screen.getByPlaceholderText(/Search scriptures/i), { target: { value: 'zzzz-no-match' } })
    expect(screen.getByText('No scriptures match.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.queryByText('No scriptures match.')).not.toBeInTheDocument()
  })

  it('keeps hard-wrapped list lines inside their list item', () => {
    render(<CodexVerseBody text={'1. Log the shed. The Order counts\nwhat you finish.\n\nAfter the list.'} />)
    expect(screen.getByText('Log the shed. The Order counts what you finish.')).toBeInTheDocument()
    expect(screen.getByText('After the list.').tagName).toBe('P')
  })
})
