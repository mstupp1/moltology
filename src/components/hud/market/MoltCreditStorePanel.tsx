import React from 'react'
import { Clock, Sparkles, TrendingUp } from 'lucide-react'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { getAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'
import { MOLT_CREDIT_PACKS, type MoltCreditPack } from './market-data'

interface MoltCreditStorePanelProps {
  onPurchase: (pack: MoltCreditPack) => void
}

function PackBadge({ badge }: { badge: MoltCreditPack['badge'] }) {
  if (!badge) return null

  const config = {
    'best-value': {
      label: 'Best Value',
      className: 'bg-crimson-soft text-crimson-text',
      icon: TrendingUp,
    },
    limited: {
      label: 'Limited',
      className: 'bg-crimson-soft text-crimson-text',
      icon: Clock,
    },
    popular: {
      label: 'Popular',
      className: 'bg-cyan-soft text-cyan-glow',
      icon: Sparkles,
    },
  }[badge]

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-chip',
        config.className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export function MoltCreditStorePanel({ onPurchase }: MoltCreditStorePanelProps) {
  const featured = MOLT_CREDIT_PACKS.find((p) => p.badge === 'best-value') ?? MOLT_CREDIT_PACKS[2]
  const gridPacks = MOLT_CREDIT_PACKS.filter((p) => p.id !== featured.id)

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen hud-ticks p-3 sm:p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff5540]/8 via-transparent to-[#00c3ff]/5 pointer-events-none" />
        <div className="relative grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-4 items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PackBadge badge={featured.badge} />
              <span className="text-[11px] text-ink-muted uppercase tracking-[0.08em]">
                Featured bundle
              </span>
            </div>
            <h2 className="font-grotesk text-lg sm:text-xl font-extrabold text-ink uppercase tracking-wide">
              {featured.name}
            </h2>
            <p className="text-xs text-ink-body leading-relaxed max-w-md">
              Molt Credits buy speed, style, and catalog depth.
            </p>
            <div className="flex flex-wrap items-baseline gap-2 pt-1">
              <span className="font-grotesk text-2xl sm:text-3xl font-extrabold text-cyan-glow tabular-nums">
                {(featured.credits + (featured.bonusCredits ?? 0)).toLocaleString()}
              </span>
              <span className="text-xs text-ink-muted uppercase tracking-[0.08em]">Molt Credits</span>
              {featured.bonusCredits ? (
                <span className="text-xs text-crimson-text font-bold">
                  includes +{featured.bonusCredits.toLocaleString()} bonus
                </span>
              ) : null}
            </div>
            <BenthicCTAButton price={featured.priceUsd} size="lg" variant="cyan" onClick={() => onPurchase(featured)}>
              Buy Bundle
            </BenthicCTAButton>
          </div>
          <div className="relative mx-auto w-full max-w-[220px] aspect-square">
            <img
              src={getAssetUrl(featured.imagePath)}
              alt=""
              className="relative w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-line-subtle pb-2">
          <h2 className="font-grotesk text-xs font-bold tracking-[0.08em] text-ink uppercase">
            Credit Packs
          </h2>
          <span className="text-[11px] text-ink-muted uppercase tracking-[0.08em]">
            Chitin Gems are earned — not sold here
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {gridPacks.map((pack) => {
            const total = pack.credits + (pack.bonusCredits ?? 0)
            const isHighlight = pack.badge === 'limited'

            return (
              <div
                key={pack.id}
                className={cn(
                  'market-pack-card rounded-card bg-surface-2 p-3 flex flex-col items-center text-center gap-2 border transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-strong',
                  isHighlight ? 'border-crimson-aggro/40' : 'border-line-subtle'
                )}
              >
                {pack.badge ? (
                  <div className="min-h-[22px]">
                    <PackBadge badge={pack.badge} />
                  </div>
                ) : (
                  <div className="min-h-[22px]" />
                )}
                <div className="w-14 h-14 sm:w-16 sm:h-16">
                  <img
                    src={getAssetUrl(pack.imagePath)}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h3 className="font-grotesk text-[11px] sm:text-xs font-bold text-ink uppercase leading-tight">
                    {pack.name}
                  </h3>
                  <p className="text-[11px] text-cyan-glow font-bold tabular-nums">
                    {total.toLocaleString()} MC
                  </p>
                  {pack.bonusCredits ? (
                    <p className="text-[11px] text-crimson-text font-semibold">
                      +{pack.bonusCredits.toLocaleString()} bonus
                    </p>
                  ) : null}
                </div>
                <BenthicCTAButton
                  price={pack.priceUsd}
                  size="sm"
                  variant="cyan"
                  fullWidth
                  onClick={() => onPurchase(pack)}
                >
                  Buy
                </BenthicCTAButton>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
