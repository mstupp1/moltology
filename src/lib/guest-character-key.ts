/**
 * Storage keys for a character a guest made (see `guest-character.ts`). Kept in a tiny module so
 * the root layout can check for an unclaimed character without loading the character code.
 */

/** The guest's look. Shared with the onboarding character step. */
export const GUEST_CHARACTER_CONFIG_KEY = 'moltology:avatar_config:guest'
/** Where the guest placed their starter gear in Customize. */
export const GUEST_CHARACTER_GEAR_KEY = 'moltology:guest-character-gear:v1'

/** Fired after a guest character is saved to the new account, so an open Customize page reloads. */
export const GUEST_CHARACTER_CLAIMED_EVENT = 'moltology:guest-character-claimed'

export function hasStoredGuestCharacter(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      (window.localStorage.getItem(GUEST_CHARACTER_CONFIG_KEY) !== null ||
        window.localStorage.getItem(GUEST_CHARACTER_GEAR_KEY) !== null)
    )
  } catch {
    return false
  }
}
