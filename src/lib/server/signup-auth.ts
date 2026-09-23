import { APIError, createAuthMiddleware, createEmailVerificationToken } from 'better-auth/api'
import { deleteSessionCookie } from 'better-auth/cookies'
import { isEmailVerificationEnabled } from '../auth-config'
import { EMAIL_VERIFICATION_COPY } from '../auth-email-verification'
import {
  SIGNUP_BLOCKED_MESSAGE,
  readSignupHeaders,
  screenSignup,
  shouldScreenSignup,
  type SignupDecision,
} from '../quality/signup-screen'
import { sendEmailVerificationEmail } from './mail'
import {
  clearSignupDecision,
  peekSignupDecision,
  readSignupTelemetry,
  rememberSignupDecision,
} from './signup-request-state'
import { hasUnresolvedSignupChallenge, recordSignupRiskEvent } from './signup-risk-events'

type SignupUser = { email?: string | null; name?: string | null; id?: string; emailVerified?: boolean }
type SignupSource = { action?: string; method?: string; oauth?: { providerId?: string } }

interface SignupHookContext {
  path?: string
  body?: { callbackURL?: unknown }
  request?: Request
  context: {
    secret: string
    baseURL: string
    returned?: unknown
    newSession: { session: { token: string }; user: SignupUser } | null
    internalAdapter: { deleteSession: (token: string) => Promise<void> }
  }
}

function providerFor(source: SignupSource): 'email' | 'google' {
  return source.method === 'oauth' ? 'google' : 'email'
}

function readReturnedUser(returned: unknown): SignupUser | null {
  if (!returned || typeof returned !== 'object' || !('user' in returned)) return null
  const user = (returned as { user?: SignupUser }).user
  return user ?? null
}

function readCallbackPath(body: { callbackURL?: unknown } | undefined): string {
  const callbackURL = body?.callbackURL
  if (typeof callbackURL !== 'string' || !callbackURL.startsWith('/')) return '/'
  return callbackURL
}

export async function validateSignupUser(args: {
  user: SignupUser
  source: SignupSource
  request?: Request
}): Promise<{ error: string; errorDescription: string } | void> {
  try {
    if (!shouldScreenSignup(args.source)) return
    const provider = providerFor(args.source)
    const headers = readSignupHeaders(args.request)
    const telemetry = provider === 'email' ? readSignupTelemetry() : null
    const decision = await screenSignup({
      provider,
      email: args.user.email || '',
      displayName: args.user.name || '',
      country: headers.country,
      acceptLanguage: headers.acceptLanguage,
      userAgent: headers.userAgent,
      elapsedMs: telemetry?.elapsedMs ?? null,
    })
    const email = args.user.email || ''
    if (decision.action === 'block') {
      await recordSignupRiskEvent({ ...decision, userId: null })
      clearSignupDecision(email)
      return { error: 'signup_blocked', errorDescription: SIGNUP_BLOCKED_MESSAGE }
    }
    rememberSignupDecision(email, decision)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.warn(`[signup-screen] Gate failed open: ${message}`)
  }
}

export async function persistAdmittedSignup(user: { id: string; email?: string | null }): Promise<void> {
  const email = user.email || ''
  const decision = peekSignupDecision(email)
  if (!decision || decision.action === 'block') return
  await recordSignupRiskEvent({ ...decision, userId: user.id })
}

async function sendChallengeEmail(ctx: SignupHookContext, email: string): Promise<void> {
  try {
    const token = await createEmailVerificationToken(ctx.context.secret, email, undefined, 3600)
    const callbackURL = encodeURIComponent(readCallbackPath(ctx.body))
    const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`
    await sendEmailVerificationEmail({ to: email, url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.warn(`[signup-screen] Could not send confirmation email: ${message}`)
  }
}

async function dropFreshSession(ctx: SignupHookContext): Promise<void> {
  const token = ctx.context.newSession?.session?.token
  if (token) {
    try {
      await ctx.context.internalAdapter.deleteSession(token)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      console.warn(`[signup-screen] Could not delete withheld session: ${message}`)
    }
  }
  deleteSessionCookie(ctx as never)
}

function withheldSignupBody(ctx: SignupHookContext): { token: null; user: SignupUser } | null {
  const user = readReturnedUser(ctx.context.returned) ?? ctx.context.newSession?.user ?? null
  if (!user) return null
  return { token: null, user }
}

async function withholdChallengedSignup(ctx: SignupHookContext, decision: SignupDecision) {
  if (decision.action !== 'require_email_verification' || isEmailVerificationEnabled()) return
  const email = readReturnedUser(ctx.context.returned)?.email || ctx.context.newSession?.user?.email
  if (email) await sendChallengeEmail(ctx, email)
  await dropFreshSession(ctx)
  return withheldSignupBody(ctx) ?? undefined
}

async function rejectChallengedSignIn(ctx: SignupHookContext): Promise<void> {
  if (isEmailVerificationEnabled()) return
  const user = ctx.context.newSession?.user
  if (!user?.id || user.emailVerified) return
  const challenged = await hasUnresolvedSignupChallenge(user.id)
  if (!challenged) return
  await dropFreshSession(ctx)
  throw new APIError('FORBIDDEN', {
    code: 'EMAIL_NOT_VERIFIED',
    message: EMAIL_VERIFICATION_COPY.loginBlocked,
  })
}

export const signupAuthAfterHook = createAuthMiddleware(async (ctx) => {
  const hookCtx = ctx as SignupHookContext
  const email =
    readReturnedUser(hookCtx.context.returned)?.email ||
    hookCtx.context.newSession?.user?.email ||
    ''
  try {
    const path = hookCtx.path || ''
    if (path.endsWith('/sign-up/email')) {
      const decision = email ? peekSignupDecision(email) : null
      if (decision) {
        const withheld = await withholdChallengedSignup(hookCtx, decision)
        if (withheld) return withheld
      }
    }
    if (path.endsWith('/sign-in/email')) {
      await rejectChallengedSignIn(hookCtx)
    }
  } finally {
    if (email) clearSignupDecision(email)
  }
})
