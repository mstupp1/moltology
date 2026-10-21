import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  MERCH_CART_STORAGE_KEY,
  cartItemCount,
  cartSubtotalCents,
  readStoredCart,
  setCartLineQuantity,
  upsertCartLine,
  type MerchCartLine,
} from '@/lib/merch'
import { getStoreAccessFn } from '@/lib/server/merch-api'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { DeliveryCheckout } from './DeliveryCheckout'
import { useOptionalToast } from '@/components/ui/ToastProvider'

const PENDING_CLEAR_KEY = 'moltology.merch.pendingClear'

/**
 * closed: nobody can order. testing: ordering is closed to members but this viewer is an admin.
 * Unknown until the store settings and the viewer's role have loaded; treated as closed.
 */
export type StoreOrderingState = 'loading' | 'open' | 'testing' | 'closed'

interface MerchCartContextValue {
  ordering: StoreOrderingState
  canOrder: boolean
  lines: MerchCartLine[]
  open: boolean
  setOpen: (open: boolean) => void
  count: number
  subtotalCents: number
  checkingOut: boolean
  addLine: (line: MerchCartLine) => void
  setQuantity: (variantId: string, quantity: number) => void
  removeLine: (variantId: string) => void
  checkout: (items: Array<{ variantId: string; quantity: number }>, options?: { clearCart?: boolean }) => Promise<void>
  completeVerifiedCheckout: (orderId: string) => void
  consumeCheckoutResult: (result: 'success' | 'cancel' | undefined) => void
}

const MerchCartContext = createContext<MerchCartContextValue | null>(null)

export function useMerchCart(): MerchCartContextValue {
  const value = useContext(MerchCartContext)
  if (!value) {
    throw new Error('Cart is unavailable.')
  }
  return value
}

export function MerchCartProvider({ children }: { children: React.ReactNode }) {
  const toastApi = useOptionalToast()
  const [lines, setLines] = useState<MerchCartLine[]>([])
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [delivery, setDelivery] = useState<{ items: Array<{ variantId: string; quantity: number }>; clearCart: boolean } | null>(null)
  const checkingOut = delivery !== null
  const consumedResult = useRef<'success' | 'cancel' | undefined>(undefined)
  const [orderingOpen, setOrderingOpen] = useState<boolean | null>(null)
  const admin = useHiddenPageAccess()
  useEffect(() => { void getStoreAccessFn().then(a => setOrderingOpen(a.orderingOpen && !a.checkoutPaused)).catch(() => setOrderingOpen(false)) }, [])
  const ordering: StoreOrderingState = orderingOpen === null ? 'loading' : orderingOpen ? 'open' : admin.pending ? 'loading' : admin.canView ? 'testing' : 'closed'
  const canOrder = ordering === 'open' || ordering === 'testing'

  useEffect(() => {
    setLines(readStoredCart(window.localStorage.getItem(MERCH_CART_STORAGE_KEY)))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(MERCH_CART_STORAGE_KEY, JSON.stringify(lines))
  }, [lines, ready])

  const addLine = useCallback((line: MerchCartLine) => {
    setLines((current) => upsertCartLine(current, line))
    setOpen(true)
  }, [])

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((current) => setCartLineQuantity(current, variantId, quantity))
  }, [])

  const removeLine = useCallback((variantId: string) => {
    setLines((current) => current.filter((line) => line.variantId !== variantId))
  }, [])

  const checkout = useCallback(
    async (items: Array<{ variantId: string; quantity: number }>, options?: { clearCart?: boolean }) => {
      if (!canOrder) {
        toastApi?.toast.info('Ordering is unavailable right now.', { id: 'merch-checkout' })
        return
      }
      setOpen(false)
      setDelivery({ items, clearCart: options?.clearCart ?? false })
    },
    [canOrder, toastApi],
  )

  const completeVerifiedCheckout = useCallback((orderId: string) => {
    try {
      const marker = JSON.parse(window.sessionStorage.getItem(PENDING_CLEAR_KEY) || 'null')
      if (marker?.orderId !== orderId || !Array.isArray(marker.items)) return
      window.sessionStorage.removeItem(PENDING_CLEAR_KEY)
      setLines(current => current.flatMap(line => {
        const purchased = marker.items.find((item: { variantId: string; quantity: number }) => item.variantId === line.variantId)
        const quantity = line.quantity - (purchased?.quantity || 0)
        return quantity > 0 ? [{ ...line, quantity }] : []
      }))
    } catch { /* Old or invalid cart markers cannot clear a cart. */ }
  }, [])

  const consumeCheckoutResult = useCallback(
    (result: 'success' | 'cancel' | undefined) => {
      if (!result) { consumedResult.current = undefined; return }
      // Toast context updates can change this callback's identity; consume each return once.
      if (consumedResult.current === result) return
      consumedResult.current = result
      if (result === 'success') {
        toastApi?.toast.info('Check your order link for verified payment and fulfillment status.', { id: 'merch-checkout-result' })
        return
      }
      window.sessionStorage.removeItem(PENDING_CLEAR_KEY)
      toastApi?.toast.info('Checkout was canceled. Your cart is still here.', { id: 'merch-checkout-result' })
    },
    [toastApi],
  )

  const value = useMemo<MerchCartContextValue>(
    () => ({
      ordering,
      canOrder,
      lines,
      open,
      setOpen,
      count: cartItemCount(lines),
      subtotalCents: cartSubtotalCents(lines),
      checkingOut,
      addLine,
      setQuantity,
      removeLine,
      checkout,
      consumeCheckoutResult,
      completeVerifiedCheckout,
    }),
    [addLine, canOrder, checkingOut, checkout, consumeCheckoutResult, completeVerifiedCheckout, lines, open, ordering, removeLine, setQuantity],
  )

  return <MerchCartContext.Provider value={value}>{children}{delivery && <DeliveryCheckout items={delivery.items} clearCart={delivery.clearCart} testing={ordering === 'testing'} close={() => setDelivery(null)} />}</MerchCartContext.Provider>
}
