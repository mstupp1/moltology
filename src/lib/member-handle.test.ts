import { describe, expect, it } from 'vitest'
import {
  HANDLE_MESSAGES,
  HANDLE_TAKEN_MESSAGE,
  isReservedHandle,
  isUniqueViolation,
  parseMemberHandle,
  isMemberProfileUuid,
  memberDossierLocation,
  pickProfileForRouteKey,
  resolveMemberDossierRedirect,
  resolveMemberPublicName,
  resolveMemberPublicParam,
} from './member-handle'
import { PLACEHOLDER_LARVA_ID, deriveLarvaUnitNumber, formatLarvaUnit } from './larva-id'

const MEMBER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MEMBER_B = '753a434e-b4c6-4681-9f6c-db3e5e5ca284'

describe('parseMemberHandle', () => {
  it('accepts a valid unique-looking designation without coercing case', () => {
    expect(parseMemberHandle('Pincer_Prime')).toEqual({ ok: true, handle: 'Pincer_Prime' })
    expect(parseMemberHandle('ab3')).toEqual({ ok: true, handle: 'ab3' })
    expect(parseMemberHandle('a'.repeat(20))).toEqual({ ok: true, handle: 'a'.repeat(20) })
  })

  it('rejects empty, short, and long values instead of padding them', () => {
    expect(parseMemberHandle('')).toEqual({
      ok: false,
      code: 'empty',
      message: HANDLE_MESSAGES.empty,
    })
    expect(parseMemberHandle('   ')).toEqual({
      ok: false,
      code: 'space',
      message: HANDLE_MESSAGES.space,
    })
    expect(parseMemberHandle('ab')).toEqual({
      ok: false,
      code: 'length',
      message: HANDLE_MESSAGES.length,
    })
    expect(parseMemberHandle('a'.repeat(21))).toEqual({
      ok: false,
      code: 'length',
      message: HANDLE_MESSAGES.length,
    })
  })

  it('rejects spaces, slashes, and other marks instead of rewriting them', () => {
    expect(parseMemberHandle('pincer prime')).toEqual({
      ok: false,
      code: 'space',
      message: HANDLE_MESSAGES.space,
    })
    expect(parseMemberHandle('pincer//prime')).toEqual({
      ok: false,
      code: 'slash',
      message: HANDLE_MESSAGES.slash,
    })
    expect(parseMemberHandle('pincer/prime')).toEqual({
      ok: false,
      code: 'slash',
      message: HANDLE_MESSAGES.slash,
    })
    expect(parseMemberHandle('pincer-prime')).toEqual({
      ok: false,
      code: 'charset',
      message: HANDLE_MESSAGES.charset,
    })
    expect(parseMemberHandle('pincer.prime')).toEqual({
      ok: false,
      code: 'charset',
      message: HANDLE_MESSAGES.charset,
    })
  })

  it('rejects reserved words and obvious impersonation, case-insensitive', () => {
    for (const word of ['moltology', 'Oracle', 'ADMIN', 'root', 'system']) {
      expect(parseMemberHandle(word)).toEqual({
        ok: false,
        code: 'reserved',
        message: HANDLE_MESSAGES.reserved,
      })
    }
    expect(parseMemberHandle('oracle_voice')).toMatchObject({ ok: false, code: 'reserved' })
    expect(parseMemberHandle('admin1')).toMatchObject({ ok: false, code: 'reserved' })
    expect(parseMemberHandle('moderator_01')).toMatchObject({ ok: false, code: 'reserved' })
    expect(isReservedHandle('Official')).toBe(true)
    expect(isReservedHandle('pincer_prime')).toBe(false)
  })

  it('does not invent Ellis-style names or silently lowercase', () => {
    expect(parseMemberHandle('Ellis')).toEqual({ ok: true, handle: 'Ellis' })
    expect(parseMemberHandle('ellis')).toEqual({ ok: true, handle: 'ellis' })
  })
})

