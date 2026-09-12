/**
 * Public Better Auth helpers (safe to import from client + server).
 * Server-only secrets stay in auth-server.ts.
 */

export const DEFAULT_AUTH_URL = 'http://localhost:3000'
export const DEV_AUTH_SECRET = 'dev-only-better-auth-secret-min-32-chars!!'

function readProcessEnv(key: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined
  const value = process.env[key]
  return value && value.length > 0 ? value : undefined
}

function readViteEnv(key: string): string | undefined {
  if (typeof import.meta === 'undefined' || !(import.meta as { env?: Record<string, unknown> }).env) {
    return undefined
  }
  const value = (import.meta as { env: Record<string, unknown> }).env[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function getAuthBaseUrl(): string {
  const explicit =
    readProcessEnv('BETTER_AUTH_URL') ||
    readViteEnv('BETTER_AUTH_URL') ||
    readViteEnv('VITE_BETTER_AUTH_URL')
  if (explicit) return explicit.replace(/\/$/, '')

  const vercelHost = readProcessEnv('VERCEL_URL')
  if (vercelHost) {
    return vercelHost.startsWith('http') ? vercelHost.replace(/\/$/, '') : `https://${vercelHost}`
  }

  return DEFAULT_AUTH_URL
}

export function getAuthJwksUrl(): string {
  return `${getAuthBaseUrl()}/api/auth/jwks`
}

/**
 * Explicit public display flag. Vite inlines `VITE_*` into both SSR and the
 * browser, so this must never read unprefixed `GOOGLE_*` secrets.
 */
export function isExplicitPublicFlag(value?: string): boolean | null {
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return null
}

/**
 * Build-time value for `VITE_GOOGLE_AUTH_ENABLED`.
 * An explicit Vite flag wins. Otherwise both server secrets mean "show Google".
 */
export function resolveViteGoogleAuthEnabled(env: {
  VITE_GOOGLE_AUTH_ENABLED?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}): 'true' | 'false' {
  const explicit = isExplicitPublicFlag(env.VITE_GOOGLE_AUTH_ENABLED)
  if (explicit !== null) return explicit ? 'true' : 'false'
  return env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? 'true' : 'false'
}

/**
 * Client-safe Google button gate. Only `VITE_GOOGLE_AUTH_ENABLED=true|1`.
 * A raw `VITE_GOOGLE_CLIENT_ID` is not an enable flag.
 */
export function isGoogleAuthEnabled(): boolean {
  const flag = readViteEnv('VITE_GOOGLE_AUTH_ENABLED') || readProcessEnv('VITE_GOOGLE_AUTH_ENABLED')
  return isExplicitPublicFlag(flag) === true
}

export function getGoogleClientCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = readProcessEnv('GOOGLE_CLIENT_ID') || readProcessEnv('VITE_GOOGLE_CLIENT_ID')
  const clientSecret = readProcessEnv('GOOGLE_CLIENT_SECRET')
  if (clientId && clientSecret) return { clientId, clientSecret }
  return null
}
