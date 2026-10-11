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
      <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff5540]/5 via-transparent to-[#a855f7]/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-crimson-text">
              <Crown className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em]">Prestige Vault</span>
            </div>
            <h2 className="font-grotesk text-sm sm:text-base font-extrabold text-ink uppercase tracking-wide">
              Chitin Gems Unlock the Coolest Cosmetics
            </h2>
            <p className="text-xs text-ink-body max-w-xl leading-relaxed">
              The apex catalog lives here. Gems are earned through shedding, routines, and
              community contribution.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-card border border-line-subtle bg-surface-2 shrink-0">
            <img
              src={getAssetUrl('/images/chitin_gem.png')}
              alt=""
              className="w-6 h-6 object-contain"
            />
            <span className="font-grotesk text-lg font-extrabold text-crimson-text tabular-nums">
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
                'market-vault-card relative rounded-card border border-line-subtle bg-surface-1 hud-sheen overflow-hidden flex flex-col',
                owned && 'border-emerald-500/50'
              )}
            >
              <div className={cn('h-0.5 w-full shrink-0', rarity.bar)} />
              {item.exclusive ? (
                <span className="absolute top-2 right-2 z-10 text-[11px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-chip bg-crimson-aggro text-abyss">
                  Gems Only
                </span>
              ) : null}
              <div className="relative aspect-[4/3] bg-abyss">
                <img
                  src={getAssetUrl(item.imagePath)}
                  alt=""
                  className={cn(
                    'w-full h-full object-cover',
                    locked && 'brightness-50 saturate-50'
                  )}
                />
                {locked ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-abyss/40">
                    <Lock className="w-8 h-8 text-ink-muted" />
                  </div>
                ) : null}
                {owned ? (
                  <div className="absolute inset-x-0 bottom-0 py-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] bg-emerald-500/15 text-emerald-400 border-t border-emerald-500/40">
                    Unlocked
                  </div>
                ) : null}
              </div>
              <div className="p-2.5 flex flex-col flex-1 gap-2">
                <div className="space-y-0.5">
                  <span className={cn('text-[11px] font-bold uppercase tracking-[0.08em]', rarity.text)}>
                    {item.slot}
                  </span>
                  <h3 className="font-grotesk text-[11px] font-bold text-ink uppercase leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-ink-muted leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>
                {owned ? (
                  <span className="mt-auto text-[11px] text-center font-bold text-emerald-400 uppercase">
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
