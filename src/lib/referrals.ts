export const REFERRAL_XP = 100
export const REFERRAL_MONTHLY_CAP = 5
export const REFERRAL_COOKIE = 'moltology_inviter'
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

export function invitePath(userId: string): string {
  return `/i/${encodeURIComponent(userId)}`
}

/** Use the stable id; the profile route redirects to the current handle. */
export function profileSharePath(userId: string): string {
  return `/member/${encodeURIComponent(userId)}`
}

export function readReferralCookie(cookieHeader?: string | null): string | null {
  const value = cookieHeader?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${REFERRAL_COOKIE}=`))?.slice(REFERRAL_COOKIE.length + 1)
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value)
    return /^[A-Za-z0-9_-]{1,128}$/.test(decoded) ? decoded : null
  } catch {
    return null
  }
}

export type ReferralStatus = 'pending' | 'qualified' | 'rewarded' | 'cap_reached'
export interface ReferralSummary {
  userId: string
  rewardedThisMonth: number
  totalXp: number
  referrals: Array<{ id: string; displayName: string; status: ReferralStatus }>
}
