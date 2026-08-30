import React from 'react'
import { Crown, Lock } from 'lucide-react'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { getAssetUrl } from '@/lib/assets'
import { RARITY_STYLES } from '@/lib/chassis-loadout'
import { cn } from '@/lib/utils'
import { GEM_VAULT_ITEMS, type GemVaultItem } from './market-data'

interface GemVaultPanelProps {
  chitinGems: number
  ownedIds: Set<string>
  onUnlock: (item: GemVaultItem) => void
}

export function GemVaultPanel({ chitinGems, ownedIds, onUnlock }: GemVaultPanelProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl border border-[#ff5540]/25 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff5540]/5 via-transparent to-[#a855f7]/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#ff8066]">
              <Crown className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Prestige Vault</span>
            </div>
            <h2 className="font-grotesk text-sm sm:text-base font-extrabold text-[#dfe3e3] uppercase tracking-wide">
              Chitin Gems Unlock the Coolest Cosmetics
            </h2>
            <p className="text-xs text-[#839493] max-w-xl leading-relaxed">
              The apex catalog lives here. Gems are earned through shedding, routines, and
              community contribution — never purchased. Rank stays earned.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-[#ff5540]/35 bg-[#030606]/70 shrink-0">
            <img
              src={getAssetUrl('/images/chitin_gem.png')}
              alt=""
              className="w-6 h-6 object-contain"
            />
            <span className="font-grotesk text-lg font-extrabold text-[#ff8066] tabular-nums">
              {chitinGems.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
        {GEM_VAULT_ITEMS.map((item) => {
          const rarity = RARITY_STYLES[item.rarity]
          const owned = ownedIds.has(item.id)
          const canAfford = chitinGems >= item.gemCost
          const locked = !owned && !canAfford

          return (
            <div
              key={item.id}
              className={cn(
                'relative chitin-card-inset rounded-sm border-2 overflow-hidden flex flex-col',
                rarity.border,
                rarity.glow,
                owned && 'ring-1 ring-[#39ff14]/50'
              )}
            >
              <div className={cn('h-1 w-full shrink-0', rarity.bar)} />
              {item.exclusive ? (
                <span className="absolute top-2 right-2 z-10 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#ff5540] text-white">
                  Gems Only
                </span>
              ) : null}
              <div className="relative aspect-[4/3] bg-[#030606]">
                <img
                  src={getAssetUrl(item.imagePath)}
                  alt=""
                  className={cn(
                    'w-full h-full object-cover',
                    locked && 'brightness-50 saturate-50'
                  )}
                />
                {locked ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <Lock className="w-8 h-8 text-[#839493]" />
                  </div>
                ) : null}
                {owned ? (
                  <div className="absolute inset-x-0 bottom-0 py-1 text-center text-[9px] font-bold uppercase tracking-wider bg-[#39ff14]/20 text-[#39ff14] border-t border-[#39ff14]/40">
                    Unlocked
                  </div>
                ) : null}
              </div>
              <div className="p-2.5 flex flex-col flex-1 gap-2">
                <div className="space-y-0.5">
                  <span className={cn('text-[8px] font-bold uppercase', rarity.text)}>
                    {item.slot}
                  </span>
                  <h3 className="font-grotesk text-[10px] sm:text-[11px] font-bold text-[#dfe3e3] uppercase leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-[9px] text-[#839493] leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>
                {owned ? (
                  <span className="mt-auto text-[10px] text-center font-bold text-[#39ff14] uppercase">
                    Equip in Chassis
                  </span>
                ) : (
                  <BenthicCTAButton
                    size="sm"
                    fullWidth
                    variant={canAfford ? 'cyan' : 'dark'}
                    disabled={!canAfford}
                    onClick={() => onUnlock(item)}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <img
                        src={getAssetUrl('/images/chitin_gem.png')}
                        alt=""
                        className="w-3.5 h-3.5 object-contain"
                      />
                      {item.gemCost.toLocaleString()}
                    </span>
                  </BenthicCTAButton>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
