import { authClient } from './auth'

export { authClient }
export const { useSession, signIn, signUp, signOut } = authClient
