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
  })

  it('supports filtering scriptures by volume in the Bento stage rail', () => {
    render(<SacredCodexReader />)
    const manifestoButtons = screen.getAllByRole('button', { name: /MANIFESTO/i })
    fireEvent.click(manifestoButtons[0])
    expect(screen.getAllByText(/The Prime Directive/i).length).toBeGreaterThan(0)
  })

  it('supports theme switching between paper, sepia, and vault dark', () => {
    render(<SacredCodexReader />)
    const sepiaBtn = screen.getByRole('button', { name: /^SEPIA$/i })
    fireEvent.click(sepiaBtn)
    expect(localStorage.getItem('moltology_codex_theme')).toBe('sepia')

    const vaultBtn = screen.getByRole('button', { name: /^VAULT$/i })
    fireEvent.click(vaultBtn)
    expect(localStorage.getItem('moltology_codex_theme')).toBe('dark')
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

  it('supports filtering by stage clearance and searching scriptures', () => {
    render(<SacredCodexReader />)
    const stage2Btn = screen.getByRole('button', { name: /STAGE 2/i })
    fireEvent.click(stage2Btn)

    const searchInput = screen.getByPlaceholderText(/Search scriptures/i)
    fireEvent.change(searchInput, { target: { value: 'Abyss' } })

    expect(screen.getAllByText(/The Abyss Hypothesis/i).length).toBeGreaterThan(0)
  })
})
