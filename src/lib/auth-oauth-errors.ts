const AUTH_ERROR_MESSAGES: Record<string, string> = {
  account_not_linked:
    'An account with this email already exists. Sign in with your email and password, then connect Google in Settings.',
  unable_to_link_account: 'Could not connect that sign-in method. Please try again.',
  email_does_not_match:
    'That Google account uses a different email. Sign in with a matching email, or use email and password.',
  account_already_linked_to_different_user:
    'That Google account is already connected to a different user. Sign in with email and password instead.',
  email_not_found: 'Google did not return an email address. Please try again, or sign in with email and password.',
  email_not_verified: 'Google could not verify that email. Sign in with email and password instead.',
  oauth_provider_not_found: 'Google sign-in is not available right now. Please try again later.',
  unable_to_get_user_info: 'Could not finish Google sign-in. Please try again.',
  invalid_code: 'Google sign-in expired. Please try again.',
  no_code: 'Google sign-in was cancelled. Please try again.',
  signup_blocked: 'Could not create that account. Try a different email.',
}

const DEFAULT_OAUTH_ERROR = 'Could not sign in with Google. Please try again.'
const DEFAULT_LINK_ERROR = 'Could not connect Google. Please try again.'

export function normalizeOAuthErrorCode(error?: string | null): string | null {
  if (!error) return null
  const trimmed = error.trim()
  if (!trimmed) return null
  return trimmed.toLowerCase().replace(/\s+/g, '_')
}

export function mapOAuthCallbackError(
  error?: string | null,
  fallback: string = DEFAULT_OAUTH_ERROR,
): string | null {
  const code = normalizeOAuthErrorCode(error)
  if (!code) return null
  return AUTH_ERROR_MESSAGES[code] ?? fallback
}

export function mapOAuthLinkError(error?: string | null): string {
  return mapOAuthCallbackError(error, DEFAULT_LINK_ERROR) ?? DEFAULT_LINK_ERROR
}

export function readLocationOAuthError(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return normalizeOAuthErrorCode(new URLSearchParams(window.location.search).get('error'))
  } catch {
    return null
  }
}

export function hasOAuthCallbackError(error?: string | null): boolean {
  return Boolean(normalizeOAuthErrorCode(error) || readLocationOAuthError())
}

export function authErrorCallbackURL(callbackURL: string): string {
  try {
    return `${new URL(callbackURL).origin}/auth`
  } catch {
    return '/auth'
  }
}
