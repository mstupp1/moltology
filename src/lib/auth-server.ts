import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getDb } from '../db'
import {
  authAccount,
  authJwks,
  authSession,
  authUser,
  authVerification,
} from '../db/schema'
import {
  DEFAULT_AUTH_URL,
  DEV_AUTH_SECRET,
  getAuthBaseUrl,
  getGoogleClientCredentials,
} from './auth-config'

function getAuthSecret(): string {
  const secret = typeof process !== 'undefined' ? process.env.BETTER_AUTH_SECRET : undefined
  if (secret && secret.length >= 16) return secret

  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined
  if (nodeEnv === 'production') {
    throw new Error('BETTER_AUTH_SECRET must be set in production (min 16 characters).')
  }
  return DEV_AUTH_SECRET
}

function getTrustedOrigins(baseURL: string): string[] {
  const origins = new Set<string>([
    baseURL,
    DEFAULT_AUTH_URL,
    'http://127.0.0.1:3000',
    'https://moltology.org',
    'https://www.moltology.org',
  ])

  const extra = typeof process !== 'undefined' ? process.env.BETTER_AUTH_TRUSTED_ORIGINS : undefined
  if (extra) {
    for (const origin of extra.split(',')) {
      const trimmed = origin.trim()
      if (trimmed) origins.add(trimmed)
    }
  }

  const vercelHost = typeof process !== 'undefined' ? process.env.VERCEL_URL : undefined
  if (vercelHost) {
    origins.add(vercelHost.startsWith('http') ? vercelHost : `https://${vercelHost}`)
  }

  return [...origins]
}

const google = getGoogleClientCredentials()
const baseURL = getAuthBaseUrl()

/**
 * Google is a trusted IdP. `requireLocalEmailVerified` is false so an existing
 * email/password row (unverified in this app) can auto-link on Google sign-in.
 * Better Auth 1.7 marks that flag deprecated; keep Google trusted and do not
 * allow linking mismatched emails.
 */
export const ACCOUNT_LINKING_OPTIONS = {
  enabled: true,
  trustedProviders: ['google'] as const,
  requireLocalEmailVerified: false,
}

export function getAuthApiErrorUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}/auth`
}

export const auth = betterAuth({
  baseURL,
  secret: getAuthSecret(),
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    camelCase: true,
    transaction: false,
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
      jwks: authJwks,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
  },
  account: {
    accountLinking: {
      enabled: ACCOUNT_LINKING_OPTIONS.enabled,
      trustedProviders: [...ACCOUNT_LINKING_OPTIONS.trustedProviders],
      requireLocalEmailVerified: ACCOUNT_LINKING_OPTIONS.requireLocalEmailVerified,
    },
  },
  onAPIError: {
    errorURL: getAuthApiErrorUrl(baseURL),
  },
  socialProviders: google
    ? {
        google: {
          clientId: google.clientId,
          clientSecret: google.clientSecret,
        },
      }
    : undefined,
  trustedOrigins: getTrustedOrigins(baseURL),
  advanced: {
    useSecureCookies: baseURL.startsWith('https://'),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const { ensureUserProfile } = await import('./user-sync')
          await ensureUserProfile(user.id)
        },
      },
    },
  },
  plugins: [
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
        }),
      },
    }),
    tanstackStartCookies(),
  ],
})

export function isGoogleSocialConfigured(): boolean {
  return Boolean(google)
}

let jwksValidated = false

/**
 * Validates that existing JWKS keys in the database can be decrypted by the
 * currently active auth secret. If a secret was rotated, or if a dev database
 * was reset from a production branch with a different secret, any undecryptable
 * keys are safely pruned so Better Auth can auto-mint fresh keys without throwing
 * 500 "Failed to decrypt private key".
 */
export async function ensureValidJwks(): Promise<void> {
  if (jwksValidated) return

  try {
    const db = getDb()
    const rows = await db.select().from(authJwks)
    if (rows.length === 0) {
      jwksValidated = true
      return
    }

    const { symmetricDecrypt } = await import('better-auth/crypto')
    const { eq } = await import('drizzle-orm')
    const secret = getAuthSecret()

    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.privateKey)
        await symmetricDecrypt({ key: secret, data: parsed })
      } catch {
        console.warn(
          `[Better Auth] JWKS key ${row.id} cannot be decrypted with the active secret. Pruning to allow auto-minting.`,
        )
        await db.delete(authJwks).where(eq(authJwks.id, row.id))
      }
    }

    jwksValidated = true
  } catch (err) {
    console.error('[Better Auth] Error during JWKS validation:', err)
  }
}

