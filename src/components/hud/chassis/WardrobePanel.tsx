import React from 'react'
import type { CatalogRef, GearItemState } from '@/lib/chassis-loadout'
import { CATEGORY_LABELS, isCosmetic } from '@/lib/chassis-loadout'
import { GearItemCard } from './GearItemCard'
import type { GearHoverTarget } from './gear-tooltip-position'

export interface WardrobePanelProps {
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
  /** Tap toggles: wears the look (replacing any in that category) or takes it off. */
  onToggleLook: (itemId: string, wear: boolean) => void
  onHoverItem?: (target: GearHoverTarget | null) => void
  disabled?: boolean
}

/** Owned cosmetics. They change how the avatar looks and leave stats alone. */
export const WardrobePanel: React.FC<WardrobePanelProps> = ({
  items,
  catalogById,
  onToggleLook,
  onHoverItem,
  disabled = false,
}) => {
  const owned = items
    .map((item) => ({ item, catalog: catalogById.get(item.catalogItemId) }))
    .filter((row): row is { item: GearItemState; catalog: CatalogRef } => isCosmetic(row.catalog))
    .sort((a, b) => a.catalog.sortOrder - b.catalog.sortOrder)

  return (
    <section aria-labelledby="wardrobe-heading" className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 id="wardrobe-heading" className="text-[11px] uppercase tracking-[0.18em] text-ink">
          Wardrobe
        </h2>
        <p className="text-[11px] text-ink-muted">Looks change your avatar, not your stats.</p>
      </div>
      {owned.length === 0 ? (
        <p className="text-xs text-ink-muted">No cosmetics yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {owned.map(({ item, catalog }) => {
            const worn = Boolean(item.lookSlot)
            return (
              <li key={item.id} className="w-14 md:w-16">
                <GearItemCard
                  catalog={catalog}
                  compact
                  selected={worn}
                  dimmed={disabled}
                  onClick={() => !disabled && onToggleLook(item.id, !worn)}
                  onHoverChange={(hovered, anchor) =>
                    onHoverItem?.(hovered && anchor ? { itemId: item.id, anchor } : null)
                  }
                />
                <p className="mt-1 text-center text-[11px] uppercase tracking-wider text-ink-muted">
                  {worn ? 'Wearing' : CATEGORY_LABELS[catalog.category]}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
