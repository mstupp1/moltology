import { describe, expect, it } from 'vitest'
import {
  ORACLE_SKILLS,
  ORACLE_SKILL_PLAYBOOK_MAX_CHARS,
  buildOracleSkillCatalog,
  getOracleSkill,
  parseOracleSkill,
  toSkillInfo,
} from './oracle-skills-catalog'

const VALID = `---
id: test-skill
name: Test skill
summary: A short summary.
whenToUse: When testing.
category: Focus
price: 60
examples:
  - Help me test
preview:
  member: Hi
  oracle: Hello
---

Do the thing.
`

describe('Oracle skill catalog', () => {
  it('loads the twelve launch skills with four free starters', () => {
    expect(ORACLE_SKILLS).toHaveLength(12)
    expect(ORACLE_SKILLS.filter((s) => s.price === 0).map((s) => s.id).sort()).toEqual([
      'close-the-day',
      'focus-rounds',
      'one-thing-first',
      'two-minute-start',
    ])
  })

  it('keeps every playbook within budget and in catalog order', () => {
    for (const skill of ORACLE_SKILLS) {
      expect(skill.playbook.length).toBeLessThanOrEqual(ORACLE_SKILL_PLAYBOOK_MAX_CHARS)
      expect(skill.examples.length).toBeGreaterThan(0)
    }
    const orders = ORACLE_SKILLS.map((s) => s.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
  })

  it('avoids trademarked method names in member-facing text', () => {
    const banned = /pomodoro|getting things done|\bGTD\b|\bWOOP\b|eat the frog|atomic habits/i
    for (const skill of ORACLE_SKILLS) {
      const { playbook, ...card } = skill
      expect(JSON.stringify(card) + playbook).not.toMatch(banned)
    }
  })

  it('looks skills up by id and strips the playbook for the browser', () => {
    const skill = getOracleSkill('two-minute-start')
    expect(skill?.name).toBe('Two-minute start')
    expect(getOracleSkill('nope')).toBeUndefined()
    expect(getOracleSkill(null)).toBeUndefined()
    expect(toSkillInfo(skill!)).not.toHaveProperty('playbook')
  })

  it('parses a valid file and rejects bad fields', () => {
    expect(parseOracleSkill(VALID, 'test.md')).toMatchObject({ id: 'test-skill', price: 60, playbook: 'Do the thing.' })
    expect(() => parseOracleSkill(VALID.replace('price: 60', 'price: 75'), 'test.md')).toThrow(/price/)
    expect(() => parseOracleSkill(VALID.replace('category: Focus', 'category: Vibes'), 'test.md')).toThrow(/category/)
    expect(() => parseOracleSkill(VALID.replace('id: test-skill', 'id: Test Skill'), 'test.md')).toThrow(/id/)
    expect(() => parseOracleSkill(VALID.replace('Do the thing.', ''), 'test.md')).toThrow(/empty/)
  })

  it('rejects duplicate ids', () => {
    expect(() => buildOracleSkillCatalog({ 'a.md': VALID, 'b.md': VALID })).toThrow(/Two skill files/)
  })
})
