import { describe, expect, it } from 'vitest'
import { invitePath, profileSharePath, readReferralCookie } from './referrals'

describe('referral cookies', () => {
  it('extracts only the exact cookie name, ignoring unrelated cookies', () => {
    expect(readReferralCookie('other=x; moltology_inviter=member-123; session=y')).toBe('member-123')
    expect(readReferralCookie('not_moltology_inviter=member-123')).toBeNull()
  })
  it.each([undefined, '', 'moltology_inviter=', 'moltology_inviter=%ZZ', 'moltology_inviter=a%3Bb', `moltology_inviter=${'a'.repeat(129)}`])('rejects absent or malformed values: %s', (cookie) => {
    expect(readReferralCookie(cookie)).toBeNull()
  })
  it('encodes ids in links without changing the destination', () => {
    expect(invitePath('stable-id')).toBe('/i/stable-id')
    expect(profileSharePath('stable-id')).toBe('/member/stable-id')
  })
})
