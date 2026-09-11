import type { CanonicalAlignmentTask } from './alignment-tasks'
import { resolveMemberPublicName, resolveMemberPublicParam } from './member-handle'
import { getStageLabel } from './connections'

export const ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED = 'routine_completed' as const
export const ACTIVITY_EVENT_KIND_DAY_ALIGNED = 'day_aligned' as const
export const ACTIVITY_EVENT_KIND_STREAK_MILESTONE = 'streak_milestone' as const
export const ACTIVITY_EVENT_KIND_STAGE_REACHED = 'stage_reached' as const
export const ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED = 'connection_accepted' as const
export const ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED = 'forum_topic_opened' as const
export const ACTIVITY_EVENT_KIND_ORACLE_MILESTONE = 'oracle_milestone' as const

export const ACTIVITY_EVENT_KINDS = [
  ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
  ACTIVITY_EVENT_KIND_DAY_ALIGNED,
  ACTIVITY_EVENT_KIND_STREAK_MILESTONE,
  ACTIVITY_EVENT_KIND_STAGE_REACHED,
  ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED,
  ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED,
  ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
] as const

export type ActivityEventKind = (typeof ACTIVITY_EVENT_KINDS)[number]

export type ActivityVisibility = 'private' | 'friends' | 'public'

export type ActivityFeedScope = 'self' | 'circle'

export const ACTIVITY_FEED_FILTER_IDS = [
  'all',
  'highlights',
  'liturgies',
  'streaks',
  'stages',
  'community',
] as const

export type ActivityFeedFilter = (typeof ACTIVITY_FEED_FILTER_IDS)[number]

export type ActivityEventCategory =
  | 'ROUTINES'
  | 'STREAKS'
  | 'STAGES'
  | 'CONNECTIONS'
  | 'COMMUNITY'
  | 'ORACLE'
  | 'ACTIVITY'

export const ORACLE_CONSULTATION_MILESTONES = [1, 5, 10, 25, 50] as const

export interface ActivityKindDefinition {
  category: ActivityEventCategory
  categoryLabel: string
  filter: Exclude<ActivityFeedFilter, 'all' | 'highlights'>
  highlight: boolean
  defaultVisibility: ActivityVisibility
}

/**
 * Registry for stream kinds. Add a writer + copy builder when introducing a new kind.
 * Unknown kinds still render via title/detail so the feed stays forward-compatible.
 */
export const ACTIVITY_KIND_REGISTRY: Record<ActivityEventKind, ActivityKindDefinition> = {
  routine_completed: {
    category: 'ROUTINES',
    categoryLabel: 'Liturgy',
    filter: 'liturgies',
    highlight: false,
    defaultVisibility: 'friends',
  },
  day_aligned: {
    category: 'ROUTINES',
    categoryLabel: 'Alignment',
    filter: 'liturgies',
    highlight: true,
    defaultVisibility: 'friends',
  },
  streak_milestone: {
    category: 'STREAKS',
    categoryLabel: 'Streak',
    filter: 'streaks',
    highlight: true,
    defaultVisibility: 'friends',
  },
  stage_reached: {
    category: 'STAGES',
    categoryLabel: 'Stage',
    filter: 'stages',
    highlight: true,
    defaultVisibility: 'friends',
  },
  connection_accepted: {
    category: 'CONNECTIONS',
    categoryLabel: 'Circle',
    filter: 'community',
    highlight: true,
    defaultVisibility: 'friends',
  },
  forum_topic_opened: {
    category: 'COMMUNITY',
    categoryLabel: 'Community',
    filter: 'community',
    highlight: true,
    defaultVisibility: 'friends',
  },
  oracle_milestone: {
    category: 'ORACLE',
    categoryLabel: 'Oracle',
    filter: 'community',
    highlight: true,
    defaultVisibility: 'friends',
  },
}

export const FALLBACK_ACTIVITY_KIND: ActivityKindDefinition = {
  category: 'ACTIVITY',
  categoryLabel: 'Pulse',
  filter: 'liturgies',
  highlight: false,
  defaultVisibility: 'friends',
}

export const ACTIVITY_FEED_FILTERS: Array<{ id: ActivityFeedFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'liturgies', label: 'Liturgies' },
  { id: 'streaks', label: 'Streaks' },
  { id: 'stages', label: 'Stages' },
  { id: 'community', label: 'Community' },
]

export const ACTIVITY_FEED_SCOPES: Array<{ id: ActivityFeedScope; label: string }> = [
  { id: 'circle', label: 'Circle' },
  { id: 'self', label: 'You' },
]

export const ACTIVITY_STREAM_EMPTY_COPY = {
  title: 'The stream is still',
  body: 'Seal a liturgy, welcome a connection, or open a consultation. Pulses from your circle will register here.',
} as const

