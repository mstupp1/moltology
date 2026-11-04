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
        'grid w-full grid-cols-2 gap-2 sm:w-auto sm:gap-3',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5 rounded-control bg-surface-2 px-2 py-2 sm:gap-2 sm:px-3">
        <img
          src={getAssetUrl('/images/molt_credit.png')}
          alt=""
          className="w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0"
        />
        <div className="flex flex-col leading-none min-w-0">
          <span className="whitespace-nowrap text-[11px] uppercase tracking-wide sm:tracking-[0.08em] text-ink-muted font-bold">
            Molt Credits
          </span>
          <span className="font-grotesk text-base font-extrabold text-cyan-glow tabular-nums">
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

      <div className="flex min-w-0 items-center gap-1.5 rounded-control bg-surface-2 px-2 py-2 sm:gap-2 sm:px-3">
        <img
          src={getAssetUrl('/images/chitin_gem.png')}
          alt=""
          className="w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0"
        />
        <div className="flex flex-col leading-none min-w-0">
          <span className="whitespace-nowrap text-[11px] uppercase tracking-wide sm:tracking-[0.08em] text-ink-muted font-bold">
            Chitin Gems
          </span>
          <span className="font-grotesk text-base font-extrabold text-crimson-text tabular-nums">
            {formatBalance(chitinGems)}
          </span>
        </div>
        <span className="ml-auto hidden shrink-0 text-[11px] uppercase tracking-[0.08em] font-bold text-ink-muted px-1.5 py-0.5 border border-line-subtle rounded-chip sm:inline">
          Earned
        </span>
      </div>
    </div>
  )
}
