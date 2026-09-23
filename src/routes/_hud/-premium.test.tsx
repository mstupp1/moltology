import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './premium'
import { authClient } from '@/lib/auth-client'
import { clearCachedUser } from '@/lib/auth-session'
import { getUserProfileFn } from '@/lib/server/api'
import { getPremiumOfferFn } from '@/lib/server/premium-api'

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

vi.mock('@/lib/server/premium-api', () => ({
  getPremiumOfferFn: vi.fn(),
  createPremiumCheckoutFn: vi.fn(),
  createPremiumPortalFn: vi.fn(),
}))

const LAZY_TIMEOUT = 5000

const freeOffer = {
  hasPurchasedPremium: false,
  isPremium: false,
  priceLabel: '$5.99 per month',
  canManage: false,
  configured: true,
  configMessage: null,
}

describe('Premium HUD route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCachedUser()
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: 'user' } as never)
    vi.mocked(getPremiumOfferFn).mockResolvedValue(freeOffer)
  })

  it('hides the page from guests', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as never)
    const Component = Route.options.component!
    render(<Component />)

    expect(await screen.findByTestId('hidden-page-unavailable')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'This page is not available' })).toBeInTheDocument()
    expect(screen.queryByTestId('premium-page')).not.toBeInTheDocument()
    expect(getPremiumOfferFn).not.toHaveBeenCalled()
  })

  it('hides the page from signed-in members', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Member', email: 'member@example.com', role: 'user' } },
      isPending: false,
    } as never)
    const Component = Route.options.component!
    render(<Component />)

    expect(await screen.findByTestId('hidden-page-unavailable', {}, { timeout: LAZY_TIMEOUT })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Premium membership/i })).not.toBeInTheDocument()
    expect(getPremiumOfferFn).not.toHaveBeenCalled()
  })

  it('renders the membership page for admins', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', email: 'ops@example.com', role: 'admin' } },
      isPending: false,
    } as never)
    const Component = Route.options.component!
    render(<Component />)

    expect(await screen.findByRole('heading', { name: /Premium membership/i }, { timeout: LAZY_TIMEOUT })).toBeInTheDocument()
    expect(screen.getByText('Premium benefits are not available yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Subscribe to Premium/i })).toBeInTheDocument()
    expect(screen.queryByTestId('hidden-page-unavailable')).not.toBeInTheDocument()
  })

  it('renders the membership page for super admins', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'super-1', name: 'Super', email: 'myles@moltology.org', role: 'user' } },
      isPending: false,
    } as never)
    const Component = Route.options.component!
    render(<Component />)

    expect(
      await screen.findByRole('heading', { name: /Premium membership/i }, { timeout: LAZY_TIMEOUT }),
    ).toBeInTheDocument()
  })
})
