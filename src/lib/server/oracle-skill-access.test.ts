import { describe, expect, it } from 'vitest'
import { getOracleSkill } from '../ai/oracle-skills-catalog'
import { buildSkillCards, skillAccess, type MemberSkillProfile } from './oracle-skill-access'

const member = (patch: Partial<MemberSkillProfile> = {}): MemberSkillProfile => ({
  role: 'user',
  isPremium: false,
  settings: {},
  unlocked: new Set(),
  ...patch,
})

describe('Oracle skill access', () => {
  const starter = getOracleSkill('focus-rounds')!
  const paid = getOracleSkill('weekly-review')!

  it('gives every member the free starters', () => {
    expect(skillAccess(starter, member())).toBe('starter')
    expect(skillAccess(paid, member())).toBeNull()
  })

  it('counts purchases, admins and Oracle MAX', () => {
    expect(skillAccess(paid, member({ unlocked: new Set(['weekly-review']) }))).toBe('owned')
    expect(skillAccess(paid, member({ role: 'admin' }))).toBe('admin')
    expect(skillAccess(paid, member({ isPremium: true }))).toBe('max')
    // A purchase outlasts a MAX subscription.
    expect(skillAccess(paid, member({ isPremium: true, unlocked: new Set(['weekly-review']) }))).toBe('owned')
  })

  it('builds cards without playbooks, with switched-off skills disabled', () => {
    const cards = buildSkillCards(member({ settings: { off: ['focus-rounds'] } }))
    expect(cards).toHaveLength(12)
    expect(cards.every((card) => !('playbook' in card))).toBe(true)
    expect(cards.find((c) => c.id === 'focus-rounds')).toMatchObject({ access: 'starter', enabled: false })
    expect(cards.find((c) => c.id === 'two-minute-start')).toMatchObject({ access: 'starter', enabled: true })
    expect(cards.find((c) => c.id === 'weekly-review')).toMatchObject({ access: null, enabled: false })
  })

  it('shows guests the catalog with nothing usable', () => {
    expect(buildSkillCards(null).every((card) => card.access === null)).toBe(true)
  })
})
