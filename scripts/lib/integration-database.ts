function databaseTarget(value: string, requirePostgres = true): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Integration database URLs must be valid PostgreSQL URLs.')
  }
  if (requirePostgres && !['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Integration database URLs must use PostgreSQL.')
  }
  // A Neon endpoint identifies the branch. Production configuration may use
  // its HTTPS Neon Auth URL rather than a PostgreSQL connection string.
  return url.hostname.toLowerCase().replace('-pooler.', '.').replace('.neonauth.', '.')
}

export function resolveIntegrationDatabaseUrl(env: Record<string, string | undefined>): string {
  const dev = env.DEV_DATABASE_URL?.trim()
  if (!dev || dev.includes('ep-dummy')) {
    throw new Error('Set DEV_DATABASE_URL to an explicit Neon development database before running integration tests.')
  }
  const target = databaseTarget(dev)
  if (env.PROD_DATABASE_URL?.trim() && target === databaseTarget(env.PROD_DATABASE_URL.trim(), false)) {
    throw new Error('Integration tests cannot use PROD_DATABASE_URL as their development target.')
  }
  return dev
}
