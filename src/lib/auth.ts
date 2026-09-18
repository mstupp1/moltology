import { createAuthClient } from 'better-auth/react'
import { jwtClient } from 'better-auth/client/plugins'
import { AUTH_SESSION_CLIENT_OPTIONS } from './auth-config'
import { createAuthSessionFetch } from './auth-session-fetch'

export const authClient = createAuthClient({
  plugins: [jwtClient()],
  sessionOptions: AUTH_SESSION_CLIENT_OPTIONS,
  fetchOptions: {
    customFetchImpl: createAuthSessionFetch(),
  },
})
