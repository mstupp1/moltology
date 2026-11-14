import { describe, expect, it } from 'vitest'
import { autoPickOn, nextSkillSettings, readSkillPart, skillSwitchedOff } from './oracle-skills'

const KNOWN = new Set(['focus-rounds', 'weekly-review'])

describe('Oracle skill settings', () => {
  it('defaults to auto-pick on with nothing switched off', () => {
    expect(autoPickOn({})).toBe(true)
    expect(autoPickOn(null)).toBe(true)
    expect(autoPickOn({ autoPick: false })).toBe(false)
    expect(skillSwitchedOff({}, 'focus-rounds')).toBe(false)
  })

  it('switches one skill off and back on, dropping unknown ids', () => {
    const off = nextSkillSettings({ off: ['retired-skill'] }, { skillId: 'focus-rounds', enabled: false }, KNOWN)
    expect(off).toEqual({ autoPick: true, off: ['focus-rounds'] })
    expect(nextSkillSettings(off, { skillId: 'focus-rounds', enabled: true }, KNOWN)).toEqual({ autoPick: true, off: [] })
    expect(nextSkillSettings(off, { skillId: 'made-up', enabled: false }, KNOWN).off).toEqual(['focus-rounds'])
  })

  it('changes auto-pick without touching switched-off skills', () => {
    expect(nextSkillSettings({ off: ['weekly-review'] }, { autoPick: false }, KNOWN)).toEqual({
      autoPick: false,
      off: ['weekly-review'],
    })
  })

  it('reads a saved skill label from message parts', () => {
    const part = { type: 'skill', id: 'focus-rounds', name: 'Focus rounds', how: 'auto' }
    expect(readSkillPart([{ type: 'text' }, part])).toEqual(part)
    expect(readSkillPart([])).toBeNull()
    expect(readSkillPart(undefined)).toBeNull()
    expect(readSkillPart([{ type: 'skill', id: 3 }])).toBeNull()
  })
})
