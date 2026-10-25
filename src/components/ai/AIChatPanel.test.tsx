import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIChatPanel } from './AIChatPanel'
import * as viewport from '@/hooks/useChatViewport'
import { useOracleUsage } from '@/hooks/useOracleUsage'
import { buildOracleUsageSnapshot } from '@/lib/ai/usage-limits'
import { authClient } from '@/lib/auth-client'

vi.mock('@/hooks/useOracleUsage', () => ({
  useOracleUsage: vi.fn(() => ({ snapshot: null, unavailable: false, blocked: false, refresh: vi.fn() })),
}))

// Mock scrollIntoView for test environment
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/ai/stream-oracle-chat-client', () => ({
  streamOracleChat: vi.fn().mockImplementation(async ({ userId, onChunk, onThreadId }) => {
    if (!userId) {
      const text =
        "You're browsing as a guest. Create a free account to unlock full answers."
      onChunk?.(text)
      return { text, threadId: null, isGuest: true }
    }
    const text = 'The Synaptic Oracle analyzes your telemetry: Stage 3 Exoshell requires complete chitin hardening.'
    onChunk?.(text)
    const threadId = 'thread-123'
    onThreadId?.(threadId)
    return { text, threadId }
  }),
}))

// Mock server API functions used by component
vi.mock('@/lib/server/api', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getAIMessagesFn: vi.fn().mockResolvedValue([]),
    getAIThreadsFn: vi.fn().mockResolvedValue([]),
    getUserProfileFn: vi.fn().mockResolvedValue({ role: 'user' }),
  }
})

