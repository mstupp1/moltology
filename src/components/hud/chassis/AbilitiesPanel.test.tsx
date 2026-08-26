import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AbilitiesPanel } from './AbilitiesPanel'
import type { SynapticAbility } from '@/lib/chassis-loadout'

const abilities: SynapticAbility[] = [
  {
    id: 'item-1',
    catalogItemId: 'cat-1',
    name: 'Zero-Latency Clamp',
    description: 'The first grip of a session closes without hesitation.',
    slot: 'claws',
    status: 'Ready',
    locked: false,
  },
  {
    id: 'item-2',
    catalogItemId: 'cat-2',
    name: 'Quiet Arrival',
    description: 'Thought reaches the dome already complete.',
    slot: 'head',
    status: 'Locked',
    locked: true,
  },
]

describe('AbilitiesPanel', () => {
  it('shows seated legendary power names instead of a stub readout', () => {
    render(<AbilitiesPanel abilities={abilities} />)
    expect(screen.getByText('Zero-Latency Clamp')).toBeInTheDocument()
    expect(screen.getByText('Quiet Arrival')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('Locked')).toBeInTheDocument()
    expect(screen.queryByText(/stub readout/i)).not.toBeInTheDocument()
  })

  it('invites seating legendary plating when no powers are owned', () => {
    render(<AbilitiesPanel abilities={[]} />)
    expect(screen.getByText(/No legendary power is seated/i)).toBeInTheDocument()
  })
})
