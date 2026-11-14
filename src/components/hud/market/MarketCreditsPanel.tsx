import React from 'react'
import { getAssetUrl } from '@/lib/assets'
import { MOLT_CREDIT_PACKS, formatUsd, type MoltCreditPack } from '@/lib/molt-credits'
import { HudButton } from '@/components/ui/HudButton'

/** Molt Credit packs. Members see them as coming soon until purchases open. */
export function MarketCreditsPanel({
  live,
  buyingPackId,
  onBuy,
}: {
  live: boolean
  buyingPackId?: string | null
  onBuy?: (pack: MoltCreditPack) => void
}) {
  return (
    <section className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-sm font-semibold text-ink">Molt Credits</h2>
        {live ? null : (
          <span className="rounded-chip bg-surface-3 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-sm text-ink-body mb-4 max-w-prose">
        Credits are a shortcut for when you want a piece now. They pay at the same price as gems, and
        your gems are always spent first. Every piece can still be earned with gems.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {MOLT_CREDIT_PACKS.map((pack) => (
          <li key={pack.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <img src={getAssetUrl('/images/molt_credit.png')} alt="" className="w-8 h-8 object-contain" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">{pack.name}</p>
                <p className="font-grotesk text-base font-bold text-ink tabular-nums">
                  {pack.credits.toLocaleString('en-US')} credits
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-muted min-h-[1lh]">{pack.bonusPercent ? `${pack.bonusPercent}% extra` : ''}</p>
            {live ? (
              <HudButton size="sm" fullWidth disabled={Boolean(buyingPackId)} onClick={() => onBuy?.(pack)}>
                {buyingPackId === pack.id ? 'Opening checkout…' : formatUsd(pack.priceCents)}
              </HudButton>
            ) : (
              <p className="text-sm font-semibold text-ink-muted">{formatUsd(pack.priceCents)}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
