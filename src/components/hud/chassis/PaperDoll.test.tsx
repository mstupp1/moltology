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
    expect(screen.getByRole('button', { name: 'Belt slot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Legs slot' })).toBeInTheDocument()
  })

  it('mirrors weapon art on the off-hand claw hardpoint', () => {
    const catalogByIdWithClaw = new Map<string, CatalogRef>([
      ...catalogById,
      [
        'c-claws',
        {
          id: 'c-claws',
          slug: 'pincer',
          name: 'Test Pincer',
          category: 'claws',
          imageUrl: '/images/chassis/pincer.webp',
          rarity: 'common',
          visualType: 'pincer',
          primaryStat: 10,
          affixes: [],
          uniquePower: null,
          flavorText: 'Sharp.',
          sortOrder: 2,
        },
      ],
    ])

    const clawItems: GearItemState[] = [
      {
        id: 'item-claw',
        catalogItemId: 'c-claws',
        equippedSlot: 'claws-2',
        vaultIndex: null,
      },
    ]

    const { container } = render(
      <PaperDoll
        items={clawItems}
        catalogById={catalogByIdWithClaw}
        selectedItemId={null}
        onSelectItem={vi.fn()}
        onSlotActivate={vi.fn()}
      />
    )

    const flipped = container.querySelector('img.scale-x-\\[-1\\]')
    expect(flipped).toBeInTheDocument()
  })
})
