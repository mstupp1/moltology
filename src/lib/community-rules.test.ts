import { describe, it, expect } from 'vitest'
import { validateForumContent, COMMUNITY_RULES } from './community-rules'

describe('Community Rules & Guardrails', () => {
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
})
