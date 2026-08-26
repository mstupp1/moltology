import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChassisStatusPage } from './ChassisStatusPage'
import { authClient } from '@/lib/auth-client'
import { getChassisLoadoutFn, moveGearItemFn } from '@/lib/server/api'
import { clearChassisLoadoutCache } from '@/lib/chassis-loadout'
import type { CatalogRef, ChassisLoadoutPayload, GearItemState } from '@/lib/chassis-loadout'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/server/api', () => ({
  getChassisLoadoutFn: vi.fn(),
  moveGearItemFn: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/hooks/useHudPersist', () => ({
  useHudPersist: () => ({
    begin: vi.fn(),
    end: vi.fn(),
    run: vi.fn(async (fn: () => Promise<unknown>) => fn()),
    isPersisting: false,
  }),
}))

const catalog: CatalogRef[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'larval-plate-vest',
    name: 'Larval Plate Vest',
    flavorText: 'Thin chitin, still soft from the last shed.',
    category: 'carapace',
    rarity: 'common',
    visualType: 'carapace',
    primaryStat: 12,
    affixes: [],
    uniquePower: null,
    imageUrl: '/images/chassis/carapace.webp',
    sortOrder: 1,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000006',
    slug: 'synapse-shear-claws',
    name: 'Synapse-Shear Claws',
    flavorText: 'Legendary torque.',
    category: 'claws',
    rarity: 'legendary',
    visualType: 'pincer',
    primaryStat: 96,
    affixes: [{ stat: 'speed', value: 8 }],
    uniquePower: {
      name: 'Zero-Latency Clamp',
      description: 'The first grip of a session closes without hesitation.',
    },
    imageUrl: '/images/chassis/pincer.webp',
    sortOrder: 7,
  },
]

const items: GearItemState[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    catalogItemId: catalog[0].id,
    equippedSlot: null,
    vaultIndex: 0,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    catalogItemId: catalog[1].id,
    equippedSlot: null,
    vaultIndex: 1,
  },
]

const emptyPayload: ChassisLoadoutPayload = {
  catalog,
  items,
  totals: { defense: 0, attack: 0, intelligence: 0, speed: 0, perception: 0 },
  vaultSize: 20,
}

describe('ChassisStatusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearChassisLoadoutCache()
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    vi.mocked(getChassisLoadoutFn).mockResolvedValue(emptyPayload)
    vi.mocked(moveGearItemFn).mockImplementation(async ({ data }: any) => {
      const nextItems = items.map((item) =>
        item.id === data.itemId
          ? { ...item, equippedSlot: data.target.slot, vaultIndex: null }
          : item
      )
      const totals = {
        defense: data.target.slot === 'carapace' ? 12 : 0,
        attack: data.target.slot === 'claws' ? 96 : 0,
        intelligence: 0,
        speed: data.target.slot === 'claws' ? 8 : 0,
        perception: 0,
      }
      return { catalog, items: nextItems, totals, vaultSize: 20 }
    })
  })

  it('shows vaulted gear, zeroed stats, and locked legendary powers', async () => {
    render(<ChassisStatusPage />)
    expect(await screen.findByText('Larval Plate Vest')).toBeInTheDocument()
    expect(screen.getByText('Synapse-Shear Claws')).toBeInTheDocument()
    expect(screen.getAllByText('Zero-Latency Clamp').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0)
    expect(screen.queryByText(/stub readout/i)).not.toBeInTheDocument()
  })

  it('equips a selected vault piece onto a matching hardpoint on desktop without opening bottom modal', async () => {
    render(<ChassisStatusPage />)
    const claw = await screen.findByRole('button', { name: /Synapse-Shear Claws/i })
    fireEvent.click(claw)

    // Verify no bottom sheet modal dialog is opened on desktop
    expect(screen.queryByRole('dialog', { name: /Gear/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Claws slot' })[0])

    await waitFor(() => {
      expect(moveGearItemFn).toHaveBeenCalled()
    })
    const call = vi.mocked(moveGearItemFn).mock.calls[0][0] as { data: { itemId: string; target: { type: string; slot: string } } }
    expect(call.data.itemId).toBe('22222222-2222-4222-8222-222222222222')
    expect(call.data.target).toEqual({ type: 'equip', slot: 'claws' })
    expect((await screen.findAllByText('96')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
  })

  it('opens bottom sheet modal when tapping an item on mobile viewports', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    render(<ChassisStatusPage />)
    const claw = await screen.findByRole('button', { name: /Synapse-Shear Claws/i })
    fireEvent.click(claw)

    expect(await screen.findByRole('dialog', { name: /Synapse-Shear Claws/i })).toBeInTheDocument()
    expect((await screen.findAllByText('+96 Attack')).length).toBeGreaterThan(0)

    vi.unstubAllGlobals()
  })
})
