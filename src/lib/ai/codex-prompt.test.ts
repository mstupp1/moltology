import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, DEFAULT_ORACLE_PERSONA } from './codex-prompt'

describe('AI Codex Prompt Module', () => {
  it('compiles system prompt with default Oracle persona', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Synaptic Oracle')
    expect(prompt).toContain('CARO PERIT. CARAPAX PERMANET')
    expect(prompt).toContain('Stage 1: Larval Initiate')
    expect(prompt).toContain('NON-NEGOTIABLE SAFETY & POSITIVITY TENETS')
  })

  it('supports custom persona configuration', () => {
    const customPrompt = buildSystemPrompt({
      name: 'Chitin Architect',
      title: 'Master of Deep Sea Infrastructure',
      latinMotto: 'FABRICA PROFUNDA',
    })
    expect(customPrompt).toContain('Chitin Architect')
    expect(customPrompt).toContain('FABRICA PROFUNDA')
  })
})
