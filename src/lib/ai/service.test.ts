import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reserveOracleChatUsage, summarizeThreadTitle } from './service'
import { ORACLE_TITLE_MODEL_ID, getOracleThreadFallbackTitle } from './oracle-models'
import { PgDialect } from 'drizzle-orm/pg-core'

const { neonClient } = vi.hoisted(() => {
  const client: any = (strings: TemplateStringsArray, ...values: unknown[]) => ({
    text: strings.join('?'),
    values,
  })
  client.transaction = vi.fn()
  return { neonClient: client }
})

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({
    $client: neonClient,
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'thread-1', title: 'Test Title' }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  })),
}))

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(undefined),
}))

describe('summarizeThreadTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    neonClient.transaction.mockReset()
  })

  it('uses the title model with bounded generation and returns a cleaned title', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '"Carcinization Acceleration Tips"',
    } as any)

    const title = await summarizeThreadTitle('How can I molt faster and increase my chitin density?')
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ORACLE_TITLE_MODEL_ID,
        maxRetries: 0,
        maxOutputTokens: 32,
        reasoning: 'none',
        abortSignal: expect.any(AbortSignal),
      })
    )
    expect(title).toBe('Carcinization Acceleration Tips')
  })

  it('strips "Title:" prefixes, extra quotes, and trailing ellipses from model output', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValueOnce({
      text: 'Title: Daily Molt Routine Guide...',
    } as any)

    const title = await summarizeThreadTitle('What should my daily routine be?')
    expect(title).toBe('Daily Molt Routine Guide')
  })

  it('falls back to sliced user message if generateText fails', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Gateway timeout'))

    const title = await summarizeThreadTitle('What is the best way to shed biological hesitation?')
    expect(title).toBe('What is the best way to shed biological hesitation?')
  })

  it('handles empty or blank prompt gracefully with default fallback', async () => {
    const title = await summarizeThreadTitle('   ')
    expect(title).toBe('Ascendance Consultation')
  })

  it('retains the same initial excerpt on empty output and provider failure', async () => {
    const message = 'A long opening message '.repeat(20) + '\nAnd another question'
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValueOnce({ text: '' } as any)
    expect(await summarizeThreadTitle(message)).toBe(getOracleThreadFallbackTitle(message))
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Provider unavailable'))
    expect(await summarizeThreadTitle(message)).toBe(getOracleThreadFallbackTitle(message))
  })

  it('does not call a model after the request has been cancelled', async () => {
    const controller = new AbortController()
    controller.abort()
    const { generateText } = await import('ai')
    expect(await summarizeThreadTitle('A cancelled conversation', undefined, undefined, controller.signal))
      .toBe('A cancelled conversation')
    expect(generateText).not.toHaveBeenCalled()
  })

  it('bounds input and forwards cancellation to the generation request', async () => {
    const controller = new AbortController()
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockImplementationOnce(async ({ abortSignal }: any) => {
      expect(abortSignal.aborted).toBe(false)
      controller.abort()
      expect(abortSignal.aborted).toBe(true)
      throw new Error('Aborted')
    })
    const message = 'x'.repeat(1_000)
    expect(await summarizeThreadTitle(message, undefined, undefined, controller.signal))
      .toBe(getOracleThreadFallbackTitle(message))
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toHaveLength(500)
  })
})

describe('reserveOracleChatUsage', () => {
  const serverTime = '2026-10-30T12:00:00.000Z'

  it('checks current rolling windows and inserts only inside a serializable transaction', async () => {
    neonClient.transaction.mockResolvedValueOnce([[
      { timestamps: [], is_premium: false, allowed: true, id: 'reserved-1', server_time: serverTime },
    ]])

    await expect(reserveOracleChatUsage('member-1')).resolves.toEqual({ allowed: true, id: 'reserved-1', isPremium: false })
    const { ensureUserProfile } = await import('../user-sync')
    expect(ensureUserProfile).toHaveBeenCalledWith('member-1')
    expect(neonClient.transaction).toHaveBeenCalledWith(
      [expect.objectContaining({ text: expect.stringContaining('INSERT INTO ai_usage_events') })],
      { isolationLevel: 'Serializable' },
    )
    const query = neonClient.transaction.mock.calls[0][0][0]
    expect(query.text).toContain("kind = 'chat'")
    expect(query.text).toContain('profiles')
    expect(query.text).toContain('last_minute')
    expect(query.text).toContain('now()::timestamp')
    expect(query.text).toContain('"createdAt" > clock.db_now - interval \'7 days\'')
    expect(query.text).toContain("'1 minute'")
    expect(query.values).toContain('member-1')
  })

  it('returns a current 429 decision without an id when the atomic check denies the reservation', async () => {
    neonClient.transaction.mockResolvedValueOnce([[
      {
        timestamps: Array.from({ length: 5 }, () => new Date(new Date(serverTime).getTime() - 10_000)),
        is_premium: false,
        allowed: false,
        id: null,
        server_time: serverTime,
      },
    ]])

    await expect(reserveOracleChatUsage('member-1')).resolves.toMatchObject({
      allowed: false,
      decision: { allowed: false, scope: 'minute', retryAfterSeconds: 50 },
    })
  })

  it('rechecks against the retry transaction clock and sees a newer committed reservation', async () => {
    neonClient.transaction
      .mockRejectedValueOnce({ code: '40001' })
      .mockResolvedValueOnce([[
        {
          timestamps: Array.from({ length: 5 }, () => new Date(new Date(serverTime).getTime() - 10_000)),
          is_premium: false,
          allowed: false,
          id: null,
          server_time: serverTime,
        },
      ]])

    await expect(reserveOracleChatUsage('member-1')).resolves.toMatchObject({
      allowed: false,
      decision: { allowed: false, scope: 'minute', retryAfterSeconds: 50 },
    })
    expect(neonClient.transaction).toHaveBeenCalledTimes(2)
  })
})

describe('updateAIThreadTitle', () => {
  it('updates thread title and returns updated record', async () => {
    const { updateAIThreadTitle } = await import('./service')
    const res = await updateAIThreadTitle('thread-1', 'New Generated Title', 'usr_1', 'Original excerpt')
    expect(res).toBeDefined()
    const { getDb } = await import('../../db')
    const db = vi.mocked(getDb).mock.results.at(-1)?.value
    const predicate = new PgDialect().sqlToQuery(db.where.mock.calls[0][0])
    expect(predicate.sql).toContain('"ai_threads"."userId"')
    expect(predicate.sql).toContain('"ai_threads"."title"')
    expect(predicate.params).toEqual(['thread-1', 'usr_1', 'Original excerpt'])
  })

  it('returns null if threadId or title is missing', async () => {
    const { updateAIThreadTitle } = await import('./service')
    expect(await updateAIThreadTitle('', 'Title', 'usr_1', 'Original')).toBeNull()
    expect(await updateAIThreadTitle('thread-1', '', 'usr_1', 'Original')).toBeNull()
  })
})
