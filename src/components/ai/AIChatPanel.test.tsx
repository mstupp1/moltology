import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIChatPanel } from './AIChatPanel'
import { sendChatMessageHandler } from '@/lib/server/api'

// Mock scrollIntoView for test environment
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
}))

vi.mock('@/lib/ai/stream-oracle-chat-client', () => ({
  streamOracleChat: vi.fn().mockImplementation(async ({ userId, onChunk, onThreadId }) => {
    if (!userId) {
      const text =
        'The abyssal waters stir around your uncalibrated signal... Your inquiry ripples into the deep trench, but your neural frequency remains in unregistered Guest Drift. Transmute your biological hesitation and initialize an initiate account.'
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

  it('renders authenticated new chat screen without guest CTA or canned message when userId is provided', () => {
    render(<AIChatPanel userId="usr_valid_user" personaName="SYNAPTIC ORACLE" />)

    expect(screen.queryByText(/Welcome! I am the/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Welcome back!/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Sign up free to unlock/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You're currently exploring in Guest Mode/i)).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask the SYNAPTIC ORACLE.../i)).toBeInTheDocument()
  })

  it('submits a shortcut in guest mode and ensures conversation starts with user message and no canned message before it', async () => {
    render(<AIChatPanel userId={null} />)

    const shortcutBtn = screen.getByRole('button', { name: /what is moltology/i })
    fireEvent.click(shortcutBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/The abyssal waters stir around your uncalibrated signal/i)
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
      expect(screen.getByPlaceholderText(/Ask the SYNAPTIC ORACLE.../i)).toBeInTheDocument()
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
})

describe('AIChatPanel Chats Dropdown Window', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Chats button in header for desktop / compact panel', () => {
    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    expect(chatsBtn).toBeInTheDocument()
    expect(chatsBtn).toHaveAttribute('title', 'Chats')
  })

  it('opens small scrollable window with list of chats when clicking Chats button', async () => {
    const { getAIThreadsFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-1', title: 'First Carcinization Consultation', createdAt: new Date() },
      { id: 'thread-2', title: 'Deep Trench Strategy', createdAt: new Date() },
    ])

    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    await waitFor(() => {
      expect(screen.getByText('CHATS')).toBeInTheDocument()
      expect(screen.getByText('First Carcinization Consultation')).toBeInTheDocument()
      expect(screen.getByText('Deep Trench Strategy')).toBeInTheDocument()
    })
  })

  it('switches active thread and loads messages when selecting a chat from the window', async () => {
    const { getAIThreadsFn, getAIMessagesFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-alpha', title: 'Chitin Density Analysis' },
    ])
    ;(getAIMessagesFn as any).mockResolvedValue([
      { id: 'msg-1', role: 'user', content: 'What is my shell hardness?' },
      { id: 'msg-2', role: 'assistant', content: 'Your shell hardness index is 94%.' },
    ])

    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    await waitFor(() => {
      expect(screen.getByText('Chitin Density Analysis')).toBeInTheDocument()
    })

    const threadItem = screen.getByRole('button', { name: /Chitin Density Analysis/i })
    fireEvent.click(threadItem)

    // Chats popup should close
    await waitFor(() => {
      expect(screen.queryByText('CHATS')).not.toBeInTheDocument()
      expect(screen.getByText('What is my shell hardness?')).toBeInTheDocument()
      expect(screen.getByText('Your shell hardness index is 94%.')).toBeInTheDocument()
    })
  })

  it('resets chat and closes dropdown when clicking main New Chat header button', async () => {
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
      expect(screen.queryByText('CHATS')).not.toBeInTheDocument()
    })
  })

  it('closes the chats window when clicking close button or pressing Escape', async () => {
    render(<AIChatPanel userId="usr_valid_user" />)
    const chatsBtn = screen.getByRole('button', { name: /Toggle Chats/i })
    fireEvent.click(chatsBtn)

    expect(screen.getByText('CHATS')).toBeInTheDocument()

    const closeWindowBtn = screen.getByRole('button', { name: /Close Chats Window/i })
    fireEvent.click(closeWindowBtn)

    expect(screen.queryByText('CHATS')).not.toBeInTheDocument()

    // Reopen and test Escape key
    fireEvent.click(chatsBtn)
    expect(screen.getByText('CHATS')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('CHATS')).not.toBeInTheDocument()
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


