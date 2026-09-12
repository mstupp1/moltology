import { describe, expect, it } from 'vitest'
import { auth, isGoogleSocialConfigured } from './auth-server'

describe('auth-server', () => {
  it('exposes a Better Auth handler and email/password API', () => {
    expect(typeof auth.handler).toBe('function')
    expect(auth.api.signUpEmail).toBeDefined()
    expect(auth.api.signInEmail).toBeDefined()
    expect(auth.api.signOut).toBeDefined()
    expect(auth.api.getSession).toBeDefined()
  })

  it('does not configure Google social when credentials are absent', () => {
    expect(isGoogleSocialConfigured()).toBe(false)
  })
})
