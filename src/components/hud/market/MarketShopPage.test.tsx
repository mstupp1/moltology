import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { MarketShopPage } from './MarketShopPage'

function renderMarket() {
  return render(
    <ToastProvider>
      <MarketShopPage />
    </ToastProvider>
  )
}

describe('MarketShopPage', () => {
  it('renders dual currency balances in the header', () => {
    renderMarket()
    expect(screen.getByText('1,450')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
    expect(screen.getAllByText('Molt Credits').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Chitin Gems').length).toBeGreaterThan(0)
  })

  it('shows credit packs on the Buy Credits tab by default', () => {
    renderMarket()
    expect(screen.getByText('Credit Packs')).toBeInTheDocument()
    expect(screen.getByText('Starter Drip')).toBeInTheDocument()
    expect(screen.getByText(/Chitin Gems are earned — not sold here/)).toBeInTheDocument()
  })

  it('switches to exchange and gem vault tabs', () => {
    renderMarket()
    fireEvent.click(screen.getByRole('tab', { name: /Exchange/i }))
    expect(screen.getByText('Shed Material')).toBeInTheDocument()
    expect(screen.getByText('Spend Molt Credits')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Gem Vault/i }))
    expect(screen.getByText(/Chitin Gems Unlock the Coolest Cosmetics/)).toBeInTheDocument()
    expect(screen.getByText('Mariana Singularity Aura')).toBeInTheDocument()
  })

  it('increases Molt Credits when purchasing a pack', () => {
    renderMarket()
    const starterCard = screen.getByText('Starter Drip').closest('.chitin-card-inset')
    expect(starterCard).toBeTruthy()
    fireEvent.click(within(starterCard as HTMLElement).getByRole('button', { name: /Buy/i }))
    expect(screen.getByText('1,950')).toBeInTheDocument()
  })

  it('deducts gems when unlocking a vault cosmetic', () => {
    renderMarket()
    fireEvent.click(screen.getByRole('tab', { name: /Gem Vault/i }))
    const polishCard = screen.getByText('Shell Polish Kit').closest('.chitin-card-inset')
    expect(polishCard).toBeTruthy()
    fireEvent.click(within(polishCard as HTMLElement).getByRole('button'))
    expect(screen.getByText('Unlocked')).toBeInTheDocument()
    expect(screen.getAllByText('50').length).toBeGreaterThan(0)
  })
})
