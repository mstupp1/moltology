import { ORACLE_THREAD_ID_HEADER } from './oracle-chat'
import { getAuthJWTToken, jwtAuthHeaders } from '../jwt'

export interface StreamOracleChatParams {
  messages: Array<{ role: string; content: string }>
  userId?: string | null
  threadId?: string | null
  model?: string
  /**
   * Compact JWT for `Authorization: Bearer`. When omitted, mint one with a short
   * timeout. Pass `null` to skip (guest / tests). Same-origin cookies are never
   * enough: `/api/chat` only accepts Bearer or `x-auth-token`.
   */
  token?: string | null
  signal?: AbortSignal
  onThreadId?: (threadId: string) => void
  onChunk?: (fullText: string) => void
}

export interface StreamOracleChatResult {
  text: string
  threadId: string | null
  isGuest?: boolean
}

async function resolveOracleToken(token: string | null | undefined): Promise<string | null> {
  if (token === null) return null
  if (typeof token === 'string' && token.length > 0) return token
  try {
    return (await getAuthJWTToken()) ?? null
  } catch {
    return null
  }
}

/**
 * Client helper: POST /api/chat and either parse guest JSON or stream plain text tokens.
 * Auth is a Bearer JWT, not the Better Auth session cookie.
 */
export async function streamOracleChat(params: StreamOracleChatParams): Promise<StreamOracleChatResult> {
  const token = await resolveOracleToken(params.token)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...jwtAuthHeaders(token),
    },
    credentials: 'same-origin',
    signal: params.signal,
    body: JSON.stringify({
      messages: params.messages,
      userId: params.userId || undefined,
      threadId: params.threadId || undefined,
      model: params.model,
    }),
  })

  const contentType = res.headers.get('content-type') || ''
  const headerThreadId = res.headers.get(ORACLE_THREAD_ID_HEADER)

  if (contentType.includes('application/json')) {
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || data?.text || 'Something went wrong sending your message. Please try again.')
    }
    const text = data?.text || ''
    if (data?.threadId && params.onThreadId) {
      params.onThreadId(data.threadId)
    }
    if (text && params.onChunk) {
      params.onChunk(text)
    }
    return {
      text,
      threadId: data?.threadId ?? null,
      isGuest: Boolean(data?.isGuest),
    }
  }

  if (!res.ok) {
    const fallback = await res.text().catch(() => '')
    throw new Error(fallback || 'Something went wrong sending your message. Please try again.')
  }

  if (headerThreadId && params.onThreadId) {
    params.onThreadId(headerThreadId)
  }

  if (!res.body) {
    throw new Error('Empty response from chat server.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    fullText += decoder.decode(value, { stream: true })
    params.onChunk?.(fullText)
  }
  fullText += decoder.decode()
  params.onChunk?.(fullText)

  if (!fullText.trim()) {
    throw new Error('No response received. Please try again.')
  }

  return {
    text: fullText,
    threadId: headerThreadId,
  }
}
