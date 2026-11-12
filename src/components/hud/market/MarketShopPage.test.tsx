import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/ToastProvider'
import type { MarketPayload } from '@/lib/market'

const getMarketFn = vi.fn()
const buyGearFn = vi.fn()
const createCreditCheckoutFn = vi.fn()

vi.mock('@/lib/server/api', () => ({
  getMarketFn: (...args: unknown[]) => getMarketFn(...args),
  buyGearFn: (...args: unknown[]) => buyGearFn(...args),
  createCreditCheckoutFn: (...args: unknown[]) => createCreditCheckoutFn(...args),
  getChassisLoadoutFn: vi.fn().mockRejectedValue(new Error('no character')),
}))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
let session: { userId: string | null; isPending?: boolean } = { userId: 'member-1' }
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => session }))
vi.mock('@/components/AuthModal', () => ({
  AuthModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog" aria-label="Sign up" /> : null),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

function payload(balance: number, owned = false): MarketPayload {
  return {
    addFree: false,
    moltCredits: 0,
    creditsLive: false,
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
            primaryStat: 19,
            affixes: [{ stat: 'neuralLatency', value: 3 }],
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
    window.history.replaceState(null, '', '/market')
    getMarketFn.mockReset()
    session = { userId: 'member-1' }
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

  it('opens Stripe checkout for a pack once credits are live', async () => {
    getMarketFn.mockResolvedValue({ ...payload(320), creditsLive: true, moltCredits: 550 })
    createCreditCheckoutFn.mockResolvedValue({ url: 'https://checkout.stripe.test/c' })
    const assign = vi.fn()
    const realLocation = window.location
    Object.defineProperty(window, 'location', { configurable: true, value: { ...realLocation, assign, href: 'http://localhost/market' } })
    onTestFinished(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: realLocation })
    })
    renderMarket()
    await screen.findByTestId('gem-balance')
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }))
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '$1.99' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://checkout.stripe.test/c'))
    expect(createCreditCheckoutFn).toHaveBeenCalledWith({ data: { token: 'token', packId: 'pouch' } })
  })

  it('filters to a rarity and shows that version of each piece', async () => {
    getMarketFn.mockResolvedValue(payload(320))
    renderMarket()
    await screen.findByText('Tide-Braced Carapace')
    fireEvent.change(screen.getByRole('combobox', { name: 'Rarity' }), { target: { value: 'legendary' } })
    expect(screen.getByRole('button', { name: /Tide-Braced Carapace, Legendary/ })).toBeInTheDocument()
  })

  it('pages through a long list and hides owned pieces', async () => {
    const base = payload(320, true)
    const one = base.pieces[0]!
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      ...one,
      baseKey: `${one.baseKey}-${i}`,
      name: `Piece ${i + 1}`,
      variants: one.variants.map((v) => ({ ...v, catalogItemId: `${v.catalogItemId}-${i}`, owned: v.rarity === 'uncommon' && i < 5 })),
    }))
    getMarketFn.mockResolvedValue({ ...base, pieces })
    renderMarket()
    await screen.findByRole('button', { name: /^Piece 1,/ })
    expect(screen.queryByRole('button', { name: /^Piece 25,/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(screen.getByRole('button', { name: /^Piece 25,/ })).toBeInTheDocument()
    expect(window.location.search).toContain('page=2')
    fireEvent.click(screen.getByRole('button', { name: 'Hide owned' }))
    // Back to page one; owned pieces show their cheapest version not yet owned.
    expect(screen.getByRole('button', { name: /^Piece 1, Legendary/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Piece 6, Uncommon/ })).toBeInTheDocument()
    expect(window.location.search).toContain('owned=hide')
    expect(window.location.search).not.toContain('page=')
  })

  it('features promos and opens a bundle with its pieces', async () => {
    const base = payload(320)
    const v = base.pieces[0]!.variants[1]!
    const make = (baseKey: string, name: string, category: 'carapace' | 'belt' | 'legs' | 'head') => ({
      baseKey,
      name,
      flavorText: '',
      category,
      variants: [
        { ...v, catalogItemId: `${baseKey}-e`, rarity: 'epic' as const, appearanceKey: `${baseKey}--epic`, price: 900 },
        { ...v, catalogItemId: `${baseKey}-l`, rarity: 'legendary' as const, appearanceKey: `${baseKey}--legendary` },
      ],
    })
    getMarketFn.mockResolvedValue({
      ...base,
      pieces: [
        make('oracle-dome-lattice', 'Oracle Dome Lattice', 'head'),
        make('abyssal-ward-shell', 'Abyssal Ward Shell', 'carapace'),
        make('abyssal-clasp-girdle', 'Abyssal Clasp Girdle', 'belt'),
        make('void-stride-articulation', 'Void-Stride Articulation', 'legs'),
      ],
    })
    renderMarket()
    const featured = await screen.findByRole('region', { name: 'Featured' })
    expect(within(featured).getByText('Oracle Dome Lattice')).toBeInTheDocument()
    fireEvent.click(within(featured).getAllByRole('button', { name: /Abyssal Set bundle/ })[0]!)
    const detail = await screen.findByTestId('market-bundle-detail')
    expect(within(detail).getByText('Abyssal Clasp Girdle')).toBeInTheDocument()
    expect(within(detail).getByText('2,160')).toBeInTheDocument()
    expect(within(detail).queryByRole('button', { name: /^Buy/ })).not.toBeInTheDocument()
    // Filtering hides the promos.
    fireEvent.click(screen.getByRole('button', { name: 'Belt' }))
    expect(screen.queryByRole('region', { name: 'Featured' })).not.toBeInTheDocument()
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

  it('lets a guest browse the shop and sends them to sign up to buy', async () => {
    session = { userId: null, isPending: false }
    getMarketFn.mockResolvedValue({ ...payload(0), guest: true })
    renderMarket()
    fireEvent.click(await screen.findByRole('button', { name: /Tide-Braced Carapace, Uncommon/ }))
    const detail = await screen.findByTestId('market-detail')
    expect(screen.queryByTestId('gem-balance')).not.toBeInTheDocument()
    fireEvent.click(within(detail).getByRole('button', { name: 'Sign up to buy' }))
    expect(await screen.findByRole('dialog', { name: 'Sign up' })).toBeInTheDocument()
    expect(buyGearFn).not.toHaveBeenCalled()
  })

  it('waits for the session before loading, so members never see the guest shop', async () => {
    session = { userId: null, isPending: true }
    getMarketFn.mockResolvedValue(payload(320))
    renderMarket()
    await new Promise((r) => setTimeout(r, 20))
    expect(getMarketFn).not.toHaveBeenCalled()
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

  it('lets admins add a piece for free instead of buying it', async () => {
    getMarketFn.mockResolvedValue({ ...payload(0), addFree: true })
    renderMarket()
    fireEvent.click(await screen.findByRole('button', { name: /Tide-Braced Carapace, Uncommon/ }))
    const detail = await screen.findByTestId('market-detail')
    fireEvent.click(within(detail).getByRole('radio', { name: /Legendary/ }))
    expect(within(detail).getByRole('button', { name: 'Add to collection' })).toBeEnabled()
    expect(within(detail).queryByRole('button', { name: /Buy for/ })).toBeNull()
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
