import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PremiumBanner, PremiumDashboardBanner } from './PremiumDashboardBanner'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getPremiumMembershipFn } from '@/lib/server/premium-api'

vi.mock('@/hooks/useHiddenPageAccess', () => ({
  useHiddenPageAccess: vi.fn(),
}))

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('token'),
}))

vi.mock('@/lib/server/premium-api', () => ({
  getPremiumMembershipFn: vi.fn(),
}))

describe('Premium dashboard banner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthSession).mockReturnValue({
      userId: 'admin-1',
      user: { id: 'admin-1', email: 'ops@example.com', role: 'admin' },
      isPending: false,
    } as never)
  })

  it('names the free and lapsed states without offering current premium', () => {
    const { rerender } = render(<PremiumBanner hasPurchasedPremium={false} />)
    expect(screen.getByTestId('premium-dashboard-banner')).toHaveTextContent(/monthly membership/i)
    rerender(<PremiumBanner hasPurchasedPremium={true} />)
    expect(screen.getByTestId('premium-dashboard-banner')).toHaveTextContent(/not active/i)
    expect(screen.getByRole('link', { name: 'View Premium' })).toHaveAttribute('href', '/premium')
  })

  it('shows the banner for free and lapsed admins and hides it for current premium', async () => {
    vi.mocked(useHiddenPageAccess).mockReturnValue({ canView: true, pending: false })

    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: false, isPremium: false })
    const free = render(<PremiumDashboardBanner />)
    expect(await screen.findByTestId('premium-dashboard-banner')).toHaveTextContent(/monthly membership/i)
    free.unmount()

    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: true, isPremium: false })
    const lapsed = render(<PremiumDashboardBanner />)
    expect(await screen.findByTestId('premium-dashboard-banner')).toHaveTextContent(/not active/i)
    lapsed.unmount()

    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: true, isPremium: true })
    render(<PremiumDashboardBanner />)
    await waitFor(() => expect(getPremiumMembershipFn).toHaveBeenCalledTimes(3))
    expect(screen.queryByTestId('premium-dashboard-banner')).not.toBeInTheDocument()
  })

  it('hides the soft-launch banner from members', async () => {
    vi.mocked(useHiddenPageAccess).mockReturnValue({ canView: false, pending: false })
    vi.mocked(useAuthSession).mockReturnValue({
      userId: 'member-1',
      user: { id: 'member-1', email: 'member@example.com', role: 'user' },
      isPending: false,
    } as never)
    render(<PremiumDashboardBanner />)
    await waitFor(() => {
      expect(getPremiumMembershipFn).not.toHaveBeenCalled()
    })
    expect(screen.queryByTestId('premium-dashboard-banner')).not.toBeInTheDocument()
  })
})
