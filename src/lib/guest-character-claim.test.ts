import { beforeEach, describe, expect, it, vi } from 'vitest'
import { claimGuestCharacter } from './guest-character-claim'
import { guestStarterItems, saveGuestCharacter } from './guest-character'
import { hasStoredGuestCharacter } from './guest-character-key'
import { getChassisLoadoutFn, saveCharacterFn } from './server/api'
import type { ChassisLoadoutPayload } from './chassis-loadout'

vi.mock('./jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c') }))
vi.mock('./server/api', () => ({ getChassisLoadoutFn: vi.fn(), saveCharacterFn: vi.fn() }))

const memberItems = guestStarterItems().map((i, n) => ({
  ...i,
  id: `b1000000-0000-4000-8000-${String(n + 1).padStart(12, '0')}`,
}))
const member = (config: ChassisLoadoutPayload['config']): ChassisLoadoutPayload => ({
  catalog: [],
  items: memberItems,
  totals: {} as ChassisLoadoutPayload['totals'],
  vaultSize: 20,
  config,
  appearanceRevision: 1,
})

describe('claimGuestCharacter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('saves the guest look and layout to an account with no character yet', async () => {
    const guest = guestStarterItems()
    // The guest swapped two vault pieces.
    const [a, b] = guest.filter((i) => i.vaultIndex !== null)
    ;[a.vaultIndex, b.vaultIndex] = [b.vaultIndex, a.vaultIndex]
    saveGuestCharacter({ style: 'critters', seed: 'mine', race: 'crab' }, guest)
    vi.mocked(getChassisLoadoutFn).mockResolvedValue(member(null))
    vi.mocked(saveCharacterFn).mockResolvedValue(member({ style: 'critters', seed: 'mine' }))

    await expect(claimGuestCharacter('user-1')).resolves.toBe('saved')
    const sent = vi.mocked(saveCharacterFn).mock.calls[0][0].data
    expect(sent.config.seed).toBe('mine')
    expect(sent.expectedRevision).toBe(1)
    expect(sent.placements.every((p) => p.id.startsWith('b1'))).toBe(true)
    expect(sent.placements.find((p) => p.id === memberItems[guest.indexOf(a)].id)?.vaultIndex).toBe(
      a.vaultIndex,
    )
    expect(sent.grants).toBeUndefined()
    expect(hasStoredGuestCharacter()).toBe(false)
  })

  it('drops the guest character when the account already has one', async () => {
    saveGuestCharacter({ style: 'critters', seed: 'mine' }, guestStarterItems())
    vi.mocked(getChassisLoadoutFn).mockResolvedValue(member({ style: 'critters', seed: 'theirs' }))

    await expect(claimGuestCharacter('user-1')).resolves.toBe('kept-existing')
    expect(saveCharacterFn).not.toHaveBeenCalled()
    expect(hasStoredGuestCharacter()).toBe(false)
  })
})
