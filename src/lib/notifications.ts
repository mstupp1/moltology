import type { NotificationKind, NotificationPayload } from '../db/schema'
import { presentFriendNotification } from './connections'
import { isForumMentionKind, presentForumMentionNotification } from './forum-mentions'
import { isForumReplyKind, presentForumReplyNotification } from './forum-replies'

export const NOTIFICATION_KIND_FRIEND_REQUEST = 'friend_request' as const
export const NOTIFICATION_KIND_FRIEND_ACCEPTED = 'friend_accepted' as const
export const NOTIFICATION_KIND_FRIEND_REJECTED = 'friend_rejected' as const
export { NOTIFICATION_KIND_FORUM_MENTION } from './forum-mentions'
export { NOTIFICATION_KIND_FORUM_REPLY, isForumInboxKind } from './forum-replies'

export const ACTIVITY_INBOX_LABEL = 'HAILS, REPLIES & ALERTS'

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

export function presentNotificationView(row: {
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
}): NotificationView {
  const copy = isForumMentionKind(row.kind)
    ? presentForumMentionNotification({
        userId: row.actorUserId,
        handle: row.actorHandle,
        larvaId: row.actorLarvaId,
      })
    : isForumReplyKind(row.kind)
      ? presentForumReplyNotification({
          userId: row.actorUserId,
          handle: row.actorHandle,
          larvaId: row.actorLarvaId,
          target: row.payload.replyTarget,
        })
      : presentFriendNotification(row.kind, {
          userId: row.actorUserId,
          handle: row.actorHandle,
          larvaId: row.actorLarvaId,
        })
  return {
    id: row.id,
    kind: row.kind,
    title: copy.title,
    detail: copy.detail,
    actorUserId: row.actorUserId,
    actorLarvaId: row.actorLarvaId,
    actorHandle: row.actorHandle?.trim() || null,
    payload: row.payload,
    readAt: row.readAt,
    createdAt: row.createdAt,
    actionable: isActionableFriendRequest(row.kind, row.readAt, row.payload),
  }
}
