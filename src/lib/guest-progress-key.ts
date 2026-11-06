/**
 * Storage key for guest progress (see `guest-progress.ts`). Kept in its own tiny module so the
 * root layout can check for unclaimed progress without loading the quiz or alignment code.
 */
export const GUEST_PROGRESS_STORAGE_KEY = 'moltology:guest-progress:v1'

/** Fired after a guest audit is saved to the new account, so an open results view can show it as saved. */
export const GUEST_AUDIT_CLAIMED_EVENT = 'moltology:guest-audit-claimed'

export function hasStoredGuestProgress(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY) !== null
  } catch {
    return false
  }
}
