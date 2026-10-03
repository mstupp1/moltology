import { describe, it, expect } from 'vitest'
import {
  clampEvaluationText,
  JEV_GATEWAY_MODEL_ID,
  LAYA_GATEWAY_MODEL_ID,
  LAYA_STATE_MAX_CHARS,
  moderationModelFor,
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
