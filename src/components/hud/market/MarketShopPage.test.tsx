import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/ToastProvider'
import type { MarketPayload } from '@/lib/market'

const getMarketFn = vi.fn()
const buyGearFn = vi.fn()

vi.mock('@/lib/server/api', () => ({
  getMarketFn: (...args: unknown[]) => getMarketFn(...args),
  buyGearFn: (...args: unknown[]) => buyGearFn(...args),
  getChassisLoadoutFn: vi.fn().mockRejectedValue(new Error('no character')),
}))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => ({ userId: 'member-1' }) }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

function payload(balance: number, owned = false): MarketPayload {
  return {
    everyItem: false,
    moltCredits: 0,
    wallet: {
      balance,
      history: [{ id: 'h1', amount: 100, source: 'welcome', description: 'Welcome to the market', createdAt: '2026-11-04T12:00:00Z' }],
      firsts: [{ id: 'moltmax', title: 'Finish the Moltmax quiz', gems: 50, done: true }],
    },
    pieces: [
      {
        baseKey: 'tide-braced-carapace',
        name: 'Tide-Braced Carapace',
        flavorText: 'Ribbed against surface weather.',
        category: 'carapace',
        variants: [
          {
            catalogItemId: 'a1000000-0000-4000-8000-000000000002',
            rarity: 'uncommon',
            appearanceKey: 'tide-braced-carapace',
            price: 150,
            primaryStat: 28,
            affixes: [],
            uniquePower: null,
            owned,
          },
          {
            catalogItemId: 'a3000000-0000-4000-8000-000000000024',
            rarity: 'legendary',
            appearanceKey: 'tide-braced-carapace--legendary',
            price: 2000,
            primaryStat: 102,
            affixes: [{ stat: 'intelligence', value: 15 }],
            uniquePower: { name: 'Abyssal Bulwark', description: 'Criticism arrives pre-sorted.' },
            owned: false,
          },
        ],
      },
    ],
  }
}

function renderMarket() {
  return render(
    <ToastProvider>
      <MarketShopPage />
    </ToastProvider>,
  )
}

import { MarketShopPage } from './MarketShopPage'

describe('MarketShopPage', () => {
  beforeEach(() => {
    getMarketFn.mockReset()
    buyGearFn.mockReset()
  })

  it('shows the real gem balance and Molt Credits as coming soon', async () => {
    getMarketFn.mockResolvedValue(payload(320))
    renderMarket()
    expect(await screen.findByTestId('gem-balance')).toHaveTextContent('320')
    expect(screen.getByText('Soon')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }))
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\$1\.99/ })).not.toBeInTheDocument()
  })

  it('filters to a rarity and shows that version of each piece', async () => {
    getMarketFn.mockResolvedValue(payload(320))
    renderMarket()
    await screen.findByText('Tide-Braced Carapace')
    fireEvent.click(screen.getByRole('button', { name: 'Legendary' }))
    expect(screen.getByRole('button', { name: /Tide-Braced Carapace, Legendary/ })).toBeInTheDocument()
  })

  it('buys a piece with gems and reloads the market', async () => {
    getMarketFn.mockResolvedValueOnce(payload(320)).mockResolvedValue(payload(170, true))
    buyGearFn.mockResolvedValue({ ok: true, balance: 170 })
    renderMarket()
    fireEvent.click(await screen.findByRole('button', { name: /Tide-Braced Carapace, Uncommon/ }))
    const detail = await screen.findByTestId('market-detail')
    fireEvent.click(within(detail).getByRole('button', { name: 'Buy for 150 gems' }))
    await waitFor(() =>
      expect(buyGearFn).toHaveBeenCalledWith({
        data: { token: 'token', catalogItemId: 'a1000000-0000-4000-8000-000000000002' },
      }),
    )
    expect(await screen.findByTestId('gem-balance')).toHaveTextContent('170')
  })

  it("won't let a member buy what they can't afford", async () => {
    getMarketFn.mockResolvedValue(payload(320))
    renderMarket()
    fireEvent.click(await screen.findByRole('button', { name: /Tide-Braced Carapace, Uncommon/ }))
    const detail = await screen.findByTestId('market-detail')
    fireEvent.click(within(detail).getByRole('radio', { name: /Legendary/ }))
    expect(within(detail).getByRole('button', { name: 'Buy for 2,000 gems' })).toBeDisabled()
    expect(within(detail).getByText(/You need 1,680 more gems/)).toBeInTheDocument()
  })

  it('lists ways to earn and recent gems', async () => {
    getMarketFn.mockResolvedValue(payload(320))
    renderMarket()
    await screen.findByText('Tide-Braced Carapace')
    fireEvent.click(screen.getByRole('tab', { name: 'Earn gems' }))
    expect(screen.getByText('Finish every daily liturgy')).toBeInTheDocument()
    expect(screen.getByText('Welcome to the market')).toBeInTheDocument()
  })
})
