import { describe, it, expect } from 'vitest'
import { describeAlignmentToday, pickDashboardNextStep } from './dashboard-next-step'

describe('pickDashboardNextStep', () => {
  it('asks guests to join before anything else', () => {
    expect(pickDashboardNextStep({ isGuest: true, completedCount: 0, totalCount: 8 }).kind).toBe('join')
  })

  it('points at alignment while liturgies remain', () => {
    const fresh = pickDashboardNextStep({ isGuest: false, completedCount: 0, totalCount: 8 })
    expect(fresh).toMatchObject({ kind: 'alignment', remaining: 8, label: 'Start today’s alignment' })

    const partial = pickDashboardNextStep({
      isGuest: false,
      completedCount: 5,
      totalCount: 8,
      lastThread: { id: 't1', title: 'Shell care' },
    })
    expect(partial).toMatchObject({ kind: 'alignment', remaining: 3, label: 'Continue alignment' })
  })

  it('resumes the last Oracle thread once alignment is done', () => {
    expect(
      pickDashboardNextStep({ isGuest: false, completedCount: 8, totalCount: 8, lastThread: { id: 't1', title: '  ' } }),
    ).toEqual({ kind: 'resume-oracle', label: 'Continue consultation', threadId: 't1', threadTitle: 'Untitled consultation' })
  })

  it('falls back to a fresh consultation', () => {
    expect(pickDashboardNextStep({ isGuest: false, completedCount: 8, totalCount: 8, lastThread: null }).kind).toBe('oracle')
  })
})

describe('describeAlignmentToday', () => {
  it('reads the real count', () => {
    expect(describeAlignmentToday(0, 8)).toBe('8 liturgies waiting today.')
    expect(describeAlignmentToday(7, 8)).toBe('1 liturgy left today.')
    expect(describeAlignmentToday(3, 8)).toBe('5 liturgies left today.')
    expect(describeAlignmentToday(8, 8)).toBe('All liturgies done today. The shell holds.')
  })
})
