import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SacredCodexReader } from './SacredCodexReader'

describe('SacredCodexReader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the main sacred codex title and header', () => {
    render(<SacredCodexReader />)
    expect(screen.getByText(/SACRED SCRIPTURES & REVELATIONS/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /The Prime Directive/i })).toBeInTheDocument()
  })

  it('supports filtering scriptures by volume', () => {
    render(<SacredCodexReader />)
    const manifestoBadge = screen.getByRole('button', { name: /MANIFESTO/i })
    fireEvent.click(manifestoBadge)
    expect(screen.getByRole('heading', { level: 2, name: /The Prime Directive/i })).toBeInTheDocument()
  })

  it('supports theme switching between paper, sepia, and vault dark', () => {
    render(<SacredCodexReader />)
    const sepiaBtn = screen.getByRole('button', { name: /SEPIA/i })
    fireEvent.click(sepiaBtn)
    expect(localStorage.getItem('moltology_codex_theme')).toBe('sepia')
  })


  it('allows toggling study notes panel and saving notes', () => {
    render(<SacredCodexReader />)
    const openNotesBtn = screen.getByRole('button', { name: /OPEN SCRIPTURE STUDY NOTES/i })
    fireEvent.click(openNotesBtn)

    expect(screen.getByText(/STUDY NOTES & ANNOTATIONS/i)).toBeInTheDocument()
    
    const textarea = screen.getByPlaceholderText(/Record your reflections/i)
    fireEvent.change(textarea, { target: { value: 'My sacred test reflection' } })

    expect(localStorage.getItem('moltology_codex_notes')).toContain('My sacred test reflection')
  })

  it('launches and exits fullscreen soft minimal PDF overlay reader mode', () => {
    render(<SacredCodexReader />)
    const fullscreenBtns = screen.getAllByTitle(/Fullscreen Reader/i)
    fireEvent.click(fullscreenBtns[0])

    const exitBtn = screen.getByRole('button', { name: /Exit Fullscreen Overlay/i })
    expect(exitBtn).toBeInTheDocument()

    fireEvent.click(exitBtn)
    expect(screen.queryByRole('button', { name: /Exit Fullscreen Overlay/i })).not.toBeInTheDocument()
  })
})
