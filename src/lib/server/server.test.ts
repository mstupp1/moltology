import { describe, it, expect } from 'vitest'
import { ServerError, formatServerError } from './error'
import { extractAuthToken } from './middleware'
import { getDb } from '../../db'
import { publicMiddleware, authenticatedMiddleware } from './functions'
import {
  getPublicChangelogsHandler,
  getChangelogBySlugHandler,
  getS3AssetUrlHandler,
  toggleDailyAlignmentTaskHandler,
} from './api'
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

  it('should extract JWT from Bearer authorization header', () => {
    const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxIn0.sig'
    const req = new Request('https://example.com', {
      headers: { authorization: `Bearer ${jwt}` },
    })
    expect(extractAuthToken(req)).toBe(jwt)
  })

  it('should extract JWT from x-auth-token header', () => {
    const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIyIn0.sig'
    const req = new Request('https://example.com', {
      headers: { 'x-auth-token': jwt },
    })
    expect(extractAuthToken(req)).toBe(jwt)
  })

  it('should ignore opaque Better Auth session cookies', () => {
    const req = new Request('https://example.com', {
      headers: {
        cookie: 'better-auth.session_token=opaque-session-id; Path=/; HttpOnly',
      },
    })
    expect(extractAuthToken(req)).toBeNull()
  })

  it('should ignore Bearer values that are not JWTs', () => {
    const req = new Request('https://example.com', {
      headers: { authorization: 'Bearer opaque-session-id' },
    })
    expect(extractAuthToken(req)).toBeNull()
  })
})

describe('Database Client Factory (getDb)', () => {
  it('should return default db instance when no token is provided', () => {
    const client = getDb()
    expect(client).toBeDefined()
  })

  it('should ignore authToken and still return the owner db client', () => {
    const client = getDb('sample-jwt-token')
    expect(client).toBe(getDb())
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
    // Empty when DATABASE_URL is unavailable in the test environment
    if (changelogs.length > 0) {
      expect(changelogs[0]).toHaveProperty('version')
      expect(changelogs[0]).toHaveProperty('slug')
    }
  })

  it('should execute getChangelogBySlugHandler and return single entry', async () => {
    const changelogs: ChangelogEntry[] = await getPublicChangelogsHandler({ data: undefined, context: {} })
    if (changelogs.length > 0 && changelogs[0].slug) {
      const entry = await getChangelogBySlugHandler({ data: changelogs[0].slug, context: {} })
      expect(entry).toBeDefined()
      expect(entry?.slug).toBe(changelogs[0].slug)
    }
  })

  it('should execute getS3AssetUrlHandler when credentials exist', async () => {
    if (!process.env.AWS_ENDPOINT_URL_S3 || !process.env.AWS_ACCESS_KEY_ID) {
      expect(true).toBe(true)
      return
    }
    const result = await getS3AssetUrlHandler({ data: { key: 'images/order_emblem.png' }, context: {} })
    expect(result).toHaveProperty('url')
    expect(result.url).toContain('images/order_emblem.png')
  })

  it('should throw when toggleDailyAlignmentTaskHandler is called unauthenticated', async () => {
    await expect(
      toggleDailyAlignmentTaskHandler({
        data: {
          taskKey: 'silent-synchronization',
          completed: true,
          date: '2026-08-25',
        },
        context: {},
      })
    ).rejects.toThrow('Unauthenticated')
  })
})
