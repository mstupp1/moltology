import { describe, expect, it } from 'vitest'
import { getOraclePromptLengthError } from './prompt-limits'

describe('Oracle per-message limits', () => {
  it.each([{ premium: false, limit: 1500 }, { premium: true, limit: 4000 }])('enforces the boundary for premium=$premium', ({ premium, limit }) => {
    expect(getOraclePromptLengthError('a'.repeat(limit), premium)).toBeNull()
    expect(getOraclePromptLengthError('a'.repeat(limit + 1), premium)).toContain('Shorten your message')
    expect(getOraclePromptLengthError(`  ${'a'.repeat(limit)}  `, premium)).toBeNull()
  })
})
