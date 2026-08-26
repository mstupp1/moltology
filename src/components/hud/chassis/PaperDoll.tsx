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
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'

const LEFT_SLOTS: EquipmentCategory[] = ['head', 'carapace', 'antennae']
const RIGHT_SLOTS: EquipmentCategory[] = ['claws', 'legs']

export interface PaperDollProps {
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
  selectedItemId: string | null
  onSelectItem: (id: string | null) => void
  onSlotActivate: (slot: EquipmentCategory) => void
  onHoverItem?: (id: string | null) => void
  /** DiceBear data URI — replaces default lobster schematic when set */
  avatarSrc?: string | null
  avatarAlt?: string
}

function EquipSlot({
  slot,
  item,
  catalog,
  selected,
  hasSelection,
  onSelect,
  onActivate,
  onHoverChange,
}: {
  slot: EquipmentCategory
  item: GearItemState | undefined
  catalog: CatalogRef | undefined
  selected: boolean
  hasSelection: boolean
  onSelect: () => void
  onActivate: () => void
  onHoverChange?: (hovered: boolean) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `equip:${slot}`,
    data: { type: 'equip', slot },
  })

  const handleActivate = () => {
    if (hasSelection) onActivate()
    else if (item) onSelect()
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        relative w-full aspect-[9/16] min-h-[44px] max-w-[5rem] mx-auto
        border border-dashed rounded-sm cursor-pointer
        ${isOver ? 'border-[#00c3ff] bg-[#00c3ff]/10' : 'border-[#3a4a49]/80 bg-[#050808]/60'}
        flex items-center justify-center
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
      {!item && (
        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#4a5a59] text-center px-1 pointer-events-none">
          {CATEGORY_LABELS[slot]}
        </span>
      )}
      {item && catalog && (
        <div className="absolute inset-0.5">
          <DraggableGear
            itemId={item.id}
            catalog={catalog}
            selected={selected}
            onSelect={hasSelection ? onActivate : onSelect}
            onHoverChange={onHoverChange}
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
  avatarSrc,
  avatarAlt = 'Your avatar',
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
        hasSelection={Boolean(selectedItemId)}
        onSelect={() => onSelectItem(item?.id ?? null)}
        onActivate={() => onSlotActivate(slot)}
        onHoverChange={(hovered) => onHoverItem?.(hovered ? item?.id ?? null : null)}
      />
    )
  }

  const renderCenterUnit = (sizeClass: string) => (
    <div className={`relative flex items-center justify-center ${sizeClass} shrink-0`}>
      {avatarSrc ? (
        <LobsterAvatarPortrait
          src={avatarSrc}
          size={320}
          alt={avatarAlt}
          className="w-full h-full max-w-[min(100%,14rem)] max-h-[min(100%,14rem)]"
        />
      ) : (
        <div className="relative flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-[#00c3ff]/30 bg-gradient-to-b from-[#071624]/90 via-[#030c14]/95 to-[#01050a] overflow-hidden p-3 sm:p-4 shadow-[0_0_25px_rgba(0,195,255,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,195,255,0.12),transparent_70%)] pointer-events-none" />
          <ChromaElement
            src={getAssetUrl('/images/extracted/cyber_lobster_3d_chroma.jpg')}
            alt="Chassis unit schematic"
            blendMode="screen"
            glowColor="cyan"
            terminalEffects={false}
            className="relative z-10 w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  )

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

        {renderCenterUnit('w-48 md:w-56 aspect-square max-h-[350px]')}

        <div className="flex flex-col items-center justify-center gap-2 w-16 md:w-20">
          {RIGHT_SLOTS.map(renderSlot)}
          <div className="w-full aspect-[9/16] opacity-0 pointer-events-none" aria-hidden />
        </div>
      </div>

      {/* Mobile: lobster then 5-slot strip */}
      <div className="flex sm:hidden flex-col items-center justify-center gap-3 w-full flex-1 min-h-0">
        {renderCenterUnit('w-44 aspect-square max-h-[260px]')}
        <div className="grid grid-cols-5 gap-1.5 w-full max-w-sm mx-auto justify-items-center">
          {EQUIPMENT_CATEGORIES.map(renderSlot)}
        </div>
      </div>
    </div>
  )
}
