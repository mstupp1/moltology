/**
 * Unread / last-visited helpers for forum boards and topics.
 * Visit rows live per member; these functions only compare timestamps.
 */

export const FORUM_UNREAD_LABEL = 'New transmission'
export const FORUM_UNREAD_BOARD_LABEL = 'New transmissions'

export interface ForumVisitMaps {
  topicVisitedAtById: ReadonlyMap<string, string>
  boardVisitedAtById: ReadonlyMap<string, string>
}

export function forumTopicActivityAt(topic: {
  lastReplyAt?: string | Date | null
  createdAt?: string | Date | null
}): string | null {
  const reply = parseForumTime(topic.lastReplyAt)
  const created = parseForumTime(topic.createdAt)
  if (reply == null && created == null) return null
  if (reply == null) return new Date(created!).toISOString()
  if (created == null) return new Date(reply).toISOString()
  return new Date(Math.max(reply, created)).toISOString()
}

/**
 * A topic is unread when activity landed after the member last looked.
 * Topic visit wins. Board first-look is the baseline for never-opened threads.
 * No visit at either scope means they have not been here yet — no chrome.
 */
export function isForumTopicUnread(input: {
  lastActivityAt?: string | Date | null
  topicVisitedAt?: string | Date | null
  boardVisitedAt?: string | Date | null
}): boolean {
  const activity = parseForumTime(input.lastActivityAt)
  if (activity == null) return false

  const topicVisited = parseForumTime(input.topicVisitedAt)
  if (topicVisited != null) return activity > topicVisited

  const boardVisited = parseForumTime(input.boardVisitedAt)
  if (boardVisited != null) return activity > boardVisited

  return false
}

export function topicHasUnreadActivity(
  topic: {
    id: string
    categoryId?: string | null
    lastReplyAt?: string | Date | null
    createdAt?: string | Date | null
  },
  visits: ForumVisitMaps,
): boolean {
  return isForumTopicUnread({
    lastActivityAt: forumTopicActivityAt(topic),
    topicVisitedAt: visits.topicVisitedAtById.get(topic.id) ?? null,
    boardVisitedAt: topic.categoryId
      ? visits.boardVisitedAtById.get(topic.categoryId) ?? null
      : null,
  })
}

export function countUnreadForumTopics(
  topics: Array<{
    id: string
    categoryId?: string | null
    lastReplyAt?: string | Date | null
    createdAt?: string | Date | null
  }>,
  visits: ForumVisitMaps,
  categoryId?: string,
): number {
  const scoped = categoryId
    ? topics.filter((topic) => topic.categoryId === categoryId)
    : topics
  return scoped.reduce((count, topic) => count + (topicHasUnreadActivity(topic, visits) ? 1 : 0), 0)
}

export function formatForumUnreadCount(count: number): string {
  if (count <= 0) return ''
  if (count === 1) return '1 new'
  return `${count} new`
}

function parseForumTime(value: string | Date | null | undefined): number | null {
  if (!value) return null
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}
