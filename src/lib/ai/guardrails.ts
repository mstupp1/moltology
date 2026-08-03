/**
 * Guardrails module for AI interaction.
 * Enforces rate limiting, prompt sanitization, safety policies, and input token boundaries.
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Clean up stale rate limit records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface GuardrailResult {
  allowed: boolean
  reason?: string
  sanitizedText?: string
}

/**
  Check rate limit for a given identifier (IP or User ID).
  Default: 30 requests per minute.
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetMs: windowMs }
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetMs: Math.max(0, record.resetAt - now),
    }
  }

  record.count += 1
  return {
    success: true,
    remaining: limit - record.count,
    resetMs: Math.max(0, record.resetAt - now),
  }
}

/**
 * Patterns matching potential prompt injections, system override attempts, or abusive inputs.
 */
const INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /disregard (all )?prior rules/i,
  /you are now in DAN mode/i,
  /bypass (safety|content) filter/i,
  /system prompt override/i,
  /reveal your (system|hidden) (prompt|instructions)/i,
]

/**
 * Key terms that violate core non-negotiable safety policies.
 */
const EXPLICIT_HARM_PATTERNS = [
  /\b(self[- ]harm|suicide|how to make bomb|explosives|illegal weapons)\b/i,
]

/**
 * Validate input text against guardrails.
 */
export function validateInputGuardrails(input: string): GuardrailResult {
  if (!input || typeof input !== 'string') {
    return { allowed: false, reason: 'Invalid input payload' }
  }

  const trimmed = input.trim()
  if (trimmed.length === 0) {
    return { allowed: false, reason: 'Input cannot be empty' }
  }

  if (trimmed.length > 4000) {
    return {
      allowed: false,
      reason: 'Input exceeds maximum allowed length of 4000 characters',
    }
  }

  // Check injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: 'Input contains prohibited system override or prompt injection attempt.',
      }
    }
  }

  // Check explicit harm patterns
  for (const pattern of EXPLICIT_HARM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: 'Input violates safety and positivity policy.',
      }
    }
  }

  // Basic sanitization (trimming and normalizing spaces)
  const sanitizedText = trimmed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

  return {
    allowed: true,
    sanitizedText,
  }
}
