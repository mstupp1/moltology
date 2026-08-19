import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('CommandPalette Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is initially closed', () => {
    render(<CommandPalette />)
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('opens on Meta+K or Ctrl+K shortcut', () => {
    render(<CommandPalette />)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type a command or search protocol/i)).toBeInTheDocument()

    // Press Meta+K again to toggle closed
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('opens on custom open-command-palette event', () => {
    render(<CommandPalette />)

    fireEvent(window, new CustomEvent('open-command-palette'))
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()
  })

  it('closes on Escape key press', () => {
    render(<CommandPalette />)

    fireEvent(window, new CustomEvent('open-command-palette'))
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('closes when clicking outside (on the overlay backdrop)', () => {
    render(<CommandPalette />)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const overlay = screen.getByTestId('command-palette-overlay')
    expect(overlay).toBeInTheDocument()

    // Click directly on the overlay backdrop
    fireEvent.click(overlay)
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('does NOT close when clicking inside the modal content', () => {
    render(<CommandPalette />)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const modal = screen.getByTestId('command-palette-modal')
    expect(modal).toBeInTheDocument()

    // Click inside the modal
    fireEvent.click(modal)
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()

    // Click inside the search input
    const input = screen.getByPlaceholderText(/Type a command or search protocol/i)
    fireEvent.click(input)
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()
  })

  it('closes when clicking the close (X) button', () => {
    render(<CommandPalette />)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const closeBtn = screen.getByRole('button', { name: '' }) // The X icon button
    fireEvent.click(closeBtn)

    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('filters commands when typing in the search input', () => {
    render(<CommandPalette />)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const input = screen.getByPlaceholderText(/Type a command or search protocol/i)

    fireEvent.change(input, { target: { value: 'Codex' } })
    expect(screen.getByText('Open Sacred Codex & Canonical Scriptures')).toBeInTheDocument()
    expect(screen.queryByText('Open Subterranean Vats & Level -7 Bio-Vault')).not.toBeInTheDocument()
  })

  it('executes command action and navigates on click', () => {
    render(<CommandPalette />)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const codexOption = screen.getByText('Open Sacred Codex & Canonical Scriptures')
    fireEvent.click(codexOption)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })
})
