import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAIThreadsHandler,
  getAIMessagesHandler,
  sendChatMessageHandler,
  pinAIThreadHandler,
  archiveAIThreadHandler,
  deleteAIThreadHandler,
} from './db-services'

vi.mock('./write-auth', () => ({
  resolveWriteAuth: vi.fn(),
}))

vi.mock('../ai/service', () => ({
  getUserAIThreads: vi.fn(),
  getAIThreadMessages: vi.fn(),
  getOwnedAIThread: vi.fn(),
  saveAIMessage: vi.fn(),
  createAIThread: vi.fn(),
  pinAIThread: vi.fn(),
  archiveAIThread: vi.fn(),
  deleteAIThread: vi.fn(),
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

const jwtAuth = {
  userId: 'usr_jwt',
  token: 'a.b.c',
  dbClient: {} as any,
  payload: { sub: 'usr_jwt' },
}

describe('Oracle thread mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pinAIThreadHandler requires auth', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(null)

    await expect(
      pinAIThreadHandler({ data: { threadId: 't1', pinned: true }, context: {} })
    ).rejects.toThrow('Unauthenticated')

    const { pinAIThread } = await import('../ai/service')
    expect(pinAIThread).not.toHaveBeenCalled()
  })

  it('pinAIThreadHandler pins with the JWT subject', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { pinAIThread } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(jwtAuth)
    vi.mocked(pinAIThread).mockResolvedValueOnce({
      id: 't1',
      title: 'Pinned',
      pinnedAt: new Date('2026-01-01T00:00:00Z'),
      archivedAt: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as any)

    const res = await pinAIThreadHandler({
      data: { threadId: 't1', pinned: true },
      context: { user: { sub: 'usr_jwt' } },
    })

    expect(pinAIThread).toHaveBeenCalledWith('usr_jwt', 't1', true)
    expect(res.thread?.id).toBe('t1')
    expect(res.thread?.pinnedAt).toBeTruthy()
  })

  it('pinAIThreadHandler throws Thread not found on miss', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { pinAIThread } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(jwtAuth)
    vi.mocked(pinAIThread).mockResolvedValueOnce(null)

    await expect(
      pinAIThreadHandler({ data: { threadId: 'missing', pinned: true }, context: {} })
    ).rejects.toThrow('Thread not found')
  })

  it('archiveAIThreadHandler requires auth', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(null)

    await expect(
      archiveAIThreadHandler({ data: { threadId: 't1', archived: true }, context: {} })
    ).rejects.toThrow('Unauthenticated')

    const { archiveAIThread } = await import('../ai/service')
    expect(archiveAIThread).not.toHaveBeenCalled()
  })

  it('archiveAIThreadHandler archives with the JWT subject', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { archiveAIThread } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(jwtAuth)
    vi.mocked(archiveAIThread).mockResolvedValueOnce({
      id: 't1',
      title: 'Archived',
      pinnedAt: null,
      archivedAt: new Date('2026-01-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as any)

    const res = await archiveAIThreadHandler({
      data: { threadId: 't1', archived: true },
      context: { user: { sub: 'usr_jwt' } },
    })

    expect(archiveAIThread).toHaveBeenCalledWith('usr_jwt', 't1', true)
    expect(res.thread?.archivedAt).toBeTruthy()
  })

  it('archiveAIThreadHandler throws Thread not found on miss', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { archiveAIThread } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(jwtAuth)
    vi.mocked(archiveAIThread).mockResolvedValueOnce(null)

    await expect(
      archiveAIThreadHandler({ data: { threadId: 'missing', archived: true }, context: {} })
    ).rejects.toThrow('Thread not found')
  })

  it('deleteAIThreadHandler requires auth', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(null)

    await expect(deleteAIThreadHandler({ data: { threadId: 't1' }, context: {} })).rejects.toThrow(
      'Unauthenticated'
    )

    const { deleteAIThread } = await import('../ai/service')
    expect(deleteAIThread).not.toHaveBeenCalled()
  })

  it('deleteAIThreadHandler deletes with the JWT subject', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { deleteAIThread } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(jwtAuth)
    vi.mocked(deleteAIThread).mockResolvedValueOnce(true)

    const res = await deleteAIThreadHandler({
      data: { threadId: 't1' },
      context: { user: { sub: 'usr_jwt' } },
    })

    expect(deleteAIThread).toHaveBeenCalledWith('usr_jwt', 't1')
    expect(res).toEqual({ ok: true })
  })

  it('deleteAIThreadHandler throws Thread not found on miss', async () => {
    const { resolveWriteAuth } = await import('./write-auth')
    const { deleteAIThread } = await import('../ai/service')
    vi.mocked(resolveWriteAuth).mockResolvedValueOnce(jwtAuth)
    vi.mocked(deleteAIThread).mockResolvedValueOnce(false)

    await expect(deleteAIThreadHandler({ data: { threadId: 'missing' }, context: {} })).rejects.toThrow(
      'Thread not found'
    )
  })
})
