import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleOracleChatRequest } from './handle-oracle-chat-request'
import { ORACLE_THREAD_ID_HEADER, ORACLE_UNAVAILABLE_MESSAGE } from './oracle-chat'
import { ORACLE_MODELS } from './oracle-models'

vi.mock('../jwt', () => ({
  verifyNeonJWT: vi.fn().mockResolvedValue({ valid: false }),
  looksLikeJwt: (token?: string | null) =>
    !!token && token.split('.').length === 3 && token.split('.').every((part) => part.length > 0),
}))

vi.mock('./guardrails', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 29, resetMs: 60000 })),
  validateInputGuardrails: vi.fn(() => ({ allowed: true })),
}))

vi.mock('./service', () => ({
  summarizeThreadTitle: vi.fn().mockResolvedValue('Test Title'),
  createAIThread: vi.fn().mockResolvedValue({ id: 'thread-1' }),
  saveAIMessage: vi.fn().mockResolvedValue({ id: 'msg-1' }),
  updateAIThreadTitle: vi.fn().mockResolvedValue({ id: 'thread-1' }),
  getOwnedAIThread: vi.fn().mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111', userId: 'usr_from_jwt' }),
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

const TEST_THREAD_ID = '11111111-1111-4111-8111-111111111111'
const TEST_JWT = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1c3JfZnJvbV9qd3QifQ.sig'

function makeRequest(body: unknown, init?: RequestInit) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  })
}

async function authedRequest(body: unknown) {
  const { verifyNeonJWT } = await import('../jwt')
  vi.mocked(verifyNeonJWT).mockResolvedValueOnce({
    valid: true,
    payload: { sub: 'usr_from_jwt' },
    error: null,
  } as any)
  return makeRequest(body, { headers: { Authorization: `Bearer ${TEST_JWT}` } })
}
const encoder = new TextEncoder()

