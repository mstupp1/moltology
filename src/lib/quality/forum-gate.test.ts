import { describe, expect, it, vi } from 'vitest'
import {
  FORUM_QUARANTINE_ERROR,
  decideForumGate,
  fallbackForumDecision,
  forumTopicQualityFields,
  qualityPercentFromRubric,
  screenForumSubmission,
  visibleInHotFeed,
} from './forum-gate'

describe('forum gate decisions', () => {
  it('maps the rubric onto a 0–100 score', () => {
    expect(qualityPercentFromRubric(0)).toBe(0)
    expect(qualityPercentFromRubric(2)).toBe(50)
    expect(qualityPercentFromRubric(4)).toBe(100)
    expect(qualityPercentFromRubric(1.9)).toBe(48)
  })

  it('quarantines a high-confidence prohibited post and keeps it out of hot', () => {
    const decision = decideForumGate({
      isProhibited: { probability: 0.81 },
      category: { choice: 'off-topic' },
      qualityScore: { score: 0 },
    })

    expect(decision.status).toBe('quarantine')
    expect(decision.reason).toBe(FORUM_QUARANTINE_ERROR)
    expect(decision.discoveryEligible).toBe(false)
    expect(decision.suggestedCategory).toBe('off-topic')
    expect(forumTopicQualityFields(decision)).toEqual({})
  })

  it('allows a post at the 0.8 boundary and suggests a real board', () => {
    const decision = decideForumGate({
      isProhibited: { probability: 0.8 },
      category: { choice: 'sacred-doctrine-ai' },
      qualityScore: { score: 3 },
    })

    expect(decision.status).toBe('allow')
    expect(decision.suggestedCategory).toBe('sacred-doctrine-ai')
    expect(decision.qualityScore).toBe(75)
    expect(decision.discoveryEligible).toBe(true)
    expect(forumTopicQualityFields(decision)).toEqual({
      qualityScore: 75,
      discoveryEligible: true,
      suggestedCategory: 'sacred-doctrine-ai',
    })
  })

  it('hides ordinary-or-worse posts from hot without blocking them', () => {
    const decision = decideForumGate({
      isProhibited: { probability: 0.1 },
      category: { choice: 'not-a-board' },
      qualityScore: { score: 1 },
    })

    expect(decision.status).toBe('allow')
    expect(decision.suggestedCategory).toBeNull()
    expect(decision.qualityScore).toBe(25)
    expect(decision.discoveryEligible).toBe(false)
  })

  it('keeps pinned topics in hot and treats unscored rows as visible', () => {
    expect(visibleInHotFeed({ isPinned: true, discoveryEligible: false })).toBe(true)
    expect(visibleInHotFeed({ isPinned: false, discoveryEligible: false })).toBe(false)
    expect(visibleInHotFeed({ isPinned: false })).toBe(true)
  })

  it('uses an injected evaluation and falls open when Jev throws', async () => {
    const screened = await screenForumSubmission(
      { title: 'A real question about stages', body: 'How does stage 2 actually work in practice?' },
      {
        evaluate: async () => ({
          isProhibited: { probability: 0.05 },
          category: { choice: 'sacred-doctrine-ai' },
          qualityScore: { score: 2 },
        }),
      },
    )
    expect(screened).toMatchObject({
      status: 'allow',
      qualityScore: 50,
      discoveryEligible: true,
      source: 'jev',
    })

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fallback = await screenForumSubmission(
      { title: 'Hello trench', body: 'This is a normal introduction post.' },
      {
        evaluate: async () => {
          throw new Error('gateway down')
        },
      },
    )
    expect(fallback).toEqual(fallbackForumDecision())
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
