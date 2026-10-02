import { experimental_evaluate as evaluate, type Experimental_EvaluationQuestion } from 'ai'

/**
 * Moderation evaluation models on Vercel AI Gateway. The helpers below keep
 * their original Jev names. Laya (Convai) is the default and is free on the
 * gateway, but it rejects state over roughly 512 tokens, so longer inputs go
 * to Jev (TypeSafe), which costs about $0.04 per million input tokens.
 * MODERATION_MODEL_ID overrides the short-input model.
 */
export const LAYA_GATEWAY_MODEL_ID = 'convaiinnovations/laya'
export const JEV_GATEWAY_MODEL_ID = 'typesafe-ai/jev'

export const MODERATION_MODEL_ID =
  (typeof process !== 'undefined' && process.env.MODERATION_MODEL_ID?.trim()) || LAYA_GATEWAY_MODEL_ID

/** State Laya reliably accepts, measured in characters of state text. */
export const LAYA_STATE_MAX_CHARS = 1_500

/** Keeps state well inside Jev's 32,000-token window. */
export const EVALUATION_STATE_MAX_CHARS = 12_000

export function clampEvaluationText(text: string, max: number = EVALUATION_STATE_MAX_CHARS): string {
  return text.length > max ? text.slice(0, max) : text
}

export function stateLength(state: string | Record<string, string>): number {
  if (typeof state === 'string') return state.length
  return Object.values(state).reduce((sum, value) => sum + value.length, 0)
}

/** Short inputs use the default model. Long ones use Jev, which accepts them. */
export function moderationModelFor(state: string | Record<string, string>): string {
  if (MODERATION_MODEL_ID !== LAYA_GATEWAY_MODEL_ID) return MODERATION_MODEL_ID
  return stateLength(state) > LAYA_STATE_MAX_CHARS ? JEV_GATEWAY_MODEL_ID : LAYA_GATEWAY_MODEL_ID
}

/** Preflight budget. A miss falls open to the local checks. */
export const JEV_EVAL_TIMEOUT_MS = 1_200

/** Act only on a clear yes. 0.8 itself stays on the allow side. */
export const JEV_HIGH_CONFIDENCE = 0.8

export function exceedsJevConfidence(
  probability: number | undefined,
  threshold: number = JEV_HIGH_CONFIDENCE,
): boolean {
  return typeof probability === 'number' && Number.isFinite(probability) && probability > threshold
}

export function jevEvaluationSkipped(): boolean {
  return process.env.VITEST === 'true'
}

type EvaluationQuestions = Record<string, Experimental_EvaluationQuestion>

/**
 * One moderation-model round trip. Returns null when the gateway is down, times out, or
 * the call is skipped under Vitest (pass `evaluate` in unit tests instead).
 */
export async function evaluateWithJev<QUESTIONS extends EvaluationQuestions>(args: {
  state: string | Record<string, string>
  questions: QUESTIONS
  model?: string
  timeoutMs?: number
}): Promise<{ answers: { [ID in keyof QUESTIONS]: unknown } } | null> {
  if (jevEvaluationSkipped()) return null

  try {
    const result = await evaluate({
      model: args.model ?? moderationModelFor(args.state),
      state: args.state,
      questions: args.questions,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(args.timeoutMs ?? JEV_EVAL_TIMEOUT_MS),
      // No zeroDataRetention flag: the gateway rejects it on the Hobby plan,
      // which made every evaluation fail open.
    })
    return { answers: result.answers }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.warn(`[moderation] Evaluation unavailable: ${message}`)
    return null
  }
}
