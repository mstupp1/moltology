import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, X } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { MERCH_MAX_QUANTITY, formatMerchPrice } from '@/lib/merch'
import { MerchImage } from './MerchImage'
import { useMerchCart } from './MerchCartProvider'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** Cart panel: slides in from the right on wide screens and fills the screen on phones. */
export function CartDrawer() {
  const cart = useMerchCart()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const { open, setOpen } = cart

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) {
      setVisible(false)
      returnFocus.current?.focus?.()
      return
    }
    returnFocus.current = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() => setVisible(true))
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, setOpen])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] font-sans">
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={`absolute inset-0 h-full w-full cursor-default bg-abyss/70 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line-subtle bg-surface-1 shadow-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
          <h2 id="cart-title" className="font-grotesk text-lg font-semibold text-ink">
            Cart {cart.count > 0 ? <span className="text-ink-muted">({cart.count})</span> : null}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className={`flex h-10 w-10 items-center justify-center rounded-control text-ink-muted hover:bg-surface-2 hover:text-ink ${FOCUS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-ink-muted">Your cart is empty.</p>
              <Link
                to="/store"
                onClick={() => setOpen(false)}
                className={`rounded-control text-sm text-cyan-glow underline-offset-4 hover:underline ${FOCUS}`}
              >
                Browse the store
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line-subtle">
              {cart.lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 py-4 first:pt-0">
                  <Link
                    to="/store/$slug"
                    params={{ slug: line.productSlug }}
                    onClick={() => setOpen(false)}
                    className={`h-24 w-24 shrink-0 overflow-hidden rounded-control bg-surface-2 ${FOCUS}`}
                  >
                    <MerchImage src={line.imageUrl} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{line.productTitle}</p>
                        <p className="text-xs text-ink-muted">{line.variantTitle}</p>
                      </div>
                      <p className="text-sm tabular-nums text-ink">{formatMerchPrice(line.unitPriceCents * line.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-control border border-line">
                        <button
                          type="button"
                          aria-label={`Decrease ${line.productTitle}`}
                          onClick={() => cart.setQuantity(line.variantId, line.quantity - 1)}
                          className={`flex h-8 w-8 items-center justify-center text-ink hover:bg-surface-2 ${FOCUS}`}
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${line.productTitle}`}
                          disabled={line.quantity >= MERCH_MAX_QUANTITY}
                          onClick={() => cart.setQuantity(line.variantId, line.quantity + 1)}
                          className={`flex h-8 w-8 items-center justify-center text-ink hover:bg-surface-2 disabled:text-ink-muted ${FOCUS}`}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.removeLine(line.variantId)}
                        className={`rounded-control text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline ${FOCUS}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 ? (
          <div className="space-y-3 border-t border-line-subtle px-5 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-body">Subtotal</span>
              <span className="text-base font-medium tabular-nums text-ink">{formatMerchPrice(cart.subtotalCents)}</span>
            </div>
            <p className="text-xs text-ink-muted">Shipping and tax are added at checkout.</p>
            <HudButton
              size="lg"
              fullWidth
              disabled={cart.checkingOut}
              onClick={() =>
                void cart.checkout(
                  cart.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
                  { clearCart: true },
                )
              }
            >
              {cart.checkingOut ? 'Starting checkout…' : 'Check out'}
            </HudButton>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
