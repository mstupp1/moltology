import { ORACLE_MODELS, getOracleDefaultModelId, canUseOracleChatModel, type OracleAccessTier } from './oracle-models'
import { capOracleHistory, ORACLE_FREE_LIMITS } from './usage-limits'

/** Shown in the chat, as the Oracle's reply, when a guest can't send another message. */
export const GUEST_ORACLE_LIMIT_MESSAGES = {
  visitor:
    `That's all the guest messages for today. Sign up free to keep going: members get ${ORACLE_FREE_LIMITS.perFiveHours} messages every 5 hours, and your chats are saved.`,
  allGuests:
    'The Oracle has answered all the guest questions it can for today. Sign up free to keep asking, and your chats will be saved.',
  unavailable:
    "The Oracle can't answer guests right now. Try again in a little while, or sign up free to keep asking.",
} as const

export const ORACLE_UNAVAILABLE_MESSAGE =
  "Sorry — the Oracle couldn't reach a working model right now. Please try again in a moment."

export const ORACLE_EMPTY_RESPONSE_ERROR = 'No response received.'

export const ORACLE_MODEL_TIMEOUT_ERROR = 'The request timed out.'

/** How long we wait for the first token before falling through to the next model. */
export const ORACLE_MODEL_FIRST_TOKEN_MS = 12_000

export const ORACLE_THREAD_ID_HEADER = 'X-Oracle-Thread-Id'

/** Title/preview rows never enter chat routing; membership is supplied by the server. */
export function getOracleCandidateModelIds(selectedModelId?: string, tier: OracleAccessTier = 'free'): string[] {
  const allowed = ORACLE_MODELS.filter((model) => canUseOracleChatModel(model, tier))
  const selected = allowed.find((model) => model.id === selectedModelId)
    ?? allowed.find((model) => model.id === getOracleDefaultModelId(tier))
  // Preserve the selected model: never silently downgrade or increase cost.
  return selected ? [selected.id] : []
}

export function orderOracleModels(requestedModelId?: string, _preferredModelId?: string, tier: OracleAccessTier = 'free'): string[] {
  // Moderation's model preference cannot override the member's entitlement/default.
  return getOracleCandidateModelIds(requestedModelId, tier)
}

/** The member sees a fixed message; provider error text stays in the server log. */
export function formatOracleUnavailableMessage(lastError?: { message?: string } | null): string {
  if (lastError?.message) {
    console.warn('[Oracle Chat] All model candidates failed:', lastError.message)
  }
  return ORACLE_UNAVAILABLE_MESSAGE
}

export interface OracleChatMessageInput {
  role: string
  content?: string
  text?: string
}

export function getLastUserText(messages: OracleChatMessageInput[]): string {
  const lastMsg = messages[messages.length - 1]
  return lastMsg?.content || lastMsg?.text || ''
}

/**
 * Stored history becomes model input. Only user and assistant turns pass, so a
 * system message never reaches the model, and the history is capped by size.
 */
export function toModelMessages(messages: OracleChatMessageInput[], maxMessages?: number, maxChars?: number) {
  const turns = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => Boolean((m.content || m.text || '').trim()))
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: (m.content || m.text || '').trim(),
    }))
  return capOracleHistory(turns, maxMessages, maxChars)
}

function chunkHasText(chunk: unknown): boolean {
  if (typeof chunk === 'string') return chunk.trim().length > 0
  if (ArrayBuffer.isView(chunk)) {
    return new TextDecoder().decode(chunk).trim().length > 0
  }
  return false
}

function rejectOnAbort(signal: AbortSignal, message: string): Promise<never> {
  return new Promise((_, reject) => {
    const fail = () => reject(new Error(message))
    if (signal.aborted) {
      fail()
      return
    }
    signal.addEventListener('abort', fail, { once: true })
  })
}

/**
 * Wait for the first non-empty token before committing to a model stream.
 * Empty, errored, or timed-out streams throw so the caller can try the next model.
 */
export async function commitOracleTextStream<T>(
  source: ReadableStream<T>,
  timeoutMs: number = ORACLE_MODEL_FIRST_TOKEN_MS,
): Promise<ReadableStream<T>> {
  const reader = source.getReader()
  const buffered: T[] = []
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), timeoutMs)

  try {
    while (true) {
      let readResult: ReadableStreamReadResult<T>
      try {
        readResult = await Promise.race([
          reader.read(),
          rejectOnAbort(abort.signal, ORACLE_MODEL_TIMEOUT_ERROR),
        ])
      } catch (err) {
        if (abort.signal.aborted) {
          throw new Error(ORACLE_MODEL_TIMEOUT_ERROR)
        }
        throw err instanceof Error ? err : new Error(String(err))
      }

      const { done, value } = readResult
      if (value !== undefined) buffered.push(value)
      if (buffered.some(chunkHasText)) break
      if (done) {
        throw new Error(ORACLE_EMPTY_RESPONSE_ERROR)
      }
    }
  } catch (err) {
    try {
      await reader.cancel(err)
    } catch {
      // The source may already be closed or cancelled.
    }
    try {
      reader.releaseLock()
    } catch {
      // Already released by cancel().
    }
    throw err
  } finally {
    clearTimeout(timer)
  }

  return new ReadableStream<T>({
    async start(controller) {
      try {
        for (const chunk of buffered) controller.enqueue(chunk)
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value !== undefined) controller.enqueue(value)
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      } finally {
        try {
          reader.releaseLock()
        } catch {
          // Already released.
        }
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
}

