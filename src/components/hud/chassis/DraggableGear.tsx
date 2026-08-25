import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { CatalogRef } from '@/lib/chassis-loadout'
import { GearItemCard } from './GearItemCard'

export interface DraggableGearProps {
  itemId: string
  catalog: CatalogRef
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
}

export const DraggableGear: React.FC<DraggableGearProps> = ({
  itemId,
  catalog,
  selected,
  onSelect,
  compact,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item:${itemId}`,
    data: { type: 'item', itemId, category: catalog.category },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="h-full w-full">
      <GearItemCard
        catalog={catalog}
        selected={selected}
        compact={compact}
        onClick={onSelect}
        dragHandleProps={{ ...listeners, ...attributes }}
        className="h-full"
      />
    </div>
  )
}
