import React from 'react'
import { Plus } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

interface MarketCurrencyBarProps {
  moltCredits: number
  chitinGems: number
  onAddCredits?: () => void
  className?: string
}

function formatBalance(value: number): string {
  return value.toLocaleString('en-US')
}

export function MarketCurrencyBar({
  moltCredits,
  chitinGems,
  onAddCredits,
  className,
}: MarketCurrencyBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-stretch justify-end gap-2 sm:gap-2.5',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-[140px] px-3 py-2 rounded-card border border-line-subtle bg-surface-1/90 hud-sheen">
        <img
          src={getAssetUrl('/images/molt_credit.png')}
          alt=""
          className="w-7 h-7 object-contain shrink-0"
        />
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
            Molt Credits
          </span>
          <span className="font-grotesk text-base sm:text-lg font-extrabold text-cyan-glow tabular-nums">
            {formatBalance(moltCredits)}
          </span>
        </div>
        {onAddCredits ? (
          <button
            type="button"
            onClick={onAddCredits}
            className="ml-auto shrink-0 w-7 h-7 flex items-center justify-center rounded-control border border-line bg-surface-1 text-cyan-glow hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            aria-label="Jump to buy Molt Credits"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 min-w-[140px] px-3 py-2 rounded-card border border-line-subtle bg-surface-1/90 hud-sheen">
        <img
          src={getAssetUrl('/images/chitin_gem.png')}
          alt=""
          className="w-7 h-7 object-contain shrink-0"
        />
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
            Chitin Gems
          </span>
          <span className="font-grotesk text-base sm:text-lg font-extrabold text-crimson-text tabular-nums">
            {formatBalance(chitinGems)}
          </span>
        </div>
        <span className="ml-auto shrink-0 text-[11px] uppercase tracking-[0.08em] font-bold text-ink-muted px-1.5 py-0.5 border border-line-subtle rounded-chip">
          Earned
        </span>
      </div>
    </div>
  )
}
