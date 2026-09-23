import { describe, expect, it, vi } from 'vitest'
import {
  ORACLE_DEEP_MODEL_ID,
  ORACLE_FAST_MODEL_ID,
  ORACLE_JAILBREAK_ERROR,
  complexityBandFromScore,
  contextForOracleIntent,
  decideOraclePreflight,
  fallbackOracleDecision,
  preferredOracleModelId,
  screenOraclePrompt,
} from './oracle-preflight'

describe('oracle preflight decisions', () => {
  it('maps rubric scores onto the 1–5 band', () => {
    expect(complexityBandFromScore(0)).toBe(1)
    expect(complexityBandFromScore(2.49)).toBe(3)
    expect(complexityBandFromScore(2.5)).toBe(4)
    expect(complexityBandFromScore(4)).toBe(5)
  })

  it('sends deep questions to DeepSeek and lighter ones to GLM', () => {
    expect(preferredOracleModelId(3)).toBe(ORACLE_FAST_MODEL_ID)
    expect(preferredOracleModelId(4)).toBe(ORACLE_DEEP_MODEL_ID)
  })

  it('loads context only for the matching intent', () => {
    expect(contextForOracleIntent('codex_doctrine')).toBe('codex')
    expect(contextForOracleIntent('chassis_equipment')).toBe('chassis')
    expect(contextForOracleIntent('progression_tasks')).toBe('progression')
    expect(contextForOracleIntent('casual_banter')).toBe('base')
    expect(contextForOracleIntent('unrelated')).toBe('base')
  })

  it('blocks a high-confidence jailbreak and allows the 0.8 boundary', () => {
    const blocked = decideOraclePreflight({
      isJailbreak: { probability: 0.81 },
      intent: { choice: 'codex_doctrine' },
      complexity: { score: 4 },
    })
    expect(blocked.blocked).toBe(true)
    expect(blocked.reason).toBe(ORACLE_JAILBREAK_ERROR)
    expect(blocked.preferredModelId).toBeUndefined()

    const allowed = decideOraclePreflight({
      isJailbreak: { probability: 0.8 },
      intent: { choice: 'casual_banter' },
      complexity: { score: 0 },
    })
    expect(allowed.blocked).toBe(false)
    expect(allowed.intent).toBe('casual_banter')
    expect(allowed.context).toBe('base')
    expect(allowed.complexityBand).toBe(1)
    expect(allowed.preferredModelId).toBe(ORACLE_FAST_MODEL_ID)
  })

  it('routes doctrine and chassis from one evaluation', async () => {
    const doctrine = await screenOraclePrompt('What does the ledger scripture require?', {
      evaluate: async () => ({
        isJailbreak: { probability: 0.02 },
        intent: { choice: 'codex_doctrine' },
        complexity: { score: 3.2 },
      }),
    })
    expect(doctrine).toMatchObject({
      blocked: false,
      intent: 'codex_doctrine',
      context: 'codex',
      complexityBand: 4,
      preferredModelId: ORACLE_DEEP_MODEL_ID,
      source: 'jev',
    })

    const chassis = await screenOraclePrompt('Which carapace slot raises shell hardness?', {
      evaluate: async () => ({
        isJailbreak: { probability: 0.01 },
        intent: { choice: 'chassis_equipment' },
        complexity: { score: 1 },
      }),
    })
    expect(chassis.context).toBe('chassis')
    expect(chassis.preferredModelId).toBe(ORACLE_FAST_MODEL_ID)
  })

  it('falls open to the full codex prompt when Jev throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const decision = await screenOraclePrompt('hello', {
      evaluate: async () => {
        throw new Error('timeout')
      },
    })
    expect(decision).toEqual(fallbackOracleDecision())
    expect(decision.preferredModelId).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
