/**
 * Forum reply pings for Activity Center.
 *
 * Persist is a thin notifications row when someone answers a topic or post
 * the member authored. Inbox chrome and OS deep-links reuse the same path
 * shape as forum hails.
 */

import { resolveMemberPublicName } from './member-handle'

export const NOTIFICATION_KIND_FORUM_REPLY = 'forum_reply' as const

export type ForumReplyTarget = 'topic' | 'post'

export function isForumReplyKind(kind: string): boolean {
  return kind === NOTIFICATION_KIND_FORUM_REPLY
}

export function isForumInboxKind(kind: string): boolean {
  return kind === 'forum_mention' || kind === NOTIFICATION_KIND_FORUM_REPLY
}

export function forumReplySourceKey(replyPostId: string, recipientUserId: string): string {
  return `forum_reply:post:${replyPostId}:${recipientUserId}`
}

export function presentForumReplyNotification(input: {
  userId?: string | null
  handle?: string | null
  larvaId?: string | null
  target?: ForumReplyTarget | null
}): { title: string; detail: string } {
  const actorPublicName = resolveMemberPublicName(input)
  if (input.target === 'post') {
    return {
      title: 'A reply reached your post',
      detail: `${actorPublicName} answered your post.`,
    }
  }
  return {
    title: 'A reply reached your thread',
    detail: `${actorPublicName} answered a thread you opened.`,
  }
}
