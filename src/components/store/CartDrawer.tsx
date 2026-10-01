import React from 'react'
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
          <p className="text-sm text-[#839493]">Your cart is empty.</p>
        ) : (
          <ul className="space-y-3">
            {cart.lines.map((line) => (
              <li key={line.variantId} className="chitin-card-inset flex gap-3 p-3">
                {line.imageUrl ? (
                  <img src={line.imageUrl} alt="" className="h-16 w-16 rounded-sm object-contain bg-[#080e11]" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#dfe3e3]">{line.productTitle}</p>
                  <p className="text-xs text-[#839493]">{line.variantTitle}</p>
                  <p className="mt-1 text-sm text-amber-200">{formatMerchPrice(line.unitPriceCents)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 border border-[#3a4a49] text-[#dfe3e3]"
                      aria-label={`Decrease ${line.productTitle}`}
                      onClick={() => cart.setQuantity(line.variantId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 border border-[#3a4a49] text-[#dfe3e3]"
                      aria-label={`Increase ${line.productTitle}`}
                      onClick={() => cart.setQuantity(line.variantId, line.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-xs text-[#839493] underline-offset-2 hover:underline"
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
          <span className="text-[#839493]">Subtotal</span>
          <span className="font-medium text-[#dfe3e3]">{formatMerchPrice(cart.subtotalCents)}</span>
        </div>
        <p className="text-xs text-[#839493]">Shipping and tax are confirmed at checkout.</p>
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
