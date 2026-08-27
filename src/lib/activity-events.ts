import type { CanonicalAlignmentTask } from './alignment-tasks'

export const ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED = 'routine_completed' as const

export type ActivityEventKind = typeof ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED

export const ACTIVITY_STREAM_EMPTY_COPY = {
  title: 'The stream is still',
  body: 'Seal a daily liturgy and the first pulse of your own work will register here. Nothing is borrowed.',
} as const

export const ACTIVITY_STREAM_SUBTITLE = 'Pulses from your own liturgies. Nothing borrowed.'

export interface ActivityEventView {
  id: string
  kind: string
  category: 'ROUTINES'
  title: string
  detail: string
  valueBadge?: string | null
  occurredAt: string
  occurredLabel: string
}

export function routineActivitySourceKey(taskKey: string, date: string): string {
  return `routine:${taskKey}:${date}`
}

export function buildRoutineCompletedCopy(task: CanonicalAlignmentTask): {
  kind: typeof ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED
  title: string
  detail: string
  valueBadge: string
} {
  return {
    kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
    title: `${task.title} sealed`,
    detail: `The ${task.time} liturgy is complete.`,
    valueBadge: task.time,
  }
}

export function formatActivityAge(occurredAt: Date, now: Date): string {
  const ms = now.getTime() - occurredAt.getTime()
  if (ms < 45_000) return 'just now'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return occurredAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function toActivityEventView(
  row: {
    id: string
    kind: string
    title: string
    detail: string
    valueBadge?: string | null
    createdAt: Date | string | null
  },
  now: Date
): ActivityEventView {
  const createdAt = row.createdAt ? new Date(row.createdAt) : now
  return {
    id: row.id,
    kind: row.kind,
    category: 'ROUTINES',
    title: row.title,
    detail: row.detail,
    valueBadge: row.valueBadge ?? null,
    occurredAt: createdAt.toISOString(),
    occurredLabel: formatActivityAge(createdAt, now),
  }
}
