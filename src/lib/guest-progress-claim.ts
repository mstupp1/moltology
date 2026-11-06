/**
 * Saves a guest's Moltmax audit to the account that just signed in on this browser.
 * Loaded lazily by `GuestProgressClaimer`, only when guest progress is stored.
 */
import { computeMoltmaxResult } from './moltmax-quiz'
import { clearGuestAudit, readGuestProgress } from './guest-progress'
import { GUEST_AUDIT_CLAIMED_EVENT } from './guest-progress-key'
import { getAuthJWTToken } from './jwt'
import { updateUserStatsFn } from './server/api'

export type GuestAuditClaim = 'saved' | 'kept-existing' | 'none'

/**
 * A guest audit the guest asked to save replaces any earlier one. One they only finished is saved
 * when the account has no audit yet, so signing in to an older account never overwrites its result.
 * On a failed request the stored audit stays for the next try.
 */
export async function claimGuestAudit(): Promise<GuestAuditClaim> {
  const { audit } = readGuestProgress()
  if (!audit) return 'none'
  const token = await getAuthJWTToken().catch(() => null)
  if (!token) return 'none'
  const result = computeMoltmaxResult(audit.answers)
  const updated = await updateUserStatsFn({
    data: {
      moltmaxScore: result.score,
      moltmaxDimensionScores: result.dimensionScores,
      onlyIfNoAudit: !audit.saveRequested,
      token,
    },
  })
  clearGuestAudit()
  if (!updated) return 'kept-existing'
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(GUEST_AUDIT_CLAIMED_EVENT))
  return 'saved'
}
