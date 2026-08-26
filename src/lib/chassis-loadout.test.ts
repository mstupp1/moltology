import { describe, it, expect } from 'vitest'
import {
  applyMoveUpdates,
  chassisTypeImageUrl,
  computeLoadoutTotals,
  clearChassisLoadoutCache,
  deriveSynapticAbilities,
  emptyTotals,
  findFirstFreeVaultIndex,
  formatAffixLine,
  getCachedChassisLoadout,
  planGearMove,
  planStarterGrants,
  primaryStatLine,
  setCachedChassisLoadout,
  VISUAL_TYPE_SLOT,
  type CatalogRef,
  type GearItemState,
} from './chassis-loadout'

function ref(partial: Partial<CatalogRef> & Pick<CatalogRef, 'id' | 'category'>): CatalogRef {
  const category = partial.category
  const visualType =
    partial.visualType ??
    (category === 'head'
      ? 'helm'
      : category === 'claws'
        ? 'pincer'
        : category === 'legs'
          ? 'greaves'
          : category === 'antennae'
            ? 'antennae'
            : 'carapace')
  return {
    slug: partial.id,
    name: partial.id,
    flavorText: 'Hard.',
    rarity: 'common',
    primaryStat: 10,
    affixes: [],
    uniquePower: null,
    sortOrder: 1,
    ...partial,
    category,
    visualType,
  }
}

const catalog: CatalogRef[] = [
  ref({ id: 'cat-carapace', slug: 'shell', name: 'Shell', category: 'carapace', primaryStat: 10 }),
  ref({
    id: 'cat-claws',
    slug: 'claws',
    name: 'Claws',
    category: 'claws',
    rarity: 'rare',
    primaryStat: 25,
    sortOrder: 2,
  }),
  ref({
    id: 'cat-carapace-2',
    slug: 'shell-2',
    name: 'Shell II',
    category: 'carapace',
    rarity: 'epic',
    primaryStat: 40,
    affixes: [{ stat: 'perception', value: 6 }],
    sortOrder: 3,
  }),
  ref({
    id: 'cat-legendary',
    slug: 'legend',
    name: 'Legend Plate',
    category: 'carapace',
    rarity: 'legendary',
    primaryStat: 90,
    uniquePower: {
      name: 'Pressure Calcifies',
      description: 'Depth hardens this plate.',
    },
    sortOrder: 4,
  }),
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

  it('adds affix stats from equipped gear onto loadout totals', () => {
    const items: GearItemState[] = [
      { id: '1', catalogItemId: 'cat-carapace-2', equippedSlot: 'carapace', vaultIndex: null },
    ]
    expect(computeLoadoutTotals(items, byId)).toEqual({
      defense: 40,
      attack: 0,
      intelligence: 0,
      speed: 0,
      perception: 6,
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

  it('caches loadout per user for session remounts', () => {
    clearChassisLoadoutCache()
    const payload = {
      catalog,
      items: [],
      totals: emptyTotals(),
      vaultSize: 20,
    }
    setCachedChassisLoadout('user-a', payload)
    expect(getCachedChassisLoadout('user-a')).toEqual(payload)
    expect(getCachedChassisLoadout('user-b')).toBeNull()
    clearChassisLoadoutCache()
    expect(getCachedChassisLoadout('user-a')).toBeNull()
  })

  it('formats primary and affix lines for tooltips', () => {
    expect(primaryStatLine(catalog[0])).toBe('+10 Defense')
    expect(formatAffixLine({ stat: 'speed', value: 5 })).toBe('+5 Speed')
  })

  it('maps visual types onto type-level 9:16 image paths', () => {
    expect(chassisTypeImageUrl('helm')).toBe('/images/chassis/helm.svg')
    expect(chassisTypeImageUrl('hammer')).toBe('/images/chassis/hammer.svg')
    expect(VISUAL_TYPE_SLOT.hammer).toBe('claws')
    expect(VISUAL_TYPE_SLOT.pincer).toBe('claws')
  })

  it('lights synaptic abilities for equipped legendaries and locks vaulted ones', () => {
    const items: GearItemState[] = [
      { id: 'eq', catalogItemId: 'cat-legendary', equippedSlot: 'carapace', vaultIndex: null },
      { id: 'v', catalogItemId: 'cat-carapace', equippedSlot: null, vaultIndex: 0 },
    ]
    const abilities = deriveSynapticAbilities(items, byId)
    expect(abilities).toHaveLength(1)
    expect(abilities[0].name).toBe('Pressure Calcifies')
    expect(abilities[0].status).toBe('Ready')
    expect(abilities[0].locked).toBe(false)

    const vaulted: GearItemState[] = [
      { id: 'eq', catalogItemId: 'cat-legendary', equippedSlot: null, vaultIndex: 1 },
    ]
    const locked = deriveSynapticAbilities(vaulted, byId)
    expect(locked[0].status).toBe('Locked')
    expect(locked[0].locked).toBe(true)
  })

  it('grants missing starter catalog rows into free vault cells', () => {
    const existing: GearItemState[] = [
      { id: 'owned', catalogItemId: 'starter-a', equippedSlot: null, vaultIndex: 0 },
    ]
    const grants = planStarterGrants(
      existing,
      ['starter-a', 'starter-b', 'starter-c'],
      ['starter-a', 'starter-b', 'starter-c'],
      4
    )
    expect(grants).toEqual([
      { catalogItemId: 'starter-b', vaultIndex: 1 },
      { catalogItemId: 'starter-c', vaultIndex: 2 },
    ])
  })
})
