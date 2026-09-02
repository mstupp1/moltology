import { describe, it, expect } from 'vitest'
import {
  MEMBER_SEARCH_MIN_CHARS,
  memberSearchRank,
  rankMemberSearchResults,
  sanitizeMemberSearchQuery,
} from './member-search'

describe('member search ranking', () => {
  it('sanitizes LIKE wildcards without inventing a second people search', () => {
    expect(sanitizeMemberSearchQuery('  claw_%lord  ')).toBe('clawlord')
    expect(sanitizeMemberSearchQuery('ab')).toHaveLength(MEMBER_SEARCH_MIN_CHARS)
  })

  it('ranks handle matches ahead of larva unit, then display name', () => {
    const handlePrefix = {
      handle: 'claw_lord',
      larvaId: 'LARVA UNIT #9',
      displayName: 'claw_lord',
    }
    const handleContains = {
      handle: 'the_claw',
      larvaId: 'LARVA UNIT #2',
      displayName: 'the_claw',
    }
    const larvaPrefix = {
      handle: null,
      larvaId: 'CLA-4401',
      displayName: 'CLA-4401',
    }
    const displayNameOnly = {
      handle: 'silent_shell',
      larvaId: 'LARVA UNIT #8',
      displayName: 'Claw Friend',
    }

    expect(memberSearchRank('cla', handlePrefix)).toBeLessThan(memberSearchRank('cla', handleContains))
    expect(memberSearchRank('cla', handleContains)).toBeLessThan(memberSearchRank('cla', larvaPrefix))
    expect(memberSearchRank('cla', larvaPrefix)).toBeLessThan(memberSearchRank('cla', displayNameOnly))

    const ranked = rankMemberSearchResults('cla', [
      displayNameOnly,
      larvaPrefix,
      handleContains,
      handlePrefix,
    ])
    expect(ranked.map((row) => row.displayName)).toEqual([
      'claw_lord',
      'the_claw',
      'CLA-4401',
      'Claw Friend',
    ])
  })

  it('prefers a larva unit prefix over a display-name contains when no handle matches', () => {
    const larva = {
      handle: null,
      larvaId: 'UNIT-CLA',
      displayName: 'UNIT-CLA',
    }
    const named = {
      handle: 'harbor',
      larvaId: 'LARVA UNIT #3',
      displayName: 'Claw Harbor',
    }
    expect(memberSearchRank('cla', larva)).toBeLessThan(memberSearchRank('cla', named))
  })
})
