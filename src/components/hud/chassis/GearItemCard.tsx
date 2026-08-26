import React from 'react'
import type { CatalogRef } from '@/lib/chassis-loadout'
import {
  RARITY_STYLES,
  CATEGORY_LABELS,
  chassisTypeImageUrl,
} from '@/lib/chassis-loadout'

export interface GearItemCardProps {
  catalog: CatalogRef
  selected?: boolean
  dimmed?: boolean
  compact?: boolean
  onClick?: () => void
  onHoverChange?: (hovered: boolean) => void
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
  onHoverChange,
  className = '',
  dragHandleProps,
  style,
}) => {
  const rarity = RARITY_STYLES[catalog.rarity]
  const imageSrc = catalog.imageUrl || chassisTypeImageUrl(catalog.visualType)

  return (
    <button
      type="button"
      style={style}
      {...dragHandleProps}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      className={`
        relative flex flex-col items-stretch justify-between w-full
        aspect-[9/16] min-h-[44px] rounded-sm border-2 overflow-hidden
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
      <div className={`w-full ${compact ? 'h-1' : 'h-1.5'} ${rarity.bar} shrink-0`} />
      <div className="flex-1 relative min-h-0">
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>
      <div className={`w-full ${compact ? 'py-0.5 px-0.5' : 'py-1 px-1'} text-center ${rarity.bar} shrink-0`}>
        <span className="block text-[8px] sm:text-[9px] text-[#dfe3e3] font-semibold leading-tight line-clamp-2">
          {catalog.name}
        </span>
        <span className={`text-[9px] sm:text-[10px] font-bold ${rarity.text}`}>
          +{catalog.primaryStat}
        </span>
      </div>
    </button>
  )
}
