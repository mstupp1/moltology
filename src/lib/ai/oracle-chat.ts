import { ORACLE_MODELS, getOracleModel } from './oracle-models'

export const GUEST_ORACLE_RESPONSES = [
  "The Oracle sees great potential in you, but you're still in Guest Mode! Create a free account to unlock detailed answers, advice, and save your chat history.",
  'That is a great question! In Guest Mode, my answers are kept brief. Sign up for a free account to unlock full Oracle guidance and start your journey.',
  "I'd love to give you the full breakdown, but you're browsing as a guest. Create your free account in seconds to get complete answers and track your progress!",
  'The answer lies just beneath the surface! In Guest Mode, detailed insights and saved chats are locked. Sign up for free to unlock the full Oracle experience.',
  "You're asking the right questions, but full answers require a free account. Sign up below to unlock complete answers and permanent chat history!",
]

export const ORACLE_UNAVAILABLE_MESSAGE =
  "Sorry — the Oracle couldn't reach a working model right now. Please try again in a moment."

export const ORACLE_EMPTY_RESPONSE_ERROR = 'No response received.'

export const ORACLE_MODEL_TIMEOUT_ERROR = 'The request timed out.'

/** How long we wait for the first token before falling through to the next model. */
export const ORACLE_MODEL_FIRST_TOKEN_MS = 12_000

export const ORACLE_THREAD_ID_HEADER = 'X-Oracle-Thread-Id'

export function pickGuestOracleResponse(userText: string, messageCount: number): string {
  const index = Math.abs(userText.length + messageCount) % GUEST_ORACLE_RESPONSES.length
  return GUEST_ORACLE_RESPONSES[index]
}

export function getOracleCandidateModelIds(selectedModelId?: string): string[] {
  const selectedModel = getOracleModel(selectedModelId)
  return [
    selectedModel.id,
    ...ORACLE_MODELS.filter((m) => m.id !== selectedModel.id).map((m) => m.id),
  ]
}

export function formatOracleUnavailableMessage(lastError?: { message?: string } | null): string {
  if (lastError?.message) {
    return `${ORACLE_UNAVAILABLE_MESSAGE} (${lastError.message})`
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

export function toModelMessages(messages: OracleChatMessageInput[]) {
  return messages
    .filter((m) => Boolean((m.content || m.text || '').trim()))
    .map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: (m.content || m.text || '').trim(),
    }))
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

