/**
 * Client-safe signup signals. A filled honeypot rejects before any model call.
 * A fast form is a signal, not a reject by itself.
 */

export const SIGNUP_HONEYPOT_FIELD = 'confirm_website'
export const SIGNUP_ELAPSED_FIELD = 'signupElapsedMs'

/** Submissions faster than this are marked fast. 1500ms itself is not fast. */
export const SIGNUP_FAST_MS = 1_500

export const SIGNUP_HONEYPOT_MESSAGE = 'Could not create that account.'

export interface SignupTelemetry {
  elapsedMs: number | null
  fast: boolean
}

export function honeypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function parseSignupElapsedMs(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return null
}

export function isFastSignup(elapsedMs: number | null): boolean {
  return elapsedMs != null && elapsedMs < SIGNUP_FAST_MS
}

export function signupClientFields(input: { honeypot: string; elapsedMs: number | null }): {
  confirm_website: string
  signupElapsedMs?: number
} {
  if (input.elapsedMs == null) {
    return { [SIGNUP_HONEYPOT_FIELD]: input.honeypot }
  }
  return {
    [SIGNUP_HONEYPOT_FIELD]: input.honeypot,
    [SIGNUP_ELAPSED_FIELD]: input.elapsedMs,
  }
}
