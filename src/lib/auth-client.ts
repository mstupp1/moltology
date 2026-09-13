import { authClient } from './auth'

export { authClient }
export const { useSession, signIn, signUp, signOut, linkSocial, unlinkAccount, listAccounts } = authClient
