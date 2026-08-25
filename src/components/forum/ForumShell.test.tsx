import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { authClient } from '@/lib/auth-client'
import { ForumShell, useForumAuth } from './ForumShell'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/components/AuthModal', () => ({
  AuthModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="auth-modal">Auth Modal</div> : null,
}))

function AuthProbe() {
  const { isAuthenticated, userId } = useForumAuth()
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'authed' : 'guest'}</span>
      <span data-testid="user-id">{userId || 'none'}</span>
      {isAuthenticated ? <span>Post Reply Ready</span> : <span>Sign in to join the discussion.</span>}
    </div>
  )
}

describe('ForumShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('treats users as guests when session is empty', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)

    render(
      <ForumShell>
        <AuthProbe />
      </ForumShell>
    )

    expect(screen.getByTestId('auth-state')).toHaveTextContent('guest')
    expect(screen.getByTestId('user-id')).toHaveTextContent('none')
    expect(screen.getByText('Sign in to join the discussion.')).toBeInTheDocument()
  })

  it('authenticates when user lives under session data.user', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-from-data', name: 'Initiate' } },
    } as any)

    render(
      <ForumShell>
        <AuthProbe />
      </ForumShell>
    )

    expect(screen.getByTestId('auth-state')).toHaveTextContent('authed')
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-from-data')
    expect(screen.getByText('Post Reply Ready')).toBeInTheDocument()
  })

  it('authenticates via root user fallback when data.user is absent', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      user: { id: 'user-from-root', name: 'Ascendant' },
    } as any)

    render(
      <ForumShell>
        <AuthProbe />
      </ForumShell>
    )

    expect(screen.getByTestId('auth-state')).toHaveTextContent('authed')
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-from-root')
    expect(screen.getByText('Post Reply Ready')).toBeInTheDocument()
  })
})
