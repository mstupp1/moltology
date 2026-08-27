import React, { useLayoutEffect, useRef, useState } from 'react'
import type { CatalogRef } from '@/lib/chassis-loadout'
import {
  CATEGORY_LABELS,
  RARITY_LABELS,
  RARITY_STYLES,
  SLOT_DEFAULT_VISUAL,
  VISUAL_TYPE_LABELS,
  formatAffixLine,
  primaryStatLine,
} from '@/lib/chassis-loadout'
import {
  computeGearTooltipPosition,
  type TooltipAnchor,
} from './gear-tooltip-position'

export interface GearTooltipProps {
  catalog: CatalogRef
  className?: string
}

export interface GearTooltipFloatingProps {
  catalog: CatalogRef
  anchor: TooltipAnchor
}

export const GearTooltip: React.FC<GearTooltipProps> = ({ catalog, className = '' }) => {
  const rarity = RARITY_STYLES[catalog.rarity]
  const power = catalog.uniquePower

  return (
    <div
      className={`
        font-sans text-left bg-[#070b0b]/95 border-2 ${rarity.border} ${rarity.glow}
        chamfer-corner shadow-2xl overflow-hidden
        ${className}
      `}
      data-testid="gear-tooltip"
    >
      <div className={`px-3 py-2 ${rarity.bar} border-b ${rarity.border}`}>
        <h3 className={`text-sm sm:text-base font-bold tracking-wide ${rarity.text}`}>
          {catalog.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-[#839493] uppercase tracking-widest mt-0.5">
          {RARITY_LABELS[catalog.rarity]} · {CATEGORY_LABELS[catalog.category]}
          {catalog.visualType && catalog.visualType !== SLOT_DEFAULT_VISUAL[catalog.category]
            ? ` · ${VISUAL_TYPE_LABELS[catalog.visualType]}`
            : ''}
        </p>
      </div>

      <div className="px-3 py-2 space-y-1">
        <p className="text-lg sm:text-xl font-bold text-[#dfe3e3]">{primaryStatLine(catalog)}</p>
        {(catalog.affixes ?? []).map((affix, index) => (
          <p key={`${affix.stat}-${index}`} className="text-xs sm:text-sm text-[#9ae6b4]">
            {formatAffixLine(affix)}
          </p>
        ))}
      </div>

      {power && (
        <div className={`mx-3 mb-2 px-2 py-2 border ${rarity.border} ${rarity.bar} chamfer-corner`}>
          <p className={`text-xs sm:text-sm font-bold tracking-wide ${rarity.text}`}>{power.name}</p>
          <p className="text-[11px] sm:text-xs text-[#dfe3e3] leading-relaxed mt-1">{power.description}</p>
        </div>
      )}

      <p className="px-3 pb-3 text-xs sm:text-sm italic text-[#9aa8a7] leading-relaxed">
        {catalog.flavorText}
      </p>
    </div>
  )
}

export const GearTooltipFloating: React.FC<GearTooltipFloatingProps> = ({ catalog, anchor }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    const rect = el.getBoundingClientRect()
    setPosition(
      computeGearTooltipPosition(anchor, rect, {
        width: window.innerWidth,
        height: window.innerHeight,
      })
    )
  }, [anchor, catalog])

  return (
    <div
      ref={ref}
      className="hidden md:block pointer-events-none fixed z-50 w-72 max-w-[calc(100vw-2rem)]"
      style={{
        top: position?.top ?? anchor.top,
        left: position?.left ?? anchor.right + 12,
        visibility: position ? 'visible' : 'hidden',
      }}
      data-testid="gear-tooltip-floating"
    >
      <GearTooltip catalog={catalog} />
    </div>
  )
}
