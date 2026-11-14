import { describe, expect, it, vi } from 'vitest'
import { cleanSupportSummary, triageSupportTicket } from './support-triage'

describe('cleanSupportSummary', () => {
  it('strips quotes, prefixes, markdown and trailing periods', () => {
    expect(cleanSupportSummary('Subject: "Charged twice for MAX."')).toBe('Charged twice for MAX')
    expect(cleanSupportSummary('**Cannot sign in**\nextra line')).toBe('Cannot sign in')
  })

  it('rejects empty or too-short output', () => {
    expect(cleanSupportSummary('')).toBeNull()
    expect(cleanSupportSummary('  ok ')).toBeNull()
    expect(cleanSupportSummary(null)).toBeNull()
  })
})

describe('triageSupportTicket', () => {
  it('keeps a valid Laya topic even when priority is unknown', async () => {
    const result = await triageSupportTicket('The forum feed is blank on my phone.', {
      classify: vi.fn().mockResolvedValue({ topic: { choice: 'bug' }, priority: { choice: 'SOON' } }),
      summarize: vi.fn().mockResolvedValue('Forum feed blank on phone'),
    })
    expect(result).toEqual({
      category: 'BUG',
      urgency: 'NORMAL',
      subject: 'Forum feed blank on phone',
      triageSource: 'laya',
      summarySource: 'model',
    })
  })
})
