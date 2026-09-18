import { createAuthClient } from 'better-auth/react'
import { jwtClient } from 'better-auth/client/plugins'
import { AUTH_SESSION_CLIENT_OPTIONS } from './auth-config'

export const authClient = createAuthClient({
  plugins: [jwtClient()],
  sessionOptions: AUTH_SESSION_CLIENT_OPTIONS,
})
