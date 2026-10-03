import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, DEFAULT_ORACLE_PERSONA } from './codex-prompt'

describe('AI Codex Prompt Module', () => {
  it('compiles system prompt with default Oracle persona', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Synaptic Oracle')
    expect(prompt).toContain('Stage 1: Larval Initiate')
    expect(prompt).toContain('COMMUNICATION & FORMATTING RULES')
    expect(prompt).toContain('NO Terminal Boilerplate or Headers')
  })

  it('supports custom persona configuration', () => {
    const customPrompt = buildSystemPrompt({
      name: 'Chitin Architect',
      title: 'Master of Deep Sea Infrastructure',
    })
    expect(customPrompt).toContain('Chitin Architect')
    expect(customPrompt).toContain('Master of Deep Sea Infrastructure')
  })

  it('provides a static, unified prompt containing doctrine, equipment, and scriptures', () => {
    const prompt = buildSystemPrompt(DEFAULT_ORACLE_PERSONA)
    expect(prompt).toContain('DYNAMIC CANONICAL SCRIPTURES')
    expect(prompt).toContain('CHASSIS & EQUIPMENT')
    expect(prompt).toContain('PROGRESSION')
    expect(buildSystemPrompt(DEFAULT_ORACLE_PERSONA, 'base')).toBe(prompt)
    expect(buildSystemPrompt(DEFAULT_ORACLE_PERSONA, 'codex')).toBe(prompt)
  })
})

