import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Clock, MessageSquare } from 'lucide-react'
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
import { ForumUnreadMark, PinBadge } from '@/components/forum/ForumBits'

export const FORUM_HUB_TITLE = 'COMMUNITY'
export const FORUM_HUB_SUBTITLE = 'Live boards and the latest transmissions.'
export const FORUM_HUB_CTA = 'ENTER COMMUNITY'
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

function PulseChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] border border-line-subtle text-ink-muted rounded-chip bg-surface-1">
      {label}
      <span className="tabular-nums text-cyan-glow">{count}</span>
    </span>
  )
}

function ForumHubListGhost() {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 flex-1 border border-line-subtle bg-surface-1 rounded-chip" />
        ))}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-24 shrink-0 border border-line-subtle bg-surface-1 rounded-control" />
        ))}
      </div>
      {Array.from({ length: HUB_THREAD_LIMIT }).map((_, i) => (
        <div key={i} className="h-20 border border-line-subtle bg-surface-1 rounded-card" />
      ))}
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
    <div
      className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 md:p-5 space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between"
      data-testid="forum-hub-card"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 border-b border-line-subtle pb-3">
          <div>
            <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-glow" />
              {FORUM_HUB_TITLE}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">{FORUM_HUB_SUBTITLE}</p>
          </div>
          {pulse.unreadCount > 0 && (
            <ForumUnreadMark label={formatForumUnreadCount(pulse.unreadCount)} />
          )}
        </div>

        <HudGhostWidget isLoading={isLoading} skeleton={<ForumHubListGhost />}>
          <div className="space-y-2.5">
            {boards.length > 0 && (
              <div className="flex flex-wrap gap-1.5" data-testid="forum-hub-pulse">
                <PulseChip label="Boards" count={pulse.boardCount} />
                <PulseChip label="Topics" count={pulse.topicCount} />
                {pulse.unreadCount > 0 && <PulseChip label="New" count={pulse.unreadCount} />}
              </div>
            )}

            {boards.length > 0 && (
              <div
                className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
                data-testid="forum-hub-boards"
              >
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    to="/forum/$categorySlug"
                    params={{ categorySlug: board.slug }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] rounded-control border shrink-0 bg-surface-1 hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    style={{
                      borderColor: `${board.color}80`,
                      color: board.color,
                    }}
                  >
                    <span className="truncate max-w-[9.5rem]">{board.name}</span>
                    <span className="tabular-nums text-ink">{board.topicCount}</span>
                    {board.unreadCount > 0 && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-cyan-glow"
                        aria-label={formatForumUnreadCount(board.unreadCount)}
                      />
                    )}
                  </Link>
                ))}
              </div>
            )}

            {threads.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <p className="font-grotesk text-xs font-bold text-ink tracking-[0.08em] uppercase">
                  {FORUM_HUB_EMPTY_COPY.title}
                </p>
                <p className="text-xs text-ink-muted leading-relaxed">{FORUM_HUB_EMPTY_COPY.body}</p>
              </div>
            ) : (
              <div className="space-y-2 font-sans">
                {threads.map((thread) => (
                  <HubThreadRow key={thread.id} thread={thread} />
                ))}
              </div>
            )}
          </div>
        </HudGhostWidget>
      </div>

      <div className="pt-2 border-t border-line-subtle flex items-center justify-between text-xs">
        <span className="text-ink-muted text-[11px] tracking-[0.08em]">OPEN THE BOARDS</span>
        <button
          type="button"
          onClick={() => navigate({ to: '/forum' })}
          className="px-3 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong text-[11px] font-bold tracking-[0.08em] flex items-center gap-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <span>{FORUM_HUB_CTA}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function HubThreadRow({ thread }: { thread: ForumHubThreadView }) {
  return (
    <div
      className={`p-3 border transition-colors rounded-card group bg-surface-1 hover:bg-surface-2 ${
        thread.unread
          ? 'border-cyan-glow/40 hover:border-line-strong'
          : 'border-line-subtle hover:border-line-strong'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {thread.userId ? (
          <Link
            to="/member/$profileId"
            params={{
              profileId: resolveMemberPublicParam({
                id: thread.userId,
                handle: thread.authorHandle,
              }),
            }}
            className="shrink-0 mt-0.5 hover:opacity-90"
            onClick={(e) => e.stopPropagation()}
            aria-label={thread.authorName}
          >
            <ForumAvatar
              src={thread.authorAvatar}
              authorName={thread.authorName}
              authorHandle={thread.authorHandle}
              userId={thread.userId}
              avatarConfig={thread.authorAvatarConfig}
              size="sm"
              className="ring-1 ring-line group-hover:ring-line-strong"
            />
          </Link>
        ) : (
          <ForumAvatar
            src={thread.authorAvatar}
            authorName={thread.authorName}
            authorHandle={thread.authorHandle}
            userId={thread.userId}
            avatarConfig={thread.authorAvatarConfig}
            size="sm"
            className="ring-1 ring-line mt-0.5"
          />
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="px-1.5 py-0.5 font-sans font-bold uppercase tracking-[0.08em] rounded-chip border text-[11px] truncate max-w-[70%]"
              style={{
                borderColor: `${thread.categoryColor}80`,
                color: thread.categoryColor,
                backgroundColor: `${thread.categoryColor}10`,
              }}
            >
              {thread.categoryName}
            </span>
            {thread.isPinned && <PinBadge />}
            {thread.unread && <ForumUnreadMark label={FORUM_UNREAD_LABEL} />}
          </div>

          <Link
            to="/forum/$categorySlug/$topicSlug"
            params={{ categorySlug: thread.categorySlug, topicSlug: thread.slug }}
            className="block space-y-0.5"
          >
            <h3 className="font-grotesk text-xs font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase line-clamp-1 leading-snug">
              {thread.title}
            </h3>
            {thread.preview ? (
              <p className="text-[11px] text-ink-muted line-clamp-1 leading-relaxed">{thread.preview}</p>
            ) : null}
          </Link>

          <div className="flex items-center justify-between gap-2 text-[11px] text-ink-muted">
            <span className="truncate text-ink font-bold">{thread.authorName}</span>
            <span className="flex items-center gap-2.5 shrink-0">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-cyan-glow" />
                <span>{thread.repliesCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-ink-muted/60 group-hover:text-ink-muted transition-colors" />
                <span>{thread.ageLabel}</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
