import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Route } from './oracle'

window.HTMLElement.prototype.scrollIntoView = vi.fn()

let mockUser: any = null

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => config,
  useLocation: () => ({ pathname: '/oracle' }),
  useNavigate: () => vi.fn(),
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: mockUser ? { user: mockUser } : null }),
  },
}))

// Mock OracleContext
vi.mock('@/components/hud/OracleContext', () => ({
  useSafeOracle: () => undefined,
}))

// Mock server API
vi.mock('@/lib/server/api', () => ({
  getAIThreadsFn: vi.fn().mockResolvedValue([
    { id: 'thread-1', title: 'Carcinization Inquiries' },
  ]),
  getAIMessagesFn: vi.fn().mockResolvedValue([]),
  sendChatMessageFn: vi.fn().mockResolvedValue({
    text: 'Guest response from the deep.',
    isGuest: true,
  }),
}))

describe('Oracle Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
  })

  it('renders guest mode benefits box and create account CTA when unauthenticated', () => {
    const Component = (Route as any).component
    render(<Component />)

    expect(screen.getAllByText(/GUEST MODE/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/MEMBER BENEFITS:/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /SIGN UP/i }).length).toBeGreaterThan(0)
  })

  it('renders historical chats sidebar when user is authenticated', async () => {
    mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
    const Component = (Route as any).component
    render(<Component />)

    await waitFor(() => {
      expect(screen.getAllByText('CHATS').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/New Chat/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Carcinization Inquiries/i).length).toBeGreaterThan(0)
    })
  })

  it('toggles mobile conversations overlay drawer open and close', async () => {
    mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
    const Component = (Route as any).component
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Toggle Conversations/i })).toBeInTheDocument()
    })

    const toggleBtn = screen.getByRole('button', { name: /Toggle Conversations/i })
    const drawer = screen.getByRole('dialog', { name: /Conversations/i })

    // Initially drawer should be hidden via transform
    expect(drawer).toHaveClass('-translate-x-full')

    // Click toggle button to open drawer
    fireEvent.click(toggleBtn)
    expect(drawer).toHaveClass('translate-x-0')

    // Close drawer via close button
    const closeBtn = screen.getByRole('button', { name: /Close Conversations/i })
    fireEvent.click(closeBtn)
    expect(drawer).toHaveClass('-translate-x-full')
  })

  it('selects thread from mobile drawer and closes drawer', async () => {
    mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
    const Component = (Route as any).component
    render(<Component />)

    await waitFor(() => {
      expect(screen.getAllByText('Carcinization Inquiries').length).toBeGreaterThan(0)
    })

    const toggleBtn = screen.getByRole('button', { name: /Toggle Conversations/i })
    fireEvent.click(toggleBtn)

    const drawer = screen.getByRole('dialog', { name: /Conversations/i })
    expect(drawer).toHaveClass('translate-x-0')

    // Find thread button inside mobile drawer and click it
    const drawerThreadButtons = screen.getAllByRole('button', { name: /Carcinization Inquiries/i })
    fireEvent.click(drawerThreadButtons[drawerThreadButtons.length - 1])

    // Drawer should close
    expect(drawer).toHaveClass('-translate-x-full')
  })
})

