import { describe, it, expect } from 'vitest'
import {
  PLACEHOLDER_LARVA_ID,
  SEED_LARVA_PROFILE_ID,
  deriveLarvaUnitNumber,
  formatLarvaUnit,
  isPlaceholderLarvaId,
  resolveMemberLarvaId,
  shouldReplacePlaceholderLarvaId,
} from './larva-id'

const MEMBER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MEMBER_B = '753a434e-b4c6-4681-9f6c-db3e5e5ca284'

describe('larva-id', () => {
  it('treats both seed casings as the shared placeholder', () => {
    expect(isPlaceholderLarvaId(PLACEHOLDER_LARVA_ID)).toBe(true)
    expect(isPlaceholderLarvaId('Larva Unit #8971')).toBe(true)
    expect(isPlaceholderLarvaId('LARVA UNIT #2468')).toBe(false)
    expect(isPlaceholderLarvaId('CLAW_LORD_99')).toBe(false)
  })

  it('derives distinct unit numbers for distinct members', () => {
    const a = deriveLarvaUnitNumber(MEMBER_A)
    const b = deriveLarvaUnitNumber(MEMBER_B)
    expect(a).not.toBe(b)
    expect(a).toBeGreaterThanOrEqual(1000)
    expect(b).toBeGreaterThanOrEqual(1000)
    expect(a).not.toBe(8971)
    expect(b).not.toBe(8971)
  })

  it('keeps seed and custom labels, and splits placeholder members', () => {
    expect(resolveMemberLarvaId(null, 'Architect Vaelen')).toBe('Architect Vaelen')
    expect(resolveMemberLarvaId(SEED_LARVA_PROFILE_ID, PLACEHOLDER_LARVA_ID)).toBe(
      PLACEHOLDER_LARVA_ID,
    )
    expect(resolveMemberLarvaId(MEMBER_A, 'CLAW_LORD_99')).toBe('CLAW_LORD_99')

    const aLabel = resolveMemberLarvaId(MEMBER_A, PLACEHOLDER_LARVA_ID)
    const bLabel = resolveMemberLarvaId(MEMBER_B, 'Larva Unit #8971')
    expect(aLabel).toBe(formatLarvaUnit(deriveLarvaUnitNumber(MEMBER_A)))
    expect(bLabel).toBe(formatLarvaUnit(deriveLarvaUnitNumber(MEMBER_B)))
    expect(aLabel).not.toBe(bLabel)
    expect(aLabel).not.toBe(PLACEHOLDER_LARVA_ID)
    expect(bLabel).not.toBe(PLACEHOLDER_LARVA_ID)
  })

  it('only replaces the placeholder on real members', () => {
    expect(shouldReplacePlaceholderLarvaId(SEED_LARVA_PROFILE_ID, PLACEHOLDER_LARVA_ID)).toBe(
      false,
    )
    expect(shouldReplacePlaceholderLarvaId(MEMBER_B, PLACEHOLDER_LARVA_ID)).toBe(true)
    expect(shouldReplacePlaceholderLarvaId(MEMBER_B, 'LARVA UNIT #2468')).toBe(false)
    expect(shouldReplacePlaceholderLarvaId(null, PLACEHOLDER_LARVA_ID)).toBe(false)
  })
})