describe('resolveMemberPublicName', () => {
  it('prefers a claimed handle over the larva unit', () => {
    expect(
      resolveMemberPublicName({
        userId: MEMBER_A,
        handle: 'claw_lord',
        larvaId: PLACEHOLDER_LARVA_ID,
      }),
    ).toBe('claw_lord')
  })

  it('falls back to the unique larva unit, never the shared placeholder', () => {
    const expectedA = formatLarvaUnit(deriveLarvaUnitNumber(MEMBER_A))
    const expectedB = formatLarvaUnit(deriveLarvaUnitNumber(MEMBER_B))
    expect(
      resolveMemberPublicName({
        userId: MEMBER_A,
        handle: null,
        larvaId: PLACEHOLDER_LARVA_ID,
      }),
    ).toBe(expectedA)
    expect(
      resolveMemberPublicName({
        userId: MEMBER_B,
        handle: '  ',
        larvaId: PLACEHOLDER_LARVA_ID,
      }),
    ).toBe(expectedB)
    expect(expectedA).not.toBe(PLACEHOLDER_LARVA_ID)
    expect(expectedB).not.toBe(PLACEHOLDER_LARVA_ID)
    expect(expectedA).not.toBe(expectedB)
  })
})

describe('member dossier public path', () => {
  it('uses the stored designation as the public param when claimed', () => {
    expect(resolveMemberPublicParam({ id: MEMBER_A, handle: 'mstupp' })).toBe('mstupp')
    expect(resolveMemberPublicParam({ id: MEMBER_A, handle: '  Mstupp  ' })).toBe('Mstupp')
    expect(memberDossierLocation({ id: MEMBER_A, handle: 'mstupp' })).toEqual({
      to: '/member/$profileId',
      params: { profileId: 'mstupp' },
    })
  })

  it('keeps the member id when no designation is claimed', () => {
    expect(resolveMemberPublicParam({ id: MEMBER_A, handle: null })).toBe(MEMBER_A)
    expect(resolveMemberPublicParam({ id: MEMBER_A, handle: '  ' })).toBe(MEMBER_A)
    expect(memberDossierLocation({ id: MEMBER_A })).toEqual({
      to: '/member/$profileId',
      params: { profileId: MEMBER_A },
    })
  })

  it('recognizes profile uuids and never treats a designation as a uuid', () => {
    expect(isMemberProfileUuid(MEMBER_A)).toBe(true)
    expect(isMemberProfileUuid(MEMBER_A.toUpperCase())).toBe(true)
    expect(isMemberProfileUuid('mstupp')).toBe(false)
    expect(isMemberProfileUuid('member-a')).toBe(false)
  })

  it('prefers an exact id match over a case-insensitive designation match', () => {
    const byHandle = { id: MEMBER_B, handle: 'mstupp' }
    const byId = { id: MEMBER_A, handle: 'Other' }
    expect(pickProfileForRouteKey(MEMBER_A, [byHandle, byId])).toEqual(byId)
    expect(pickProfileForRouteKey('MSTUPP', [byHandle, byId])).toEqual(byHandle)
    expect(pickProfileForRouteKey('nobody', [byHandle, byId])).toBeNull()
  })

  it('redirects uuid and mismatched casing to the stored designation', () => {
    const claimed = { id: MEMBER_A, handle: 'mstupp' }
    expect(resolveMemberDossierRedirect(MEMBER_A, claimed)).toBe('mstupp')
    expect(resolveMemberDossierRedirect('MSTUPP', claimed)).toBe('mstupp')
    expect(resolveMemberDossierRedirect('mstupp', claimed)).toBeNull()
  })

  it('does not redirect a uuid dossier when the member never claimed a designation', () => {
    expect(resolveMemberDossierRedirect(MEMBER_A, { id: MEMBER_A, handle: null })).toBeNull()
    expect(resolveMemberDossierRedirect(MEMBER_A, { id: MEMBER_A, handle: '  ' })).toBeNull()
  })
})

describe('isUniqueViolation', () => {
  it('recognizes a taken designation from the unique index', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(isUniqueViolation({ message: 'duplicate key value violates unique constraint "profiles_handle_lower_uidx"' })).toBe(true)
    expect(isUniqueViolation({ message: HANDLE_TAKEN_MESSAGE })).toBe(false)
  })
})
