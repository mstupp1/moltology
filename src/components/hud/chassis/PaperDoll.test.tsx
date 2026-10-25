import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PaperDoll } from './PaperDoll'
import { EQUIP_SLOT_IDS } from '@/lib/chassis-loadout'
import { ALL_EQUIPMENT_CATALOG } from '@/lib/equipment-seed-data'
it('renders the equipped character instead of a mannequin and exposes all hardpoints', () => {
  const activate = vi.fn()
  const { container } = render(
    <PaperDoll
      config={{ style: 'critters', seed: 'crab', race: 'crab' }}
      items={[]}
      catalogById={new Map(ALL_EQUIPMENT_CATALOG.map((c) => [c.id, c]))}
      selectedItemId="item"
      onSelectItem={vi.fn()}
      onSlotActivate={activate}
    />,
  )
  expect(container.querySelector('img[src*="chassis_stencil"]')).toBeNull()
  expect(screen.getByTestId('lobster-avatar-full-body')).toBeInTheDocument()
  expect(screen.getAllByRole('button')).toHaveLength(EQUIP_SLOT_IDS.length)
  fireEvent.click(screen.getByRole('button', { name: 'Left pincer slot' }))
  expect(activate).toHaveBeenCalledWith('claws-2')
})