function textStream(text: string) {
  return new ReadableStream({
    start(controller) {
      if (text) controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
}

function emptyStream() {
  return new ReadableStream({
    start(controller) {
      controller.close()
    },
  })
}

describe('handleOracleChatRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(TEST_THREAD_ID)
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

  it('returns guest JSON when only a Better Auth session cookie is present', async () => {
    const res = await handleOracleChatRequest(
      makeRequest(
        { messages: [{ role: 'user', content: 'What is moltology?' }] },
        { headers: { cookie: 'better-auth.session_token=opaque-session-id; Path=/; HttpOnly' } },
      )
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.isGuest).toBe(true)
    expect(streamTextMock).not.toHaveBeenCalled()
  })

  it('streams for a Bearer JWT even without body.userId', async () => {
    const { verifyNeonJWT } = await import('../jwt')
    vi.mocked(verifyNeonJWT).mockResolvedValueOnce({
      valid: true,
      payload: { sub: 'usr_from_jwt' },
      error: null,
    } as any)

    const encoder = new TextEncoder()
    const fakeStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('From JWT'))
        controller.close()
      },
    })
    streamTextMock.mockReturnValueOnce({ stream: fakeStream })

    const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1c3JfZnJvbV9qd3QifQ.sig'
    const res = await handleOracleChatRequest(
      makeRequest(
        { messages: [{ role: 'user', content: 'Teach me ecdysis' }] },
        { headers: { Authorization: `Bearer ${jwt}` } },
      )
    )

    expect(verifyNeonJWT).toHaveBeenCalledWith(jwt)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/plain/)
    expect(await res.text()).toBe('From JWT')
  })

  it('returns guest JSON when only body.userId is present', async () => {
    const res = await handleOracleChatRequest(
      makeRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
        userId: 'usr_spoofed',
      })
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.isGuest).toBe(true)
    expect(streamTextMock).not.toHaveBeenCalled()
  })

  it('streams text and sets thread header for a verified JWT', async () => {
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
      await authedRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
        model: 'zai/glm-5.3-flash',
      })
    )

    expect(res.status).toBe(200)
    expect(res.headers.get(ORACLE_THREAD_ID_HEADER)).toBe(TEST_THREAD_ID)
    expect(res.headers.get('content-type')).toMatch(/text\/plain/)
    expect(streamTextMock).toHaveBeenCalled()
    const text = await res.text()
    expect(text).toBe('Hello initiate')
  })

  it('rejects a threadId the JWT subject does not own', async () => {
    const { getOwnedAIThread } = await import('./service')
    vi.mocked(getOwnedAIThread).mockResolvedValueOnce(null)

    const res = await handleOracleChatRequest(
      await authedRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
        threadId: 'victim-thread',
      })
    )

    expect(res.status).toBe(403)
    expect(streamTextMock).not.toHaveBeenCalled()
  })

  it('streams before slow DB persistence completes', async () => {
    const { createAIThread, saveAIMessage } = await import('./service')
    let resolveCreate: (() => void) | undefined
    vi.mocked(createAIThread).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCreate = () => resolve({ id: 'thread-1' } as any)
        })
    )

    const encoder = new TextEncoder()
    const fakeStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('Fast '))
        controller.close()
      },
    })
    streamTextMock.mockReturnValueOnce({ stream: fakeStream })

    const requestPromise = handleOracleChatRequest(
      await authedRequest({
        messages: [{ role: 'user', content: 'Speed test' }],
      })
    )

    await vi.waitFor(() => {
      expect(streamTextMock).toHaveBeenCalled()
    })
    expect(saveAIMessage).not.toHaveBeenCalled()

    resolveCreate?.()
    const res = await requestPromise
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Fast ')
  })

  it('returns 400 when messages are missing', async () => {
    const res = await handleOracleChatRequest(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Messages/i)
  })

  it('uses the primary model when it streams a response', async () => {
    streamTextMock.mockReturnValueOnce({ stream: textStream('Primary answer') })

    const res = await handleOracleChatRequest(
      await authedRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
      })
    )

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Primary answer')
    expect(streamTextMock).toHaveBeenCalledTimes(1)
    expect(streamTextMock.mock.calls[0]?.[0]?.model).toBe(ORACLE_MODELS[0].id)
  })

  it('falls through to the next model when the primary provider throws', async () => {
    streamTextMock.mockImplementationOnce(() => {
      throw new Error('Provider unavailable')
    })
    streamTextMock.mockReturnValueOnce({ stream: textStream('Recovered answer') })

    const res = await handleOracleChatRequest(
      await authedRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
      })
    )

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Recovered answer')
    expect(streamTextMock).toHaveBeenCalledTimes(2)
  })

  it('falls through to the next model when the primary stream is empty', async () => {
    streamTextMock.mockReturnValueOnce({ stream: emptyStream() })
    streamTextMock.mockReturnValueOnce({ stream: textStream('Secondary answer') })

    const res = await handleOracleChatRequest(
      await authedRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
      })
    )

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Secondary answer')
    expect(streamTextMock).toHaveBeenCalledTimes(2)
    expect(streamTextMock.mock.calls[0]?.[0]?.model).toBe(ORACLE_MODELS[0].id)
    expect(streamTextMock.mock.calls[1]?.[0]?.model).toBe(ORACLE_MODELS[1].id)
  })

  it('returns 502 only after every model in the list fails', async () => {
    for (const _model of ORACLE_MODELS) {
      streamTextMock.mockReturnValueOnce({ stream: emptyStream() })
    }

    const res = await handleOracleChatRequest(
      await authedRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
      })
    )

    expect(res.status).toBe(502)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    const data = await res.json()
    expect(data.error).toContain(ORACLE_UNAVAILABLE_MESSAGE)
    expect(data.text).toContain(ORACLE_UNAVAILABLE_MESSAGE)
    expect(streamTextMock).toHaveBeenCalledTimes(ORACLE_MODELS.length)
  })

  it('tries the selected model first, then remaining candidates', async () => {
    streamTextMock.mockReturnValueOnce({ stream: emptyStream() })
    streamTextMock.mockReturnValueOnce({ stream: textStream('Fallback after pick') })

    const selected = 'alibaba/qwen3.8-flash'
    const res = await handleOracleChatRequest(
      await authedRequest({
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
        model: selected,
      })
    )

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Fallback after pick')
    expect(streamTextMock.mock.calls[0]?.[0]?.model).toBe(selected)
    expect(streamTextMock.mock.calls[1]?.[0]?.model).toBe(ORACLE_MODELS[0].id)
  })
})
