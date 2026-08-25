import React from 'react'
import type { CatalogRef } from '@/lib/chassis-loadout'
import { RARITY_STYLES, CATEGORY_LABELS } from '@/lib/chassis-loadout'

export interface GearItemCardProps {
  catalog: CatalogRef
  selected?: boolean
  dimmed?: boolean
  compact?: boolean
  onClick?: () => void
  className?: string
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
  style?: React.CSSProperties
}

export const GearItemCard: React.FC<GearItemCardProps> = ({
  catalog,
  selected = false,
  dimmed = false,
  compact = false,
  onClick,
  className = '',
  dragHandleProps,
  style,
}) => {
  const rarity = RARITY_STYLES[catalog.rarity]

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      {...dragHandleProps}
      className={`
        relative flex flex-col items-stretch justify-between w-full
        aspect-[2/3] min-h-[44px] rounded-sm border-2 overflow-hidden
        bg-gradient-to-b from-[#0c1414] to-[#050808]
        transition-transform touch-manipulation
        ${rarity.border} ${rarity.glow}
        ${selected ? 'ring-2 ring-[#00c3ff] ring-offset-1 ring-offset-[#030606] scale-[1.02]' : ''}
        ${dimmed ? 'opacity-40' : 'opacity-100'}
        hover:brightness-110 active:scale-[0.98]
        ${className}
      `}
      aria-label={`${catalog.name}, ${CATEGORY_LABELS[catalog.category]}`}
    >
      <div className={`w-full ${compact ? 'h-1' : 'h-1.5'} ${rarity.bar}`} />
      <div className="flex-1 flex flex-col items-center justify-center px-1 py-1 gap-0.5">
        <span
          className={`text-[8px] sm:text-[9px] uppercase tracking-wider ${rarity.text} leading-none`}
        >
          {CATEGORY_LABELS[catalog.category].slice(0, 4)}
        </span>
        <span className="text-[9px] sm:text-[10px] text-[#dfe3e3] font-semibold text-center leading-tight line-clamp-3">
          {catalog.name}
        </span>
        <span className={`text-[10px] sm:text-xs font-bold ${rarity.text}`}>
          +{catalog.primaryStat}
        </span>
      </div>
      <div className={`w-full ${compact ? 'py-0.5' : 'py-1'} text-center ${rarity.bar}`}>
        <span className={`text-[7px] sm:text-[8px] uppercase tracking-widest ${rarity.text}`}>
          {catalog.rarity}
        </span>
      </div>
    </button>
  )
}
