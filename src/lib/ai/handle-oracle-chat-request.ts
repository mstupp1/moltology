import {
  createTextStreamResponse,
  streamText,
  toTextStream,
} from 'ai'
import { extractAuthToken } from '../server/middleware'
import { verifyAuthJWT } from '../jwt'
import { validateInputGuardrails, checkRateLimit } from './guardrails'
import { buildSystemPrompt, DEFAULT_ORACLE_PERSONA } from './codex-prompt'
import { buildOracleScriptureContext } from './scripture-lookup'
import { ORACLE_JAILBREAK_ERROR, screenOraclePrompt } from '../quality/oracle-preflight'
import {
  saveAIMessage,
  createAIThread,
  summarizeThreadTitle,
  updateAIThreadTitle,
  getOwnedAIThread,
  getRecentAIThreadTurns,
  getOracleUsageSnapshot,
  reserveOracleChatUsage,
  releaseOracleChatUsage,
  finalizeOracleUsage,
} from './service'
import { getChatLimitMessage, isChatLimitError } from './chat-retention'
import { getOracleGenerationOptions, getOracleTitleModelId, getOracleThreadFallbackTitle } from './oracle-models'
import {
  decideOracleUsage,
  ORACLE_MAX_HISTORY_MESSAGES,
  ORACLE_MAX_OUTPUT_TOKENS,
} from './usage-limits'
import {
  commitOracleTextStream,
  formatOracleUnavailableMessage,
  getLastUserText,
  ORACLE_THREAD_ID_HEADER,
  pickGuestOracleResponse,
  orderOracleModels,
  toModelMessages,
  type OracleChatMessageInput,
} from './oracle-chat'

function queueOracleUserMessagePersistence(params: {
  userId: string
  threadId: string
  userText: string
}) {
  void (async () => {
    try {
      await saveAIMessage({
        threadId: params.threadId,
        userId: params.userId,
        role: 'user',
        content: params.userText,
      })
    } catch (dbErr) {
      console.warn('[handleOracleChatRequest] DB thread/message logging warning:', dbErr)
    }
  })()
}

export const ORACLE_USAGE_UNAVAILABLE_MESSAGE = 'The Oracle is unavailable right now. Try again in a minute.'

export interface OracleChatRequestBody {
  messages?: OracleChatMessageInput[]
  userId?: string
  threadId?: string
  model?: string
}

/**
 * Handles an Oracle chat POST: guest JSON, or authenticated token text stream.
 * Shared by the /api/chat route so logic stays testable without the router.
 */
