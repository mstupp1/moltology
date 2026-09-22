import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './subterranean'
import { authClient } from '@/lib/auth-client'
import { clearCachedUser } from '@/lib/auth-session'
import { getUserProfileFn } from '@/lib/server/api'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/server/api', () => ({
  getUserProfileFn: vi.fn().mockResolvedValue({ role: 'user' }),
}))

const LAZY_TIMEOUT = 5000

describe('Subterranean HUD Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCachedUser()
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: 'user' } as any)
  })

  it('hides the page from guests', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(await screen.findByTestId('hidden-page-unavailable')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'This page is not available' })).toBeInTheDocument()
    expect(screen.getByText('Your account does not have access to this page.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Command Hub' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByText('SUBTERRANEAN VATS LOCKED')).not.toBeInTheDocument()
    expect(screen.queryByText('ACTIVE BIO-VAT CONTAINMENT MATRIX')).not.toBeInTheDocument()
  })

  it('hides the page from signed-in members', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw', email: 'member@example.com', role: 'user' } },
      isPending: false,
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(await screen.findByTestId('hidden-page-unavailable', {}, { timeout: LAZY_TIMEOUT })).toBeInTheDocument()
    expect(screen.queryByText('MUTAGENIC HYBRID RESEARCH CHAMBERS')).not.toBeInTheDocument()
  })

  it('renders the vats hub for admins', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Commander Craw', email: 'ops@example.com', role: 'admin' } },
      isPending: false,
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(
      await screen.findByText('MUTAGENIC HYBRID RESEARCH CHAMBERS', {}, { timeout: LAZY_TIMEOUT })
    ).toBeInTheDocument()
    expect(screen.getByText('ACTIVE BIO-VAT CONTAINMENT MATRIX')).toBeInTheDocument()
    expect(screen.getByText('LOVECRAFTIAN ARCHIVAL TRANSCRIPTS')).toBeInTheDocument()
    expect(screen.queryByTestId('hidden-page-unavailable')).not.toBeInTheDocument()
  })

  it('renders the vats hub for super admins', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'super-1', name: 'Commander Craw', email: 'myles@moltology.org', role: 'user' } },
      isPending: false,
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(
      await screen.findByText('MUTAGENIC HYBRID RESEARCH CHAMBERS', {}, { timeout: LAZY_TIMEOUT })
    ).toBeInTheDocument()
  })
})
