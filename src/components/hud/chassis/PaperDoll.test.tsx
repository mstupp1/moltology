import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaperDoll } from './PaperDoll'
import type { CatalogRef, GearItemState } from '@/lib/chassis-loadout'

describe('PaperDoll', () => {
  const catalogById = new Map<string, CatalogRef>([
    [
      'c-antennae',
      {
        id: 'c-antennae',
        slug: 'larval-feelers',
        name: 'Larval Feelers',
        category: 'antennae',
        imageUrl: '/images/chassis/antennae.webp',
        rarity: 'common',
        visualType: 'antennae',
        primaryStat: 10,
        affixes: [],
        uniquePower: null,
        flavorText: 'Basic sensory array.',
        sortOrder: 1,
      },
    ],
  ])

  const items: GearItemState[] = [
    {
      id: 'item-antennae',
      catalogItemId: 'c-antennae',
      equippedSlot: 'antennae',
      vaultIndex: null,
    },
  ]

  it('renders all equipment slots and the background chassis stencil', () => {
    const { container } = render(
      <PaperDoll
        items={items}
        catalogById={catalogById}
        selectedItemId={null}
        onSelectItem={vi.fn()}
        onSlotActivate={vi.fn()}
      />
    )

    // Stencil backdrop image
    const stencil = container.querySelector('img[src*="chassis_stencil.webp"]')
    expect(stencil).toBeInTheDocument()

    // Slots
    expect(screen.getByRole('button', { name: 'Antennae slot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Head slot' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Claws slot' }).length).toBe(2)
    expect(screen.getByRole('button', { name: 'Carapace slot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Legs slot' })).toBeInTheDocument()
  })
})
