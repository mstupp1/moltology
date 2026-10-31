import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { PremiumSettingsSection } from './PremiumSettingsSection'
import { getPremiumMembershipFn, setPremiumAccessFn } from '@/lib/server/premium-api'

vi.mock('@/hooks/useHiddenPageAccess', () => ({
  useHiddenPageAccess: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/server/premium-api', () => ({
  getPremiumMembershipFn: vi.fn(),
  setPremiumAccessFn: vi.fn(),
}))

describe('Oracle MAX settings section', () => {
  beforeEach(() => {
    vi.mocked(getPremiumMembershipFn).mockReset()
    vi.mocked(setPremiumAccessFn).mockReset()
    vi.mocked(useHiddenPageAccess).mockReturnValue({ canView: true, pending: false })
  })

  it('hides purchase and cancel from members', async () => {
    vi.mocked(useHiddenPageAccess).mockReturnValue({ canView: false, pending: false })
    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: false, isPremium: false })
    render(
      <ToastProvider>
        <PremiumSettingsSection />
      </ToastProvider>,
    )
    expect(screen.queryByTestId('premium-settings')).not.toBeInTheDocument()
    expect(getPremiumMembershipFn).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Purchase Oracle MAX/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel Oracle MAX/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/No payment is taken/i)).not.toBeInTheDocument()
  })

  it('offers Purchase Oracle MAX to a free member and skips the badge', async () => {
    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: false, isPremium: false })
    render(
      <ToastProvider>
        <PremiumSettingsSection />
      </ToastProvider>,
    )
    expect(await screen.findByRole('button', { name: /Purchase Oracle MAX/i })).toBeEnabled()
    expect(screen.getByText(/do not have an active Oracle MAX membership/i)).toBeInTheDocument()
    expect(screen.getByText(/No payment is taken/i)).toBeInTheDocument()
    expect(screen.queryByTestId('premium-badge')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel Oracle MAX/i })).not.toBeInTheDocument()
  })

  it('shows the badge and cancel for a current member, then returns to purchase', async () => {
    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: true, isPremium: true })
    vi.mocked(setPremiumAccessFn).mockResolvedValue({ hasPurchasedPremium: true, isPremium: false })
    render(
      <ToastProvider>
        <PremiumSettingsSection />
      </ToastProvider>,
    )
    expect(await screen.findByTestId('premium-badge')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Cancel Oracle MAX/i }))
    await waitFor(() => {
      expect(setPremiumAccessFn).toHaveBeenCalledWith({
        data: { token: 'mock-jwt', action: 'cancel' },
      })
    })
    expect(await screen.findByRole('button', { name: /Purchase Oracle MAX/i })).toBeInTheDocument()
    expect(screen.queryByTestId('premium-badge')).not.toBeInTheDocument()
    expect(screen.getByText('Oracle MAX is canceled.')).toBeInTheDocument()
  })

  it('activates Oracle MAX for a free member without asking for payment', async () => {
    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: false, isPremium: false })
    vi.mocked(setPremiumAccessFn).mockResolvedValue({ hasPurchasedPremium: true, isPremium: true })
    render(
      <ToastProvider>
        <PremiumSettingsSection />
      </ToastProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Purchase Oracle MAX/i }))
    await waitFor(() => {
      expect(setPremiumAccessFn).toHaveBeenCalledWith({
        data: { token: 'mock-jwt', action: 'grant' },
      })
    })
    expect(await screen.findByTestId('premium-badge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel Oracle MAX/i })).toBeInTheDocument()
    expect(screen.getByText('Oracle MAX is active.')).toBeInTheDocument()
  })
})
