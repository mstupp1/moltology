/**
 * Client-safe email verification helpers: pending-signup stash, error detection, copy.
 */

export const EMAIL_VERIFICATION_COPY = {
  title: 'Confirm your email',
  body: (email: string) =>
    `We sent a confirmation link to ${email}. Open it to finish joining.`,
  resend: 'Resend confirmation',
  resendSuccess: 'Confirmation sent.',
  loginBlocked:
    'Confirm your email before signing in. Check your inbox, or resend the confirmation.',
  settingsUnverified: 'Email not confirmed yet.',
  settingsVerified: 'Confirmed',
} as const

const PENDING_SIGNUP_KEY = 'moltology.pendingSignup'

export type PendingSignup = {
  handle: string
  emailOptIn: boolean
  email: string
  callbackURL: string
}

export function isEmailNotVerifiedError(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false
  const code = (error.code || '').toUpperCase()
  const message = (error.message || '').toLowerCase()
  return (
    code === 'EMAIL_NOT_VERIFIED' ||
    message.includes('email not verified') ||
    message.includes('verify your email') ||
    (message.includes('not verified') && message.includes('email'))
  )
}

export function stashPendingSignup(data: PendingSignup): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(data))
}

export function peekPendingSignup(): PendingSignup | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingSignup
    if (!parsed?.email || !parsed?.handle) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPendingSignup(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(PENDING_SIGNUP_KEY)
}

export function takePendingSignup(): PendingSignup | null {
  const pending = peekPendingSignup()
  clearPendingSignup()
  return pending
}

/** True when signup succeeded but Better Auth withheld a session (verify-first). */
export function isVerifyFirstSignupResult(result: {
  data?: { token?: string | null; user?: unknown } | null
  error?: unknown
} | null | undefined): boolean {
  if (!result || result.error) return false
  const data = result.data as { token?: string | null } | null | undefined
  if (data && 'token' in data) return data.token == null
  return true
}
