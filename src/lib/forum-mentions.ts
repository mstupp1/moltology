/**
 * Forum @designation mentions.
 *
 * Tokens are `@` plus a claimed handle (3–20 letters, numbers, underscore).
 * Saved posts link those tokens to `/member/<handle>`. Persist is a thin
 * Activity Center row so a later inbox can read the hail.
 */

import {
  HANDLE_CHARSET,
  HANDLE_MAX_LENGTH,
  HANDLE_MIN_LENGTH,
  normalizeHandleForCompare,
  resolveMemberPublicName,
} from './member-handle'

export const FORUM_MENTION_MAX_PER_POST = 8
export const NOTIFICATION_KIND_FORUM_MENTION = 'forum_mention' as const

const MENTION_TOKEN_RE = /(?<![A-Za-z0-9_])@([A-Za-z0-9_]{3,20})\b/g
const MENTION_AT_CURSOR_RE = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{0,20})$/

export type ForumMentionPart =
  | { type: 'text'; value: string }
  | { type: 'mention'; handle: string }

export type ForumMentionQuery = {
  start: number
  query: string
}

export function isForumMentionKind(kind: string): boolean {
  return kind === NOTIFICATION_KIND_FORUM_MENTION
}

export function forumMentionSourceKey(sourceType: 'topic' | 'post', sourceId: string, mentionedUserId: string): string {
  return `forum_mention:${sourceType}:${sourceId}:${mentionedUserId}`
}

export function extractMentionHandles(text: string): string[] {
  if (!text) return []
  const seen = new Set<string>()
  const handles: string[] = []
  for (const match of text.matchAll(new RegExp(MENTION_TOKEN_RE))) {
    const handle = match[1]
    const key = normalizeHandleForCompare(handle)
    if (!key || seen.has(key)) continue
    if (handle.length < HANDLE_MIN_LENGTH || handle.length > HANDLE_MAX_LENGTH) continue
    if (!HANDLE_CHARSET.test(handle)) continue
    seen.add(key)
    handles.push(handle)
    if (handles.length >= FORUM_MENTION_MAX_PER_POST) break
  }
  return handles
}

export function mentionQueryAtCursor(text: string, cursor: number): ForumMentionQuery | null {
  if (cursor < 0 || cursor > text.length) return null
  const before = text.slice(0, cursor)
  const match = before.match(MENTION_AT_CURSOR_RE)
  if (!match) return null
  const atIndex = before.lastIndexOf('@')
  if (atIndex < 0) return null
  return { start: atIndex, query: match[2] }
}

export function insertMentionAtCursor(
  text: string,
  cursor: number,
  handle: string,
): { text: string; cursor: number } {
  const token = `@${handle} `
  const active = mentionQueryAtCursor(text, cursor)
  const start = active ? active.start : Math.max(0, cursor)
  const end = active ? cursor : cursor
  const next = `${text.slice(0, start)}${token}${text.slice(end)}`
  return { text: next, cursor: start + token.length }
}

export function splitForumMentionParts(text: string): ForumMentionPart[] {
  if (!text) return []
  const parts: ForumMentionPart[] = []
  let last = 0
  for (const match of text.matchAll(new RegExp(MENTION_TOKEN_RE))) {
    const index = match.index ?? 0
    if (index > last) {
      parts.push({ type: 'text', value: text.slice(last, index) })
    }
    parts.push({ type: 'mention', handle: match[1] })
    last = index + match[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) })
  }
  return parts
}

export function presentForumMentionNotification(actor: {
  userId?: string | null
  handle?: string | null
  larvaId?: string | null
}): { title: string; detail: string } {
  const actorPublicName = resolveMemberPublicName(actor)
  return {
    title: 'You were hailed',
    detail: `${actorPublicName} hailed you in a discussion.`,
  }
}

export function forumMentionHubPath(payload: {
  categorySlug?: string
  topicSlug?: string
}): string {
  const categorySlug = payload.categorySlug?.trim()
  const topicSlug = payload.topicSlug?.trim()
  if (categorySlug && topicSlug) {
    return `/forum/${categorySlug}/${topicSlug}`
  }
  return '/forum'
}
