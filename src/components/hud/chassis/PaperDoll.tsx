import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChromaElement } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'
import type { CatalogRef, GearItemState, EquipmentCategory } from '@/lib/chassis-loadout'
import {
  CATEGORY_LABELS,
  EQUIPMENT_CATEGORIES,
} from '@/lib/chassis-loadout'
import { DraggableGear } from './DraggableGear'

const LEFT_SLOTS: EquipmentCategory[] = ['head', 'carapace', 'antennae']
const RIGHT_SLOTS: EquipmentCategory[] = ['claws', 'legs']

export interface PaperDollProps {
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
  selectedItemId: string | null
  onSelectItem: (id: string | null) => void
  onSlotActivate: (slot: EquipmentCategory) => void
}

function EquipSlot({
  slot,
  item,
  catalog,
  selected,
  onSelect,
  onActivate,
}: {
  slot: EquipmentCategory
  item: GearItemState | undefined
  catalog: CatalogRef | undefined
  selected: boolean
  onSelect: () => void
  onActivate: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `equip:${slot}`,
    data: { type: 'equip', slot },
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        relative w-full aspect-[2/3] min-h-[44px] max-w-[5rem] mx-auto
        border border-dashed rounded-sm
        ${isOver ? 'border-[#00c3ff] bg-[#00c3ff]/10' : 'border-[#3a4a49]/80 bg-[#050808]/60'}
        flex items-center justify-center
      `}
      onClick={() => {
        if (item) onSelect()
        else onActivate()
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (item) onSelect()
          else onActivate()
        }
      }}
      aria-label={`${CATEGORY_LABELS[slot]} slot`}
    >
      {!item && (
        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#4a5a59] text-center px-1 pointer-events-none">
          {CATEGORY_LABELS[slot]}
        </span>
      )}
      {item && catalog && (
        <div className="absolute inset-0.5" onClick={(e) => e.stopPropagation()}>
          <DraggableGear itemId={item.id} catalog={catalog} selected={selected} onSelect={onSelect} />
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
}) => {
  const equipped = new Map(
    items
      .filter((i) => i.equippedSlot)
      .map((i) => [i.equippedSlot as EquipmentCategory, i])
  )

  const renderSlot = (slot: EquipmentCategory) => {
    const item = equipped.get(slot)
    const catalog = item ? catalogById.get(item.catalogItemId) : undefined
    return (
      <EquipSlot
        key={slot}
        slot={slot}
        item={item}
        catalog={catalog}
        selected={item?.id === selectedItemId}
        onSelect={() => onSelectItem(item?.id ?? null)}
        onActivate={() => onSlotActivate(slot)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full min-w-0 flex-1 min-h-0">
      <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase self-start border-b border-[#3a4a49] pb-2 w-full mb-1 shrink-0">
        Chassis Doll
      </h2>

      {/* Desktop / tablet: columns around lobster */}
      <div className="hidden sm:flex flex-1 min-h-0 w-full items-center justify-center gap-3 md:gap-5">
        <div className="flex flex-col items-center justify-center gap-2 w-16 md:w-20">
          {LEFT_SLOTS.map(renderSlot)}
        </div>

        <div className="relative flex items-center justify-center w-36 h-36 md:w-48 md:h-48 shrink-0">
          <div className="absolute inset-0 rounded-full border border-[#00c3ff]/25" />
          <div className="absolute inset-3 rounded-full border border-[#00c3ff]/15" />
          <ChromaElement
            src={getAssetUrl('/images/extracted/cyber_lobster_3d_chroma.jpg')}
            alt="Chassis unit schematic"
            blendMode="screen"
            glowColor="cyan"
            className="w-28 h-28 md:w-40 md:h-40 object-contain"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-2 w-16 md:w-20">
          {RIGHT_SLOTS.map(renderSlot)}
          <div className="w-full aspect-[2/3] opacity-0 pointer-events-none" aria-hidden />
        </div>
      </div>

      {/* Mobile: lobster then 5-slot strip */}
      <div className="flex sm:hidden flex-col items-center justify-center gap-3 w-full flex-1 min-h-0">
        <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
          <div className="absolute inset-0 rounded-full border border-[#00c3ff]/25" />
          <ChromaElement
            src={getAssetUrl('/images/extracted/cyber_lobster_3d_chroma.jpg')}
            alt="Chassis unit schematic"
            blendMode="screen"
            glowColor="cyan"
            className="w-24 h-24 object-contain"
          />
        </div>
        <div className="grid grid-cols-5 gap-1.5 w-full max-w-sm mx-auto justify-items-center">
          {EQUIPMENT_CATEGORIES.map(renderSlot)}
        </div>
      </div>
    </div>
  )
}
