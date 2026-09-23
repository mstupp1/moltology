import { evaluateWithJev, exceedsJevConfidence } from './jev'
import { isFastSignup } from '../signup-telemetry'

/** Signup budget. Forum and Oracle keep the shared 1200ms default. */
export const SIGNUP_JEV_TIMEOUT_MS = 800

/** Email blocks above 0.8. 0.8 itself stays on the allow side. */
export const SIGNUP_BLOCK_CONFIDENCE = 0.8

/** Google blocks only above this, and only when the email block rule also fired. */
export const GOOGLE_BLOCK_CONFIDENCE = 0.9

export const SIGNUP_BLOCKED_MESSAGE = 'Could not create that account. Try a different email.'

export const SIGNUP_RISK_LEVELS = ['clean', 'low_risk', 'suspicious', 'high_risk'] as const

export type SignupRiskLevel = (typeof SIGNUP_RISK_LEVELS)[number]
export type SignupProvider = 'email' | 'google'
export type SignupAction = 'allow' | 'require_email_verification' | 'block'
export type SignupReason = 'honeypot' | 'disposable_domain' | 'jev' | 'fail_open' | 'fast_path'

const TRUSTED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
])

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'sharklasers.com',
  'yopmail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
])

export const SIGNUP_QUESTIONS = {
  is_bot_or_burner: {
    type: 'boolean' as const,
    instructions:
      'Is this registration an automated bot, a disposable burner inbox, or a bulk fake account?',
    criteria: {
      true: 'Scripted signup, disposable or throwaway inbox, randomly generated local-part, or a burst pattern implied by the submitted signals.',
      false: 'A person creating one account, including a new personal address, a work domain, or a Google account with a normal name.',
    },
  },
  risk_level: {
    type: 'score' as const,
    instructions:
      'Rate registration risk from clean to high risk using only the submitted signals. A fast form or a rare domain is not high risk by itself.',
    criteria: [...SIGNUP_RISK_LEVELS],
  },
  action: {
    type: 'choice' as const,
    instructions:
      'Choose the least severe action that still stops obvious fraud. Prefer allow for ordinary personal email. Prefer require_email_verification for uncertainty.',
    criteria: {
      allow: 'Ordinary registration. Let the existing signup policy continue.',
      require_email_verification: 'Uncertain or mildly suspicious. Confirm the inbox before a session.',
      challenge: 'Suspicious enough to withhold a session until the inbox is confirmed.',
      block: 'Clear bot, burner, or fraud. Do not create the account.',
    },
  },
}

export interface SignupAnswers {
  is_bot_or_burner?: { probability?: number }
  risk_level?: { score?: number }
  action?: { choice?: string }
}

export interface SignupScreenInput {
  provider: SignupProvider
  email: string
  displayName: string
  country?: string | null
  acceptLanguage?: string | null
  userAgent?: string | null
  elapsedMs?: number | null
}

export interface SignupDecision {
  provider: SignupProvider
  action: SignupAction
  riskLevel: SignupRiskLevel | null
  botScore: number | null
  reason: SignupReason
  emailDomain: string | null
  country: string | null
  fastSubmission: boolean
}

export type SignupEvaluator = (state: Record<string, string>) => Promise<SignupAnswers | null>

interface DecisionInput {
  provider: SignupProvider
  disposableDomain: boolean
  fastSubmission: boolean
  emailDomain: string | null
  country: string | null
  fastPath: boolean
}

export function splitSignupEmail(email: string): { local: string; domain: string | null } {
  const trimmed = email.trim().toLowerCase()
  const at = trimmed.lastIndexOf('@')
  if (at <= 0 || at === trimmed.length - 1) {
    return { local: trimmed.slice(0, 64), domain: null }
  }
  return {
    local: trimmed.slice(0, at).slice(0, 64),
    domain: trimmed.slice(at + 1).slice(0, 255),
  }
}

export function describeEmailStructure(local: string, domain: string | null): string {
  if (local.includes('+')) return 'plus_alias'
  if ((domain === 'gmail.com' || domain === 'googlemail.com') && local.includes('.')) return 'dotted_gmail'
  if (local.length >= 24) return 'long_local'
  return 'normal'
}

