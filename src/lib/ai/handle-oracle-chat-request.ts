import {
  createTextStreamResponse,
  streamText,
  toTextStream,
} from 'ai'
import { extractAuthToken } from '../server/middleware'
import { verifyNeonJWT } from '../jwt'
import { validateInputGuardrails, checkRateLimit } from './guardrails'
import { buildSystemPrompt } from './codex-prompt'
import { saveAIMessage, createAIThread, summarizeThreadTitle, updateAIThreadTitle } from './service'
import {
  formatOracleUnavailableMessage,
  getLastUserText,
  getOracleCandidateModelIds,
  ORACLE_THREAD_ID_HEADER,
  pickGuestOracleResponse,
  toModelMessages,
  type OracleChatMessageInput,
} from './oracle-chat'

function queueOracleThreadPersistence(params: {
  userId: string
  threadId: string
  isNewThread: boolean
  userText: string
  initialThreadTitle: string
}) {
  void (async () => {
    try {
      if (params.isNewThread) {
        await createAIThread({
          id: params.threadId,
          userId: params.userId,
          title: params.initialThreadTitle,
          persona: 'oracle',
        })
      }

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
    const verification = await verifyNeonJWT(token)
    if (verification.valid && verification.payload) {
      authUserId = verification.payload.sub || (verification.payload as { id?: string }).id
    }
  }

  const userId = authUserId || body.userId
  const userText = getLastUserText(messages)

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
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

  if (!userId) {
    return Response.json({
      text: pickGuestOracleResponse(userText, messages.length),
      threadId: null,
      isGuest: true,
    })
  }

  let activeThreadId = body.threadId
  const isNewThread = !activeThreadId
  if (!activeThreadId) {
    activeThreadId = crypto.randomUUID()
  }
  const initialThreadTitle =
    userText.trim().split('\n')[0].slice(0, 60) || 'Ascendance Consultation'

  queueOracleThreadPersistence({
    userId,
    threadId: activeThreadId,
    isNewThread,
    userText,
    initialThreadTitle,
  })

  const systemPrompt = buildSystemPrompt()
  const payloadMessages = toModelMessages(messages)
  const candidateModels = getOracleCandidateModelIds(body.model)
  let lastError: Error | null = null

  for (const modelCandidate of candidateModels) {
    try {
      const threadIdForSave = activeThreadId
      const shouldSummarizeTitle = isNewThread
      const result = streamText({
        model: modelCandidate as any,
        system: systemPrompt,
        messages: payloadMessages,
        onFinish: async ({ text }) => {
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

            if (shouldSummarizeTitle) {
              // Asynchronously summarize thread title in the background without blocking TTFT
              summarizeThreadTitle(userText)
                .then(async (aiTitle) => {
                  if (aiTitle && aiTitle !== initialThreadTitle) {
                    await updateAIThreadTitle(threadIdForSave, aiTitle)
                  }
                })
                .catch((err) => {
                  console.warn('[handleOracleChatRequest] Async title summarization warning:', err)
                })
            }
          } catch (dbErr) {
            console.warn('[handleOracleChatRequest] DB assistant response logging warning:', dbErr)
          }
        },
        onError: ({ error }) => {
          console.warn(
            `[Oracle Chat] Model candidate '${modelCandidate}' stream error:`,
            error instanceof Error ? error.message : error
          )
        },
      })

      const headers: Record<string, string> = {}
      if (activeThreadId) {
        headers[ORACLE_THREAD_ID_HEADER] = activeThreadId
      }

      return createTextStreamResponse({
        headers,
        stream: toTextStream({ stream: result.stream }),
      })
    } catch (err: any) {
      console.warn(`[Oracle Chat] Model candidate '${modelCandidate}' failed:`, err?.message)
      lastError = err
    }
  }

  return Response.json(
    {
      error: formatOracleUnavailableMessage(lastError),
      text: formatOracleUnavailableMessage(lastError),
      threadId: activeThreadId ?? null,
    },
    { status: 502 }
  )
}
