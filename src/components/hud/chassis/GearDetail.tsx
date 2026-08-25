import React from 'react'
import type { CatalogRef } from '@/lib/chassis-loadout'
import {
  CATEGORY_LABELS,
  CATEGORY_TO_STAT,
  RARITY_LABELS,
  RARITY_STYLES,
  STAT_LABELS,
} from '@/lib/chassis-loadout'

export interface GearDetailProps {
  catalog: CatalogRef
  className?: string
}

export const GearDetail: React.FC<GearDetailProps> = ({ catalog, className = '' }) => {
  const rarity = RARITY_STYLES[catalog.rarity]
  const statKey = CATEGORY_TO_STAT[catalog.category]

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      <div className={`px-3 py-2 ${rarity.bar} border-b ${rarity.border}`}>
        <h3 className={`text-sm sm:text-base font-bold tracking-wide ${rarity.text}`}>
          {catalog.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-[#839493] uppercase tracking-widest mt-0.5">
          {RARITY_LABELS[catalog.rarity]} {CATEGORY_LABELS[catalog.category]}
        </p>
      </div>
      <div className="px-3">
        <p className="text-lg sm:text-xl font-bold text-[#dfe3e3]">
          +{catalog.primaryStat}{' '}
          <span className="text-xs sm:text-sm font-medium text-[#839493]">
            {STAT_LABELS[statKey]}
          </span>
        </p>
      </div>
      <p className="px-3 pb-2 text-xs sm:text-sm italic text-[#9aa8a7] leading-relaxed">
        {catalog.flavorText}
      </p>
    </div>
  )
}
