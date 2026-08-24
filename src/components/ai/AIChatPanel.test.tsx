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

// Mock server API functions used by component
vi.mock('@/lib/server/api', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    sendChatMessageFn: vi.fn().mockImplementation(async ({ data }) => {
      if (!data?.userId) {
        return {
          text: 'The abyssal waters stir around your uncalibrated signal... Your inquiry ripples into the deep trench, but your neural frequency remains in unregistered Guest Drift. Transmute your biological hesitation and initialize an initiate account.',
          threadId: null,
          isGuest: true,
        }
      }
      return {
        text: 'The Synaptic Oracle analyzes your telemetry: Stage 3 Exoshell requires complete chitin hardening.',
        threadId: data.threadId || 'thread-123',
      }
    }),
    getAIMessagesFn: vi.fn().mockResolvedValue([]),
    getAIThreadsFn: vi.fn().mockResolvedValue([]),
  }
})

describe('AIChatPanel Guest Mode Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders guest mode welcome with in-message CTA on initial load', () => {
    render(<AIChatPanel userId={null} personaName="SYNAPTIC ORACLE" />)

    expect(screen.queryByText(/Guest Mode: Answers are limited and chats aren't saved/i)).not.toBeInTheDocument()
    expect(screen.getByText(/You're currently exploring in Guest Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Sign up free to unlock/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument()
  })

  it('renders authenticated welcome without guest CTA when userId is provided', () => {
    render(<AIChatPanel userId="usr_valid_user" personaName="SYNAPTIC ORACLE" />)

    expect(screen.queryByText(/Sign up free to unlock/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Welcome back! I am the SYNAPTIC ORACLE/i)).toBeInTheDocument()
  })

  it('submits a shortcut in guest mode and receives vague guest answer with in-message CTA button', async () => {
    render(<AIChatPanel userId={null} />)

    const shortcutBtn = screen.getByRole('button', { name: /🦞 What is Moltology\?/i })
    fireEvent.click(shortcutBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/The abyssal waters stir around your uncalibrated signal/i)
      ).toBeInTheDocument()
    })

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

  it('resets conversation to initial welcome when clicking New Chat button', async () => {
    render(<AIChatPanel userId="usr_valid_user" />)

    const shortcutBtn = screen.getByRole('button', { name: /🦞 What is Moltology\?/i })
    fireEvent.click(shortcutBtn)

    await waitFor(() => {
      expect(screen.getByText(/Stage 3 Exoshell requires complete chitin hardening/i)).toBeInTheDocument()
    })

    const newChatBtn = screen.getByRole('button', { name: /New Chat/i })
    expect(newChatBtn).toBeInTheDocument()
    fireEvent.click(newChatBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Stage 3 Exoshell requires complete chitin hardening/i)).not.toBeInTheDocument()
      expect(screen.getByText(/What would you like to explore or improve today\?/i)).toBeInTheDocument()
    })
  })
})

describe('sendChatMessageHandler Server Gating', () => {
  it('returns vague lore response with isGuest=true when userId is null/unauthenticated', async () => {
    const result = await sendChatMessageHandler({
      data: {
        messages: [{ role: 'user', content: 'Tell me the secret protocols' }],
        userId: undefined,
      },
      context: {} as any,
    })

    expect(result.isGuest).toBe(true)
    expect(result.threadId).toBeNull()
    expect(result.text).toMatch(/Oracle|account|Guest/i)
  })
})
