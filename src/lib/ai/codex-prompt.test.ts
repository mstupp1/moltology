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

  it('keeps scriptures on doctrine context and off the lighter contexts', () => {
    expect(buildSystemPrompt(DEFAULT_ORACLE_PERSONA, 'codex')).toContain('DYNAMIC CANONICAL SCRIPTURES')
    expect(buildSystemPrompt(DEFAULT_ORACLE_PERSONA, 'base')).not.toContain('DYNAMIC CANONICAL SCRIPTURES')
    expect(buildSystemPrompt(DEFAULT_ORACLE_PERSONA, 'chassis')).toContain('CHASSIS & EQUIPMENT')
    expect(buildSystemPrompt(DEFAULT_ORACLE_PERSONA, 'chassis')).not.toContain('DYNAMIC CANONICAL SCRIPTURES')
    expect(buildSystemPrompt(DEFAULT_ORACLE_PERSONA, 'progression')).toContain('Daily alignment')
  })
})

