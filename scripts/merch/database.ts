/** Seed/retry are deliberately dev-only during the private pilot. */
export function requireMerchDevDatabase(env: Record<string, string | undefined>): string {
  const url = env.DATABASE_URL
  const configuredDevHost = env.DEV_DATABASE_URL ? new URL(env.DEV_DATABASE_URL).hostname.replace('-pooler.', '.') : undefined
  const endpoint = env.NEON_DEV_ENDPOINT_ID?.trim() || configuredDevHost?.split('.')[0]
  if (!url || !endpoint || !/^ep-[a-z0-9-]+$/.test(endpoint)) {
    throw new Error('Set DATABASE_URL and DEV_DATABASE_URL (or NEON_DEV_ENDPOINT_ID) after verifying the dev endpoint in Neon.')
  }
  const hostname = new URL(url).hostname.replace('-pooler.', '.')
  if (hostname.split('.')[0] !== endpoint || !hostname.endsWith('.neon.tech') || (configuredDevHost && hostname !== configuredDevHost)) {
    throw new Error('DATABASE_URL does not match the verified Neon dev endpoint.')
  }
  if (env.PROD_DATABASE_URL && hostname === new URL(env.PROD_DATABASE_URL).hostname.replace('-pooler.', '.')) {
    throw new Error('Refusing to write to the production database.')
  }
  return url
}
