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
    expect(screen.getByText(/MEMBER BENEFITS:/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /SIGN UP/i }).length).toBeGreaterThan(0)
  })

  it('renders historical threads sidebar when user is authenticated', async () => {
    mockUser = { id: 'usr_oracle_initiate', name: 'Lobster initiate' }
    const Component = (Route as any).component
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText(/HISTORICAL THREADS/i)).toBeInTheDocument()
      expect(screen.getByText(/NEW CONSULTATION/i)).toBeInTheDocument()
    })
  })
})
