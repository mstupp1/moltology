import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NewChatScreen, DEFAULT_PROMPT_SHORTCUTS } from './NewChatScreen'

describe('NewChatScreen', () => {
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the greeting and every suggestion at once, with no workspace picker', () => {
    render(<NewChatScreen onSubmit={onSubmit} />)

    expect(screen.getByRole('heading', { name: 'Ask the Oracle' })).toBeInTheDocument()
    for (const s of DEFAULT_PROMPT_SHORTCUTS) {
      expect(screen.getByRole('button', { name: s.label })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: /Workspace/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Target Workspace/i)).not.toBeInTheDocument()
  })

  it('sends a suggestion straight away', () => {
    render(<NewChatScreen onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'What is Moltology?' }))
    expect(onSubmit).toHaveBeenCalledWith({ text: 'What is Moltology and why should I molt?' })
  })

  it('renders the composer in the centered layout when given one', () => {
    render(<NewChatScreen onSubmit={onSubmit} composer={<textarea aria-label="Message" />} />)
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
  })

  it('suggests earning Chitin Gems, not Molt Credits', () => {
    const prompts = DEFAULT_PROMPT_SHORTCUTS.map((s) => s.prompt).join(' ')
    expect(prompts).not.toMatch(/earn Molt Credits/i)
    expect(prompts).toMatch(/Chitin Gems/)
  })

  it('shows the guest banner with a sign-up button', () => {
    const onOpenAuthModal = vi.fn()
    render(<NewChatScreen onSubmit={onSubmit} isGuest onOpenAuthModal={onOpenAuthModal} />)
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))
    expect(onOpenAuthModal).toHaveBeenCalled()
  })

  it('puts the composer first in the top layout used on phones', () => {
    const { container } = render(
      <NewChatScreen onSubmit={onSubmit} composer={<textarea aria-label="Message" />} composerPosition="top" />
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.firstElementChild?.tagName).toBe('TEXTAREA')
    expect(screen.getByRole('heading', { name: 'Ask the Oracle' })).toBeInTheDocument()
    expect(screen.queryByText('Try asking')).not.toBeInTheDocument()
  })
})
