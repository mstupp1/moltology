import {
  normalizeSignupCountry,
  splitSignupEmail,
  type SignupDecision,
} from '../quality/signup-screen'
import {
  SIGNUP_ELAPSED_FIELD,
  SIGNUP_HONEYPOT_FIELD,
  SIGNUP_HONEYPOT_MESSAGE,
  honeypotTripped,
  isFastSignup,
  parseSignupElapsedMs,
  type SignupTelemetry,
} from '../signup-telemetry'
import { recordSignupRiskEvent } from './signup-risk-events'

export type EmailSignupGate =
  | { kind: 'pass'; telemetry: SignupTelemetry | null }
  | { kind: 'reject'; response: Response }

function isEmailSignupPost(request: Request): boolean {
  if (request.method !== 'POST') return false
  try {
    const path = new URL(request.url).pathname.replace(/\/+$/, '').toLowerCase()
    return path.endsWith('/sign-up/email')
  } catch {
    return false
  }
}

async function readSignupBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || ''
  let text = ''
  try {
    text = await request.clone().text()
  } catch {
    return {}
  }
  if (!text) return {}
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(text) as unknown
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(text).entries())
  }
  return {}
}

function honeypotDecision(body: Record<string, unknown>, request: Request): SignupDecision {
  const email = typeof body.email === 'string' ? body.email : ''
  const elapsedMs = parseSignupElapsedMs(body[SIGNUP_ELAPSED_FIELD])
  return {
    provider: 'email',
    action: 'block',
    riskLevel: null,
    botScore: null,
    reason: 'honeypot',
    emailDomain: splitSignupEmail(email).domain,
    country: normalizeSignupCountry(request.headers.get('cf-ipcountry')),
    fastSubmission: isFastSignup(elapsedMs),
  }
}

export async function readEmailSignupGate(
  request: Request,
  deps?: { record?: typeof recordSignupRiskEvent },
): Promise<EmailSignupGate> {
  if (!isEmailSignupPost(request)) return { kind: 'pass', telemetry: null }

  const body = await readSignupBody(request)
  const elapsedMs = parseSignupElapsedMs(body[SIGNUP_ELAPSED_FIELD])
  if (!honeypotTripped(body[SIGNUP_HONEYPOT_FIELD])) {
    return { kind: 'pass', telemetry: { elapsedMs, fast: isFastSignup(elapsedMs) } }
  }

  const record = deps?.record ?? recordSignupRiskEvent
  await record({ ...honeypotDecision(body, request), userId: null })
  return {
    kind: 'reject',
    response: new Response(JSON.stringify({ message: SIGNUP_HONEYPOT_MESSAGE }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    }),
  }
}
