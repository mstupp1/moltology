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
      className: 'bg-[#ff5540] text-white border-[#ff5540]',
      icon: TrendingUp,
    },
    limited: {
      label: 'Limited',
      className: 'bg-[#ff5540]/15 text-[#ff8066] border-[#ff5540]/50',
      icon: Clock,
    },
    popular: {
      label: 'Popular',
      className: 'bg-[#00c3ff]/15 text-[#00c3ff] border-[#00c3ff]/50',
      icon: Sparkles,
    },
  }[badge]

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border',
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
      <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl relative overflow-hidden border border-[#ff5540]/30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff5540]/8 via-transparent to-[#00c3ff]/5 pointer-events-none" />
        <div className="relative grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-4 items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PackBadge badge={featured.badge} />
              <span className="text-[10px] text-[#839493] uppercase tracking-widest">
                Featured bundle
              </span>
            </div>
            <h2 className="font-grotesk text-lg sm:text-xl font-extrabold text-[#dfe3e3] uppercase tracking-wide">
              {featured.name}
            </h2>
            <p className="text-xs text-[#839493] leading-relaxed max-w-md">
              Molt Credits buy speed, style, and catalog depth. Rank and clearance stay earned —
              never sold.
            </p>
            <div className="flex flex-wrap items-baseline gap-2 pt-1">
              <span className="font-grotesk text-2xl sm:text-3xl font-extrabold text-[#00c3ff] tabular-nums">
                {(featured.credits + (featured.bonusCredits ?? 0)).toLocaleString()}
              </span>
              <span className="text-xs text-[#839493] uppercase tracking-wider">Molt Credits</span>
              {featured.bonusCredits ? (
                <span className="text-xs text-[#ff8066] font-bold">
                  includes +{featured.bonusCredits.toLocaleString()} bonus
                </span>
              ) : null}
            </div>
            <BenthicCTAButton price={featured.priceUsd} size="lg" onClick={() => onPurchase(featured)}>
              Buy Bundle
            </BenthicCTAButton>
          </div>
          <div className="relative mx-auto w-full max-w-[220px] aspect-square">
            <div className="absolute inset-0 rounded-full bg-[#00c3ff]/10 blur-2xl" />
            <img
              src={getAssetUrl(featured.imagePath)}
              alt=""
              className="relative w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(0,195,255,0.35)]"
            />
          </div>
        </div>
      </div>

      <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-[#3a4a49]/60 pb-2">
          <h2 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            Credit Packs
          </h2>
          <span className="text-[9px] text-[#839493] uppercase tracking-wider">
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
                  'chitin-card-inset p-3 chamfer-corner flex flex-col items-center text-center gap-2 border transition-transform hover:-translate-y-0.5',
                  isHighlight ? 'border-[#ff5540]/50' : 'border-[#3a4a49]'
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
                  <h3 className="font-grotesk text-[10px] sm:text-xs font-bold text-[#dfe3e3] uppercase leading-tight">
                    {pack.name}
                  </h3>
                  <p className="text-[10px] text-[#00c3ff] font-bold tabular-nums">
                    {total.toLocaleString()} MC
                  </p>
                  {pack.bonusCredits ? (
                    <p className="text-[9px] text-[#ff8066] font-semibold">
                      +{pack.bonusCredits.toLocaleString()} bonus
                    </p>
                  ) : null}
                </div>
                <BenthicCTAButton
                  price={pack.priceUsd}
                  size="sm"
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
