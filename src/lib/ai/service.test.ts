import { describe, it, expect, vi, beforeEach } from 'vitest'
import { summarizeThreadTitle } from './service'
import { ORACLE_TITLE_MODEL_ID } from './oracle-models'

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({
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
  })

  it('uses ORACLE_TITLE_MODEL_ID (alibaba/qwen3.7-flash) and returns cleaned AI-generated title', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '"Carcinization Acceleration Tips"',
    } as any)

    const title = await summarizeThreadTitle('How can I molt faster and increase my chitin density?')
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ORACLE_TITLE_MODEL_ID,
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
})

describe('updateAIThreadTitle', () => {
  it('updates thread title and returns updated record', async () => {
    const { updateAIThreadTitle } = await import('./service')
    const res = await updateAIThreadTitle('thread-1', 'New Generated Title')
    expect(res).toBeDefined()
  })

  it('returns null if threadId or title is missing', async () => {
    const { updateAIThreadTitle } = await import('./service')
    expect(await updateAIThreadTitle('', 'Title')).toBeNull()
    expect(await updateAIThreadTitle('thread-1', '')).toBeNull()
  })
})
