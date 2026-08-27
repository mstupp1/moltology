import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { CatalogRef, GearItemState, EquipSlotId } from '@/lib/chassis-loadout'
import {
  CATEGORY_LABELS,
  equipSlotCategory,
} from '@/lib/chassis-loadout'
import { getAssetUrl } from '@/lib/assets'
import { DraggableGear } from './DraggableGear'
import { GearItemCard } from './GearItemCard'
import type { GearHoverTarget, TooltipAnchor } from './gear-tooltip-position'

export interface PaperDollProps {
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
  selectedItemId: string | null
  onSelectItem: (id: string | null) => void
  onSlotActivate: (slot: EquipSlotId) => void
  onHoverItem?: (target: GearHoverTarget | null) => void
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

function EquipSlot({
  equipSlot,
  item,
  catalog,
  selected,
  hasSelection,
  flipped = false,
  onSelect,
  onActivate,
  onHoverChange,
}: {
  equipSlot: EquipSlotId
  item: GearItemState | undefined
  catalog: CatalogRef | undefined
  selected: boolean
  hasSelection: boolean
  /** Mirror weapon art on the character's left arm (screen-right hardpoint). */
  flipped?: boolean
  onSelect: () => void
  onActivate: () => void
  onHoverChange?: (hovered: boolean, anchor?: TooltipAnchor) => void
}) {
  const category = equipSlotCategory(equipSlot)
  const { setNodeRef, isOver } = useDroppable({
    id: `equip:${equipSlot}`,
    data: { type: 'equip', slot: equipSlot },
  })

  const handleActivate = () => {
    if (hasSelection) onActivate()
    else if (item) onSelect()
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        relative w-16 md:w-20 aspect-[9/16] min-h-[44px] shrink-0 rounded-sm border cursor-pointer
        ${isOver ? 'border-[#00c3ff] bg-[#00c3ff]/10' : 'border-dashed border-[#3a4a49]/80 bg-[#050808]/75 backdrop-blur-[2px]'}
        flex items-center justify-center transition-colors
      `}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleActivate()
        }
      }}
      aria-label={`${SLOT_LABELS[equipSlot]} slot`}
    >
      {!item && (
        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#4a5a59] text-center px-1 pointer-events-none">
          {CATEGORY_LABELS[category]}
        </span>
      )}
      {item && catalog && (
        <div className="absolute inset-0.5">
          <DraggableGear
            itemId={item.id}
            catalog={catalog}
            selected={selected}
            flipped={flipped}
            onSelect={hasSelection ? onActivate : onSelect}
            onHoverChange={onHoverChange}
            compact
          />
        </div>
      )}
    </div>
  )
}

export const PaperDoll: React.FC<PaperDollProps> = ({
  items,
  catalogById,
  selectedItemId,
  onSelectItem,
  onSlotActivate,
  onHoverItem,
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
      <EquipSlot
        key={equipSlot}
        equipSlot={equipSlot}
        item={item}
        catalog={catalog}
        selected={item?.id === selectedItemId}
        hasSelection={Boolean(selectedItemId)}
        flipped={options?.flipped}
        onSelect={() => onSelectItem(item?.id ?? null)}
        onActivate={() => onSlotActivate(equipSlot)}
        onHoverChange={(hovered, anchor) =>
          onHoverItem?.(
            hovered && item && anchor ? { itemId: item.id, anchor } : null
          )
        }
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-w-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative select-none">
      <div className="relative flex flex-col justify-center items-center gap-1.5 sm:gap-2 shrink-0 min-h-full w-full py-2">
        {/* Holographic Chassis Mannequin Blueprint Stencil */}
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

          <div className="flex">
            {renderSlot('belt')}
          </div>

          <div className="flex">
            {renderSlot('legs')}
          </div>
        </div>
      </div>
    </div>
  )
}
