import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SacredCodexReader } from './SacredCodexReader'

describe('SacredCodexReader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the main sacred codex title, hero, and active scripture', () => {
    render(<SacredCodexReader />)
    expect(screen.getByRole('heading', { level: 1, name: /THE SACRED/i })).toBeInTheDocument()
    expect(screen.getByText(/CANONICAL CODEX VAULT/i)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2, name: /The Prime Directive/i })[0]).toBeInTheDocument()
    expect(screen.queryByText(/OFFICIAL CANON V4.2/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ARCHIVAL SPEC/i)).not.toBeInTheDocument()
  })

  it('supports filtering scriptures by volume in the Bento stage rail', () => {
    render(<SacredCodexReader />)
    const manifestoButtons = screen.getAllByRole('button', { name: /MANIFESTO/i })
    fireEvent.click(manifestoButtons[0])
    expect(screen.getAllByText(/The Prime Directive/i).length).toBeGreaterThan(0)
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

  it('allows toggling study notes panel and saving notes', () => {
    render(<SacredCodexReader />)
    const studyNotesBtns = screen.getAllByRole('button', { name: /STUDY NOTES/i })
    fireEvent.click(studyNotesBtns[0])

    expect(screen.getByText(/STUDY NOTES & ANNOTATIONS/i)).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText(/Record your reflections/i)
    fireEvent.change(textarea, { target: { value: 'My sacred test reflection' } })

    expect(localStorage.getItem('moltology_codex_notes')).toContain('My sacred test reflection')
  })

  it('launches and exits fullscreen soft minimal PDF overlay reader mode', () => {
    render(<SacredCodexReader />)
    const fullscreenBtns = screen.getAllByTitle(/Fullscreen/i)
    fireEvent.click(fullscreenBtns[0])

    const exitBtn = screen.getByRole('button', { name: /Exit Fullscreen Overlay/i })
    expect(exitBtn).toBeInTheDocument()

    fireEvent.click(exitBtn)
    expect(screen.queryByRole('button', { name: /Exit Fullscreen Overlay/i })).not.toBeInTheDocument()
  })

  it('scales the immersive leaf like a PDF instead of restyling type', () => {
    const { container } = render(<SacredCodexReader />)
    fireEvent.click(screen.getAllByTitle(/Fullscreen/i)[0])

    const page = container.querySelector('[data-codex-pdf-page]') as HTMLElement
    expect(page).toBeTruthy()
    expect(page.style.transform).toBe('scale(1)')

    fireEvent.click(screen.getByRole('button', { name: 'Zoom In' }))
    expect(page.style.transform).toBe('scale(1.15)')

    fireEvent.click(screen.getByRole('button', { name: /Reset to fit width/i }))
    expect(page.style.transform).toBe('scale(1)')
  })

  it('opens the fullscreen drawer from an icon-only menu without index chrome', () => {
    render(<SacredCodexReader />)
    fireEvent.click(screen.getAllByTitle(/Fullscreen/i)[0])

    expect(screen.queryByText('CANON INDEX')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Toggle Canon Table of Contents Index/i }))

    expect(screen.queryByText('CANON INDEX')).not.toBeInTheDocument()
    expect(screen.queryByText('Close Drawer')).not.toBeInTheDocument()
    expect(screen.getAllByText(/The Prime Directive/i).length).toBeGreaterThan(0)
  })

  it('supports filtering by stage clearance and searching scriptures', () => {
    render(<SacredCodexReader />)
    const stage2Btn = screen.getByRole('button', { name: /STAGE 2/i })
    fireEvent.click(stage2Btn)

    const searchInput = screen.getByPlaceholderText(/Search scriptures/i)
    fireEvent.change(searchInput, { target: { value: 'Abyss' } })

    expect(screen.getAllByText(/The Abyss Hypothesis/i).length).toBeGreaterThan(0)
  })
})
