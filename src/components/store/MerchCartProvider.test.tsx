import React, { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => ({ userId: 'test' }) }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn() }))
const { access, admin } = vi.hoisted(() => ({ access: { orderingOpen: true, checkoutPaused: false }, admin: { canView: false, pending: false } }))
vi.mock('@/lib/server/merch-api', () => ({ createMerchCheckoutSessionFn: vi.fn(), getStoreAccessFn: vi.fn(async () => access) }))
vi.mock('@/hooks/useHiddenPageAccess', () => ({ useHiddenPageAccess: () => admin }))
vi.mock('./DeliveryCheckout', () => ({ DeliveryCheckout: ({ testing }: { testing: boolean }) => <p data-testid="delivery">{testing ? 'testing' : 'open'}</p> }))
const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }))
vi.mock('@/components/ui/ToastProvider', () => ({ useOptionalToast: () => ({ toast }) }))
import { MerchCartProvider, useMerchCart } from './MerchCartProvider'
import { MERCH_CART_STORAGE_KEY } from '@/lib/merch'
const line = { variantId: 'v1', productSlug: 'mug', productTitle: 'Mug', variantTitle: '11 oz', size: '11 oz', color: 'White', colorHex: '#fff', imageUrl: null, unitPriceCents: 1800, quantity: 1 }
function ReturnPage({ result }: { result: 'success' | 'cancel' }) {
  const cart = useMerchCart()
  useEffect(() => { cart.consumeCheckoutResult(result) }, [cart.consumeCheckoutResult, result])
  return <p data-testid="cart-count">{cart.count}</p>
}
beforeEach(() => { Object.assign(access, { orderingOpen: true, checkoutPaused: false }); Object.assign(admin, { canView: false, pending: false }); vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); localStorage.setItem(MERCH_CART_STORAGE_KEY, JSON.stringify([line])) })
describe('checkout return and cart hydration', () => {
  it('keeps cart lines when an unverified redirect claims success', async () => {
    sessionStorage.setItem('moltology.merch.pendingClear', '1')
    render(<MerchCartProvider><ReturnPage result="success" /></MerchCartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('1'))
    expect(localStorage.getItem(MERCH_CART_STORAGE_KEY)).not.toBe('[]')
    expect(toast.success).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('moltology.merch.pendingClear')).toBe('1')
  })
  it('preserves the cart on cancellation', async () => {
    sessionStorage.setItem('moltology.merch.pendingClear', '1')
    render(<MerchCartProvider><ReturnPage result="cancel" /></MerchCartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('1'))
    expect(sessionStorage.getItem('moltology.merch.pendingClear')).toBeNull()
  })
  it('preserves unrelated cart lines after a buy-now success with no cart clear marker', async () => {
    render(<MerchCartProvider><ReturnPage result="success" /></MerchCartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('1'))
  })
})

function OrderingProbe() {
  const cart = useMerchCart()
  return <><p data-testid="ordering">{cart.ordering}</p><button onClick={() => void cart.checkout([{ variantId: 'v1', quantity: 1 }])}>Buy</button></>
}
describe('ordering switch', () => {
  it('blocks checkout for members while ordering is closed', async () => {
    access.orderingOpen = false
    render(<MerchCartProvider><OrderingProbe /></MerchCartProvider>)
    await waitFor(() => expect(screen.getByTestId('ordering')).toHaveTextContent('closed'))
    screen.getByRole('button', { name: 'Buy' }).click()
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Ordering is unavailable right now.', expect.anything()))
    expect(screen.queryByTestId('delivery')).toBeNull()
  })
  it('lets an admin test checkout while it is closed', async () => {
    access.orderingOpen = false
    admin.canView = true
    render(<MerchCartProvider><OrderingProbe /></MerchCartProvider>)
    await waitFor(() => expect(screen.getByTestId('ordering')).toHaveTextContent('testing'))
    screen.getByRole('button', { name: 'Buy' }).click()
    expect(await screen.findByTestId('delivery')).toHaveTextContent('testing')
  })
  it('treats paused checkout as closed', async () => {
    access.checkoutPaused = true
    render(<MerchCartProvider><OrderingProbe /></MerchCartProvider>)
    await waitFor(() => expect(screen.getByTestId('ordering')).toHaveTextContent('closed'))
  })
})
