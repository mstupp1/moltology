import React from 'react'
import { getAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

function formatBalance(value: number): string {
  return value.toLocaleString('en-US')
}

/** A gem amount with its icon, for prices and balances. */
export function GemAmount({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-grotesk font-bold tabular-nums text-ink', size === 'sm' ? 'text-[12px]' : 'text-base')}>
      <img
        src={getAssetUrl('/images/chitin_gem.png')}
        alt=""
        className={cn('object-contain shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5')}
      />
      {formatBalance(value)}
      <span className="sr-only"> gems</span>
    </span>
  )
}

interface MarketCurrencyBarProps {
  chitinGems: number
  moltCredits: number
  /** False until Molt Credit purchases open. */
  creditsLive: boolean
  className?: string
}

export function MarketCurrencyBar({ chitinGems, moltCredits, creditsLive, className }: MarketCurrencyBarProps) {
  return (
    <div className={cn('grid w-full grid-cols-2 gap-2 sm:w-auto sm:gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2 rounded-control bg-surface-2 px-3 py-2">
        <img src={getAssetUrl('/images/chitin_gem.png')} alt="" className="w-6 h-6 object-contain shrink-0" />
        <div className="flex flex-col leading-none min-w-0 gap-1">
          <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
            Chitin Gems
          </span>
          <span className="font-grotesk text-base font-extrabold text-ink tabular-nums" data-testid="gem-balance">
            {formatBalance(chitinGems)}
          </span>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 rounded-control bg-surface-2 px-3 py-2">
        <img src={getAssetUrl('/images/molt_credit.png')} alt="" className="w-6 h-6 object-contain shrink-0" />
        <div className="flex flex-col leading-none min-w-0 gap-1">
          <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
            Molt Credits
          </span>
          <span className="font-grotesk text-base font-extrabold text-ink tabular-nums">
            {creditsLive || moltCredits > 0 ? formatBalance(moltCredits) : 'Soon'}
          </span>
        </div>
      </div>
    </div>
  )
}
