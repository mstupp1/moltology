import { describe, it, expect } from 'vitest'
import { ServerError, formatServerError } from './error'
import { extractAuthToken } from './middleware'
import { getDb } from '../../db'
import { publicMiddleware, authenticatedMiddleware } from './functions'
import { getPublicChangelogsHandler, getS3AssetUrlHandler, createChangelogHandler } from './api'
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
  it('should define publicMiddleware and authenticatedMiddleware stacks', () => {
    expect(publicMiddleware).toBeDefined()
    expect(authenticatedMiddleware).toBeDefined()
  })

  it('should execute getPublicChangelogsHandler and return entries (DB-authoritative)', async () => {
    const changelogs: ChangelogEntry[] = await getPublicChangelogsHandler({ data: undefined, context: {} })
    expect(Array.isArray(changelogs)).toBe(true)
    expect(changelogs.length).toBeGreaterThan(0)
    expect(changelogs[0]).toHaveProperty('version')
  })

  it('should execute getS3AssetUrlHandler and return a valid presigned URL', async () => {
    const result = await getS3AssetUrlHandler({ data: { key: 'images/order_emblem.png' }, context: {} })
    expect(result).toHaveProperty('url')
    expect(result.url).toContain('https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/order_emblem.png')
  })

  it('should throw an error when createChangelogHandler is called unauthenticated', async () => {
    await expect(
      createChangelogHandler({
        data: { version: 'v9.9.9', title: 'Test', category: 'TEST', summary: 'Test', content: 'Test' },
        context: {},
      })
    ).rejects.toThrow('Unauthenticated')
  })
})



