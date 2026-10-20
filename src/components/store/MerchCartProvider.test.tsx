import React, { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => ({ userId: 'test' }) }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn() }))
vi.mock('@/lib/server/merch-api', () => ({ createMerchCheckoutSessionFn: vi.fn() }))
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
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); localStorage.setItem(MERCH_CART_STORAGE_KEY, JSON.stringify([line])) })
describe('checkout return and cart hydration', () => {
  it('does not resurrect purchased lines when the child return effect runs before hydration', async () => {
    sessionStorage.setItem('moltology.merch.pendingClear', '1')
    render(<MerchCartProvider><ReturnPage result="success" /></MerchCartProvider>)
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('0'))
    expect(localStorage.getItem(MERCH_CART_STORAGE_KEY)).toBe('[]')
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('moltology.merch.pendingClear')).toBeNull()
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
