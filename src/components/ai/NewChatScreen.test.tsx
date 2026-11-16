import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { NewChatScreen, DEFAULT_PROMPT_SHORTCUTS, pickLatestChat, pickRecentChats } from './NewChatScreen'

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

  it('lists recent chats with an All chats link and trims suggestions on narrow panels', () => {
    const onOpenChat = vi.fn()
    const onShowAllChats = vi.fn()
    const recentChats = [
      { id: 't1', title: 'Laya forum basics', updatedAt: new Date().toISOString() },
      { id: 't2', title: 'Morning molt routine', updatedAt: new Date().toISOString() },
    ]
    render(
      <NewChatScreen
        onSubmit={onSubmit}
        recentChats={recentChats}
        onOpenChat={onOpenChat}
        onShowAllChats={onShowAllChats}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Laya forum basics/ }))
    expect(onOpenChat).toHaveBeenCalledWith('t1')
    fireEvent.click(screen.getByRole('button', { name: 'All chats' }))
    expect(onShowAllChats).toHaveBeenCalled()
    const suggested = screen.getByRole('list', { name: 'Suggested questions' })
    expect(within(suggested).getAllByRole('button')).toHaveLength(2)
  })

  it('switches between Suggested and More ideas like two views, hiding recents in ideas', () => {
    const moreIdeas = [
      { id: 'start', label: 'Start', prompts: [{ label: 'Walk me through the stages', prompt: 'Stages?' }] },
      { id: 'codex', label: 'Codex', prompts: [{ label: 'A verse for a hard morning', prompt: 'Verse?' }] },
    ]
    render(
      <NewChatScreen
        onSubmit={onSubmit}
        moreIdeas={moreIdeas}
        recentChats={[{ id: 't1', title: 'Laya forum basics', updatedAt: new Date().toISOString() }]}
        onOpenChat={vi.fn()}
      />
    )
    const views = screen.getByRole('tablist', { name: 'Prompt views' })
    expect(within(views).getByRole('tab', { name: 'Suggested' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'Recent' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Close/ })).not.toBeInTheDocument()

    fireEvent.click(within(views).getByRole('tab', { name: 'More ideas' }))
    expect(screen.queryByRole('heading', { name: 'Recent' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Suggested questions' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Codex' }))
    fireEvent.click(screen.getByRole('button', { name: 'A verse for a hard morning' }))
    expect(onSubmit).toHaveBeenCalledWith({ text: 'Verse?' })

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Codex' }), { key: 'Escape' })
    expect(within(views).getByRole('tab', { name: 'Suggested' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'Recent' })).toBeInTheDocument()
  })

  it('has no view switch without ideas', () => {
    render(<NewChatScreen onSubmit={onSubmit} />)
    expect(screen.queryByRole('tablist', { name: 'Prompt views' })).not.toBeInTheDocument()
  })

  it('shows no recents block without chats', () => {
    render(<NewChatScreen onSubmit={onSubmit} recentChats={[]} onOpenChat={vi.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Recent' })).not.toBeInTheDocument()
  })
})

describe('pickRecentChats / pickLatestChat', () => {
  const threads = [
    { id: 'old', title: 'Old', updatedAt: '2026-11-01T00:00:00Z' },
    { id: 'new', title: 'New', updatedAt: '2026-11-14T00:00:00Z' },
    { id: 'pin', title: 'Pinned', updatedAt: '2026-10-01T00:00:00Z', pinnedAt: '2026-11-02T00:00:00Z' },
    { id: 'arch', title: 'Archived', updatedAt: '2026-11-15T00:00:00Z', archivedAt: '2026-11-15T00:00:00Z' },
    { id: 'mid', title: 'Mid', updatedAt: '2026-11-10T00:00:00Z' },
  ]

  it('puts pinned chats first, skips archived ones and caps at three', () => {
    expect(pickRecentChats(threads).map((t) => t.id)).toEqual(['pin', 'new', 'mid'])
  })

  it('picks the most recently active chat for Continue', () => {
    expect(pickLatestChat(threads)?.id).toBe('new')
    expect(pickLatestChat([])).toBeNull()
  })
})
