import { describe, expect, it } from 'vitest'
import { resolveIntegrationDatabaseUrl } from './integration-database'

const dev = 'postgresql://user:password@ep-dev.example/neondb'

describe('integration database target', () => {
  it('requires an explicit dev URL rather than falling back to DATABASE_URL', () => {
    expect(() => resolveIntegrationDatabaseUrl({ DATABASE_URL: dev })).toThrow('Set DEV_DATABASE_URL')
    expect(() => resolveIntegrationDatabaseUrl({ DEV_DATABASE_URL: 'postgresql://ep-dummy/db' })).toThrow('Set DEV_DATABASE_URL')
  })

  it.each(['', '   '])('rejects blank dev target %j', (value) => {
    expect(() => resolveIntegrationDatabaseUrl({ DEV_DATABASE_URL: value })).toThrow('Set DEV_DATABASE_URL')
  })

  it('selects dev even when the ambient database points elsewhere', () => {
    expect(resolveIntegrationDatabaseUrl({ DEV_DATABASE_URL: dev, DATABASE_URL: 'postgresql://prod/db' })).toBe(dev)
  })

  it('rejects production aliases regardless of pooling, credentials or options', () => {
    expect(() => resolveIntegrationDatabaseUrl({
      DEV_DATABASE_URL: dev,
      PROD_DATABASE_URL: 'postgres://other:secret@ep-dev-pooler.example:5432/neondb?sslmode=require',
    })).toThrow('cannot use PROD_DATABASE_URL')
  })

  it('accepts a different production Neon Auth URL', () => {
    expect(resolveIntegrationDatabaseUrl({
      DEV_DATABASE_URL: dev,
      PROD_DATABASE_URL: 'https://ep-prod.neonauth.example/neondb/auth',
    })).toBe(dev)
  })

  it('rejects a production endpoint represented as a Neon Auth URL', () => {
    expect(() => resolveIntegrationDatabaseUrl({
      DEV_DATABASE_URL: dev,
      PROD_DATABASE_URL: 'https://ep-dev.neonauth.example/other/auth',
    })).toThrow('cannot use PROD_DATABASE_URL')
  })

  it('allows distinct dev and production endpoints', () => {
    expect(resolveIntegrationDatabaseUrl({ DEV_DATABASE_URL: dev, PROD_DATABASE_URL: 'postgresql://ep-prod.example/neondb' })).toBe(dev)
  })

  it.each(['not-a-url', 'https://example.com/db'])('rejects invalid target %s without echoing credentials', (value) => {
    expect(() => resolveIntegrationDatabaseUrl({ DEV_DATABASE_URL: value })).toThrow('PostgreSQL')
  })
})
