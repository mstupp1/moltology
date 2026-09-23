import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  MERCH_CART_STORAGE_KEY,
  cartItemCount,
  cartSubtotalCents,
  readStoredCart,
  setCartLineQuantity,
  upsertCartLine,
  type MerchCartLine,
} from '@/lib/merch'
import { createMerchCheckoutSessionFn } from '@/lib/server/merch-api'
import { useOptionalToast } from '@/components/ui/ToastProvider'

const PENDING_CLEAR_KEY = 'moltology.merch.pendingClear'

interface MerchCartContextValue {
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
  const session = useAuthSession()
  const toastApi = useOptionalToast()
  const [lines, setLines] = useState<MerchCartLine[]>([])
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

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
      setCheckingOut(true)
      try {
        const token = await getAuthJWTToken()
        const result = await createMerchCheckoutSessionFn({
          data: {
            token: token ?? undefined,
            userId: session.userId ?? undefined,
            items,
          },
        })
        if (options?.clearCart) {
          window.sessionStorage.setItem(PENDING_CLEAR_KEY, '1')
        }
        window.location.assign(result.url)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not start checkout. Try again.'
        toastApi?.toast.error(message, { id: 'merch-checkout' })
        setCheckingOut(false)
      }
    },
    [session.userId, toastApi],
  )

  const consumeCheckoutResult = useCallback(
    (result: 'success' | 'cancel' | undefined) => {
      if (!result) return
      if (result === 'success') {
        if (window.sessionStorage.getItem(PENDING_CLEAR_KEY) === '1') {
          setLines([])
        }
        window.sessionStorage.removeItem(PENDING_CLEAR_KEY)
        toastApi?.toast.success('Payment received. We will print and ship this order.', { id: 'merch-checkout-result' })
        return
      }
      window.sessionStorage.removeItem(PENDING_CLEAR_KEY)
      toastApi?.toast.info('Checkout was canceled. Your cart is still here.', { id: 'merch-checkout-result' })
    },
    [toastApi],
  )

  const value = useMemo<MerchCartContextValue>(
    () => ({
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
    }),
    [addLine, checkingOut, checkout, consumeCheckoutResult, lines, open, removeLine, setQuantity],
  )

  return <MerchCartContext.Provider value={value}>{children}</MerchCartContext.Provider>
}