describe('AIChatPanel Guest Mode Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOracleUsage).mockReturnValue({ snapshot: null, unavailable: false, blocked: false, refresh: vi.fn() })
  })

  it('keeps the draft editable and prevents sending when usage is blocked', async () => {
    const now = new Date()
    const snapshot = buildOracleUsageSnapshot(Array.from({ length: 15 }, () => now), false, now)
    vi.mocked(useOracleUsage).mockReturnValue({ snapshot, unavailable: false, blocked: true, refresh: vi.fn() })
    const { streamOracleChat } = await import('@/lib/ai/stream-oracle-chat-client')
    render(<AIChatPanel userId="member" />)
    const message = screen.getByRole('textbox', { name: 'Message' })
    fireEvent.change(message, { target: { value: 'Keep my draft' } })
    fireEvent.keyDown(message, { key: 'Enter' })
    expect(message).toHaveValue('Keep my draft')
    expect(message).toBeEnabled()
    expect(streamOracleChat).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))
    fireEvent.keyDown(screen.getByRole('button', { name: 'Settings' }), { key: 'Enter' })
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Usage' }))
    expect(screen.getByText('0 of 15 remaining · Past 5 hours')).toBeInTheDocument()
  })

  it.each([
    { phone: false, threadId: null }, { phone: true, threadId: null },
    { phone: false, threadId: 'existing' }, { phone: true, threadId: 'existing' },
  ])('shows usage through Chats settings: %j', async ({ phone, threadId }) => {
    const phoneSpy = vi.spyOn(viewport, 'useIsPhone').mockReturnValue(phone)
    const snapshot = buildOracleUsageSnapshot([], false)
    vi.mocked(useOracleUsage).mockReturnValue({ snapshot, unavailable: false, blocked: false, refresh: vi.fn() })
    try {
      render(<AIChatPanel userId="member" threadId={threadId} />)
      expect(await screen.findByRole('textbox', { name: 'Message' })).toBeInTheDocument()
      expect(screen.queryByRole('meter')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))
      fireEvent.keyDown(screen.getByRole('button', { name: 'Settings' }), { key: 'Enter' })
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Usage' }))
      expect(screen.getAllByRole('meter')).toHaveLength(2)
      expect(screen.getByText('15 of 15 remaining · Past 5 hours')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Close usage' }))
      expect(screen.queryByRole('meter')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    } finally { phoneSpy.mockRestore() }
  })

  it('restores the draft when the server rejects a stale allowance', async () => {
    const { streamOracleChat } = await import('@/lib/ai/stream-oracle-chat-client')
    vi.mocked(streamOracleChat).mockRejectedValueOnce(Object.assign(new Error('5-hour limit reached.'), { status: 429 }))
    render(<AIChatPanel userId="member" />)
    const message = screen.getByRole('textbox', { name: 'Message' })
    fireEvent.change(message, { target: { value: 'Save this question' } })
    fireEvent.keyDown(message, { key: 'Enter' })
    await waitFor(() => expect(message).toHaveValue('Save this question'))
    expect(vi.mocked(useOracleUsage).mock.results[0].value.refresh).toHaveBeenCalled()
  })

  it('does not show usage to guests', () => {
    render(<AIChatPanel userId={null} />)
    expect(screen.queryByRole('button', { name: 'View usage' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('renders guest mode new chat screen on initial load with no canned messages', () => {
    render(<AIChatPanel userId={null} />)

    expect(screen.queryByText(/Welcome! I am the/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Welcome back!/i)).not.toBeInTheDocument()
    expect(screen.getByText(/You're exploring as a guest/i)).toBeInTheDocument()
    expect(screen.getByText(/Sign up free for full answers/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument()
  })

  it('renders authenticated new chat screen without guest CTA or canned message when userId is provided', async () => {
    render(<AIChatPanel userId="usr_valid_user" />)

    expect(screen.queryByText(/Welcome! I am the/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Welcome back!/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Sign up free for full answers/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You're exploring as a guest/i)).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Select Cognition Model/i })).not.toBeInTheDocument()
  })

  it('shows model picker for admin users', async () => {
    const { getUserProfileFn } = await import('@/lib/server/api')
    ;(getUserProfileFn as any).mockResolvedValueOnce({ role: 'admin' })

    render(
      <AIChatPanel
        userId="usr_admin"
        user={{ email: 'admin@example.com', role: 'admin' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Select Cognition Model/i })).toBeInTheDocument()
    })
  })

  it('submits a shortcut in guest mode and ensures conversation starts with user message and no canned message before it', async () => {
    render(<AIChatPanel userId={null} />)

    const shortcutBtn = screen.getByRole('button', { name: /what is moltology/i })
    fireEvent.click(shortcutBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/You're browsing as a guest/i)
      ).toBeInTheDocument()
    })

    // User message is present
    expect(screen.getByText('What is Moltology and why should I molt?')).toBeInTheDocument()

    // No canned welcome message before user message
    expect(screen.queryByText(/Welcome! I am the/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Welcome back!/i)).not.toBeInTheDocument()

    // In-message CTA card appears on assistant responses
    expect(screen.getAllByText(/Sign up free for full answers/i).length).toBeGreaterThan(0)
    const accountButtons = screen.getAllByRole('button', { name: /Sign Up/i })
    expect(accountButtons.length).toBeGreaterThan(0)
  })

  it('opens AuthModal when clicking initial in-message sign up button in guest mode', async () => {
    render(<AIChatPanel userId={null} />)

    const initialSignUpBtn = screen.getByRole('button', { name: /Sign Up/i })
    fireEvent.click(initialSignUpBtn)

    await waitFor(() => {
      expect(screen.getAllByText(/Create Account/i).length).toBeGreaterThan(0)
    })
  })

  it('resets conversation to new chat screen when clicking New Chat button', async () => {
    render(<AIChatPanel userId="usr_valid_user" />)

    const shortcutBtn = screen.getByRole('button', { name: /what is moltology/i })
    fireEvent.click(shortcutBtn)

    await waitFor(() => {
      expect(screen.getByText(/Stage 3 Exoshell requires complete chitin hardening/i)).toBeInTheDocument()
    })

    // Verify user message is present
    expect(screen.getByText('What is Moltology and why should I molt?')).toBeInTheDocument()
    expect(screen.queryByText(/Welcome! I am the/i)).not.toBeInTheDocument()

    const newChatBtn = screen.getByRole('button', { name: /^New Chat$/i })
    expect(newChatBtn).toBeInTheDocument()
    fireEvent.click(newChatBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Stage 3 Exoshell requires complete chitin hardening/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/What is Moltology and why should I molt?/i)).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
    })
  })

  it('has no background watermark logo', () => {
    const { container } = render(<AIChatPanel userId="usr_valid_user" />)
    expect(container.querySelector('svg.grayscale')).toBeNull()
  })

  it('does not render the extra moltology logo emblem in the top left header', () => {
    const { container } = render(<AIChatPanel userId="usr_valid_user" />)
    const header = container.querySelector('.border-b')
    expect(header).toBeInTheDocument()
    const headerLogo = header?.querySelector('svg path[fill-rule="evenodd"]')
    expect(headerLogo).toBeNull()
    expect(screen.queryByText('SYNAPTIC ORACLE')).toBeNull()
  })
})

describe('AIChatPanel designation refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOracleUsage).mockReturnValue({ snapshot: null, unavailable: false, blocked: false, refresh: vi.fn() })
  })

  it('refetches the member profile when member-handle-changed fires', async () => {
    const { getUserProfileFn } = await import('@/lib/server/api')
    ;(getUserProfileFn as any)
      .mockResolvedValueOnce({ role: 'user', handle: null, larvaId: '7' })
      .mockResolvedValueOnce({ role: 'user', handle: 'claimed-name', larvaId: '7' })

    render(<AIChatPanel userId="usr_valid_user" />)

    await waitFor(() => {
      expect(getUserProfileFn).toHaveBeenCalledTimes(1)
    })

    window.dispatchEvent(new CustomEvent('member-handle-changed'))

    await waitFor(() => {
      expect(getUserProfileFn).toHaveBeenCalledTimes(2)
    })
  })
})

