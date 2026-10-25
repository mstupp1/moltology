import React from 'react'
import type { SynapticAbility } from '@/lib/chassis-loadout'
export interface AbilitiesPanelProps {
  abilities: SynapticAbility[]
  variant?: 'panel' | 'strip'
}
/** Legacy export retained for callers; powers are descriptive item lore. */
export const AbilitiesPanel: React.FC<AbilitiesPanelProps> = ({ abilities }) => (
  <section className="space-y-3 text-sm">
    <h2 className="font-grotesk font-bold">Item lore</h2>
    {abilities.length ? (
      <ul className="space-y-3">
        {abilities.map((a) => (
          <li key={a.id}>
            <p className="font-semibold">{a.name}</p>
            <p className="text-xs text-ink-muted mt-1">{a.description}</p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-ink-muted">No item lore in this collection.</p>
    )}
  </section>
)
