import { afterEach, describe, expect, it } from 'vitest'
import {
  EMAIL_VERIFICATION_COPY,
  clearPendingSignup,
  isEmailNotVerifiedError,
  isExplicitNullSessionSignup,
  isVerifyFirstSignupResult,
  peekPendingSignup,
  shouldHoldSignupForVerification,
  stashPendingSignup,
  takePendingSignup,
} from './auth-email-verification'

afterEach(() => {
  clearPendingSignup()
})

describe('auth-email-verification helpers', () => {
  it('detects EMAIL_NOT_VERIFIED codes and messages', () => {
    expect(isEmailNotVerifiedError({ code: 'EMAIL_NOT_VERIFIED' })).toBe(true)
    expect(isEmailNotVerifiedError({ message: 'Email not verified' })).toBe(true)
    expect(isEmailNotVerifiedError({ message: 'Invalid password' })).toBe(false)
  })

  it('treats null token signup results as verify-first', () => {
    expect(isVerifyFirstSignupResult({ data: { token: null, user: { id: '1' } } })).toBe(true)
    expect(isVerifyFirstSignupResult({ data: { token: 'sess', user: { id: '1' } } })).toBe(false)
    expect(isVerifyFirstSignupResult({ error: { message: 'fail' } })).toBe(false)
  })

  it('holds a challenged signup only when the server explicitly withholds the token', () => {
    const withheld = { data: { token: null, user: { id: '1' } } }
    const omitted = { data: { user: { id: '1' } } }
    expect(isExplicitNullSessionSignup(withheld)).toBe(true)
    expect(isExplicitNullSessionSignup(omitted)).toBe(false)
    expect(shouldHoldSignupForVerification(withheld, false)).toBe(true)
    expect(shouldHoldSignupForVerification(omitted, false)).toBe(false)
    expect(shouldHoldSignupForVerification(omitted, true)).toBe(true)
  })

  it('stashes and takes pending signup data', () => {
    stashPendingSignup({
      emailOptIn: true,
      email: 'claw@moltology.org',
      callbackURL: '/dashboard',
    })
    expect(peekPendingSignup()?.emailOptIn).toBe(true)
    const taken = takePendingSignup()
    expect(taken?.email).toBe('claw@moltology.org')
    expect(peekPendingSignup()).toBeNull()
  })

  it('keeps confirmation copy free of stack names and slash-pairs', () => {
    const body = EMAIL_VERIFICATION_COPY.body('claw@moltology.org')
    expect(body).toContain('claw@moltology.org')
    expect(body).not.toMatch(/Resend|Better Auth|\bJWT\b/)
    expect(EMAIL_VERIFICATION_COPY.title).toBe('Confirm your email')
    expect(EMAIL_VERIFICATION_COPY.sendFailed).toMatch(/confirmation email/)
    expect(EMAIL_VERIFICATION_COPY.sendFailed).not.toMatch(/Resend|Better Auth|\bJWT\b/)
  })
})
