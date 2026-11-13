/**
 * Saves a character made as a guest to the account that just signed in on this browser.
 * Loaded lazily by `GuestProgressClaimer`, only when a guest character is stored.
 */
import { clearGuestCharacter, readGuestCharacter, rebaseGuestGear } from './guest-character'
import { GUEST_CHARACTER_CLAIMED_EVENT } from './guest-character-key'
import { getAuthJWTToken } from './jwt'
import { getChassisLoadoutFn, saveCharacterFn } from './server/api'

export type GuestCharacterClaim = 'saved' | 'kept-existing' | 'none'

/**
 * Only an account that has never saved a character takes the guest one. An existing account
 * keeps its own and the guest character is dropped. On a failed request the stored character
 * stays for the next try.
 */
export async function claimGuestCharacter(userId: string): Promise<GuestCharacterClaim> {
  const guest = readGuestCharacter()
  if (!guest.config && !guest.items) {
    clearGuestCharacter()
    return 'none'
  }
  const token = await getAuthJWTToken().catch(() => null)
  if (!token) return 'none'
  const member = await getChassisLoadoutFn({ data: { userId, token } })
  if (member.config || !guest.config) {
    clearGuestCharacter()
    return member.config ? 'kept-existing' : 'none'
  }
  const { equipment: _, accessory: __, claws: ___, ...config } = guest.config
  const gear = guest.items
    ? rebaseGuestGear(member.items, member.catalog, guest.items)
    : {
        placements: member.items.map((i) => ({
          id: i.id,
          equippedSlot: i.equippedSlot,
          vaultIndex: i.vaultIndex,
        })),
        grants: [],
        release: [],
      }
  try {
    await saveCharacterFn({
      data: {
        userId,
        token,
        config,
        expectedRevision: member.appearanceRevision ?? 0,
        placements: gear.placements,
        ...(gear.grants.length || gear.release.length
          ? { grants: gear.grants, release: gear.release }
          : {}),
      },
    })
  } catch (err) {
    // A layout the server refuses still carries the look over, on the member's own gear.
    if (!guest.items) throw err
    const fresh = await getChassisLoadoutFn({ data: { userId, token } })
    if (fresh.config) {
      clearGuestCharacter()
      return 'kept-existing'
    }
    await saveCharacterFn({
      data: {
        userId,
        token,
        config,
        expectedRevision: fresh.appearanceRevision ?? 0,
        placements: fresh.items.map((i) => ({
          id: i.id,
          equippedSlot: i.equippedSlot,
          vaultIndex: i.vaultIndex,
        })),
      },
    })
  }
  clearGuestCharacter()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GUEST_CHARACTER_CLAIMED_EVENT))
    window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
  }
  return 'saved'
}
