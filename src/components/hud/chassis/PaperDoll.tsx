import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { CatalogRef, GearItemState, EquipmentCategory } from '@/lib/chassis-loadout'
import {
  CATEGORY_LABELS,
} from '@/lib/chassis-loadout'
import { getAssetUrl } from '@/lib/assets'
import { DraggableGear } from './DraggableGear'
import { GearItemCard } from './GearItemCard'

export interface PaperDollProps {
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
  selectedItemId: string | null
  onSelectItem: (id: string | null) => void
  onSlotActivate: (slot: EquipmentCategory) => void
  onHoverItem?: (id: string | null) => void
}

function EquipSlot({
  slot,
  dropId,
  item,
  catalog,
  selected,
  hasSelection,
  onSelect,
  onActivate,
  onHoverChange,
  readOnly = false,
}: {
  slot: EquipmentCategory
  /** Unique droppable id — use when rendering duplicate visuals for one slot (e.g. dual claws). */
  dropId?: string
  item: GearItemState | undefined
  catalog: CatalogRef | undefined
  selected: boolean
  hasSelection: boolean
  onSelect: () => void
  onActivate: () => void
  onHoverChange?: (hovered: boolean) => void
  /** Mirror slot — accepts drops but does not host its own drag source. */
  readOnly?: boolean
}) {
  const droppableId = dropId ?? `equip:${slot}`
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: 'equip', slot },
  })

  const handleActivate = () => {
    if (hasSelection) onActivate()
    else if (item && !readOnly) onSelect()
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
      aria-label={`${CATEGORY_LABELS[slot]} slot`}
    >
      {!item && !readOnly && (
        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#4a5a59] text-center px-1 pointer-events-none">
          {CATEGORY_LABELS[slot]}
        </span>
      )}
      {item && catalog && (
        <div className="absolute inset-0.5">
          {readOnly ? (
            <GearItemCard catalog={catalog} compact className="h-full pointer-events-none opacity-90" />
          ) : (
            <DraggableGear
              itemId={item.id}
              catalog={catalog}
              selected={selected}
              onSelect={hasSelection ? onActivate : onSelect}
              onHoverChange={onHoverChange}
              compact
            />
          )}
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
      .map((i) => [i.equippedSlot as EquipmentCategory, i])
  )

  const renderSlot = (
    slot: EquipmentCategory,
    options?: { dropId?: string; readOnly?: boolean }
  ) => {
    const item = equipped.get(slot)
    const catalog = item ? catalogById.get(item.catalogItemId) : undefined
    return (
      <EquipSlot
        key={options?.dropId ?? slot}
        slot={slot}
        dropId={options?.dropId}
        item={item}
        catalog={catalog}
        selected={item?.id === selectedItemId}
        hasSelection={Boolean(selectedItemId)}
        onSelect={() => onSelectItem(item?.id ?? null)}
        onActivate={() => onSlotActivate(slot)}
        onHoverChange={(hovered) => onHoverItem?.(hovered ? item?.id ?? null : null)}
        readOnly={options?.readOnly}
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
            className="h-full max-h-[96%] w-auto object-contain opacity-25 filter drop-shadow-[0_0_16px_rgba(0,195,255,0.25)] pointer-events-none"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2">
          {renderSlot('antennae')}
          {renderSlot('head')}

          <div className="flex gap-1.5 sm:gap-2">
            {renderSlot('claws', { dropId: 'equip:claws-1' })}
            {renderSlot('carapace')}
            {renderSlot('claws', { dropId: 'equip:claws-2', readOnly: true })}
          </div>

          <div className="flex">
            {renderSlot('legs')}
          </div>
        </div>
      </div>
    </div>
  )
}
