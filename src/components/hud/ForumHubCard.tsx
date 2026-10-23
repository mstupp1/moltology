import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { MessageSquare, Pin } from 'lucide-react'
import {
  getForumCategoriesFn,
  getForumTopicsFn,
  type ForumCategoryEntry,
  type ForumTopicEntry,
} from '@/lib/server/api'
import { FORUM_WITHDRAWN_PREVIEW, isForumEntryWithdrawn, relativeTime } from '@/lib/forum-utils'
import { formatForumUnreadCount, FORUM_UNREAD_LABEL } from '@/lib/forum-visits'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { ForumUnreadMark } from '@/components/forum/ForumBits'
import { DASHBOARD_FOCUS, DashboardEmptyRow, DashboardPanel } from '@/components/hud/dashboard/DashboardPanel'
import { cn } from '@/lib/utils'

export const FORUM_HUB_TITLE = 'COMMUNITY'
export const FORUM_HUB_CTA = 'Open boards'
export const FORUM_HUB_EMPTY_COPY = {
  title: 'The boards are quiet',
  body: 'No threads yet. Open Community to start one.',
} as const

const HUB_THREAD_LIMIT = 3
const HUB_SORT: 'active' = 'active'

export type ForumHubThreadView = {
  id: string
  title: string
  slug: string
  preview: string
  categorySlug: string
  categoryName: string
  categoryColor: string
  authorName: string
  authorHandle: string | null
  authorAvatar: string
  authorAvatarConfig: ForumTopicEntry['authorAvatarConfig']
  authorStage: number
  userId: string | null
  ageLabel: string
  repliesCount: number
  isPinned: boolean
  unread: boolean
}

export type ForumHubBoardView = {
  id: string
  slug: string
  name: string
  color: string
  topicCount: number
  unreadCount: number
}

export type ForumHubPulse = {
  boardCount: number
  topicCount: number
  unreadCount: number
}

export function forumHubTopicPreview(topic: Pick<ForumTopicEntry, 'content' | 'deletedAt'>): string {
  if (isForumEntryWithdrawn(topic)) return FORUM_WITHDRAWN_PREVIEW
  return (topic.content || '').replace(/\s+/g, ' ').trim()
}

export function toForumHubThreads(
  topics: ForumTopicEntry[],
  nowLabel = relativeTime,
): ForumHubThreadView[] {
  return topics.slice(0, HUB_THREAD_LIMIT).map((topic) => ({
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    preview: forumHubTopicPreview(topic),
    categorySlug: topic.categorySlug || 'general-discussion',
    categoryName: topic.categoryName || 'General Discussion',
    categoryColor: topic.categoryColor || '#00ffff',
    authorName: topic.authorName,
    authorHandle: topic.authorHandle ?? null,
    authorAvatar: topic.authorAvatar,
    authorAvatarConfig: topic.authorAvatarConfig ?? null,
    authorStage: topic.authorStage,
    userId: topic.userId,
    ageLabel: nowLabel(topic.lastReplyAt || topic.createdAt),
    repliesCount: topic.repliesCount,
    isPinned: Boolean(topic.isPinned),
    unread: Boolean(topic.unread),
  }))
}

export function toForumHubBoards(categories: ForumCategoryEntry[]): ForumHubBoardView[] {
  return [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      color: category.color || '#00ffff',
      topicCount: category.topicCount || 0,
      unreadCount: category.unreadCount || 0,
    }))
}

export function toForumHubPulse(boards: ForumHubBoardView[]): ForumHubPulse {
  return {
    boardCount: boards.length,
    topicCount: boards.reduce((sum, board) => sum + board.topicCount, 0),
    unreadCount: boards.reduce((sum, board) => sum + board.unreadCount, 0),
  }
}

function ForumHubListGhost() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="flex gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-28 shrink-0 border border-line-subtle bg-surface-1 rounded-control" />
        ))}
      </div>
      <div className="rounded-control border border-line-subtle divide-y divide-line-subtle">
        {Array.from({ length: HUB_THREAD_LIMIT }).map((_, i) => (
          <div key={i} className="h-16" />
        ))}
      </div>
    </div>
  )
}

