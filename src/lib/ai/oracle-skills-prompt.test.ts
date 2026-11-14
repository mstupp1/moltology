import { describe, expect, it, vi } from 'vitest'
import { getOracleSkill } from './oracle-skills-catalog'
import { USE_SKILL_TOOL, buildOracleSkillContext, createOracleSkillTools, joinStepText } from './oracle-skills-prompt'

const focus = getOracleSkill('focus-rounds')!
const start = getOracleSkill('two-minute-start')!

describe('Oracle skill prompt', () => {
  it('adds nothing when the member has no skills to offer', () => {
    expect(buildOracleSkillContext({ discoverable: [] })).toBe('')
  })

  it('loads a picked skill in full', () => {
    const context = buildOracleSkillContext({ picked: focus, discoverable: [] })
    expect(context).toContain('SKILL IN USE: Focus rounds')
    expect(context).toContain(focus.playbook)
    expect(context).not.toContain(USE_SKILL_TOOL)
  })

  it('lists owned skills briefly, without their playbooks', () => {
    const context = buildOracleSkillContext({ discoverable: [focus, start] })
    expect(context).toContain(`- focus-rounds (Focus rounds): ${focus.whenToUse}`)
    expect(context).toContain(USE_SKILL_TOOL)
    expect(context).not.toContain(focus.playbook)
  })

  it('offers no tool for a picked skill or an empty list', () => {
    expect(createOracleSkillTools({ picked: focus, discoverable: [start] }, { onUse: vi.fn() })).toBeUndefined()
    expect(createOracleSkillTools({ discoverable: [] }, { onUse: vi.fn() })).toBeUndefined()
  })

  it('returns a playbook once and reports which skill was used', async () => {
    const onUse = vi.fn()
    const setup = createOracleSkillTools({ discoverable: [focus, start] }, { onUse })!
    const execute = setup.tools[USE_SKILL_TOOL].execute as (input: { skill: string }) => Promise<string>
    expect(await execute({ skill: 'not-owned' })).toMatch(/not available/)
    expect(await execute({ skill: 'two-minute-start' })).toContain(start.playbook)
    expect(await execute({ skill: 'focus-rounds' })).toMatch(/already in use/)
    expect(onUse).toHaveBeenCalledTimes(1)
    expect(onUse).toHaveBeenCalledWith(start)
    expect(setup.prepareStep({ stepNumber: 0 })).toBeUndefined()
    expect(setup.prepareStep({ stepNumber: 1 })).toEqual({ activeTools: [] })
  })

  it('joins the text of every step', () => {
    expect(joinStepText([{ text: 'Let me check. ' }, { text: 'Round 1.' }], 'Round 1.')).toBe('Let me check. Round 1.')
    expect(joinStepText(undefined, 'fallback')).toBe('fallback')
    expect(joinStepText([{ text: '' }], 'fallback')).toBe('fallback')
  })
})
