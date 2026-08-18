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

  it('renders guest mode welcome without top banner or initial in-message CTA', () => {
    render(<AIChatPanel userId={null} personaName="SYNAPTIC ORACLE" />)

    expect(screen.queryByText(/Guest Mode: Answers are limited and chats aren't saved/i)).not.toBeInTheDocument()
    expect(screen.getByText(/You're currently exploring in Guest Mode/i)).toBeInTheDocument()
    // In-message CTA card is NOT present on the initial welcome message
    expect(screen.queryByText(/Sign up free to unlock full answers/i)).not.toBeInTheDocument()
  })

  it('renders authenticated welcome when userId is provided', () => {
    render(<AIChatPanel userId="usr_valid_user" personaName="SYNAPTIC ORACLE" />)

    expect(screen.queryByText(/Guest Mode: Answers are limited/i)).not.toBeInTheDocument()
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

    // Initiate in-message CTA card appears after user sends a query
    expect(screen.getByText(/Sign up free to unlock/i)).toBeInTheDocument()
    const accountButtons = screen.getAllByRole('button', { name: /Sign Up/i })
    expect(accountButtons.length).toBeGreaterThan(0)
  })

  it('opens AuthModal when clicking in-message sign up button in guest mode', async () => {
    render(<AIChatPanel userId={null} />)

    const shortcutBtn = screen.getByRole('button', { name: /🦞 What is Moltology\?/i })
    fireEvent.click(shortcutBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/The abyssal waters stir around your uncalibrated signal/i)
      ).toBeInTheDocument()
    })

    const inMessageSignUpBtn = screen.getByRole('button', { name: /Sign Up/i })
    fireEvent.click(inMessageSignUpBtn)

    await waitFor(() => {
      expect(screen.getAllByText(/Create Account/i).length).toBeGreaterThan(0)
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
