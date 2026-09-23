import { evaluateWithJev, exceedsJevConfidence } from './jev'

/**
 * Member-post boards. Rules & Directives stays staff-owned, so it is not a choice.
 * `off-topic` is a signal, not a board.
 */
export const FORUM_GATE_CATEGORIES = {
  'sacred-doctrine-ai': 'Lore, scriptures, clearance stages, and doctrine',
  'hardware-synaptic': 'Interface, telemetry, software, and engineering',
  'moltmaxxing-biometrics': 'Training, shell stats, routines, and personal progression',
  'general-discussion': 'Introductions and open conversation that still belongs here',
  'marketplace-transmutation': 'Credits, the catalog, and trading talk',
  'off-topic': 'Unrelated to this community',
} as const

export type ForumGateCategory = keyof typeof FORUM_GATE_CATEGORIES

/** Ordered lowest to highest. Index 0–4 maps onto a 0–100 quality score. */
export const FORUM_QUALITY_RUBRIC = [
  'Gibberish, spam fragments, or a post with no usable idea',
  'Thin, repetitive, or barely relevant',
  'Understandable and on topic, with ordinary effort',
  'Specific, coherent, and useful to other members',
  'Detailed, well reasoned, and clearly relevant',
] as const

export const FORUM_TRENDING_QUALITY_MIN = 50

export const FORUM_QUARANTINE_ERROR =
  "This post can't be published. Take out spam, harassment, solicitation, or private secrets and try again."

export interface ForumSubmission {
  title?: string
  body: string
}

export interface ForumGateAnswers {
  isProhibited?: { probability?: number }
  category?: { choice?: string }
  qualityScore?: { score?: number }
}

export interface ForumGateDecision {
  status: 'allow' | 'quarantine'
  reason?: string
  suggestedCategory: ForumGateCategory | null
  /** Null when Jev did not score the post. */
  qualityScore: number | null
  discoveryEligible: boolean
  source: 'jev' | 'fallback'
}

export type ForumGateEvaluator = (input: ForumSubmission) => Promise<ForumGateAnswers | null>

const FORUM_QUESTIONS = {
  isProhibited: {
    type: 'boolean' as const,
    instructions:
      'Is this post spam, commercial or crypto solicitation, hate, explicit harassment, malicious code, or leaked secrets?',
    criteria: {
      true: 'Spam, scams, solicitation, hate, harassment, malware, or credentials and private secrets.',
      false: 'A sincere community post, including disagreement, critique, or a rough draft.',
    },
  },
  category: {
    type: 'choice' as const,
    instructions: 'Select the primary topic that best fits this submission.',
    criteria: FORUM_GATE_CATEGORIES,
  },
  qualityScore: {
    type: 'score' as const,
    instructions:
      'Rate depth, coherence, and relevance. Penalize one-word slop, gibberish, and posts that say nothing.',
    criteria: [...FORUM_QUALITY_RUBRIC],
  },
}

export function qualityPercentFromRubric(score: number): number {
  const maxIndex = FORUM_QUALITY_RUBRIC.length - 1
  const clamped = Math.min(maxIndex, Math.max(0, score))
  return Math.round((clamped / maxIndex) * 100)
}

export function isForumGateCategory(value: string | undefined): value is ForumGateCategory {
  return !!value && Object.prototype.hasOwnProperty.call(FORUM_GATE_CATEGORIES, value)
}

export function fallbackForumDecision(): ForumGateDecision {
  return {
    status: 'allow',
    suggestedCategory: null,
    qualityScore: null,
    discoveryEligible: true,
    source: 'fallback',
  }
}

/**
 * Pure gate. High-confidence prohibited posts never insert.
 * Quality under 50 stays out of Hot. The member's chosen board is not moved.
 */
export function decideForumGate(answers: ForumGateAnswers): ForumGateDecision {
  if (exceedsJevConfidence(answers.isProhibited?.probability)) {
    return {
      status: 'quarantine',
      reason: FORUM_QUARANTINE_ERROR,
      suggestedCategory: isForumGateCategory(answers.category?.choice) ? answers.category.choice : null,
      qualityScore:
        typeof answers.qualityScore?.score === 'number'
          ? qualityPercentFromRubric(answers.qualityScore.score)
          : null,
      discoveryEligible: false,
      source: 'jev',
    }
  }

  const qualityScore =
    typeof answers.qualityScore?.score === 'number'
      ? qualityPercentFromRubric(answers.qualityScore.score)
      : null

  return {
    status: 'allow',
    suggestedCategory: isForumGateCategory(answers.category?.choice) ? answers.category.choice : null,
    qualityScore,
    discoveryEligible: qualityScore === null || qualityScore >= FORUM_TRENDING_QUALITY_MIN,
    source: 'jev',
  }
}

export function visibleInHotFeed(topic: {
  isPinned?: boolean | null
  discoveryEligible?: boolean | null
}): boolean {
  if (topic.isPinned) return true
  return topic.discoveryEligible !== false
}

/** Columns to write when Jev actually scored the topic. A fallback must not wipe a prior score. */
export function forumTopicQualityFields(decision: ForumGateDecision): {
  qualityScore?: number | null
  discoveryEligible?: boolean
  suggestedCategory?: string | null
} {
  if (decision.source !== 'jev' || decision.status !== 'allow') return {}
  return {
    qualityScore: decision.qualityScore,
    discoveryEligible: decision.discoveryEligible,
    suggestedCategory: decision.suggestedCategory,
  }
}

async function defaultForumEvaluator(input: ForumSubmission): Promise<ForumGateAnswers | null> {
  const result = await evaluateWithJev({
    state: {
      title: input.title?.trim() || '',
      body: input.body.trim(),
    },
    questions: FORUM_QUESTIONS,
  })
  if (!result) return null
  return result.answers as ForumGateAnswers
}

export async function screenForumSubmission(
  input: ForumSubmission,
  options?: { evaluate?: ForumGateEvaluator },
): Promise<ForumGateDecision> {
  try {
    const answers = await (options?.evaluate ?? defaultForumEvaluator)(input)
    if (!answers) return fallbackForumDecision()
    return decideForumGate(answers)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.warn(`[forum-gate] Jev evaluation failed; local checks still apply: ${message}`)
    return fallbackForumDecision()
  }
}
