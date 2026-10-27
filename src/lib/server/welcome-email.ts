import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { profiles } from '../../db/schema'
import { sendWelcomeEmail } from './mail'

interface WelcomeUser {
  id: string
  email: string
  emailVerified: boolean
}

interface SignupContext {
  path?: string
  params?: { id?: unknown }
  body?: { provider?: unknown }
}

/** Only called by the new-user hook, never by ordinary sign-in or linking hooks. */
export function isVerifiedGoogleSignup(user: WelcomeUser, context?: SignupContext | null): boolean {
  if (!user.emailVerified) return false
  return (context?.path === '/callback/:id' && context.params?.id === 'google')
    || (context?.path === '/sign-in/social' && context.body?.provider === 'google')
}

/** Best effort: do not let a lookup, render, or delivery failure break authentication. */
export async function sendWelcomeForVerifiedUser(user: WelcomeUser): Promise<void> {
  if (!user.id || !user.email || !user.emailVerified) return
  try {
    const [profile] = await getDb().select({ isSimulated: profiles.isSimulated })
      .from(profiles).where(eq(profiles.id, user.id)).limit(1)
    // Do not email simulated users or guess when a profile could not be established.
    if (!profile || profile.isSimulated) return
    const result = await sendWelcomeEmail({ userId: user.id, to: user.email })
    if (!result.sent) console.warn('[welcome-email] Welcome email was not sent.', { reason: result.error })
  } catch {
    console.warn('[welcome-email] Could not send welcome email; authentication continues.')
  }
}
