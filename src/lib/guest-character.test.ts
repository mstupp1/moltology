import { describe, it, expect, beforeEach } from 'vitest'
import {
  clearGuestCharacter,
  guestStarterItems,
  readGuestCharacter,
  rebaseGuestGear,
  saveGuestCharacter,
} from './guest-character'
import { hasStoredGuestCharacter } from './guest-character-key'
import type { CatalogRef, GearItemState } from './chassis-loadout'

const ref = (id: string, kind: 'gear' | 'cosmetic' = 'gear') => ({ id, kind }) as CatalogRef

describe('guest character', () => {
  beforeEach(() => localStorage.clear())

  it('starts guests on the same starter layout a new member gets', () => {
    const items = guestStarterItems()
    expect(items.filter((i) => i.equippedSlot)).toHaveLength(7)
    const vault = items.filter((i) => i.vaultIndex !== null).map((i) => i.vaultIndex)
    expect(vault).toEqual(vault.map((_, i) => i))
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
  })

  it('stores and clears the draft', () => {
    const items = guestStarterItems()
    saveGuestCharacter({ style: 'critters', seed: 'abc', race: 'crab' }, items)
    expect(hasStoredGuestCharacter()).toBe(true)
    const stored = readGuestCharacter()
    expect(stored.config?.seed).toBe('abc')
    expect(stored.items).toEqual(items.map(({ lookSlot: _, ...i }) => i))
    clearGuestCharacter()
    expect(hasStoredGuestCharacter()).toBe(false)
  })

  it('ignores a malformed gear draft', () => {
    localStorage.setItem('moltology:guest-character-gear:v1', JSON.stringify([{ id: 'x' }]))
    expect(readGuestCharacter().items).toBeNull()
  })

  it('moves the guest layout onto the member gear rows', () => {
    const A = 'a1000000-0000-4000-8000-000000000001'
    const B = 'a1000000-0000-4000-8000-000000000004'
    const C = 'a1000000-0000-4000-8000-000000000007'
    const member: GearItemState[] = [
      { id: 'm1', catalogItemId: A, equippedSlot: 'carapace', vaultIndex: null },
      { id: 'm2', catalogItemId: B, equippedSlot: 'claws-1', vaultIndex: null },
      { id: 'm3', catalogItemId: B, equippedSlot: 'claws-2', vaultIndex: null },
    ]
    const guest: GearItemState[] = [
      { id: 'g1', catalogItemId: A, equippedSlot: null, vaultIndex: 0 },
      { id: 'g2', catalogItemId: B, equippedSlot: 'claws-2', vaultIndex: null },
      { id: 'g3', catalogItemId: C, equippedSlot: 'head', vaultIndex: null },
    ]
    const out = rebaseGuestGear(member, [ref(A), ref(B), ref(C)], guest, () => 'new-1')
    expect(out.placements).toEqual([
      { id: 'm1', equippedSlot: null, vaultIndex: 0 },
      { id: 'm2', equippedSlot: 'claws-2', vaultIndex: null },
      { id: 'new-1', equippedSlot: 'head', vaultIndex: null },
    ])
    expect(out.grants).toEqual([{ id: 'new-1', catalogItemId: C }])
    expect(out.release).toEqual(['m3'])
  })
})
