import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIChatPanel } from './AIChatPanel'
import { sendChatMessageHandler } from '@/lib/server/db-services'
import { authClient } from '@/lib/auth-client'

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
  })

  it('renders guest mode new chat screen on initial load with no canned messages', () => {
    render(<AIChatPanel userId={null} personaName="SYNAPTIC ORACLE" />)

    expect(screen.queryByText(/Welcome! I am the/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Welcome back!/i)).not.toBeInTheDocument()
    expect(screen.getByText(/You're currently exploring in Guest Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Sign up free to unlock/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument()
  })

  it('renders authenticated new chat screen without guest CTA or canned message when userId is provided', async () => {
    render(<AIChatPanel userId="usr_valid_user" personaName="SYNAPTIC ORACLE" />)

    expect(screen.queryByText(/Welcome! I am the/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Welcome back!/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Sign up free to unlock/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You're currently exploring in Guest Mode/i)).not.toBeInTheDocument()
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
    expect(screen.getAllByText(/Sign up free to unlock/i).length).toBeGreaterThan(0)
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

    const newChatBtn = screen.getByRole('button', { name: /New Chat/i })
    expect(newChatBtn).toBeInTheDocument()
    fireEvent.click(newChatBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Stage 3 Exoshell requires complete chitin hardening/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/What is Moltology and why should I molt?/i)).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
    })
  })

  it('renders a faded grayscale watermark of the logo in the background', () => {
    const { container } = render(<AIChatPanel userId="usr_valid_user" />)
    const watermarkImg = container.querySelector('img[src*="order_emblem.png"].grayscale')
    expect(watermarkImg).toBeInTheDocument()
    expect(watermarkImg?.className).toContain('grayscale')
    expect(watermarkImg?.className).toContain('opacity-[0.035]')
    expect(watermarkImg?.parentElement?.className).toContain('pointer-events-none')
  })

  it('does not render the extra moltology logo emblem in the top left header', () => {
    const { container } = render(<AIChatPanel userId="usr_valid_user" personaName="SYNAPTIC ORACLE" />)
    const header = container.querySelector('.border-b')
    expect(header).toBeInTheDocument()
    const headerLogo = header?.querySelector('img[src*="order_emblem.png"]')
    expect(headerLogo).toBeNull()
    expect(screen.getByText('SYNAPTIC ORACLE')).toBeInTheDocument()
  })
})

describe('AIChatPanel Chats List Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(screen.getByText('CHATS')).toBeInTheDocument()
    expect(screen.getByText('First Carcinization Consultation')).toBeInTheDocument()
    expect(screen.getByText('Deep Trench Strategy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to conversation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Close Chats$/i })).toBeInTheDocument()
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
      expect(screen.queryByText('CHATS')).not.toBeInTheDocument()
      expect(screen.getByText('What is my shell hardness?')).toBeInTheDocument()
      expect(screen.getByText('Your shell hardness index is 94%.')).toBeInTheDocument()
    })
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

    fireEvent.click(screen.getByRole('button', { name: /Back to conversation/i }))

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
      expect(screen.getByText('CHATS')).toBeInTheDocument()
    })

    const newChatBtn = screen.getByRole('button', { name: /New Chat/i })
    fireEvent.click(newChatBtn)

    await waitFor(() => {
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      expect(screen.queryByText('CHATS')).not.toBeInTheDocument()
    })
  })

  it('closes the chats panel when clicking close or pressing Escape', async () => {
    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    expect(screen.getByText('CHATS')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Close Chats$/i }))
    expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()

    fireEvent.click(chatsBtn)
    expect(screen.getByText('CHATS')).toBeInTheDocument()
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

    expect(screen.getByText('CHATS')).toBeInTheDocument()
    expect(screen.getAllByText(/GUEST MODE/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Chats in guest mode are temporary/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP FREE/i })).toBeInTheDocument()
  })

  it('does not paint guest chrome while the session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    render(<AIChatPanel />)

    expect(screen.queryByText(/GUEST MODE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You're currently exploring in Guest Mode/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP FREE/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Sign Up$/i })).not.toBeInTheDocument()
  })

  it('does not treat an explicit parent userId of null as guest while the session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    render(<AIChatPanel userId={null} />)

    expect(screen.queryByText(/GUEST MODE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You're currently exploring in Guest Mode/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP FREE/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Sign Up$/i })).not.toBeInTheDocument()
  })
})

describe('AIChatPanel Thinking State & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})


