import { describe, expect, it } from 'vitest'
import {
  authErrorCallbackURL,
  mapOAuthCallbackError,
  mapOAuthLinkError,
  normalizeOAuthErrorCode,
} from './auth-oauth-errors'

describe('auth-oauth-errors', () => {
  it('normalizes Better Auth callback codes', () => {
    expect(normalizeOAuthErrorCode('account_not_linked')).toBe('account_not_linked')
    expect(normalizeOAuthErrorCode('account not linked')).toBe('account_not_linked')
    expect(normalizeOAuthErrorCode('  ')).toBeNull()
    expect(normalizeOAuthErrorCode(undefined)).toBeNull()
  })

  it('maps account_not_linked to an actionable sign-in message', () => {
    expect(mapOAuthCallbackError('account_not_linked')).toMatch(/Sign in with your email and password/i)
    expect(mapOAuthCallbackError('account_not_linked')).toMatch(/Settings/i)
  })

  it('falls back for unknown codes and returns null when absent', () => {
    expect(mapOAuthCallbackError(undefined)).toBeNull()
    expect(mapOAuthCallbackError('totally_unknown')).toBe('Could not sign in with Google. Please try again.')
    expect(mapOAuthLinkError('unable_to_link_account')).toBe(
      'Could not connect that sign-in method. Please try again.',
    )
  })

  it('builds an /auth error callback from an absolute callback URL', () => {
    expect(authErrorCallbackURL('https://moltology.org/dashboard')).toBe('https://moltology.org/auth')
    expect(authErrorCallbackURL('/dashboard')).toBe('/auth')
  })
})
