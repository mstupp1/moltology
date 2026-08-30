import { describe, expect, it } from 'vitest'
import {
  HANDLE_MESSAGES,
  HANDLE_TAKEN_MESSAGE,
  isReservedHandle,
  isUniqueViolation,
  parseMemberHandle,
  resolveMemberPublicName,
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

describe('isUniqueViolation', () => {
  it('recognizes a taken designation from the unique index', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(isUniqueViolation({ message: 'duplicate key value violates unique constraint "profiles_handle_lower_uidx"' })).toBe(true)
    expect(isUniqueViolation({ message: HANDLE_TAKEN_MESSAGE })).toBe(false)
  })
})
