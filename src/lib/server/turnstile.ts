
export interface TurnstileVerificationOptions {
  token?: string | null
  ip?: string | null
  idempotencyKey?: string
  expectedAction?: string
  expectedHostnames?: string[]
}

export interface TurnstileVerificationResult {
  success: boolean
  challengeTs?: string
  hostname?: string
  errorCodes?: string[]
  action?: string
  cdata?: string
  errorMessage?: string
}

const CLOUDFLARE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Cloudflare's always-pass test secret. Only for local development and tests. */
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA'

export const TURNSTILE_UNAVAILABLE_MESSAGE =
  'Bot protection is not available right now. Please try again later.'

/**
 * The real secret when one is set. Without one, production gets null so every
 * check fails, and other environments get the always-pass test secret.
 */
export function resolveTurnstileSecret(
  rawEnv: Record<string, string | undefined> = process.env,
): string | null {
  const secret = rawEnv.TURNSTILE_SECRET_KEY?.trim()
  if (secret) return secret
  const isProduction = rawEnv.VERCEL_ENV
    ? rawEnv.VERCEL_ENV === 'production'
    : rawEnv.NODE_ENV === 'production'
  return isProduction ? null : TURNSTILE_TEST_SECRET
}

/**
 * Canonical Server-Side Turnstile Verification
 * Follows Cloudflare Turnstile integration specification:
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstileToken(
  options: TurnstileVerificationOptions
): Promise<TurnstileVerificationResult> {
  const { token, ip, idempotencyKey, expectedAction, expectedHostnames } = options

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      success: false,
      errorCodes: ['missing-input-response'],
      errorMessage: 'Bot verification token missing. Please try again.',
    }
  }

  const trimmedToken = token.trim()

  if (trimmedToken.length > 2048) {
    return {
      success: false,
      errorCodes: ['invalid-token-length'],
      errorMessage: 'Verification token exceeds permitted length.',
    }
  }

  const secretKey = resolveTurnstileSecret()
  if (!secretKey) {
    console.error('[verifyTurnstileToken] TURNSTILE_SECRET_KEY is not set in production.')
    return {
      success: false,
      errorCodes: ['missing-secret'],
      errorMessage: TURNSTILE_UNAVAILABLE_MESSAGE,
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', trimmedToken)
    if (ip) {
      formData.append('remoteip', ip)
    }
    if (idempotencyKey) {
      formData.append('idempotency_key', idempotencyKey)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(CLOUDFLARE_SITEVERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        errorCodes: [`http-status-${response.status}`],
        errorMessage: `Cloudflare verification returned status ${response.status}`,
      }
    }

    const outcome = (await response.json()) as {
      success: boolean
      'error-codes'?: string[]
      challenge_ts?: string
      hostname?: string
      action?: string
      cdata?: string
    }

    if (!outcome.success) {
      return {
        success: false,
        challengeTs: outcome.challenge_ts,
        hostname: outcome.hostname,
        errorCodes: outcome['error-codes'] || [],
        action: outcome.action,
        cdata: outcome.cdata,
        errorMessage: 'Bot protection challenge failed. Please refresh and try again.',
      }
    }

    // Action validation (if expected action is enforced)
    if (expectedAction && outcome.action && outcome.action !== expectedAction) {
      return {
        success: false,
        challengeTs: outcome.challenge_ts,
        hostname: outcome.hostname,
        errorCodes: ['action-mismatch'],
        action: outcome.action,
        errorMessage: 'Verification action mismatch.',
      }
    }

    // Hostname validation (if expected hostnames allowlist is provided)
    if (expectedHostnames && expectedHostnames.length > 0 && outcome.hostname) {
      const allowed = new Set(expectedHostnames.map((h) => h.toLowerCase().trim()))
      if (!allowed.has(outcome.hostname.toLowerCase().trim())) {
        return {
          success: false,
          challengeTs: outcome.challenge_ts,
          hostname: outcome.hostname,
          errorCodes: ['hostname-mismatch'],
          errorMessage: 'Verification hostname mismatch.',
        }
      }
    }

    return {
      success: true,
      challengeTs: outcome.challenge_ts,
      hostname: outcome.hostname,
      errorCodes: outcome['error-codes'],
      action: outcome.action,
      cdata: outcome.cdata,
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return {
        success: false,
        errorCodes: ['verification-timeout'],
        errorMessage: 'Turnstile verification timed out. Please try again.',
      }
    }
    console.error('[verifyTurnstileToken] Network or validation error:', error)
    return {
      success: false,
      errorCodes: ['internal-error'],
      errorMessage: 'Verification service error. Please try again.',
    }
  }
}