export function isDisposableSignupDomain(domain: string | null): boolean {
  return !!domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

export function isTrustedSignupDomain(domain: string | null): boolean {
  return !!domain && TRUSTED_EMAIL_DOMAINS.has(domain)
}

export function normalizeSignupCountry(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toUpperCase()
  if (!trimmed || !/^[A-Z]{2}$/.test(trimmed)) return null
  return trimmed
}

export function readSignupHeaders(request: Request | undefined): {
  country: string | null
  acceptLanguage: string | null
  userAgent: string | null
} {
  if (!request) return { country: null, acceptLanguage: null, userAgent: null }
  return {
    country: normalizeSignupCountry(request.headers.get('cf-ipcountry')),
    acceptLanguage: clipHeader(request.headers.get('accept-language'), 128),
    userAgent: clipHeader(request.headers.get('user-agent'), 256),
  }
}

export function shouldScreenSignup(source: {
  action?: string
  method?: string
  oauth?: { providerId?: string }
}): boolean {
  if (source.action !== 'create-user') return false
  if (source.method === 'email-password') return true
  return source.method === 'oauth' && source.oauth?.providerId === 'google'
}

function clipHeader(value: string | null, max: number): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function finite(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function riskLevelFromScore(score: number | null): SignupRiskLevel | null {
  if (score == null) return null
  const index = Math.round(score)
  if (index < 0 || index >= SIGNUP_RISK_LEVELS.length) return null
  return SIGNUP_RISK_LEVELS[index]
}

export function decideSignupScreen(answers: SignupAnswers | null, input: DecisionInput): SignupDecision {
  const base = {
    provider: input.provider,
    emailDomain: input.emailDomain,
    country: input.country,
    fastSubmission: input.fastSubmission,
  }

  if (input.fastPath) {
    return { ...base, action: 'allow', riskLevel: 'clean', botScore: null, reason: 'fast_path' }
  }

  if (input.disposableDomain && input.provider === 'email') {
    return {
      ...base,
      action: 'require_email_verification',
      riskLevel: 'suspicious',
      botScore: null,
      reason: 'disposable_domain',
    }
  }

  if (!answers) {
    return { ...base, action: 'allow', riskLevel: null, botScore: null, reason: 'fail_open' }
  }

  const probability = finite(answers.is_bot_or_burner?.probability)
  const botScore = probability == null ? null : Math.round(Math.min(1, Math.max(0, probability)) * 100)
  const rounded = finite(answers.risk_level?.score)
  const scoreIndex = rounded == null ? null : Math.round(rounded)
  const riskLevel = riskLevelFromScore(scoreIndex)
  const choice = answers.action?.choice
  const highConfidence = exceedsJevConfidence(probability ?? undefined, SIGNUP_BLOCK_CONFIDENCE)
  const veryHigh = exceedsJevConfidence(probability ?? undefined, GOOGLE_BLOCK_CONFIDENCE)

  let action: SignupAction = 'allow'
  if (choice === 'require_email_verification' || choice === 'challenge') {
    action = 'require_email_verification'
  }
  if (choice === 'block' && ((scoreIndex != null && scoreIndex >= 3) || highConfidence)) {
    action = 'block'
  } else if (choice === 'block') {
    action = 'require_email_verification'
  }
  if (action === 'allow' && highConfidence && scoreIndex != null && scoreIndex >= 2) {
    action = 'require_email_verification'
  }

  if (input.provider === 'google' && !(action === 'block' && veryHigh)) {
    action = 'allow'
  }

  return { ...base, action, riskLevel, botScore, reason: 'jev' }
}

function buildSignupState(input: SignupScreenInput, local: string, domain: string | null, disposableDomain: boolean, fastSubmission: boolean): Record<string, string> {
  return {
    email_domain: domain || 'unknown',
    email_local_part: local || 'unknown',
    email_structure: describeEmailStructure(local, domain),
    display_name: input.displayName.trim().slice(0, 80) || 'unknown',
    auth_provider: input.provider,
    country: input.country?.trim() || 'unknown',
    accept_language: input.acceptLanguage?.trim() || 'unknown',
    user_agent: input.userAgent?.trim().slice(0, 256) || 'unknown',
    form_duration_ms: input.provider === 'email' && input.elapsedMs != null ? String(Math.round(input.elapsedMs)) : 'unknown',
    fast_submission: fastSubmission ? 'true' : 'false',
    disposable_domain: disposableDomain ? 'true' : 'false',
  }
}

async function defaultSignupEvaluator(state: Record<string, string>): Promise<SignupAnswers | null> {
  const result = await evaluateWithJev({
    state,
    questions: SIGNUP_QUESTIONS,
    timeoutMs: SIGNUP_JEV_TIMEOUT_MS,
  })
  if (!result) return null
  return result.answers as SignupAnswers
}

export async function screenSignup(
  input: SignupScreenInput,
  options?: { evaluate?: SignupEvaluator },
): Promise<SignupDecision> {
  const { local, domain } = splitSignupEmail(input.email)
  const disposableDomain = isDisposableSignupDomain(domain)
  const fastSubmission = input.provider === 'email' && isFastSignup(input.elapsedMs ?? null)
  const fastPath =
    input.provider === 'google' && isTrustedSignupDomain(domain) && input.displayName.trim().length > 0
  const decisionInput: DecisionInput = {
    provider: input.provider,
    disposableDomain,
    fastSubmission,
    emailDomain: domain,
    country: input.country ?? null,
    fastPath,
  }

  if (fastPath || (disposableDomain && input.provider === 'email')) {
    return decideSignupScreen(null, decisionInput)
  }

  try {
    const answers = await (options?.evaluate ?? defaultSignupEvaluator)(
      buildSignupState(input, local, domain, disposableDomain, fastSubmission),
    )
    return decideSignupScreen(answers, decisionInput)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.warn(`[signup-screen] Jev evaluation failed; signup stays open: ${message}`)
    return decideSignupScreen(null, { ...decisionInput, fastPath: false, disposableDomain: false })
  }
}
