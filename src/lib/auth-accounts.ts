export const CREDENTIAL_PROVIDER_ID = 'credential'
export const GOOGLE_PROVIDER_ID = 'google'

export type LinkedAccount = {
  id?: string
  providerId: string
}

export function hasProvider(accounts: LinkedAccount[], providerId: string): boolean {
  return accounts.some((account) => account.providerId === providerId)
}

export function canUnlinkProvider(accounts: LinkedAccount[], providerId: string): boolean {
  return accounts.some((account) => account.providerId !== providerId)
}
