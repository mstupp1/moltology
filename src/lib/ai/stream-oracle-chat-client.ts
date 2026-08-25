import { ORACLE_THREAD_ID_HEADER } from './oracle-chat'

export interface StreamOracleChatParams {
  messages: Array<{ role: string; content: string }>
  userId?: string | null
  threadId?: string | null
  model?: string
  signal?: AbortSignal
  onThreadId?: (threadId: string) => void
  onChunk?: (fullText: string) => void
}

export interface StreamOracleChatResult {
  text: string
  threadId: string | null
  isGuest?: boolean
}

/**
 * Client helper: POST /api/chat and either parse guest JSON or stream plain text tokens.
 */
export async function streamOracleChat(params: StreamOracleChatParams): Promise<StreamOracleChatResult> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    throw new Error('Empty response from Oracle chat.')
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
    throw new Error('The Oracle was unable to formulate a response. Please try again.')
  }

  return {
    text: fullText,
    threadId: headerThreadId,
  }
}

