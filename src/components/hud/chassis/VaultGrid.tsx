import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { CatalogRef, GearItemState } from '@/lib/chassis-loadout'
import { VAULT_SIZE } from '@/lib/chassis-loadout'
import { DraggableGear } from './DraggableGear'

export interface VaultGridProps {
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
  vaultSize?: number
  selectedItemId: string | null
  onSelectItem: (id: string | null) => void
  onCellActivate: (index: number) => void
  onHoverItem?: (id: string | null) => void
}

function VaultCell({
  index,
  item,
  catalog,
  selected,
  hasSelection,
  onSelect,
  onActivate,
  onHoverChange,
}: {
  index: number
  item: GearItemState | undefined
  catalog: CatalogRef | undefined
  selected: boolean
  hasSelection: boolean
  onSelect: () => void
  onActivate: () => void
  onHoverChange?: (hovered: boolean) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `vault:${index}`,
    data: { type: 'vault', index },
  })

  const handleActivate = () => {
    if (item) onSelect()
    else if (hasSelection) onActivate()
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        relative w-16 md:w-20 aspect-[9/16] min-h-[44px] shrink-0 rounded-sm border cursor-pointer
        ${isOver ? 'border-[#00c3ff] bg-[#00c3ff]/10' : 'border-[#2a3535] bg-[#050808]/80'}
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
      aria-label={`Vault cell ${index + 1}`}
    >
      {item && catalog ? (
        <div className="absolute inset-0.5">
          <DraggableGear
            itemId={item.id}
            catalog={catalog}
            selected={selected}
            onSelect={onSelect}
            onHoverChange={onHoverChange}
            compact
          />
        </div>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-[#3a4a49] pointer-events-none">
          {index + 1}
        </span>
      )}
    </div>
  )
}

export const VaultGrid: React.FC<VaultGridProps> = ({
  items,
  catalogById,
  vaultSize = VAULT_SIZE,
  selectedItemId,
  onSelectItem,
  onCellActivate,
  onHoverItem,
}) => {
  const byIndex = new Map(
    items
      .filter((i) => i.vaultIndex !== null && i.vaultIndex !== undefined)
      .map((i) => [i.vaultIndex as number, i])
  )

  return (
    <div className="w-full min-w-0 space-y-2">
      <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase border-b border-[#3a4a49] pb-2">
        Equipment Vault
      </h2>
      <div className="flex justify-center w-full">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1.5 sm:gap-2 justify-items-center mx-auto w-fit max-w-full">
          {Array.from({ length: vaultSize }, (_, index) => {
            const item = byIndex.get(index)
            const catalog = item ? catalogById.get(item.catalogItemId) : undefined
            return (
              <VaultCell
                key={index}
                index={index}
                item={item}
                catalog={catalog}
                selected={item?.id === selectedItemId}
                hasSelection={Boolean(selectedItemId)}
                onSelect={() => onSelectItem(item?.id ?? null)}
                onActivate={() => onCellActivate(index)}
                onHoverChange={(hovered) => onHoverItem?.(hovered ? item?.id ?? null : null)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
