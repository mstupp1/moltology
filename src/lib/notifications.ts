import type { NotificationKind, NotificationPayload } from '../db/schema'

export const NOTIFICATION_KIND_FRIEND_REQUEST = 'friend_request' as const
export const NOTIFICATION_KIND_FRIEND_ACCEPTED = 'friend_accepted' as const
export const NOTIFICATION_KIND_FRIEND_REJECTED = 'friend_rejected' as const

export type NotificationView = {
  id: string
  kind: NotificationKind
  title: string
  detail: string
  actorUserId: string | null
  actorLarvaId: string | null
  actorHandle: string | null
  payload: NotificationPayload
  readAt: string | null
  createdAt: string
  actionable: boolean
}

export function friendRequestSourceKey(requestId: string): string {
  return `friend_request:${requestId}`
}

export function friendAcceptedSourceKey(requestId: string): string {
  return `friend_accepted:${requestId}`
}

export function friendRejectedSourceKey(requestId: string): string {
  return `friend_rejected:${requestId}`
}

export function countUnreadNotifications(
  items: Array<{ readAt: string | null | undefined }>
): number {
  return items.filter((item) => !item.readAt).length
}

export function isActionableFriendRequest(
  kind: NotificationKind,
  readAt: string | null | undefined,
  payload: NotificationPayload
): boolean {
  return kind === NOTIFICATION_KIND_FRIEND_REQUEST && !readAt && Boolean(payload.requestId)
}
