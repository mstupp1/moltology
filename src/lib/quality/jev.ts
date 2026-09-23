import { experimental_evaluate as evaluate, type Experimental_EvaluationQuestion } from 'ai'

/**
 * Jev on Vercel AI Gateway. The unversioned id tracks the current checkpoint.
 * Boolean questions are the SDK name for TypeSafe Noul.
 */
export const JEV_GATEWAY_MODEL_ID = 'typesafe-ai/jev'

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
 * One Jev round trip. Returns null when the gateway is down, times out, or
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
      model: args.model ?? JEV_GATEWAY_MODEL_ID,
      state: args.state,
      questions: args.questions,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(args.timeoutMs ?? JEV_EVAL_TIMEOUT_MS),
      providerOptions: {
        gateway: { zeroDataRetention: true },
      },
    })
    return { answers: result.answers }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.warn(`[jev] Evaluation unavailable: ${message}`)
    return null
  }
}
