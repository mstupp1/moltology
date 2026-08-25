import { describe, it, expect } from 'vitest'
import {
  applyMoveUpdates,
  computeLoadoutTotals,
  findFirstFreeVaultIndex,
  planGearMove,
  type CatalogRef,
  type GearItemState,
} from './chassis-loadout'

const catalog: CatalogRef[] = [
  {
    id: 'cat-carapace',
    slug: 'shell',
    name: 'Shell',
    flavorText: 'Hard.',
    category: 'carapace',
    rarity: 'common',
    primaryStat: 10,
    sortOrder: 1,
  },
  {
    id: 'cat-claws',
    slug: 'claws',
    name: 'Claws',
    flavorText: 'Sharp.',
    category: 'claws',
    rarity: 'rare',
    primaryStat: 25,
    sortOrder: 2,
  },
  {
    id: 'cat-carapace-2',
    slug: 'shell-2',
    name: 'Shell II',
    flavorText: 'Harder.',
    category: 'carapace',
    rarity: 'epic',
    primaryStat: 40,
    sortOrder: 3,
  },
]

const byId = Object.fromEntries(catalog.map((c) => [c.id, c]))

describe('chassis-loadout', () => {
  it('computes loadout totals from equipped gear only', () => {
    const items: GearItemState[] = [
      { id: '1', catalogItemId: 'cat-carapace', equippedSlot: 'carapace', vaultIndex: null },
      { id: '2', catalogItemId: 'cat-claws', equippedSlot: 'claws', vaultIndex: null },
      { id: '3', catalogItemId: 'cat-carapace-2', equippedSlot: null, vaultIndex: 0 },
    ]
    expect(computeLoadoutTotals(items, byId)).toEqual({
      defense: 10,
      attack: 25,
      intelligence: 0,
      speed: 0,
      perception: 0,
    })
  })

  it('finds the first free vault index', () => {
    const items: GearItemState[] = [
      { id: '1', catalogItemId: 'cat-carapace', equippedSlot: null, vaultIndex: 0 },
      { id: '2', catalogItemId: 'cat-claws', equippedSlot: null, vaultIndex: 2 },
    ]
    expect(findFirstFreeVaultIndex(items, 4)).toBe(1)
  })

  it('rejects cross-category equip', () => {
    const items: GearItemState[] = [
      { id: '1', catalogItemId: 'cat-claws', equippedSlot: null, vaultIndex: 0 },
    ]
    const plan = planGearMove(items, byId, '1', { type: 'equip', slot: 'carapace' })
    expect(plan.ok).toBe(false)
  })

  it('equips into an empty matching slot', () => {
    const items: GearItemState[] = [
      { id: '1', catalogItemId: 'cat-carapace', equippedSlot: null, vaultIndex: 0 },
    ]
    const plan = planGearMove(items, byId, '1', { type: 'equip', slot: 'carapace' })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.updates).toEqual([
      { id: '1', equippedSlot: 'carapace', vaultIndex: null },
    ])
  })

  it('swaps when equipping onto an occupied slot from vault', () => {
    const items: GearItemState[] = [
      { id: 'eq', catalogItemId: 'cat-carapace', equippedSlot: 'carapace', vaultIndex: null },
      { id: 'v', catalogItemId: 'cat-carapace-2', equippedSlot: null, vaultIndex: 3 },
    ]
    const plan = planGearMove(items, byId, 'v', { type: 'equip', slot: 'carapace' })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    const next = applyMoveUpdates(items, plan.updates)
    expect(next.find((i) => i.id === 'v')?.equippedSlot).toBe('carapace')
    expect(next.find((i) => i.id === 'eq')?.vaultIndex).toBe(3)
  })

  it('rearranges vault cells by swap', () => {
    const items: GearItemState[] = [
      { id: 'a', catalogItemId: 'cat-carapace', equippedSlot: null, vaultIndex: 0 },
      { id: 'b', catalogItemId: 'cat-claws', equippedSlot: null, vaultIndex: 1 },
    ]
    const plan = planGearMove(items, byId, 'a', { type: 'vault', index: 1 })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    const next = applyMoveUpdates(items, plan.updates)
    expect(next.find((i) => i.id === 'a')?.vaultIndex).toBe(1)
    expect(next.find((i) => i.id === 'b')?.vaultIndex).toBe(0)
  })
})
