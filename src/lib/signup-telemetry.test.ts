import { describe, expect, it } from 'vitest'
import {
  SIGNUP_FAST_MS,
  honeypotTripped,
  isFastSignup,
  parseSignupElapsedMs,
  signupClientFields,
} from './signup-telemetry'

describe('signup telemetry', () => {
  it('treats a filled honeypot as tripped and a blank one as clean', () => {
    expect(honeypotTripped('https://spam.example')).toBe(true)
    expect(honeypotTripped('  x  ')).toBe(true)
    expect(honeypotTripped('')).toBe(false)
    expect(honeypotTripped('   ')).toBe(false)
    expect(honeypotTripped(undefined)).toBe(false)
    expect(honeypotTripped(1)).toBe(false)
  })

  it('parses elapsed milliseconds and treats missing values as absent', () => {
    expect(parseSignupElapsedMs(0)).toBe(0)
    expect(parseSignupElapsedMs(1499)).toBe(1499)
    expect(parseSignupElapsedMs('1500')).toBe(1500)
    expect(parseSignupElapsedMs(-1)).toBeNull()
    expect(parseSignupElapsedMs('')).toBeNull()
    expect(parseSignupElapsedMs('fast')).toBeNull()
    expect(parseSignupElapsedMs(undefined)).toBeNull()
  })

  it('marks only sub-1.5s completions as fast', () => {
    expect(isFastSignup(1499)).toBe(true)
    expect(isFastSignup(SIGNUP_FAST_MS)).toBe(false)
    expect(isFastSignup(30_000)).toBe(false)
    expect(isFastSignup(null)).toBe(false)
  })

  it('omits elapsed time from the client payload when the timer never started', () => {
    expect(signupClientFields({ honeypot: '', elapsedMs: null })).toEqual({ confirm_website: '' })
    expect(signupClientFields({ honeypot: '', elapsedMs: 2200 })).toEqual({
      confirm_website: '',
      signupElapsedMs: 2200,
    })
  })
})
