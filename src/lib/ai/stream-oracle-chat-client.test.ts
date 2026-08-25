import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streamOracleChat } from './stream-oracle-chat-client'
import { ORACLE_THREAD_ID_HEADER } from './oracle-chat'

describe('streamOracleChat client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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
      onChunk,
    })

    expect(result).toEqual({ text: 'Guest reply', threadId: null, isGuest: true })
    expect(onChunk).toHaveBeenCalledWith('Guest reply')
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
      streamOracleChat({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow('Rate limit exceeded.')
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
      streamOracleChat({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow('The Oracle was unable to formulate a response. Please try again.')
  })
})