export function ForumHubCard() {
  const navigate = useNavigate()
  const session = useAuthSession()
  const userId = session.userId
  const isAuthPending = session.isPending

  const [threads, setThreads] = useState<ForumHubThreadView[]>([])
  const [boards, setBoards] = useState<ForumHubBoardView[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadHub() {
      if (isAuthPending) return

      try {
        const token = userId ? ((await getAuthJWTToken()) ?? undefined) : undefined
        const auth = userId ? { userId, token } : {}
        const [fetchedTopics, fetchedCats] = await Promise.all([
          getForumTopicsFn({ data: { sortBy: HUB_SORT, limit: HUB_THREAD_LIMIT, ...auth } }),
          getForumCategoriesFn({ data: auth }),
        ])
        if (isMounted) {
          setThreads(toForumHubThreads(Array.isArray(fetchedTopics) ? fetchedTopics : []))
          setBoards(toForumHubBoards(Array.isArray(fetchedCats) ? fetchedCats : []))
        }
      } catch {
        if (isMounted) {
          setThreads([])
          setBoards([])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadHub()
    return () => {
      isMounted = false
    }
  }, [userId, isAuthPending])

  const pulse = toForumHubPulse(boards)

  return (
    <DashboardPanel
      icon={<MessageSquare />}
      title={FORUM_HUB_TITLE}
      meta={pulse.unreadCount > 0 ? <ForumUnreadMark label={formatForumUnreadCount(pulse.unreadCount)} /> : null}
      action={{ label: FORUM_HUB_CTA, onClick: () => navigate({ to: '/forum' }) }}
      className="h-full"
      data-testid="forum-hub-card"
    >
      <HudGhostWidget isLoading={isLoading} skeleton={<ForumHubListGhost />}>
        <div className="space-y-3">
          {boards.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" data-testid="forum-hub-boards">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  to="/forum/$categorySlug"
                  params={{ categorySlug: board.slug }}
                  className={cn(
                    'inline-flex items-center gap-1.5 min-h-8 px-2.5 text-xs font-bold text-ink rounded-control border border-line-subtle shrink-0 bg-surface-1 hover:bg-surface-3 hover:border-line transition-colors',
                    DASHBOARD_FOCUS,
                  )}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: board.color }} aria-hidden="true" />
                  <span className="truncate max-w-[9.5rem]">{board.name}</span>
                  <span className="tabular-nums text-ink-muted font-normal">{board.topicCount}</span>
                  {board.unreadCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" role="img" aria-label={formatForumUnreadCount(board.unreadCount)} />
                  )}
                </Link>
              ))}
            </div>
          )}

          {threads.length === 0 ? (
            <DashboardEmptyRow title={FORUM_HUB_EMPTY_COPY.title} body={FORUM_HUB_EMPTY_COPY.body} />
          ) : (
            <ul className="rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden font-sans">
              {threads.map((thread) => (
                <HubThreadRow key={thread.id} thread={thread} />
              ))}
            </ul>
          )}
        </div>
      </HudGhostWidget>
    </DashboardPanel>
  )
}

function HubThreadRow({ thread }: { thread: ForumHubThreadView }) {
  const avatar = (
    <ForumAvatar
      src={thread.authorAvatar}
      authorName={thread.authorName}
      authorHandle={thread.authorHandle}
      userId={thread.userId}
      avatarConfig={thread.authorAvatarConfig}
      size="sm"
      className="ring-1 ring-line"
    />
  )

  return (
    <li className="relative flex items-start gap-3 px-3 py-2.5 bg-surface-1 hover:bg-surface-2 transition-colors group">
      {thread.userId ? (
        <Link
          to="/member/$profileId"
          params={{
            profileId: resolveMemberPublicParam({ id: thread.userId, handle: thread.authorHandle }),
          }}
          className={cn('relative z-10 shrink-0 mt-0.5 rounded-full hover:opacity-90', DASHBOARD_FOCUS)}
          aria-label={thread.authorName}
        >
          {avatar}
        </Link>
      ) : (
        <span className="shrink-0 mt-0.5">{avatar}</span>
      )}

      <div className="min-w-0 flex-1 space-y-0.5">
        <Link
          to="/forum/$categorySlug/$topicSlug"
          params={{ categorySlug: thread.categorySlug, topicSlug: thread.slug }}
          className="flex items-center gap-1.5 min-w-0 rounded-chip after:absolute after:inset-0 focus-visible:outline-hidden focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-cyan-glow"
        >
          {thread.unread && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow shrink-0">
              <span className="sr-only">{FORUM_UNREAD_LABEL}</span>
            </span>
          )}
          {thread.isPinned && (
            <Pin className="w-3 h-3 shrink-0 text-crimson-text" aria-label="Pinned" role="img" />
          )}
          <h3 className="text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors truncate leading-snug">
            {thread.title}
          </h3>
        </Link>
        {thread.preview ? <p className="text-xs text-ink-muted truncate leading-relaxed">{thread.preview}</p> : null}
        <div className="flex items-center gap-x-2 text-[11px] text-ink-muted min-w-0">
          <span className="inline-flex items-center gap-1 min-w-0 font-bold" style={{ color: thread.categoryColor }}>
            <span className="truncate">{thread.categoryName}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate text-ink-body">{thread.authorName}</span>
          <span className="ml-auto flex items-center gap-2.5 shrink-0 tabular-nums">
            <span className="flex items-center gap-1" aria-label={`${thread.repliesCount} replies`}>
              <MessageSquare className="w-3 h-3" aria-hidden="true" />
              {thread.repliesCount}
            </span>
            <span>{thread.ageLabel}</span>
          </span>
        </div>
      </div>
    </li>
  )
}
