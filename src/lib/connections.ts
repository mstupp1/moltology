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
  actorLarvaId: string
): { title: string; detail: string } {
  switch (kind) {
    case 'friend_request':
      return {
        title: 'Friend request',
        detail: `${actorLarvaId} sent you a friend request.`,
      }
    case 'friend_accepted':
      return {
        title: 'Friend request accepted',
        detail: `${actorLarvaId} accepted your friend request.`,
      }
    case 'friend_rejected':
      return {
        title: 'Friend request declined',
        detail: `${actorLarvaId} declined your friend request.`,
      }
    default:
      return {
        title: 'Connection update',
        detail: 'Something changed in your connections.',
      }
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
