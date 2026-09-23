import { getDb } from '../../db'
import { signupRiskEvents } from '../../db/schema'
import type { SignupDecision } from '../quality/signup-screen'

export async function recordSignupRiskEvent(input: SignupDecision & { userId: string | null }): Promise<void> {
  try {
    const db = getDb()
    await db.insert(signupRiskEvents).values({
      userId: input.userId,
      provider: input.provider,
      action: input.action,
      riskLevel: input.riskLevel,
      botScore: input.botScore,
      country: input.country,
      emailDomain: input.emailDomain,
      reason: input.reason,
      fastSubmission: input.fastSubmission,
    })
  } catch (err) {
    console.warn('[signup-risk] Could not record signup risk event', err)
  }
}

export async function hasUnresolvedSignupChallenge(userId: string): Promise<boolean> {
  try {
    const db = getDb()
    const { and, eq } = await import('drizzle-orm')
    const [row] = await db
      .select({ id: signupRiskEvents.id })
      .from(signupRiskEvents)
      .where(and(eq(signupRiskEvents.userId, userId), eq(signupRiskEvents.action, 'require_email_verification')))
      .limit(1)
    return Boolean(row)
  } catch (err) {
    console.warn('[signup-risk] Could not read signup challenge; sign-in stays open', err)
    return false
  }
}