export const ACTIVITY_STREAM_SELF_EMPTY_COPY = {
  title: 'The stream is still',
  body: 'Seal a daily liturgy, open a consultation, or welcome a connection. The first pulse of your own work will register here. Nothing is borrowed.',
} as const

export const ACTIVITY_STREAM_FILTER_EMPTY_COPY = {
  title: 'Nothing in this slice',
  body: 'Try another filter, or check back after the next liturgy.',
} as const

export const ACTIVITY_STREAM_SUBTITLE =
  'Liturgies, connections, community, and Oracle pulses from you and your circle.'

export const ACTIVITY_STREAM_PAGE_DESCRIPTION =
  'See liturgies, welcomed connections, community threads, and Oracle milestones from you and the members you keep close.'

export const ACTIVITY_STREAM_GUEST_LOCK_MESSAGE =
  'The circle feed stays sealed until you sign in. Guests do not inherit another member\'s pulses.'

export interface ActivityEventMetadata {
  taskKey?: string
  taskTitle?: string
  time?: string
  date?: string
  streakDays?: number
  bonusXp?: number
  stage?: number
  previousStage?: number
  stageTitle?: string
  completedCount?: number
  totalCount?: number
  peerUserId?: string
  peerHandle?: string
  peerName?: string
  topicId?: string
  topicSlug?: string
  categorySlug?: string
  categoryName?: string
  topicTitle?: string
  consultationCount?: number
  threadId?: string
}

export interface ActivityActorView {
  id: string
  displayName: string
  handle: string | null
  larvaId: string
  stage: number
  avatarConfig: { style: string; seed: string } | null
}

export interface ActivityEventStat {
  label: string
  value: string
}

export interface ActivityEventView {
  id: string
  kind: string
  category: ActivityEventCategory
  categoryLabel: string
  title: string
  detail: string
  valueBadge?: string | null
  occurredAt: string
  occurredLabel: string
  visibility: ActivityVisibility
  href?: string | null
  metadata: ActivityEventMetadata
  actor: ActivityActorView
  isOwn: boolean
  highlight: boolean
}

export interface ActivityFeedPage {
  events: ActivityEventView[]
  nextCursor: string | null
}

export function resolveActivityKindMeta(kind: string): ActivityKindDefinition {
  if (kind in ACTIVITY_KIND_REGISTRY) {
    return ACTIVITY_KIND_REGISTRY[kind as ActivityEventKind]
  }
  return FALLBACK_ACTIVITY_KIND
}

export function kindsForActivityFilter(filter: ActivityFeedFilter): string[] | null {
  if (filter === 'all') return null
  const kinds = ACTIVITY_EVENT_KINDS.filter((kind) => {
    const meta = ACTIVITY_KIND_REGISTRY[kind]
    if (filter === 'highlights') return meta.highlight
    return meta.filter === filter
  })
  return [...kinds]
}

export function routineActivitySourceKey(taskKey: string, date: string): string {
  return `routine:${taskKey}:${date}`
}

export function dayAlignedSourceKey(date: string): string {
  return `day_aligned:${date}`
}

export function streakMilestoneSourceKey(days: number, date: string): string {
  return `streak:${days}:${date}`
}

export function stageReachedSourceKey(stage: number): string {
  return `stage:${stage}`
}

export function connectionAcceptedSourceKey(userAId: string, userBId: string): string {
  const [left, right] = userAId < userBId ? [userAId, userBId] : [userBId, userAId]
  return `connection:${left}:${right}`
}

export function forumTopicOpenedSourceKey(topicId: string): string {
  return `forum_topic:${topicId}`
}

export function oracleMilestoneSourceKey(count: number): string {
  return `oracle:${count}`
}

export function isOracleConsultationMilestone(count: number): boolean {
  return (ORACLE_CONSULTATION_MILESTONES as readonly number[]).includes(count)
}

export function forumTopicHref(categorySlug: string, topicSlug: string): string {
  return `/forum/${categorySlug}/${topicSlug}`
}

export function memberActivityHref(input: { id: string; handle?: string | null }): string {
  return `/member/${resolveMemberPublicParam(input)}`
}

export type ParsedActivityHref =
  | { kind: 'dashboard' }
  | { kind: 'pipeline' }
  | { kind: 'connections' }
  | { kind: 'oracle' }
  | { kind: 'forum' }
  | { kind: 'forum-board'; categorySlug: string }
  | { kind: 'forum-topic'; categorySlug: string; topicSlug: string }
  | { kind: 'member'; profileId: string }
  | { kind: 'none' }

