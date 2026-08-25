import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleOracleChatRequest } from './handle-oracle-chat-request'
import { ORACLE_THREAD_ID_HEADER } from './oracle-chat'

vi.mock('../jwt', () => ({
  verifyNeonJWT: vi.fn().mockResolvedValue({ valid: false }),
}))

vi.mock('./guardrails', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 29, resetMs: 60000 })),
  validateInputGuardrails: vi.fn(() => ({ allowed: true })),
}))

vi.mock('./service', () => ({
  summarizeThreadTitle: vi.fn().mockResolvedValue('Test Title'),
  createAIThread: vi.fn().mockResolvedValue({ id: 'thread-1' }),
  saveAIMessage: vi.fn().mockResolvedValue({ id: 'msg-1' }),
}))

vi.mock('./codex-prompt', () => ({
  buildSystemPrompt: vi.fn(() => 'system prompt'),
}))

const streamTextMock = vi.fn()
vi.mock('ai', () => ({
  streamText: (...args: any[]) => streamTextMock(...args),
  toTextStream: ({ stream }: any) => stream,
  createTextStreamResponse: ({ stream, headers }: any) =>
    new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(headers || {}),
      },
    }),
}))

function makeRequest(body: unknown, init?: RequestInit) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  })
}

describe('handleOracleChatRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns guest JSON when unauthenticated', async () => {
    const res = await handleOracleChatRequest(
      makeRequest({
        messages: [{ role: 'user', content: 'What is moltology?' }],
      })
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    const data = await res.json()
    expect(data.isGuest).toBe(true)
    expect(data.threadId).toBeNull()
    expect(data.text).toMatch(/Guest|account|Sign up|Oracle/i)
    expect(streamTextMock).not.toHaveBeenCalled()
  })

  it('streams text and sets thread header for authenticated body.userId', async () => {
    const encoder = new TextEncoder()
    const fakeStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('Hello '))
        controller.enqueue(encoder.encode('initiate'))
        controller.close()
      },
    })
    streamTextMock.mockReturnValueOnce({
      stream: fakeStream,
    })

    const res = await handleOracleChatRequest(
      makeRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
        userId: 'usr_test',
        model: 'alibaba/qwen3.7-flash',
      })
    )

    expect(res.status).toBe(200)
    expect(res.headers.get(ORACLE_THREAD_ID_HEADER)).toBe('thread-1')
    expect(res.headers.get('content-type')).toMatch(/text\/plain/)
    expect(streamTextMock).toHaveBeenCalled()
    const text = await res.text()
    expect(text).toBe('Hello initiate')
  })

  it('returns 400 when messages are missing', async () => {
    const res = await handleOracleChatRequest(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Messages/i)
  })
})
