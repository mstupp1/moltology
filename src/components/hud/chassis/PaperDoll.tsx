import React from 'react'
import {
  EQUIP_SLOT_IDS,
  type CatalogRef,
  type GearItemState,
  type EquipSlotId,
} from '@/lib/chassis-loadout'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { ReadOnlyPaperDoll } from '../member/ReadOnlyPaperDoll'
import { SLOT_NAMES } from './ChassisStatusPage'
import type { GearHoverTarget } from './gear-tooltip-position'
export interface PaperDollProps {
  config?: LobsterAvatarConfig
  items: GearItemState[]
  catalogById: Map<string, CatalogRef>
  selectedItemId: string | null
  onSelectItem: (id: string | null) => void
  onSlotActivate: (slot: EquipSlotId) => void
  onHoverItem?: (target: GearHoverTarget | null) => void
}
/** Compatibility wrapper; the unified workspace owns editing. */
export const PaperDoll: React.FC<PaperDollProps> = ({
  config,
  items,
  catalogById,
  selectedItemId,
  onSlotActivate,
  onSelectItem,
}) => (
  <div>
    <ReadOnlyPaperDoll config={config} items={items} catalogById={catalogById} />
    <div className="flex flex-wrap gap-2">
      {EQUIP_SLOT_IDS.map((slot) => (
        <button
          type="button"
          key={slot}
          onClick={() =>
            selectedItemId
              ? onSlotActivate(slot)
              : onSelectItem(items.find((i) => i.equippedSlot === slot)?.id ?? null)
          }
          className="px-2 py-2 text-xs border border-line rounded-control"
          aria-label={`${SLOT_NAMES[slot]} slot`}
        >
          {SLOT_NAMES[slot]}
        </button>
      ))}
    </div>
  </div>
)
