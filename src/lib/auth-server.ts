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
