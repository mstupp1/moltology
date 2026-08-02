import { describe, it, expect } from 'vitest'
import { ServerError, formatServerError } from './error'
import { extractAuthToken } from './middleware'
import { getDb } from '../../db'
import { publicServerFn, authenticatedServerFn } from './functions'
import { executeServerFn } from './execute'
import { getPublicChangelogsFn } from './api'
import type { ChangelogEntry } from '../changelogs-data'

describe('Server Error & Formatting', () => {
  it('should instantiate ServerError with custom status and code', () => {
    const err = new ServerError('Forbidden resource', 'FORBIDDEN', 403, { id: 123 })
    expect(err.message).toBe('Forbidden resource')
    expect(err.code).toBe('FORBIDDEN')
    expect(err.status).toBe(403)
    expect(err.details).toEqual({ id: 123 })
  })

  it('should format ServerError instances into structured response payload', () => {
    const err = new ServerError('Invalid token', 'UNAUTHORIZED', 401)
    const formatted = formatServerError(err)
    expect(formatted).toEqual({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
        status: 401,
        details: undefined,
      },
    })
  })

  it('should format generic Error instances cleanly', () => {
    const err = new Error('Database connection failed')
    const formatted = formatServerError(err)
    expect(formatted).toEqual({
      success: false,
      error: {
        message: 'Database connection failed',
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    })
  })

  it('should handle unknown error types', () => {
    const formatted = formatServerError('String error')
    expect(formatted).toEqual({
      success: false,
      error: {
        message: 'String error',
        code: 'UNKNOWN_ERROR',
        status: 500,
      },
    })
  })
})

describe('Auth Token Extraction', () => {
  it('should return null when request or headers are missing', () => {
    expect(extractAuthToken(null)).toBeNull()
    expect(extractAuthToken({} as Request)).toBeNull()
  })

  it('should extract token from Bearer authorization header', () => {
    const req = new Request('https://example.com', {
      headers: { authorization: 'Bearer test-jwt-token-123' },
    })
    expect(extractAuthToken(req)).toBe('test-jwt-token-123')
  })

  it('should extract token from x-auth-token header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-auth-token': 'custom-jwt-token-456' },
    })
    expect(extractAuthToken(req)).toBe('custom-jwt-token-456')
  })
})

describe('Database Client Factory (getDb)', () => {
  it('should return default db instance when no token is provided', () => {
    const client = getDb()
    expect(client).toBeDefined()
  })

  it('should create an RLS-scoped db instance when token is provided', () => {
    const client = getDb('sample-jwt-token')
    expect(client).toBeDefined()
  })
})

describe('Server Functions', () => {
  it('should define publicServerFn and authenticatedServerFn builders', () => {
    expect(publicServerFn).toBeDefined()
    expect(authenticatedServerFn).toBeDefined()
  })

  it('should execute getPublicChangelogsFn and return entries within context', async () => {
    const changelogs: ChangelogEntry[] = await executeServerFn(getPublicChangelogsFn)
    expect(Array.isArray(changelogs)).toBe(true)
    expect(changelogs.length).toBeGreaterThan(0)
    expect(changelogs[0]).toHaveProperty('version')
  })
})
