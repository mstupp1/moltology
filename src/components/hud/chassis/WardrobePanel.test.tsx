import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { WardrobePanel } from './WardrobePanel'
import type { CatalogRef, GearItemState } from '@/lib/chassis-loadout'

const base = {
  flavorText: 'Grown, not forged.',
  imageUrl: '/images/chassis/helm.webp',
  visualType: 'helm' as const,
  primaryStat: 0,
  affixes: [],
  uniquePower: null,
}

describe('WardrobePanel', () => {
  const catalogById = new Map<string, CatalogRef>([
    ['c-crown', { ...base, id: 'c-crown', slug: 'reef-crown', name: 'Reef Crown', category: 'head', rarity: 'uncommon', sortOrder: 2, kind: 'cosmetic', artKey: 'reef-crown' }],
    ['c-sash', { ...base, id: 'c-sash', slug: 'kelp-sash', name: 'Kelp Sash', category: 'belt', rarity: 'common', sortOrder: 1, kind: 'cosmetic', artKey: 'kelp-sash' }],
    ['g-visor', { ...base, id: 'g-visor', slug: 'visor', name: 'Visor', category: 'head', rarity: 'common', sortOrder: 0, primaryStat: 8 }],
  ])
  const items: GearItemState[] = [
    { id: 'i-crown', catalogItemId: 'c-crown', equippedSlot: null, vaultIndex: null, lookSlot: 'look-head' },
    { id: 'i-sash', catalogItemId: 'c-sash', equippedSlot: null, vaultIndex: null, lookSlot: null },
    { id: 'i-visor', catalogItemId: 'g-visor', equippedSlot: null, vaultIndex: 0 },
  ]

  it('lists only cosmetics and toggles them on tap', () => {
    const onToggleLook = vi.fn()
    render(<WardrobePanel items={items} catalogById={catalogById} onToggleLook={onToggleLook} />)
    expect(screen.getByText('Wearing')).toBeInTheDocument()
    expect(screen.queryByText('Visor')).toBeNull()

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0]) // Kelp Sash sorts first and is not worn
    expect(onToggleLook).toHaveBeenCalledWith('i-sash', true)
    fireEvent.click(buttons[1])
    expect(onToggleLook).toHaveBeenCalledWith('i-crown', false)
  })
})
