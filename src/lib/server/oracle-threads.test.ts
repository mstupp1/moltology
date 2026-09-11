import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAIThreadsHandler, getAIMessagesHandler, sendChatMessageHandler } from './db-services'

vi.mock('./write-auth', () => ({
  resolveWriteAuth: vi.fn(),
}))

vi.mock('../ai/service', () => ({
  getUserAIThreads: vi.fn(),
  getAIThreadMessages: vi.fn(),
  getOwnedAIThread: vi.fn(),
  saveAIMessage: vi.fn(),
  createAIThread: vi.fn(),
  summarizeThreadTitle: vi.fn().mockResolvedValue('Title'),
}))

vi.mock('../ai/guardrails', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 29, resetMs: 60000 })),
  validateInputGuardrails: vi.fn(() => ({ allowed: true })),
}))

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'Oracle reply' }),
}))

describe('Oracle thread authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAIThreadsHandler ignores client userId and returns [] without a JWT', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(null)

    const rows = await getAIThreadsHandler({
      data: { userId: 'victim-user' },
      context: {},
    })

    expect(rows).toEqual([])
    const { getUserAIThreads } = await import('../ai/service')
    expect(getUserAIThreads).not.toHaveBeenCalled()
  })

  it('getAIThreadsHandler lists only the JWT subject threads', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { getUserAIThreads } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce({
      userId: 'usr_jwt',
      token: 'a.b.c',
      dbClient: {} as any,
      payload: { sub: 'usr_jwt' },
    })
    vi.mocked(getUserAIThreads).mockResolvedValueOnce([{ id: 't1' }] as any)

    const rows = await getAIThreadsHandler({
      data: { userId: 'usr_jwt' },
      context: { user: { sub: 'usr_jwt' } },
    })

    expect(getUserAIThreads).toHaveBeenCalledWith('usr_jwt')
    expect(rows).toEqual([{ id: 't1' }])
  })

  it('getAIMessagesHandler returns [] without a JWT even when threadId is supplied', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(null)

    const rows = await getAIMessagesHandler({
      data: { threadId: 'victim-thread' },
      context: {},
    })

    expect(rows).toEqual([])
    const { getAIThreadMessages } = await import('../ai/service')
    expect(getAIThreadMessages).not.toHaveBeenCalled()
  })

  it('getAIMessagesHandler scopes messages to the authenticated owner', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { getAIThreadMessages } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce({
      userId: 'usr_jwt',
      token: 'a.b.c',
      dbClient: {} as any,
      payload: { sub: 'usr_jwt' },
    })
    vi.mocked(getAIThreadMessages).mockResolvedValueOnce([
      { id: 'm1', threadId: 't1', userId: 'usr_jwt', role: 'user', content: 'hi', createdAt: new Date() },
    ] as any)

    const rows = await getAIMessagesHandler({
      data: { threadId: 't1' },
      context: { user: { sub: 'usr_jwt' } },
    })

    expect(getAIThreadMessages).toHaveBeenCalledWith('t1', 'usr_jwt')
    expect(rows[0]?.content).toBe('hi')
  })

  it('sendChatMessageHandler stays in guest mode when only userId is supplied', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(null)

    const res = await sendChatMessageHandler({
      data: {
        messages: [{ role: 'user', content: 'Teach me ecdysis' }],
        userId: 'spoofed-user',
      },
      context: {},
    })

    expect(res).toMatchObject({ isGuest: true, threadId: null })
    const { generateText } = await import('ai')
    expect(generateText).not.toHaveBeenCalled()
  })
})
