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

describe('Premium settings section', () => {
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
    expect(await screen.findByText(/do not have an active Premium membership/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Purchase Premium/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel Premium/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/No payment is taken/i)).not.toBeInTheDocument()
  })

  it('offers Purchase Premium to a free member and skips the badge', async () => {
    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: false, isPremium: false })
    render(
      <ToastProvider>
        <PremiumSettingsSection />
      </ToastProvider>,
    )
    expect(await screen.findByRole('button', { name: /Purchase Premium/i })).toBeEnabled()
    expect(screen.getByText(/do not have an active Premium membership/i)).toBeInTheDocument()
    expect(screen.getByText(/No payment is taken/i)).toBeInTheDocument()
    expect(screen.queryByTestId('premium-badge')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel Premium/i })).not.toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: /Cancel Premium/i }))
    await waitFor(() => {
      expect(setPremiumAccessFn).toHaveBeenCalledWith({
        data: { token: 'mock-jwt', action: 'cancel' },
      })
    })
    expect(await screen.findByRole('button', { name: /Purchase Premium/i })).toBeInTheDocument()
    expect(screen.queryByTestId('premium-badge')).not.toBeInTheDocument()
    expect(screen.getByText('Premium is canceled.')).toBeInTheDocument()
  })

  it('activates Premium for a free member without asking for payment', async () => {
    vi.mocked(getPremiumMembershipFn).mockResolvedValue({ hasPurchasedPremium: false, isPremium: false })
    vi.mocked(setPremiumAccessFn).mockResolvedValue({ hasPurchasedPremium: true, isPremium: true })
    render(
      <ToastProvider>
        <PremiumSettingsSection />
      </ToastProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Purchase Premium/i }))
    await waitFor(() => {
      expect(setPremiumAccessFn).toHaveBeenCalledWith({
        data: { token: 'mock-jwt', action: 'grant' },
      })
    })
    expect(await screen.findByTestId('premium-badge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel Premium/i })).toBeInTheDocument()
    expect(screen.getByText('Premium is active.')).toBeInTheDocument()
  })
})
