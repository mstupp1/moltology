import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GuestLockGuard } from './GuestLockGuard'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

describe('GuestLockGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders locked overlay, dim screen, lock icon, and sign up CTA for guest users', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(
      <GuestLockGuard
        featureName="Molt Academy"
        message="Coursework requires an initiate account."
      >
        <div>Secret Academy Content</div>
      </GuestLockGuard>
    )

    // Verify lock card details
    expect(screen.getByText('Sign in for Molt Academy')).toBeInTheDocument()
    expect(screen.getByText('Account needed')).toBeInTheDocument()
    expect(screen.getByText('Coursework requires an initiate account.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create a free account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Already have an account\? Sign in/i })).toBeInTheDocument()

    // Verify background content exists under dim blur layer
    expect(screen.getByText('Secret Academy Content')).toBeInTheDocument()
  })

  it('opens AuthModal in signup mode when clicking Create a free account', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(
      <GuestLockGuard featureName="Podcasts">
        <div>Podcast Tracks</div>
      </GuestLockGuard>
    )

    const signUpBtn = screen.getByRole('button', { name: /Create a free account/i })
    fireEvent.click(signUpBtn)

    expect(screen.getByRole('heading', { name: /CREATE ACCOUNT/i })).toBeInTheDocument()
  })

  it('opens AuthModal in login mode when clicking Sign In link', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(
      <GuestLockGuard featureName="Benthic Lectures">
        <div>Lecture Content</div>
      </GuestLockGuard>
    )

    const signInBtn = screen.getByRole('button', { name: /Already have an account\? Sign in/i })
    fireEvent.click(signInBtn)

    expect(screen.getByRole('heading', { name: /WELCOME BACK/i })).toBeInTheDocument()
  })

  it('renders content directly without lock overlay for authenticated users', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-123', name: 'Commander Craw' } },
    } as any)

    render(
      <GuestLockGuard featureName="Benthic Archive">
        <div>Unlocked Biological Specimens</div>
      </GuestLockGuard>
    )

    expect(screen.getByText('Unlocked Biological Specimens')).toBeInTheDocument()
    expect(screen.queryByText('Sign in for Benthic Archive')).not.toBeInTheDocument()
    expect(screen.queryByText('Account needed')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create a free account/i })).not.toBeInTheDocument()
  })

  it('bypasses guest lock when bypass prop is set to true', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(
      <GuestLockGuard featureName="Chassis Configurator" bypass={true}>
        <div>Bypassed Studio Content</div>
      </GuestLockGuard>
    )

    expect(screen.getByText('Bypassed Studio Content')).toBeInTheDocument()
    expect(screen.queryByText('Sign in for Chassis Configurator')).not.toBeInTheDocument()
  })

  it('holds the lock overlay for the first-paint empty session shape', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)

    render(
      <GuestLockGuard featureName="Lectures">
        <div>Secret Content</div>
      </GuestLockGuard>
    )

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(screen.queryByText('Sign in for Lectures')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create a free account/i })).not.toBeInTheDocument()
  })

  it('renders default HudWorkspaceGhost when authClient.useSession is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)

    render(
      <GuestLockGuard featureName="Lectures">
        <div>Secret Content</div>
      </GuestLockGuard>
    )

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(screen.queryByText('Sign in for Lectures')).not.toBeInTheDocument()
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
  })

  it('renders custom skeleton when provided and authClient.useSession is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)

    render(
      <GuestLockGuard
        featureName="Benthic Archive"
        skeleton={<div data-testid="custom-archive-skeleton">Loading Archive...</div>}
      >
        <div>Archive Content</div>
      </GuestLockGuard>
    )

    expect(screen.getByTestId('custom-archive-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Sign in for Benthic Archive')).not.toBeInTheDocument()
    expect(screen.queryByText('Archive Content')).not.toBeInTheDocument()
  })
})

