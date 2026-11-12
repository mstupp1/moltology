import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SacredCodexReader, CodexVerseBody, CODEX_LAST_READ_KEY, copyPlainText } from './SacredCodexReader'
import { CODEX_READING_THEME_KEY } from './useCodexReadingTheme'

describe('SacredCodexReader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the main sacred codex title, hero, and active scripture', () => {
    render(<SacredCodexReader />)
    expect(screen.getByRole('heading', { level: 1, name: /The Sacred Codex/i })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2, name: /The Prime Directive/i })[0]).toBeInTheDocument()
    expect(screen.queryByText(/OFFICIAL CANON V4.2/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ARCHIVAL SPEC/i)).not.toBeInTheDocument()
  })

  it('drops the daily reflection and the volume tabs', () => {
    render(<SacredCodexReader />)
    expect(screen.queryByText(/Daily reflection/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Volumes' })).not.toBeInTheDocument()
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

  it('has no print button, in the page or fullscreen', () => {
    render(<SacredCodexReader />)
    expect(screen.queryByRole('button', { name: /print/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Fullscreen Reader/i }))
    expect(screen.queryByRole('button', { name: /print/i })).not.toBeInTheDocument()
  })

  it('follows the device until the reader picks a dark or light page, and remembers it', () => {
    const { container, unmount } = render(<SacredCodexReader />)
    const sheet = screen.getByTestId('codex-scripture-sheet')
    expect(sheet).toHaveAttribute('data-reading-theme', 'auto')

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark page' }))
    expect(sheet).toHaveAttribute('data-reading-theme', 'dark')
    expect(localStorage.getItem(CODEX_READING_THEME_KEY)).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: /Fullscreen Reader/i }))
    const page = container.querySelector('[data-codex-pdf-page]') as HTMLElement
    expect(page).toHaveAttribute('data-reading-theme', 'dark')
    const toggles = screen.getAllByRole('button', { name: 'Switch to light page' })
    fireEvent.click(toggles[toggles.length - 1])
    expect(page).toHaveAttribute('data-reading-theme', 'light')
    unmount()

    render(<SacredCodexReader />)
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-reading-theme', 'light')
  })

  it('copies selected scripture as plain text', () => {
    render(<SacredCodexReader />)
    const sheet = screen.getByTestId('codex-scripture-sheet')
    const range = document.createRange()
    range.selectNodeContents(sheet.querySelector('h2') as HTMLElement)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)

    expect(sheet).toHaveAttribute('data-reading-theme')
    const setData = vi.fn()
    const preventDefault = vi.fn()
    copyPlainText({ clipboardData: { setData }, preventDefault } as unknown as React.ClipboardEvent<HTMLElement>)
    expect(setData).toHaveBeenCalledTimes(1)
    expect(setData).toHaveBeenCalledWith('text/plain', expect.stringMatching(/Prime Directive/i))
    expect(preventDefault).toHaveBeenCalled()
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

  it('gives each verse an anchor and lists the open scripture\'s sections', () => {
    const onNavigate = vi.fn()
    const { container } = render(<SacredCodexReader scriptureSlug="scr-030" onNavigate={onNavigate} />)
    expect(container.querySelector('#verse-3')).toBeTruthy()
    const contents = screen.getByRole('complementary', { name: 'Contents' })
    const sections = within(contents).getByRole('list', { name: /Sections of The Daily Shedding Routine/i })
    const buttons = within(sections).getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(3)
    fireEvent.click(buttons[1])
    expect(onNavigate).toHaveBeenLastCalledWith('SCR-030', { verse: expect.any(Number) })
  })

  it('marks search hits in the open scripture and counts them in the list', () => {
    const { container } = render(<SacredCodexReader scriptureSlug="scr-030" />)
    fireEvent.change(screen.getByPlaceholderText(/Search scriptures/i), { target: { value: 'tide' } })
    expect(container.querySelectorAll('mark.codex-hit').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/\d+ match(es)?$/).length).toBeGreaterThan(0)
  })

  it('reopens the last scripture read when the address names none', () => {
    localStorage.setItem(CODEX_LAST_READ_KEY, 'SCR-010')
    const onNavigate = vi.fn()
    render(<SacredCodexReader onNavigate={onNavigate} />)
    expect(screen.getByTestId('codex-scripture-sheet')).toHaveAttribute('data-codex-scripture', 'SCR-010')
    expect(onNavigate).toHaveBeenCalledWith('SCR-010', { replace: true })
  })

  it('remembers the scripture being read', () => {
    render(<SacredCodexReader scriptureSlug="scr-002" />)
    expect(localStorage.getItem(CODEX_LAST_READ_KEY)).toBe('SCR-002')
  })
})