export async function handleOracleChatRequest(request: Request): Promise<Response> {
  let body: OracleChatRequestBody
  try {
    body = (await request.json()) as OracleChatRequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Messages array is required.' }, { status: 400 })
  }

  const token = extractAuthToken(request)
  let authUserId: string | undefined
  if (token) {
    const verification = await verifyAuthJWT(token)
    if (verification.valid && verification.payload) {
      authUserId = verification.payload.sub || (verification.payload as { id?: string }).id
    }
  }

  const userId = authUserId
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role !== 'user') {
    return Response.json({ error: 'The last message must come from you.' }, { status: 400 })
  }
  const userText = getLastUserText(messages)

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  // Per-instance flood guard. The durable per-member limits are checked below.
  const rateLimit = checkRateLimit(userId || clientIp, 30, 60 * 1000)
  if (!rateLimit.success) {
    return Response.json(
      { error: 'Rate limit exceeded. Please wait a moment before sending more messages.' },
      { status: 429 }
    )
  }

  const guardrail = validateInputGuardrails(userText)
  if (!guardrail.allowed) {
    return Response.json(
      { error: guardrail.reason || 'Message blocked by safety filters.' },
      { status: 400 }
    )
  }

  // Guests get a canned reply, so they never reach the moderation or chat models.
  if (!userId) {
    return Response.json({
      text: pickGuestOracleResponse(userText, messages.length),
      threadId: null,
      isGuest: true,
    })
  }

  try {
    const snapshot = await getOracleUsageSnapshot(userId)
    const usage = decideOracleUsage(snapshot, snapshot.isPremium)
    if (!usage.allowed) {
      return Response.json(
        { error: usage.message, limit: usage.scope },
        { status: 429, headers: { 'Retry-After': String(usage.retryAfterSeconds) } }
      )
    }
  } catch (err) {
    // Without the usage table the rolling and per-minute limits cannot be enforced,
    // so the paid model call does not run.
    console.warn('[handleOracleChatRequest] Usage check unavailable:', err)
    return Response.json(
      { error: ORACLE_USAGE_UNAVAILABLE_MESSAGE },
      { status: 503, headers: { 'Retry-After': '30' } }
    )
  }

  let activeThreadId = body.threadId
  let isNewThread = !activeThreadId
  let storedTurns: OracleChatMessageInput[] = []
  if (activeThreadId) {
    const owned = await getOwnedAIThread(userId, activeThreadId)
    if (!owned) {
      return Response.json({ error: 'Thread not found.' }, { status: 403 })
    }
    // Read before this turn is queued for saving so it is not counted twice.
    try {
      storedTurns = await getRecentAIThreadTurns(activeThreadId, ORACLE_MAX_HISTORY_MESSAGES)
    } catch (err) {
      console.warn('[handleOracleChatRequest] History read warning:', err)
    }
  } else {
    activeThreadId = crypto.randomUUID()
    isNewThread = true
  }
  const initialThreadTitle = getOracleThreadFallbackTitle(userText)

  let usageReservation: Awaited<ReturnType<typeof reserveOracleChatUsage>>
  try {
    usageReservation = await reserveOracleChatUsage(userId)
  } catch (err) {
    console.warn('[handleOracleChatRequest] Usage reservation unavailable:', err)
    return Response.json(
      { error: ORACLE_USAGE_UNAVAILABLE_MESSAGE },
      { status: 503, headers: { 'Retry-After': '30' } }
    )
  }
  if (!usageReservation.allowed) {
    return Response.json(
      { error: usageReservation.decision.message, limit: usageReservation.decision.scope },
      { status: 429, headers: { 'Retry-After': String(usageReservation.decision.retryAfterSeconds) } }
    )
  }
  const usageEventId = usageReservation.id

  // The reservation's authoritative tier governs every remote prompt processor,
  // including screening. Premium never sends prompts to the free Laya endpoint.
  const preflight = await screenOraclePrompt(guardrail.sanitizedText || userText, { isPremium: usageReservation.isPremium })
  if (preflight.blocked) {
    await releaseOracleChatUsage(usageEventId)
    return Response.json(
      { error: preflight.reason || ORACLE_JAILBREAK_ERROR },
      { status: 400 },
    )
  }

  if (isNewThread) {
    try {
      await createAIThread({
        id: activeThreadId,
        userId,
        title: initialThreadTitle,
        persona: 'oracle',
      })
    } catch (error) {
      await releaseOracleChatUsage(usageEventId)
      if (isChatLimitError(error)) {
        return Response.json({ error: getChatLimitMessage() }, { status: 409 })
      }
      console.warn('[handleOracleChatRequest] Could not reserve new conversation:', error)
      return Response.json(
        { error: 'Could not start a new conversation right now. Please try again.' },
        { status: 503 },
      )
    }
  }

  const systemPrompt = buildSystemPrompt(DEFAULT_ORACLE_PERSONA, preflight.context)
    + buildOracleScriptureContext(
      userText,
      [...storedTurns].reverse().find((turn) => turn.role === 'user')?.content,
      [...storedTurns].reverse().find((turn) => turn.role === 'assistant')?.content,
    )
  // History comes from saved messages, never the client, so a caller cannot forge
  // assistant turns. Only the new user turn is taken from the request. If the
  // previous reply is still being saved, it is missing from this one request.
  // Stored user turns are re-checked in case the input filter has tightened since.
  const payloadMessages = toModelMessages([
    ...storedTurns.filter(
      (m) => m.role !== 'user' || validateInputGuardrails(m.content || '').allowed,
    ),
    { role: 'user', content: userText },
  ])
  const accessTier = usageReservation.isPremium ? 'premium' : 'free'
  const titleModelId = getOracleTitleModelId(usageReservation.isPremium)
  const candidateModels = orderOracleModels(body.model, preflight.preferredModelId, accessTier)
  let lastError: Error | null = null

  queueOracleUserMessagePersistence({ userId, threadId: activeThreadId, userText })

  // Start once per new conversation, not once per attempted chat model. The
  // awaited completion callback keeps title persistence inside the response's
  // lifetime while generation overlaps the streamed reply.
  const titleAbortController = new AbortController()
  const abortTitle = () => titleAbortController.abort()
  request.signal.addEventListener('abort', abortTitle, { once: true })
  if (request.signal.aborted) abortTitle()
  const titleTask = isNewThread
    ? summarizeThreadTitle(userText, titleModelId, userId, titleAbortController.signal)
        .catch((error) => {
          console.warn('[handleOracleChatRequest] Title generation warning:', error)
          return initialThreadTitle
        })
    : null
  const cleanUpTitle = () => {
    abortTitle()
    request.signal.removeEventListener('abort', abortTitle)
  }

  for (const modelCandidate of candidateModels) {
    const abortController = new AbortController()
    try {
      const threadIdForSave = activeThreadId
      const result = streamText({
        model: modelCandidate as any,
        ...getOracleGenerationOptions(modelCandidate),
        maxRetries: 0,
        system: systemPrompt,
        messages: payloadMessages,
        maxOutputTokens: ORACLE_MAX_OUTPUT_TOKENS,
        abortSignal: abortController.signal,
        onFinish: async ({ text, totalUsage }) => {
          if (usageEventId) {
            void finalizeOracleUsage(usageEventId, {
              model: modelCandidate,
              inputTokens: totalUsage?.inputTokens,
              outputTokens: totalUsage?.outputTokens,
            })
          }
          if (!userId || !threadIdForSave) return
          try {
            if (text) {
              await saveAIMessage({
                threadId: threadIdForSave,
                userId,
                role: 'assistant',
                content: text,
              })
            }
          } catch (dbErr) {
            console.warn('[handleOracleChatRequest] DB assistant response logging warning:', dbErr)
          }
          // Saving the assistant response and naming the thread are independent:
          // a transient message-save failure must not suppress the title.
          try {
            const aiTitle = await titleTask
            if (!titleAbortController.signal.aborted && aiTitle && aiTitle !== initialThreadTitle) {
              await updateAIThreadTitle(threadIdForSave, aiTitle, userId, initialThreadTitle)
            }
          } catch (error) {
            console.warn('[handleOracleChatRequest] Title persistence warning:', error)
          }
        },
        onError: ({ error }) => {
          console.warn(
            `[Oracle Chat] Model candidate '${modelCandidate}' stream error:`,
            error instanceof Error ? error.message : error
          )
        },
      })

      // Do not commit until the first token arrives. streamText() returns immediately,
      // so an empty or hung model stream can fall through to the next allowed candidate.
      const committedStream = await commitOracleTextStream(
        toTextStream({ stream: result.stream }),
      )

      const headers: Record<string, string> = {}
      if (activeThreadId) {
        headers[ORACLE_THREAD_ID_HEADER] = activeThreadId
      }

      const reader = committedStream.getReader()
      const responseStream = new ReadableStream({
        async pull(controller) {
          try {
            const next = await reader.read()
            if (next.done) {
              cleanUpTitle()
              reader.releaseLock()
              controller.close()
            } else {
              controller.enqueue(next.value)
            }
          } catch (error) {
            cleanUpTitle()
            abortController.abort()
            reader.releaseLock()
            await titleTask
            controller.error(error)
          }
        },
        async cancel(reason) {
          cleanUpTitle()
          abortController.abort()
          try {
            await reader.cancel(reason)
          } finally {
            await titleTask
          }
        },
      })
      return createTextStreamResponse({
        headers,
        stream: responseStream,
      })
    } catch (err: any) {
      abortController.abort()
      console.warn(`[Oracle Chat] Model candidate '${modelCandidate}' failed:`, err?.message)
      lastError = err instanceof Error ? err : new Error(err?.message || 'Model request failed.')
    }
  }

  cleanUpTitle()
  await titleTask
  return Response.json(
    {
      error: formatOracleUnavailableMessage(lastError),
      text: formatOracleUnavailableMessage(lastError),
      threadId: activeThreadId ?? null,
    },
    { status: 502 }
  )
}