export function parseActivityEventHref(href?: string | null): ParsedActivityHref {
  const raw = href?.trim()
  if (!raw || !raw.startsWith('/')) return { kind: 'none' }
  const path = raw.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/dashboard') return { kind: 'dashboard' }
  if (path === '/pipeline') return { kind: 'pipeline' }
  if (path === '/connections') return { kind: 'connections' }
  if (path === '/oracle') return { kind: 'oracle' }
  if (path === '/forum') return { kind: 'forum' }
  const forum = path.match(/^\/forum\/([^/]+)(?:\/([^/]+))?$/)
  if (forum?.[1] && forum[2]) {
    return { kind: 'forum-topic', categorySlug: forum[1], topicSlug: forum[2] }
  }
  if (forum?.[1]) return { kind: 'forum-board', categorySlug: forum[1] }
  const member = path.match(/^\/member\/([^/]+)$/)
  if (member?.[1]) return { kind: 'member', profileId: member[1] }
  return { kind: 'none' }
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

export function buildDayAlignedCopy(completedCount: number, totalCount: number): {
  kind: typeof ACTIVITY_EVENT_KIND_DAY_ALIGNED
  title: string
  detail: string
  valueBadge: string
} {
  return {
    kind: ACTIVITY_EVENT_KIND_DAY_ALIGNED,
    title: 'Daily alignment complete',
    detail: 'Every liturgy for today is sealed.',
    valueBadge: `${completedCount}/${totalCount}`,
  }
}

export function buildStreakMilestoneCopy(days: number): {
  kind: typeof ACTIVITY_EVENT_KIND_STREAK_MILESTONE
  title: string
  detail: string
  valueBadge: string
} {
  return {
    kind: ACTIVITY_EVENT_KIND_STREAK_MILESTONE,
    title: `${days}-day streak`,
    detail: `Held for ${days} consecutive days.`,
    valueBadge: `${days}d`,
  }
}

export function buildStageReachedCopy(stage: number): {
  kind: typeof ACTIVITY_EVENT_KIND_STAGE_REACHED
  title: string
  detail: string
  valueBadge: string
} {
  const stageTitle = getStageLabel(stage)
  return {
    kind: ACTIVITY_EVENT_KIND_STAGE_REACHED,
    title: `Reached ${stageTitle}`,
    detail: `Clearance advanced to ${stageTitle}.`,
    valueBadge: `Stage ${stage}`,
  }
}

export function buildConnectionAcceptedCopy(peerName: string): {
  kind: typeof ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED
  title: string
  detail: string
  valueBadge: string
} {
  const name = peerName.trim() || 'a member'
  return {
    kind: ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED,
    title: 'Circle widened',
    detail: `Connected with ${name}.`,
    valueBadge: 'Bond',
  }
}

export function buildForumTopicOpenedCopy(topicTitle: string, categoryName: string): {
  kind: typeof ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED
  title: string
  detail: string
  valueBadge: string
} {
  const title = topicTitle.trim() || 'New thread'
  const board = categoryName.trim() || 'Community'
  return {
    kind: ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED,
    title,
    detail: `Opened a thread on ${board}.`,
    valueBadge: 'Thread',
  }
}

export function buildOracleMilestoneCopy(consultationCount: number): {
  kind: typeof ACTIVITY_EVENT_KIND_ORACLE_MILESTONE
  title: string
  detail: string
  valueBadge: string
} {
  if (consultationCount <= 1) {
    return {
      kind: ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
      title: 'First consultation',
      detail: 'Opened a channel with the Synaptic Oracle.',
      valueBadge: '1',
    }
  }
  return {
    kind: ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
    title: `${consultationCount} consultations held`,
    detail:
      consultationCount >= 25
        ? 'The Oracle has become part of the daily descent.'
        : 'A steady channel with the Synaptic Oracle.',
    valueBadge: String(consultationCount),
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

export function encodeActivityCursor(createdAt: string, id: string): string {
  return `${createdAt}|${id}`
}

export function decodeActivityCursor(cursor: string): { createdAt: string; id: string } | null {
  const trimmed = cursor.trim()
  const split = trimmed.indexOf('|')
  if (split <= 0 || split === trimmed.length - 1) return null
  const createdAt = trimmed.slice(0, split)
  const id = trimmed.slice(split + 1)
  if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) return null
  return { createdAt, id }
}

function asMetadata(value: unknown): ActivityEventMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ActivityEventMetadata
}

function asVisibility(value: unknown): ActivityVisibility {
  if (value === 'private' || value === 'friends' || value === 'public') return value
  return 'friends'
}

export function emptyActivityActor(userId: string): ActivityActorView {
  return {
    id: userId,
    displayName: resolveMemberPublicName({ userId }),
    handle: null,
    larvaId: '',
    stage: 1,
    avatarConfig: null,
  }
}

export function toActivityActorView(row: {
  userId?: string | null
  actorId?: string | null
  actorHandle?: string | null
  actorLarvaId?: string | null
  actorStage?: number | null
  actorAvatarConfig?: { style: string; seed: string } | null
}): ActivityActorView {
  const id = row.actorId || row.userId || ''
  const handle = row.actorHandle?.trim() || null
  const larvaId = row.actorLarvaId?.trim() || ''
  return {
    id,
    displayName: resolveMemberPublicName({
      userId: id,
      handle,
      larvaId,
    }),
    handle,
    larvaId,
    stage: row.actorStage ?? 1,
    avatarConfig: row.actorAvatarConfig ?? null,
  }
}

export function activityEventStats(view: ActivityEventView): ActivityEventStat[] {
  const stats: ActivityEventStat[] = []
  const meta = view.metadata
  if (view.kind === ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED) {
    if (meta.time || view.valueBadge) {
      stats.push({ label: 'Window', value: meta.time || view.valueBadge || '' })
    }
  }
  if (view.kind === ACTIVITY_EVENT_KIND_DAY_ALIGNED) {
    const sealed = meta.completedCount && meta.totalCount
      ? `${meta.completedCount}/${meta.totalCount}`
      : view.valueBadge
    if (sealed) stats.push({ label: 'Sealed', value: sealed })
  }
  if (view.kind === ACTIVITY_EVENT_KIND_STREAK_MILESTONE && (meta.streakDays || view.valueBadge)) {
    stats.push({
      label: 'Held',
      value: meta.streakDays ? `${meta.streakDays} days` : String(view.valueBadge),
    })
  }
  if (view.kind === ACTIVITY_EVENT_KIND_STAGE_REACHED) {
    const stage = meta.stage ?? view.actor.stage
    stats.push({ label: 'Clearance', value: meta.stageTitle || getStageLabel(stage) })
    if (meta.previousStage && meta.previousStage !== stage) {
      stats.push({ label: 'From', value: getStageLabel(meta.previousStage) })
    }
  }
  if (view.kind === ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED && meta.peerName) {
    stats.push({ label: 'With', value: meta.peerName })
  }
  if (view.kind === ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED && meta.categoryName) {
    stats.push({ label: 'Board', value: meta.categoryName })
  }
  if (view.kind === ACTIVITY_EVENT_KIND_ORACLE_MILESTONE && (meta.consultationCount || view.valueBadge)) {
    stats.push({
      label: 'Held',
      value: meta.consultationCount ? String(meta.consultationCount) : String(view.valueBadge),
    })
  }
  return stats.filter((stat) => stat.value.trim().length > 0)
}

export function toActivityEventView(
  row: {
    id: string
    userId?: string | null
    kind: string
    title: string
    detail: string
    valueBadge?: string | null
    visibility?: string | null
    href?: string | null
    metadata?: unknown
    createdAt: Date | string | null
    actorHandle?: string | null
    actorLarvaId?: string | null
    actorStage?: number | null
    actorAvatarConfig?: { style: string; seed: string } | null
  },
  now: Date,
  viewerId?: string | null
): ActivityEventView {
  const createdAt = row.createdAt ? new Date(row.createdAt) : now
  const meta = resolveActivityKindMeta(row.kind)
  const actor = toActivityActorView({
    userId: row.userId,
    actorHandle: row.actorHandle,
    actorLarvaId: row.actorLarvaId,
    actorStage: row.actorStage,
    actorAvatarConfig: row.actorAvatarConfig,
  })
  const actorId = actor.id || viewerId || ''
  return {
    id: row.id,
    kind: row.kind,
    category: meta.category,
    categoryLabel: meta.categoryLabel,
    title: row.title,
    detail: row.detail,
    valueBadge: row.valueBadge ?? null,
    occurredAt: createdAt.toISOString(),
    occurredLabel: formatActivityAge(createdAt, now),
    visibility: asVisibility(row.visibility),
    href: row.href ?? null,
    metadata: asMetadata(row.metadata),
    actor: actor.id ? actor : emptyActivityActor(actorId),
    isOwn: Boolean(viewerId && actorId && actorId === viewerId),
    highlight: meta.highlight,
  }
}

export function emptyCopyForFeed(scope: ActivityFeedScope, filter: ActivityFeedFilter): {
  title: string
  body: string
} {
  if (filter !== 'all' && filter !== 'highlights') return ACTIVITY_STREAM_FILTER_EMPTY_COPY
  if (scope === 'self') return ACTIVITY_STREAM_SELF_EMPTY_COPY
  return ACTIVITY_STREAM_EMPTY_COPY
}
