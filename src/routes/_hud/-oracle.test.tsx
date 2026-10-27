import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Route } from './oracle'

import { authClient } from '@/lib/auth-client'

window.HTMLElement.prototype.scrollIntoView = vi.fn()

let mockUser: any = null
let mockOracleSearch: Record<string, unknown> = {}

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => config,
  useLocation: () => ({ pathname: '/oracle' }),
  useNavigate: () => vi.fn(),
  useSearch: () => mockOracleSearch,
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

// Mock OracleContext
vi.mock('@/components/hud/OracleContext', () => ({
  useSafeOracle: () => undefined,
}))

// Mock server API
vi.mock('@/lib/server/api', () => ({
  getAIThreadsFn: vi.fn().mockResolvedValue([
    { id: 'thread-1', title: 'Carcinization Inquiries', updatedAt: '2026-08-30T16:00:00.000Z' },
    { id: 'thread-2', title: 'Older trench notes', updatedAt: '2026-08-20T12:00:00.000Z' },
  ]),
  getAIMessagesFn: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/ai/stream-oracle-chat-client', () => ({
  streamOracleChat: vi.fn().mockResolvedValue({
    text: 'Guest response from the deep.',
    isGuest: true,
  }),
}))

describe('Oracle Route Component', () => {
  afterEach(() => { vi.unstubAllGlobals() })
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubGlobal('innerWidth', 390)
    mockUser = null
    mockOracleSearch = {}
    vi.mocked(authClient.useSession).mockImplementation(() => ({
      data: mockUser ? { user: mockUser } : null,
      isPending: false,
    }) as any)
  })

  it('opens the shared guest chats menu from the header', async () => {
    const Component = (Route as any).component
    render(<Component />)

    const toggle = await screen.findByRole('button', { name: 'Toggle Chats' }, { timeout: 5000 })
    expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
    fireEvent.click(toggle)

    expect(screen.getByTestId('oracle-chats-panel')).toHaveClass('w-full', 'flex-1')
    expect(screen.getByText(/Guest chats aren't saved/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SIGN UP FREE' })).toBeInTheDocument()
  })

  it.each([390])('uses the shared full-width menu at %ipx', async (width) => {
    const resizeSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width)
    try {
      mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
      const Component = (Route as any).component
      render(<Component />)

      const toggle = await screen.findByRole('button', { name: 'Toggle Chats' }, { timeout: 5000 })
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      expect(screen.queryByTestId('oracle-chats-column')).not.toBeInTheDocument()
      fireEvent.click(toggle)

      const menu = screen.getByTestId('oracle-chats-panel')
      expect(menu).toHaveAttribute('data-chats-layout', 'takeover')
      expect(menu).toHaveClass('w-full', 'flex-1')
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(screen.queryByRole('dialog', { name: 'Chats' })).not.toBeInTheDocument()
      expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument()
      expect(await screen.findByText('Carcinization Inquiries')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()

      fireEvent.click(toggle)
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      fireEvent.click(toggle)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()

      fireEvent.click(toggle)
      fireEvent.click(await screen.findByRole('button', { name: /Carcinization Inquiries/i }))
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      const { getAIMessagesFn } = await import('@/lib/server/api')
      await waitFor(() => expect(getAIMessagesFn).toHaveBeenCalledWith({
        data: expect.objectContaining({ threadId: 'thread-1', userId: 'usr_oracle_initiate' }),
      }))
      fireEvent.click(screen.getByRole('button', { name: 'New Chat' }))
      expect(screen.queryByText('Carcinization Inquiries')).not.toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
    } finally {
      resizeSpy.mockRestore()
    }
  })

  it('keeps the desktop chats column beside the conversation, including after selecting a chat', async () => {
    vi.stubGlobal('innerWidth', 1280)
    const resizeSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(900)
    try {
      mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
      const Component = (Route as any).component
      render(<Component />)
      const panel = await screen.findByTestId('oracle-chats-panel')
      expect(panel).toHaveAttribute('data-chats-layout', 'column')
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
      fireEvent.click(await screen.findByRole('button', { name: /Carcinization Inquiries/i }))
      expect(screen.getByTestId('oracle-chats-panel')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
      const toggle = screen.getByRole('button', { name: 'Toggle Chats' })
      fireEvent.click(toggle)
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      expect(localStorage.getItem('moltology:oracle_page_chats')).toBe('closed')
      fireEvent.click(toggle)
      expect(screen.getByTestId('oracle-chats-panel')).toHaveAttribute('data-chats-layout', 'column')
      vi.stubGlobal('innerWidth', 390)
      fireEvent.resize(window)
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
      fireEvent.click(toggle)
      expect(screen.getByTestId('oracle-chats-panel')).toHaveAttribute('data-chats-layout', 'takeover')
      expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument()
      vi.stubGlobal('innerWidth', 1280)
      fireEvent.resize(window)
      expect(screen.getByTestId('oracle-chats-panel')).toHaveAttribute('data-chats-layout', 'column')
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
    } finally {
      resizeSpy.mockRestore()
    }
  })

  it('opens the requested thread from hub search instead of a blank consultation', async () => {
    mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
    mockOracleSearch = { thread: 'thread-1' }
    const { getAIMessagesFn } = await import('@/lib/server/api')
    vi.mocked(getAIMessagesFn).mockResolvedValue([
      { id: 'msg-1', role: 'user', content: 'How do I keep the last molt from melting?' },
      { id: 'msg-2', role: 'assistant', content: 'Hold the line. The shell you started is still yours.' },
    ] as any)

    const Component = (Route as any).component
    render(<Component />)

    await waitFor(() => {
      expect(getAIMessagesFn).toHaveBeenCalledWith({
        data: expect.objectContaining({ threadId: 'thread-1', userId: 'usr_oracle_initiate' }),
      })
      expect(screen.getByText(/How do I keep the last molt from melting/i)).toBeInTheDocument()
      expect(screen.getByText(/Hold the line/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Workspace Context/i })).not.toBeInTheDocument()
  })

  it('does not invent a consultation when the requested thread is gone', async () => {
    mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
    mockOracleSearch = { thread: 'thread-missing' }
    const { getAIMessagesFn } = await import('@/lib/server/api')

    const Component = (Route as any).component
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
    })
    expect(getAIMessagesFn).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
  })

  it('shows the new chat screen initially when opened, even if user has existing threads', async () => {
    mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
    const Component = (Route as any).component
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask Synaptic Oracle.../i)).toBeInTheDocument()
      expect(screen.queryByTestId('oracle-chats-panel')).not.toBeInTheDocument()
    })
  })

  it('marks the oracle noindex without a homepage canonical', () => {
    const head = (Route as any).head()
    expect(head.meta).toEqual(
      expect.arrayContaining([{ name: 'robots', content: 'noindex, nofollow' }]),
    )
    expect(head.links ?? []).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ rel: 'canonical' })]),
    )
  })

  it('holds chrome instead of GUEST MODE while the session is unresolved', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = (Route as any).component
    render(<Component />)

    fireEvent.click(await screen.findByRole('button', { name: 'Toggle Chats' }))
    expect(screen.getByTestId('oracle-chats-auth-skeleton')).toBeInTheDocument()
    expect(screen.queryByText(/GUEST MODE/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP/i })).not.toBeInTheDocument()
  })

  it('does not flash guest chrome when a pending session hydrates to a member', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    const Component = (Route as any).component
    const { rerender } = render(<Component />)

    expect(screen.queryByText(/GUEST MODE/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP/i })).not.toBeInTheDocument()

    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'usr_hydrated', name: 'QA Initiate' } },
      isPending: false,
    } as any)
    rerender(<Component />)

    expect(screen.queryByText(/GUEST MODE/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP/i })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Toggle Chats' }))
    expect(screen.getByTestId('oracle-chats-panel')).toBeInTheDocument()
    expect(await screen.findByText('Carcinization Inquiries')).toBeInTheDocument()
  })
})

