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
      <div className="flex items-center gap-2 min-w-[140px] px-3 py-2 rounded-sm border border-[#00c3ff]/40 bg-[#030606]/80 shadow-[inset_0_0_12px_rgba(0,195,255,0.08)]">
        <img
          src={getAssetUrl('/images/molt_credit.png')}
          alt=""
          className="w-7 h-7 object-contain shrink-0 drop-shadow-[0_0_6px_rgba(0,195,255,0.5)]"
        />
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-[9px] uppercase tracking-widest text-[#839493] font-bold">
            Molt Credits
          </span>
          <span className="font-grotesk text-base sm:text-lg font-extrabold text-[#00c3ff] tabular-nums">
            {formatBalance(moltCredits)}
          </span>
        </div>
        {onAddCredits ? (
          <button
            type="button"
            onClick={onAddCredits}
            className="ml-auto shrink-0 w-7 h-7 flex items-center justify-center rounded-sm border border-[#00c3ff]/50 bg-[#00c3ff]/10 text-[#00c3ff] hover:bg-[#00c3ff]/20 transition-colors"
            aria-label="Jump to buy Molt Credits"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 min-w-[140px] px-3 py-2 rounded-sm border border-[#ff5540]/35 bg-[#030606]/80 shadow-[inset_0_0_12px_rgba(255,85,64,0.06)]">
        <img
          src={getAssetUrl('/images/chitin_gem.png')}
          alt=""
          className="w-7 h-7 object-contain shrink-0 drop-shadow-[0_0_6px_rgba(255,85,64,0.45)]"
        />
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-[9px] uppercase tracking-widest text-[#839493] font-bold">
            Chitin Gems
          </span>
          <span className="font-grotesk text-base sm:text-lg font-extrabold text-[#ff8066] tabular-nums">
            {formatBalance(chitinGems)}
          </span>
        </div>
        <span className="ml-auto shrink-0 text-[8px] uppercase tracking-wider font-bold text-[#839493] px-1.5 py-0.5 border border-[#3a4a49] rounded-sm">
          Earned
        </span>
      </div>
    </div>
  )
}
