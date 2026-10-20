/**
 * The single "next step" the dashboard's Today strip offers.
 * Order: guests are asked to join, then today's alignment, then the last Oracle consultation.
 */
export type DashboardNextStep =
  | { kind: 'join'; label: string }
  | { kind: 'alignment'; label: string; remaining: number }
  | { kind: 'resume-oracle'; label: string; threadId: string; threadTitle: string }
  | { kind: 'oracle'; label: string }

export interface DashboardNextStepInput {
  isGuest: boolean
  completedCount: number
  totalCount: number
  lastThread?: { id: string; title?: string | null } | null
}

export function pickDashboardNextStep({
  isGuest,
  completedCount,
  totalCount,
  lastThread,
}: DashboardNextStepInput): DashboardNextStep {
  if (isGuest) return { kind: 'join', label: 'Create your free account' }

  const remaining = Math.max(0, totalCount - completedCount)
  if (remaining > 0) {
    return {
      kind: 'alignment',
      label: completedCount === 0 ? 'Start today’s alignment' : 'Continue alignment',
      remaining,
    }
  }

  if (lastThread?.id) {
    return {
      kind: 'resume-oracle',
      label: 'Continue consultation',
      threadId: lastThread.id,
      threadTitle: (lastThread.title || '').trim() || 'Untitled consultation',
    }
  }

  return { kind: 'oracle', label: 'Consult the Oracle' }
}

/** One-line status under the Today heading. Plain readout, no economy lines. */
export function describeAlignmentToday(completedCount: number, totalCount: number): string {
  if (totalCount <= 0) return ''
  if (completedCount >= totalCount) return 'All liturgies done today. The shell holds.'
  if (completedCount === 0) return `${totalCount} liturgies waiting today.`
  const remaining = totalCount - completedCount
  return `${remaining} ${remaining === 1 ? 'liturgy' : 'liturgies'} left today.`
}
