import React from 'react'
import type { CatalogRef, GearItemState, EquipSlotId } from '@/lib/chassis-loadout'
import { CATEGORY_LABELS, equipSlotCategory } from '@/lib/chassis-loadout'
import { getAssetUrl } from '@/lib/assets'
import { GearItemCard } from '@/components/hud/chassis/GearItemCard'

export interface ReadOnlyPaperDollProps {
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
}

const SLOT_LABELS: Record<EquipSlotId, string> = {
  head: 'Head',
  carapace: 'Carapace',
  'claws-1': 'Claws',
  'claws-2': 'Claws',
  belt: 'Belt',
  legs: 'Legs',
  antennae: 'Antennae',
}

function ReadOnlySlot({
  equipSlot,
  item,
  catalog,
  flipped = false,
}: {
  equipSlot: EquipSlotId
  item: GearItemState | undefined
  catalog: CatalogRef | undefined
  flipped?: boolean
}) {
  const category = equipSlotCategory(equipSlot)

  return (
    <div
      className="relative w-16 md:w-20 aspect-[9/16] min-h-[44px] shrink-0 rounded-sm border border-dashed border-[#3a4a49]/80 bg-[#050808]/90 flex items-center justify-center"
      aria-label={`${SLOT_LABELS[equipSlot]} slot`}
    >
      {!item && (
        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#4a5a59] text-center px-1 pointer-events-none">
          {CATEGORY_LABELS[category]}
        </span>
      )}
      {item && catalog && (
        <div className={`absolute inset-0.5 ${flipped ? 'scale-x-[-1]' : ''}`}>
          <GearItemCard catalog={catalog} selected={false} compact />
        </div>
      )}
    </div>
  )
}

export const ReadOnlyPaperDoll: React.FC<ReadOnlyPaperDollProps> = ({
  items,
  catalogById,
}) => {
  const equipped = new Map(
    items
      .filter((i) => i.equippedSlot)
      .map((i) => [i.equippedSlot as EquipSlotId, i])
  )

  const renderSlot = (equipSlot: EquipSlotId, options?: { flipped?: boolean }) => {
    const item = equipped.get(equipSlot)
    const catalog = item ? catalogById.get(item.catalogItemId) : undefined
    return (
      <ReadOnlySlot
        key={equipSlot}
        equipSlot={equipSlot}
        item={item}
        catalog={catalog}
        flipped={options?.flipped}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-w-0 relative select-none py-2">
      <div className="relative flex flex-col justify-center items-center gap-1.5 sm:gap-2 shrink-0 w-full">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
          <img
            src={getAssetUrl('images/chassis/chassis_stencil.webp')}
            alt=""
            aria-hidden="true"
            className="h-full max-h-[96%] w-auto object-contain opacity-25 filter drop-shadow-[0_0_16px_rgba(0,195,255,0.25)] pointer-events-none translate-y-[14%]"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5">
          {renderSlot('antennae')}
          {renderSlot('head')}

          <div className="flex gap-1 sm:gap-1.5">
            {renderSlot('claws-1')}
            {renderSlot('carapace')}
            {renderSlot('claws-2', { flipped: true })}
          </div>

          <div className="flex">{renderSlot('belt')}</div>
          <div className="flex">{renderSlot('legs')}</div>
        </div>
      </div>
    </div>
  )
}
