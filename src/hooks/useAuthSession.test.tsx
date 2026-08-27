import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { authClient } from '@/lib/auth-client'
import { useAuthSession } from './useAuthSession'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

function Probe() {
  const session = useAuthSession()
  return (
    <div>
      <span data-testid="pending">{String(session.isPending)}</span>
      <span data-testid="guest">{String(session.isGuest)}</span>
      <span data-testid="auth">{String(session.isAuthenticated)}</span>
      <span data-testid="user">{session.userId || 'none'}</span>
    </div>
  )
}

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('holds chrome when the session hook has not settled', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    render(<Probe />)
    expect(screen.getByTestId('pending')).toHaveTextContent('true')
    expect(screen.getByTestId('guest')).toHaveTextContent('false')
    expect(screen.getByTestId('auth')).toHaveTextContent('false')
  })

  it('exposes guest only after the session hook settles empty', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    render(<Probe />)
    expect(screen.getByTestId('pending')).toHaveTextContent('false')
    expect(screen.getByTestId('guest')).toHaveTextContent('true')
    expect(screen.getByTestId('auth')).toHaveTextContent('false')
  })

  it('exposes the member as soon as a user is present', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'usr_probe', name: 'QA' } },
      isPending: true,
    } as any)
    render(<Probe />)
    expect(screen.getByTestId('pending')).toHaveTextContent('false')
    expect(screen.getByTestId('guest')).toHaveTextContent('false')
    expect(screen.getByTestId('auth')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('usr_probe')
  })
})
