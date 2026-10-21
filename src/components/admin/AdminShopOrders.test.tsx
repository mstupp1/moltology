import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminShopOrders } from './AdminShopOrders'

const mocks = vi.hoisted(() => ({ list: vi.fn(), mutate: vi.fn(), success: vi.fn(), error: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
vi.mock('@/components/ui/ToastProvider', () => ({
  useOptionalToast: () => ({ toast: { success: mocks.success, error: mocks.error } }),
}))
vi.mock('@/lib/server/store-admin-api', () => ({
  listAdminShopOrdersFn: mocks.list,
  mutateAdminStoreFn: mocks.mutate,
}))

const order = {
  id: 'abcdef12-0000-4000-8000-000000000001', memberHandle: 'shellfriend', customerEmail: 'buyer@example.com',
  shippingAddress: { name: 'Sam Buyer', line1: '1 Reef Way', line2: null, city: 'Monterey', state: 'CA', postalCode: '93940', country: 'US', phone: null },
  livemode: true, paymentStatus: 'paid', fulfillmentStatus: 'fulfillment_failed', fulfillmentMode: 'manual', providerStatus: null,
  fulfillmentError: 'Printful is not configured.', printfulOrderId: null, stripeCheckoutSessionId: 'cs_live_1', stripePaymentIntentId: 'pi_1',
  lineItems: [{ productTitle: 'Molt Mug', variantTitle: '11 oz', quantity: 2, unitPriceCents: 1800 }],
  shipments: [], subtotalCents: 3600, shippingCents: 695, taxCents: 0, totalCents: 4295, refundCents: 0, currency: 'usd',
  createdAt: '2026-10-20T12:00:00.000Z', updatedAt: '2026-10-20T12:00:00.000Z', reconciledAt: null,
}

describe('AdminShopOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue({ summary: { paidOrders: 3, revenueCents: 12900, attention: 1 }, orders: [order] })
    mocks.mutate.mockResolvedValue({ ok: true })
  })

  it('loads live orders needing attention first and shows the summary', async () => {
    render(<AdminShopOrders />)
    expect(await screen.findByText('#ABCDEF12')).toBeInTheDocument()
    expect(mocks.list).toHaveBeenCalledWith({ data: { token: 'token', filter: 'attention', includeTest: false, query: undefined } })
    expect(screen.getByText('$129.00')).toBeInTheDocument()
    expect(screen.getByText('Fulfillment failed')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Store settings/ })).toHaveAttribute('href', '/admin/store')
    expect(screen.getByRole('link', { name: /Open storefront/ })).toHaveAttribute('href', '/store')
  })

  it('opens the order and retries fulfillment', async () => {
    render(<AdminShopOrders />)
    fireEvent.click(await screen.findByTestId(`shop-order-${order.id}`))
    expect(screen.getByText('Last error: Printful is not configured.')).toBeInTheDocument()
    expect(screen.getByText(/Sam Buyer/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Stripe/ })).toHaveAttribute('href', 'https://dashboard.stripe.com/payments/pi_1')
    expect(screen.queryByTestId('shop-refresh')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('shop-retry'))
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith({ data: { token: 'token', action: 'retry', target: order.id } }))
    expect(mocks.success).toHaveBeenCalled()
  })

  it('switches filters and includes test orders on request', async () => {
    render(<AdminShopOrders />)
    await screen.findByText('#ABCDEF12')
    fireEvent.click(screen.getByTestId('shop-filter-paid'))
    fireEvent.click(screen.getByTestId('shop-include-test'))
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith({ data: { token: 'token', filter: 'paid', includeTest: true, query: undefined } }))
  })
})
