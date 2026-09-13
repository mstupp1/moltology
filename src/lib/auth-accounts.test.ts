import { describe, expect, it } from 'vitest'
import { canUnlinkProvider, CREDENTIAL_PROVIDER_ID, GOOGLE_PROVIDER_ID, hasProvider } from './auth-accounts'

describe('auth-accounts', () => {
  const both = [
    { providerId: CREDENTIAL_PROVIDER_ID },
    { providerId: GOOGLE_PROVIDER_ID },
  ]

  it('detects linked providers', () => {
    expect(hasProvider(both, GOOGLE_PROVIDER_ID)).toBe(true)
    expect(hasProvider([{ providerId: CREDENTIAL_PROVIDER_ID }], GOOGLE_PROVIDER_ID)).toBe(false)
  })

  it('blocks unlinking the last remaining method', () => {
    expect(canUnlinkProvider(both, GOOGLE_PROVIDER_ID)).toBe(true)
    expect(canUnlinkProvider([{ providerId: GOOGLE_PROVIDER_ID }], GOOGLE_PROVIDER_ID)).toBe(false)
  })
})
