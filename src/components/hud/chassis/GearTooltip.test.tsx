import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GearTooltip } from './GearTooltip'
import type { CatalogRef } from '@/lib/chassis-loadout'

const legendary: CatalogRef = {
  id: 'cat-1',
  slug: 'synapse-shear-claws',
  name: 'Synapse-Shear Claws',
  flavorText: 'Legendary torque. Soft deadlines do not survive contact.',
  category: 'claws',
  rarity: 'legendary',
  visualType: 'pincer',
  primaryStat: 96,
  affixes: [{ stat: 'speed', value: 8 }],
  uniquePower: {
    name: 'Zero-Latency Clamp',
    description: 'The first grip of a session closes without hesitation.',
  },
  imageUrl: '/images/chassis/pincer.svg',
  sortOrder: 7,
}

describe('GearTooltip', () => {
  it('renders name, rarity, slot, affix lines, and unique power', () => {
    render(<GearTooltip catalog={legendary} />)
    expect(screen.getByText('Synapse-Shear Claws')).toBeInTheDocument()
    expect(screen.getByText(/Legendary · Claws/i)).toBeInTheDocument()
    expect(screen.getByText('+96 Attack')).toBeInTheDocument()
    expect(screen.getByText('+8 Speed')).toBeInTheDocument()
    expect(screen.getByText('Zero-Latency Clamp')).toBeInTheDocument()
    expect(
      screen.getByText(/The first grip of a session closes without hesitation/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/stub readout/i)).not.toBeInTheDocument()
  })
})
