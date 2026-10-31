import { describe, it, expect, vi } from 'vitest'
import { experimental_evaluate as evaluate } from 'ai'
vi.mock('ai', () => ({ experimental_evaluate: vi.fn() }))
import {
  clampEvaluationText,
  JEV_GATEWAY_MODEL_ID,
  LAYA_GATEWAY_MODEL_ID,
  LAYA_STATE_MAX_CHARS,
  moderationModelFor,
  evaluateWithJev,
} from './jev'

describe('moderation model routing', () => {
  it('sends short inputs to Laya', () => {
    expect(moderationModelFor({ message: 'What does the third molt mean?' })).toBe(LAYA_GATEWAY_MODEL_ID)
  })

  it('sends inputs over Laya’s limit to Jev', () => {
    const body = 'x'.repeat(LAYA_STATE_MAX_CHARS)
    expect(moderationModelFor({ title: 'Long post', body })).toBe(JEV_GATEWAY_MODEL_ID)
  })

  it('clamps very long state', () => {
    expect(clampEvaluationText('a'.repeat(20), 5)).toBe('aaaaa')
    expect(clampEvaluationText('short', 5)).toBe('short')
  })
})


describe('no-training evaluation routing', () => {
  it('forwards the privacy filter without silently relaxing it', async () => {
    vi.stubEnv('VITEST', 'false')
    vi.mocked(evaluate).mockResolvedValueOnce({ answers: {} } as any)
    try {
      await evaluateWithJev({ state: 'A question', model: JEV_GATEWAY_MODEL_ID, questions: {}, disallowPromptTraining: true })
      expect(evaluate).toHaveBeenCalledWith(expect.objectContaining({
        model: JEV_GATEWAY_MODEL_ID,
        providerOptions: { gateway: { disallowPromptTraining: true } },
        maxRetries: 0,
      }))
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