describe('AIChatPanel Chats List Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOracleUsage).mockReturnValue({ snapshot: null, unavailable: false, blocked: false, refresh: vi.fn() })
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 390 })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders Chats button in header for desktop / compact panel', () => {
    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    expect(chatsBtn).toBeInTheDocument()
    expect(chatsBtn).toHaveAttribute('title', 'Chats')
  })

  it('opens a full-width list panel on a narrow viewport, not a small anchored menu', async () => {
    const { getAIThreadsFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-1', title: 'First Carcinization Consultation', createdAt: new Date() },
      { id: 'thread-2', title: 'Deep Trench Strategy', createdAt: new Date() },
    ])

    render(<AIChatPanel userId="usr_valid_user" isCompact />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    const panel = await screen.findByTestId('oracle-chats-panel')
    expect(panel).toHaveAttribute('data-chats-layout', 'takeover')
    expect(panel).toHaveAttribute('aria-label', 'Chats')
    expect(panel.className).toMatch(/w-full/)
    expect(panel.className).toMatch(/flex-1/)
    expect(panel.className).not.toMatch(/absolute/)
    expect(panel.className).not.toMatch(/w-56/)
    expect(panel.className).not.toMatch(/max-h-\[48%\]/)
    expect(screen.getByText('Chats')).toBeInTheDocument()
    expect(screen.getByText('First Carcinization Consultation')).toBeInTheDocument()
    expect(screen.getByText('Deep Trench Strategy')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Back to conversation/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Close Chats$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start a new chat' })).toBeNull()
    expect(screen.getByRole('button', { name: /^New Chat$/i })).toBeInTheDocument()
  })

  it('keeps the chats menu free of retention text and blocks starting chat 51', async () => {
    const { getAIThreadsFn } = await import('@/lib/server/api')
    const threads = Array.from({ length: 50 }, (_, index) => ({
      id: `thread-${index}`,
      title: `Chat ${index + 1}`,
      archivedAt: index === 0 ? new Date().toISOString() : null,
    }))
    ;(getAIThreadsFn as any).mockResolvedValue(threads)

    render(<AIChatPanel userId="usr_valid_user" isCompact />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^New Chat$/i })).toBeDisabled()
    })
    expect(screen.getByRole('button', { name: /^New Chat$/i })).toHaveAttribute(
      'title',
      'You have 50 conversations. Delete one to start another.'
    )
    fireEvent.click(screen.getByRole('button', { name: /what is moltology/i }))
    expect(await screen.findByText('You have 50 conversations. Delete one to start another.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))
    expect(await screen.findByText('Delete a chat to start another.')).toBeInTheDocument()
    expect(screen.queryByText(/chats used/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Archived conversations become eligible/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^New Chat$/i })).toBeDisabled()
  })

  it('returns to the conversation after selecting a thread from the list', async () => {
    const { getAIThreadsFn, getAIMessagesFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-alpha', title: 'Chitin Density Analysis' },
    ])
    ;(getAIMessagesFn as any).mockResolvedValue([
      { id: 'msg-1', role: 'user', content: 'What is my shell hardness?' },
      { id: 'msg-2', role: 'assistant', content: 'Your shell hardness index is 94%.' },
    ])

    render(<AIChatPanel userId="usr_valid_user" isCompact />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    await waitFor(() => {
      expect(screen.getByText('Chitin Density Analysis')).toBeInTheDocument()
    })

    const threadItem = screen.getByRole('button', { name: /Chitin Density Analysis/i })
    fireEvent.click(threadItem)

    await waitFor(() => {
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      expect(screen.queryByText('Chats')).not.toBeInTheDocument()
      expect(screen.getByText('What is my shell hardness?')).toBeInTheDocument()
      expect(screen.getByText('Your shell hardness index is 94%.')).toBeInTheDocument()
    })
  })

  it('switches the visible transcript on the first chat selection without a reselect', async () => {
    const { getAIThreadsFn, getAIMessagesFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-a', title: 'First molt briefing' },
      { id: 'thread-b', title: 'Second trench notes' },
    ])

    const messagesByThread: Record<string, Array<{ id: string; role: string; content: string }>> = {
      'thread-a': [
        { id: 'a1', role: 'user', content: 'Alpha user turn' },
        { id: 'a2', role: 'assistant', content: 'Alpha oracle reply' },
      ],
      'thread-b': [
        { id: 'b1', role: 'user', content: 'Bravo user turn' },
        { id: 'b2', role: 'assistant', content: 'Bravo oracle reply' },
      ],
    }

    ;(getAIMessagesFn as any).mockImplementation(async ({ data }: { data: { threadId: string } }) => {
      if (data.threadId === 'thread-a') {
        await new Promise((resolve) => setTimeout(resolve, 40))
      }
      return messagesByThread[data.threadId] ?? []
    })

    render(<AIChatPanel userId="usr_valid_user" isCompact />)

    const openChatsAndSelect = async (title: RegExp) => {
      fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))
      const threadButton = await screen.findByRole('button', { name: title })
      fireEvent.click(threadButton)
    }

    await openChatsAndSelect(/First molt briefing/i)

    await waitFor(() => {
      expect(screen.getByText('Alpha user turn')).toBeInTheDocument()
      expect(screen.getByText('Alpha oracle reply')).toBeInTheDocument()
    })

    await openChatsAndSelect(/Second trench notes/i)

    await waitFor(() => {
      expect(screen.getByText('Bravo user turn')).toBeInTheDocument()
      expect(screen.getByText('Bravo oracle reply')).toBeInTheDocument()
    })
    expect(screen.queryByText('Alpha user turn')).not.toBeInTheDocument()
    expect(screen.queryByText('Alpha oracle reply')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Bravo user turn')).toBeInTheDocument()
      expect(screen.queryByText('Alpha user turn')).not.toBeInTheDocument()
    })

    await openChatsAndSelect(/First molt briefing/i)

    await waitFor(() => {
      expect(screen.getByText('Alpha user turn')).toBeInTheDocument()
      expect(screen.getByText('Alpha oracle reply')).toBeInTheDocument()
    })
    expect(screen.queryByText('Bravo user turn')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
  })

  it('loads a preselected thread transcript on first mount without requiring a second selection', async () => {
    const { getAIMessagesFn } = await import('@/lib/server/api')
    ;(getAIMessagesFn as any).mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Already selected question' },
      { id: 'm2', role: 'assistant', content: 'Already selected answer' },
    ])

    render(<AIChatPanel userId="usr_valid_user" threadId="thread-preselected" />)

    await waitFor(() => {
      expect(getAIMessagesFn).toHaveBeenCalledWith({
        data: { threadId: 'thread-preselected', userId: 'usr_valid_user', token: 'mock-jwt' },
      })
      expect(screen.getByText('Already selected question')).toBeInTheDocument()
      expect(screen.getByText('Already selected answer')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
  })

  it('returns to the current thread when using back on the list panel', async () => {
    const { getAIThreadsFn, getAIMessagesFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-alpha', title: 'Chitin Density Analysis' },
    ])
    ;(getAIMessagesFn as any).mockResolvedValue([
      { id: 'msg-1', role: 'user', content: 'What is my shell hardness?' },
      { id: 'msg-2', role: 'assistant', content: 'Your shell hardness index is 94%.' },
    ])

    render(<AIChatPanel userId="usr_valid_user" isCompact />)
    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))

    await waitFor(() => {
      expect(screen.getByText('Chitin Density Analysis')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Chitin Density Analysis/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      expect(screen.getByText('What is my shell hardness?')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))
    expect(screen.getByTestId('oracle-chats-panel')).toBeInTheDocument()
    expect(screen.queryByText('What is my shell hardness?')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      expect(screen.getByText('What is my shell hardness?')).toBeInTheDocument()
    })
  })

  it('resets chat and closes the list panel when clicking main New Chat header button', async () => {
    const { getAIThreadsFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-alpha', title: 'Chitin Density Analysis' },
    ])

    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    await waitFor(() => {
      expect(screen.getByText('Chats')).toBeInTheDocument()
    })

    const newChatBtn = screen.getByRole('button', { name: /^New Chat$/i })
    fireEvent.click(newChatBtn)

    await waitFor(() => {
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      expect(screen.queryByText('Chats')).not.toBeInTheDocument()
    })
  })

  it('closes the chats panel when clicking back or pressing Escape', async () => {
    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    expect(screen.getByText('Chats')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))
    expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()

    fireEvent.click(chatsBtn)
    expect(screen.getByText('Chats')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
  })

  it('renders the list as a left column when the Oracle window is wide', async () => {
    const { getAIThreadsFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-1', title: 'First Carcinization Consultation' },
    ])

    const resizeListeners: Array<(entries: Array<{ contentRect: { width: number } }>) => void> = []
    class MockResizeObserver {
      constructor(cb: (entries: Array<{ contentRect: { width: number } }>) => void) {
        resizeListeners.push(cb)
      }
      observe() {
        resizeListeners.forEach((cb) => cb([{ contentRect: { width: 720 } }]))
      }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver)

    render(<AIChatPanel userId="usr_valid_user" />)
    fireEvent.click(screen.getByRole('button', { name: /Toggle Chats/i }))

    const panel = await screen.findByTestId('oracle-chats-panel')
    await waitFor(() => {
      expect(panel).toHaveAttribute('data-chats-layout', 'column')
    })
    expect(panel.className).toMatch(/w-64/)
    expect(panel.className).toMatch(/border-r/)
    expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
    expect(screen.getByText('First Carcinization Consultation')).toBeInTheDocument()
  })

  it('displays guest mode notice with Sign Up CTA when unauthenticated', async () => {
    render(<AIChatPanel userId={null} />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    expect(screen.getByText('Chats')).toBeInTheDocument()
    expect(screen.getAllByText(/GUEST MODE/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Guest chats aren't saved/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP FREE/i })).toBeInTheDocument()
  })

  it('does not paint guest chrome while the session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    render(<AIChatPanel />)

    expect(screen.queryByText(/GUEST MODE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You're exploring as a guest/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP FREE/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Sign Up$/i })).not.toBeInTheDocument()
  })

  it('does not treat an explicit parent userId of null as guest while the session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    render(<AIChatPanel userId={null} />)

    expect(screen.queryByText(/GUEST MODE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You're exploring as a guest/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP FREE/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Sign Up$/i })).not.toBeInTheDocument()
  })
})

describe('AIChatPanel Thinking State & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOracleUsage).mockReturnValue({ snapshot: null, unavailable: false, blocked: false, refresh: vi.fn() })
  })

  it('renders thinking dots while awaiting assistant response', async () => {
    const { streamOracleChat } = await import('@/lib/ai/stream-oracle-chat-client')
    let finishChat: (res: any) => void
    ;(streamOracleChat as any).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishChat = resolve
        })
    )

    render(<AIChatPanel userId="usr_valid_user" />)
    const shortcutBtn = screen.getByRole('button', { name: /what is moltology/i })
    fireEvent.click(shortcutBtn)

    // User message and thinking dots should be visible
    expect(screen.getByText('What is Moltology and why should I molt?')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /Thinking.../i })).toBeInTheDocument()

    // Resolve chat
    finishChat!({ text: 'Response received.', threadId: 'thread-new' })
    await waitFor(() => {
      expect(screen.getByText('Response received.')).toBeInTheDocument()
      expect(screen.queryByRole('status', { name: /Thinking.../i })).not.toBeInTheDocument()
    })
  })

  it('handles stream errors by clearing empty assistant placeholder and showing error alert', async () => {
    const { streamOracleChat } = await import('@/lib/ai/stream-oracle-chat-client')
    ;(streamOracleChat as any).mockRejectedValueOnce(
      new Error('The Oracle was unable to reach the neural matrix.')
    )

    render(<AIChatPanel userId="usr_valid_user" />)
    const shortcutBtn = screen.getByRole('button', { name: /what is moltology/i })
    fireEvent.click(shortcutBtn)

    await waitFor(() => {
      expect(
        screen.getByText('The Oracle was unable to reach the neural matrix.')
      ).toBeInTheDocument()
      expect(screen.queryByRole('status', { name: /Thinking.../i })).not.toBeInTheDocument()
    })
  })

  it('offers Retry on a failed send and resends the same question', async () => {
    const { streamOracleChat } = await import('@/lib/ai/stream-oracle-chat-client')
    ;(streamOracleChat as any).mockRejectedValueOnce(new Error('Daily limit reached.'))

    render(<AIChatPanel userId="usr_valid_user" />)
    fireEvent.click(screen.getByRole('button', { name: /what is moltology/i }))

    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.getByRole('alert')).toHaveTextContent('Daily limit reached.')

    fireEvent.click(retry)
    await waitFor(() => {
      expect(screen.getByText(/Stage 3 Exoshell requires complete chitin hardening/i)).toBeInTheDocument()
    })
    expect(screen.getAllByText('What is Moltology and why should I molt?')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })

  it('puts a failed message back in the box with Edit', async () => {
    const { streamOracleChat } = await import('@/lib/ai/stream-oracle-chat-client')
    ;(streamOracleChat as any).mockRejectedValueOnce(new Error('Network error.'))

    render(<AIChatPanel userId="usr_valid_user" />)
    fireEvent.click(screen.getByRole('button', { name: /what is moltology/i }))

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    expect(box.value).toBe('What is Moltology and why should I molt?')
  })

  it('stops a streaming reply and keeps what arrived', async () => {
    const { streamOracleChat } = await import('@/lib/ai/stream-oracle-chat-client')
    ;(streamOracleChat as any).mockImplementationOnce(
      ({ signal, onChunk }: { signal: AbortSignal; onChunk: (t: string) => void }) =>
        new Promise((_, reject) => {
          onChunk('Partial wisdom')
          signal.addEventListener('abort', () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
    )

    render(<AIChatPanel userId="usr_valid_user" />)
    fireEvent.click(screen.getByRole('button', { name: /what is moltology/i }))

    fireEvent.click(await screen.findByRole('button', { name: 'Stop reply' }))
    await waitFor(() => {
      expect(screen.getByText('Stopped.')).toBeInTheDocument()
    })
    expect(screen.getByText('Partial wisdom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
  })

  it('shows Copy on finished replies', async () => {
    render(<AIChatPanel userId="usr_valid_user" />)
    fireEvent.click(screen.getByRole('button', { name: /what is moltology/i }))
    expect(await screen.findByRole('button', { name: 'Copy message' })).toBeInTheDocument()
  })
})
