import React from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import { HudButton } from '@/components/ui/HudButton'
import { formatMerchPrice } from '@/lib/merch'
import { useMerchCart } from './MerchCartProvider'

export function CartDrawer() {
  const cart = useMerchCart()

  return (
    <HudBottomSheet
      isOpen={cart.open}
      onClose={() => cart.setOpen(false)}
      title="Cart"
      ariaLabel="Cart"
    >
      <div className="space-y-4 px-4 pb-6 pt-2 font-sans">
        {cart.lines.length === 0 ? (
          <p className="text-sm text-ink-muted">Your cart is empty.</p>
        ) : (
          <ul className="space-y-3">
            {cart.lines.map((line) => (
              <li key={line.variantId} className="flex gap-3 rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3">
                {line.imageUrl ? (
                  <BrandAwareImage src={line.imageUrl} alt="" className="h-16 w-16 rounded-control object-contain bg-surface-2" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{line.productTitle}</p>
                  <p className="text-xs text-ink-muted">{line.variantTitle}</p>
                  <p className="mt-1 text-sm text-ink">{formatMerchPrice(line.unitPriceCents)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      aria-label={`Decrease ${line.productTitle}`}
                      onClick={() => cart.setQuantity(line.variantId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      aria-label={`Increase ${line.productTitle}`}
                      onClick={() => cart.setQuantity(line.variantId, line.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto rounded-control text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      onClick={() => cart.removeLine(line.variantId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Subtotal</span>
          <span className="font-medium text-ink">{formatMerchPrice(cart.subtotalCents)}</span>
        </div>
        <p className="text-xs text-ink-muted">Shipping and tax are confirmed at checkout.</p>
        <HudButton
          fullWidth
          disabled={cart.lines.length === 0 || cart.checkingOut}
          onClick={() =>
            void cart.checkout(
              cart.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
              { clearCart: true },
            )
          }
        >
          {cart.checkingOut ? 'Starting checkout…' : 'Checkout'}
        </HudButton>
      </div>
    </HudBottomSheet>
  )
}
