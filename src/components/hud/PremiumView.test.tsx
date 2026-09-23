import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PremiumOfferPanel } from './PremiumView'
import type { PremiumOffer } from '@/lib/premium-membership'

const base: PremiumOffer = {
  hasPurchasedPremium: false,
  isPremium: false,
  priceLabel: '$5.99 per month',
  canManage: false,
  configured: true,
  configMessage: null,
}

const handlers = () => ({
  onSubscribe: vi.fn(),
  onManage: vi.fn(),
  onActivate: vi.fn(),
  onCancel: vi.fn(),
})

describe('Premium offer panel', () => {
  it('offers checkout to a free member and no invented benefits', () => {
    render(
      <PremiumOfferPanel offer={base} busy={null} {...handlers()} />,
    )
    expect(screen.getByRole('button', { name: /Subscribe to Premium/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Activate Premium/i })).toBeEnabled()
    expect(screen.getByText(/No payment is taken/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Manage membership/i })).not.toBeInTheDocument()
    expect(screen.getByText('Premium benefits are not available yet.')).toBeInTheDocument()
    expect(screen.getByText(/does not change your rank, clearance, stage, or forum authority/i)).toBeInTheDocument()
  })

  it('offers subscribe and manage when a purchase has lapsed', () => {
    const onSubscribe = vi.fn()
    const onManage = vi.fn()
    const onActivate = vi.fn()
    render(
      <PremiumOfferPanel
        offer={{ ...base, hasPurchasedPremium: true, canManage: true }}
        checkout="cancel"
        busy={null}
        onSubscribe={onSubscribe}
        onManage={onManage}
        onActivate={onActivate}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText(/purchased Premium before/i)).toBeInTheDocument()
    expect(screen.getByTestId('premium-checkout-cancel')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Subscribe to Premium/i }))
    fireEvent.click(screen.getByRole('button', { name: /Activate Premium/i }))
    fireEvent.click(screen.getByRole('button', { name: /Manage membership/i }))
    expect(onSubscribe).toHaveBeenCalledOnce()
    expect(onActivate).toHaveBeenCalledOnce()
    expect(onManage).toHaveBeenCalledOnce()
  })

  it('hides subscribe for a current premium membership', () => {
    render(
      <PremiumOfferPanel
        offer={{ ...base, hasPurchasedPremium: true, isPremium: true, canManage: true }}
        checkout="success"
        busy={null}
        {...handlers()}
      />,
    )
    expect(screen.getByText('Your Premium membership is active.')).toBeInTheDocument()
    expect(screen.getByTestId('premium-checkout-success')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Subscribe to Premium/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Activate Premium/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel Premium/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Manage membership/i })).toBeInTheDocument()
  })

  it('blocks checkout when billing is not configured', () => {
    render(
      <PremiumOfferPanel
        offer={{
          ...base,
          priceLabel: null,
          configured: false,
          configMessage: 'Premium billing is not configured in this environment. Missing: STRIPE_PREMIUM_PRICE_ID.',
        }}
        busy={null}
        {...handlers()}
      />,
    )
    expect(screen.getByTestId('premium-config-message')).toHaveTextContent('STRIPE_PREMIUM_PRICE_ID')
    expect(screen.getByRole('button', { name: /Subscribe to Premium/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Activate Premium/i })).toBeEnabled()
  })
})
