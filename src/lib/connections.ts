import type { FriendRequestStatus, NotificationKind } from '../db/schema'
import { STAGE_PIPELINE_DATA } from './codexData'
import { resolveMemberPublicName } from './member-handle'

export type RelationshipState =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'friends'
  | 'self'

export type PublicProfileStats = {
  pincerTorque: number
  shellHardness: number
  processingPower: number
  durability: number
  clawStrength: number
  socialDetachmentIndex: number
  submergenceDepthRating: number
}

export type PublicMoltmaxSummary = {
  score: number | null
  clearance: string | null
  stage: string | null
} | null

export type PublicProfileBond = {
  kind: string
  label: string
  memberId: string
  memberName: string
  memberHandle: string | null
}

export type PublicProfileView = {
  id: string
  larvaId: string
  handle: string | null
  displayName: string
  stage: number
  stageLabel: string
  avatarConfig: { style: string; seed: string } | null
  memberSince: string
  stats: PublicProfileStats | null
  moltmax: PublicMoltmaxSummary
  relationship: RelationshipState
  pendingRequestId: string | null
  bio: string | null
  traits: Array<{ id: string; label: string }>
  joinStory: string | null
  referredBy: { id: string; displayName: string; handle: string | null } | null
  bonds: PublicProfileBond[]
}

export type ConnectionMemberSummary = {
  id: string
  larvaId: string
  handle: string | null
  displayName: string
  stage: number
  stageLabel: string
  avatarConfig: { style: string; seed: string } | null
  requestId?: string
  since?: string
}

export type ConnectionsListView = {
  friends: ConnectionMemberSummary[]
  incoming: ConnectionMemberSummary[]
  outgoing: ConnectionMemberSummary[]
}

export type MemberSearchResult = {
  id: string
  larvaId: string
  handle: string | null
  displayName: string
  stage: number
  stageLabel: string
  avatarConfig: { style: string; seed: string } | null
}

export function relationshipForMember(
  connections: ConnectionsListView | null | undefined,
  memberId: string,
): { relationship: RelationshipState; pendingRequestId: string | null } {
  if (!connections) return { relationship: 'none', pendingRequestId: null }

  if (connections.friends.some((row) => row.id === memberId)) {
    return { relationship: 'friends', pendingRequestId: null }
  }

  const incoming = connections.incoming.find((row) => row.id === memberId)
  if (incoming) {
    return { relationship: 'pending_received', pendingRequestId: incoming.requestId ?? null }
  }

  const outgoing = connections.outgoing.find((row) => row.id === memberId)
  if (outgoing) {
    return { relationship: 'pending_sent', pendingRequestId: outgoing.requestId ?? null }
  }

  return { relationship: 'none', pendingRequestId: null }
}

export type ConnectionsHubPreviewKind = 'incoming' | 'friend'

export type ConnectionsHubPreviewItem = ConnectionMemberSummary & {
  kind: ConnectionsHubPreviewKind
}

function friendSinceTime(row: ConnectionMemberSummary): number {
  if (!row.since) return 0
  const ms = new Date(row.since).getTime()
  return Number.isFinite(ms) ? ms : 0
}

/** Incoming requests first, then newest friends. Hub cards show at most `limit`. */
export function pickConnectionsHubPreview(
  connections: ConnectionsListView | null | undefined,
  limit = 3,
): ConnectionsHubPreviewItem[] {
  if (!connections || limit <= 0) return []

  const incoming = connections.incoming.map((row) => ({ ...row, kind: 'incoming' as const }))
  const friends = [...connections.friends]
    .sort((a, b) => friendSinceTime(b) - friendSinceTime(a))
    .map((row) => ({ ...row, kind: 'friend' as const }))

  return [...incoming, ...friends].slice(0, limit)
}

const STAGE_SHORT_LABELS: Record<number, string> = {
  1: 'Larval Initiate',
  2: 'Soft-Shed',
  3: 'Exoshell Born',
  4: 'Ascendant',
}

export function getStageLabel(stage: number): string {
  if (STAGE_SHORT_LABELS[stage]) return STAGE_SHORT_LABELS[stage]
  const fromPipeline = STAGE_PIPELINE_DATA.find((s) => s.stageNum === stage)
  if (fromPipeline) {
    return fromPipeline.stageTitle.replace(/^STAGE \d+:\s*/i, '').replace(/^THE\s+/i, '')
  }
  return `Stage ${stage}`
}

/** Always store friendship pairs with userAId < userBId lexicographically. */
export function normalizeFriendPair(a: string, b: string): [string, string] {
  if (a === b) {
    throw new Error('Cannot create a friendship with yourself.')
  }
  return a < b ? [a, b] : [b, a]
}

const VALID_TRANSITIONS: Record<FriendRequestStatus, FriendRequestStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: [],
  rejected: [],
  cancelled: [],
}

export function canTransitionFriendRequest(
  from: FriendRequestStatus,
  to: FriendRequestStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertCanSendFriendRequest(senderId: string, recipientId: string): void {
  if (!senderId || !recipientId) {
    throw new Error('Both members are required for a friend request.')
  }
  if (senderId === recipientId) {
    throw new Error('You cannot send a friend request to yourself.')
  }
}

export function buildFriendNotificationCopy(
  kind: NotificationKind,
  actorPublicName: string
): { title: string; detail: string } {
  switch (kind) {
    case 'friend_request':
      return {
        title: 'Friend request',
        detail: `${actorPublicName} sent you a friend request.`,
      }
    case 'friend_accepted':
      return {
        title: 'Friend request accepted',
        detail: `${actorPublicName} accepted your friend request.`,
      }
    case 'friend_rejected':
      return {
        title: 'Friend request declined',
        detail: `${actorPublicName} declined your friend request.`,
      }
    default:
      return {
        title: 'Connection update',
        detail: 'Something changed in your connections.',
      }
  }
}

const FRIEND_NOTIFICATION_KINDS = new Set<NotificationKind>([
  'friend_request',
  'friend_accepted',
  'friend_rejected',
])

/** Live public name + copy for Activity Center rows. Never bake larva unit in when a handle exists. */
export function presentFriendNotification(
  kind: NotificationKind,
  actor: {
    userId?: string | null
    handle?: string | null
    larvaId?: string | null
  },
): { title: string; detail: string; actorPublicName: string } {
  const actorPublicName = resolveMemberPublicName(actor)
  if (!FRIEND_NOTIFICATION_KINDS.has(kind)) {
    return {
      title: 'Connection update',
      detail: 'Something changed in your connections.',
      actorPublicName,
    }
  }
  return {
    ...buildFriendNotificationCopy(kind, actorPublicName),
    actorPublicName,
  }
}

export function toMemberSummary(row: {
  id: string
  larvaId: string
  handle?: string | null
  stage: number
  avatarConfig: { style: string; seed: string } | null
  requestId?: string
  since?: string | Date | null
}): ConnectionMemberSummary {
  const handle = row.handle?.trim() || null
  return {
    id: row.id,
    larvaId: row.larvaId,
    handle,
    displayName: resolveMemberPublicName({
      userId: row.id,
      handle,
      larvaId: row.larvaId,
    }),
    stage: row.stage,
    stageLabel: getStageLabel(row.stage),
    avatarConfig: row.avatarConfig ?? null,
    requestId: row.requestId,
    since: row.since
      ? typeof row.since === 'string'
        ? row.since
        : row.since.toISOString()
      : undefined,
  }
}
