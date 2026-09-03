import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streamOracleChat } from './stream-oracle-chat-client'
import { ORACLE_THREAD_ID_HEADER } from './oracle-chat'
import { getCachedUser, resolveAuthSession, setCachedUser } from '../auth-session'
import { getAuthJWTToken } from '../jwt'

vi.mock('../jwt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../jwt')>()
  return {
    ...actual,
    getAuthJWTToken: vi.fn().mockResolvedValue(null),
  }
})

describe('streamOracleChat client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(getAuthJWTToken).mockResolvedValue(null)
  })

  it('parses guest JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ text: 'Guest reply', threadId: null, isGuest: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const onChunk = vi.fn()
    const result = await streamOracleChat({
      messages: [{ role: 'user', content: 'hi' }],
      token: null,
      onChunk,
    })

    expect(result).toEqual({ text: 'Guest reply', threadId: null, isGuest: true })
    expect(onChunk).toHaveBeenCalledWith('Guest reply')
  })

  it('does not send Authorization when no JWT is available', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ text: 'Guest reply', threadId: null, isGuest: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await streamOracleChat({
      messages: [{ role: 'user', content: 'hi' }],
      token: null,
    })

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('sends Authorization Bearer when a compact JWT is available', async () => {
    const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1c3JfcWEifQ.sig'
    vi.mocked(getAuthJWTToken).mockResolvedValueOnce(jwt)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('oracle answer', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          [ORACLE_THREAD_ID_HEADER]: 'thread-jwt',
        },
      })
    )

    await streamOracleChat({
      messages: [{ role: 'user', content: 'hi' }],
      userId: 'usr_qa',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        }),
      }),
    )
    const body = JSON.parse(String((fetchSpy.mock.calls[0]?.[1] as RequestInit).body))
    expect(body.userId).toBe('usr_qa')
  })

  it('streams plain text and reports thread id from header', async () => {
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('partial '))
        controller.enqueue(encoder.encode('answer'))
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          [ORACLE_THREAD_ID_HEADER]: 'thread-xyz',
        },
      })
    )

    const chunks: string[] = []
    const onThreadId = vi.fn()
    const result = await streamOracleChat({
      messages: [{ role: 'user', content: 'hi' }],
      userId: 'usr_1',
      token: null,
      onThreadId,
      onChunk: (t) => chunks.push(t),
    })

    expect(onThreadId).toHaveBeenCalledWith('thread-xyz')
    expect(result.text).toBe('partial answer')
    expect(result.threadId).toBe('thread-xyz')
    expect(chunks.at(-1)).toBe('partial answer')
  })

  it('throws plain error messages from failed JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await expect(
      streamOracleChat({ messages: [{ role: 'user', content: 'hi' }], token: null })
    ).rejects.toThrow('Rate limit exceeded.')
  })

  it('does not drop a signed-in session when the Oracle request errors', async () => {
    setCachedUser({ id: 'usr_qa', name: 'Probe' })
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('upstream timeout'))

    await expect(
      streamOracleChat({ messages: [{ role: 'user', content: 'hi' }], userId: 'usr_qa', token: null }),
    ).rejects.toThrow('upstream timeout')

    expect(getCachedUser()?.id).toBe('usr_qa')
    const state = resolveAuthSession({
      data: null,
      isPending: false,
      error: new Error('upstream timeout'),
    })
    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.userId).toBe('usr_qa')
  })

  it('still posts when JWT mint fails and does not treat that as a sign-out', async () => {
    setCachedUser({ id: 'usr_qa', name: 'Probe' })
    vi.mocked(getAuthJWTToken).mockResolvedValueOnce(null)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ text: 'ok', threadId: 't1', isGuest: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const result = await streamOracleChat({
      messages: [{ role: 'user', content: 'hi' }],
      userId: 'usr_qa',
    })

    expect(result.isGuest).toBe(false)
    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(JSON.parse(String((fetchSpy.mock.calls[0]?.[1] as RequestInit).body)).userId).toBe('usr_qa')
    expect(resolveAuthSession({ data: null, isPending: false }).isAuthenticated).toBe(true)
  })

  it('throws error when plain text stream completes with empty content', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    )

    await expect(
      streamOracleChat({ messages: [{ role: 'user', content: 'hi' }], token: null })
    ).rejects.toThrow('No response received. Please try again.')
  })
})
