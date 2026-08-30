import React from 'react'
import { ArrowRightLeft, Zap } from 'lucide-react'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { ChromaElement } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'
import { RARITY_STYLES } from '@/lib/chassis-loadout'
import { cn } from '@/lib/utils'
import {
  EXCHANGE_LISTINGS,
  MATERIAL_QUICK_SHEDS,
  type ExchangeListing,
  type MaterialQuickShed,
} from './market-data'

interface MaterialExchangePanelProps {
  moltCredits: number
  onOpenTransmute: () => void
  onQuickShed: (material: MaterialQuickShed) => void
  onExchange: (listing: ExchangeListing) => void
}

export function MaterialExchangePanel({
  moltCredits,
  onOpenTransmute,
  onQuickShed,
  onExchange,
}: MaterialExchangePanelProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-5 chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-[#3a4a49]/60 pb-2">
            <div>
              <h2 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                Shed Material
              </h2>
              <p className="text-[10px] text-[#839493] mt-1 leading-relaxed">
                Liquidate terrestrial attachments into Molt Credits. Biological trace removed;
                shell upgraded.
              </p>
            </div>
            <Zap className="w-4 h-4 text-[#00c3ff] shrink-0" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MATERIAL_QUICK_SHEDS.map((material) => (
              <button
                key={material.id}
                type="button"
                onClick={() => onQuickShed(material)}
                className="chitin-card-inset p-2.5 chamfer-corner border border-[#3a4a49] hover:border-[#00c3ff]/50 transition-all text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                    {material.imagePath.includes('extracted') ? (
                      <ChromaElement
                        src={getAssetUrl(material.imagePath)}
                        alt=""
                        blendMode="screen"
                        glowColor="cyan"
                        className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <img
                        src={getAssetUrl(material.imagePath)}
                        alt=""
                        className="w-9 h-9 object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-[#dfe3e3] uppercase truncate">
                      {material.name}
                    </div>
                    <div className="text-[9px] text-[#00c3ff] font-bold tabular-nums">
                      +{material.yieldCredits.toLocaleString()} MC
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <BenthicCTAButton fullWidth onClick={onOpenTransmute}>
            <span className="flex items-center justify-center gap-2">
              Custom Asset Transmutation
              <ArrowRightLeft className="w-4 h-4" />
            </span>
          </BenthicCTAButton>
        </div>

        <div className="lg:col-span-7 chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-[#3a4a49]/60 pb-2">
            <div>
              <h2 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                Spend Molt Credits
              </h2>
              <p className="text-[10px] text-[#839493] mt-1">
                Accelerators, premium cosmetics, and catalog boosts — never rank.
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#00c3ff] tabular-nums shrink-0">
              {moltCredits.toLocaleString()} MC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {EXCHANGE_LISTINGS.map((listing) => {
              const rarity = RARITY_STYLES[listing.rarity]
              const canAfford = moltCredits >= listing.creditCost

              return (
                <div
                  key={listing.id}
                  className={cn(
                    'chitin-card-inset p-3 chamfer-corner border-2 flex gap-3 items-stretch',
                    rarity.border,
                    rarity.glow,
                    !canAfford && 'opacity-70'
                  )}
                >
                  <div className="w-14 h-14 shrink-0 rounded-sm overflow-hidden border border-[#3a4a49]/60 bg-[#030606]">
                    <img
                      src={getAssetUrl(listing.imagePath)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn('text-[8px] font-bold uppercase', rarity.text)}>
                          {listing.category}
                        </span>
                      </div>
                      <h3 className="font-grotesk text-[11px] font-bold text-[#dfe3e3] uppercase leading-tight">
                        {listing.name}
                      </h3>
                      <p className="text-[9px] text-[#839493] leading-snug line-clamp-2 mt-0.5">
                        {listing.description}
                      </p>
                    </div>
                    <BenthicCTAButton
                      size="sm"
                      variant={canAfford ? 'red' : 'dark'}
                      disabled={!canAfford}
                      onClick={() => onExchange(listing)}
                    >
                      {listing.creditCost.toLocaleString()} MC
                    </BenthicCTAButton>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
