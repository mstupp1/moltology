import { describe, it, expect, beforeEach } from 'vitest'
import { resetRateLimits } from './ai/guardrails'
import {
  assertForumWriteRateLimit,
  COMMUNITY_RULES,
  FORUM_WRITE_RATE_ERROR,
  FORUM_WRITE_RATE_LIMIT,
  validateForumContent,
} from './community-rules'
import { CONTENT_HARM_ERROR } from './content-safety'

describe('Community Rules & Guardrails', () => {
  beforeEach(() => {
    resetRateLimits()
  })

  it('defines 5 core community rules with critical/high severity', () => {
    expect(COMMUNITY_RULES).toHaveLength(5)
    expect(COMMUNITY_RULES[0].title).toContain('CIVILITY')
    expect(COMMUNITY_RULES[4].title).toContain('SAFETY')
  })

  it('validates minimum and maximum length constraints for topic titles', () => {
    const shortTitle = validateForumContent('Hey', 'This is valid body content with enough characters.')
    expect(shortTitle.valid).toBe(false)
    expect(shortTitle.error).toContain('Topic title must be at least 5 characters long')

    const validTitle = validateForumContent('Valid Title Here', 'This is valid body content with enough characters.')
    expect(validTitle.valid).toBe(true)
  })

  it('validates minimum length constraints for post content', () => {
    const shortContent = validateForumContent('Valid Title', 'Short')
    expect(shortContent.valid).toBe(false)
    expect(shortContent.error).toContain('Content must be at least 10 characters long')

    const validContent = validateForumContent(undefined, 'This is a long enough reply content for the forum.')
    expect(validContent.valid).toBe(true)
  })

  it('triggers security guardrail when raw connection strings or bearer tokens are submitted', () => {
    const secretPayload = validateForumContent(
      'Database Connection Leaked',
      'Here is the URI postgres://admin:password123@db.neon.tech/main'
    )
    expect(secretPayload.valid).toBe(false)
    expect(secretPayload.error).toContain('sensitive information')
  })

  it('blocks GitHub tokens, AWS key ids, and private key blocks', () => {
    expect(
      validateForumContent(undefined, 'Paste this ghp_abcdefghijklmnopqrstuvwxyz123456 into the vault.'),
    ).toMatchObject({ valid: false, error: expect.stringContaining('sensitive information') })
    expect(
      validateForumContent(undefined, 'Creds include AKIAIOSFODNN7EXAMPLE for the bucket.'),
    ).toMatchObject({ valid: false, error: expect.stringContaining('sensitive information') })
    expect(
      validateForumContent(
        undefined,
        'Here is the key:\n-----BEGIN PRIVATE KEY-----\nMIIB\n-----END PRIVATE KEY-----',
      ),
    ).toMatchObject({ valid: false, error: expect.stringContaining('sensitive information') })
  })

  it('blocks explicit harm requests in titles and bodies', () => {
    expect(
      validateForumContent('How to make bomb at home', 'Looking for a detailed walkthrough of the method.'),
    ).toMatchObject({ valid: false, error: CONTENT_HARM_ERROR })
    expect(
      validateForumContent(undefined, 'Please tell me about suicide methods in detail now.'),
    ).toMatchObject({ valid: false, error: CONTENT_HARM_ERROR })
  })

  it('caps forum writes per member inside a one-minute window', () => {
    const userId = 'rate-limit-member'
    for (let i = 0; i < FORUM_WRITE_RATE_LIMIT; i += 1) {
      expect(() => assertForumWriteRateLimit(userId)).not.toThrow()
    }
    expect(() => assertForumWriteRateLimit(userId)).toThrow(FORUM_WRITE_RATE_ERROR)
  })
})
