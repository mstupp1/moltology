import React from 'react'
import type { CatalogRef, GearItemState } from '@/lib/chassis-loadout'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { equipmentAppearance } from '@/lib/character-appearance'
import { LobsterAvatarFullBody } from '../LobsterAvatarFullBody'
export interface ReadOnlyPaperDollProps {
  config?: LobsterAvatarConfig
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
}
export const ReadOnlyPaperDoll: React.FC<ReadOnlyPaperDollProps> = ({
  config,
  items,
  catalogById,
}) => (
  <div className="space-y-3">
    <LobsterAvatarFullBody
      config={
        config
          ? {
              ...config,
              equipment: config.equipment ?? equipmentAppearance(items, [...catalogById.values()]),
            }
          : undefined
      }
      size={420}
      className="w-full aspect-square rounded-card"
    />
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      {items
        .filter((i) => i.equippedSlot)
        .map((i) => (
          <li key={i.id}>{catalogById.get(i.catalogItemId)?.name}</li>
        ))}
    </ul>
  </div>
)
