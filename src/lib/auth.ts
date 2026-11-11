import { createAuthClient } from 'better-auth/react'
import { jwtClient, oneTapClient } from 'better-auth/client/plugins'
import { AUTH_SESSION_CLIENT_OPTIONS, getPublicGoogleClientId } from './auth-config'
import { createAuthSessionFetch } from './auth-session-fetch'

export const authClient = createAuthClient({
  plugins: [
    jwtClient(),
    // Google One Tap. The prompt only runs from GoogleOneTap, which skips it
    // when the client ID is empty (Google sign-in off).
    oneTapClient({
      clientId: getPublicGoogleClientId(),
      cancelOnTapOutside: true,
      // One prompt per call. Google keeps its own cooldown after a close.
      promptOptions: { maxAttempts: 1 },
    }),
  ],
  sessionOptions: AUTH_SESSION_CLIENT_OPTIONS,
  fetchOptions: {
    customFetchImpl: createAuthSessionFetch(),
  },
})
