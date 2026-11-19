import React from 'react'
import { getAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

function formatBalance(value: number): string {
  return value.toLocaleString('en-US')
}

/** A gem amount with its icon, for prices and balances. */
export function GemAmount({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-grotesk font-semibold tabular-nums text-ink', size === 'sm' ? 'text-xs' : 'text-base')}>
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

/**
 * The wallet in the Shop's title row: one line, the same height as the buttons in other title
 * rows, so the Shop band lines up with Customize and Progress.
 */
export function MarketCurrencyBar({ chitinGems, moltCredits, creditsLive, className }: MarketCurrencyBarProps) {
  const credits = creditsLive || moltCredits > 0 ? formatBalance(moltCredits) : 'Soon'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="flex h-8 items-center gap-1.5 rounded-control bg-surface-3 px-2.5"
        title="Chitin Gems"
      >
        <img src={getAssetUrl('/images/chitin_gem.png')} alt="" className="w-4 h-4 object-contain shrink-0" />
        <span className="font-grotesk text-ui font-semibold text-ink tabular-nums" data-testid="gem-balance">
          {formatBalance(chitinGems)}
        </span>
        <span className="text-xs text-ink-muted whitespace-nowrap">Chitin Gems</span>
      </div>
      <div
        className="flex h-8 items-center gap-1.5 rounded-control bg-surface-3 px-2.5"
        title="Molt Credits"
      >
        <img src={getAssetUrl('/images/molt_credit.png')} alt="" className="w-4 h-4 object-contain shrink-0" />
        <span className="font-grotesk text-ui font-semibold text-ink tabular-nums">{credits}</span>
        <span className="text-xs text-ink-muted whitespace-nowrap">Molt Credits</span>
      </div>
    </div>
  )
}
