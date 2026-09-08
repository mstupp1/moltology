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

export const FORUM_HUB_TITLE = 'COMMUNITY FORUMS'
export const FORUM_HUB_SUBTITLE = 'Live boards and the latest transmissions.'
export const FORUM_HUB_EMPTY_COPY = {
  title: 'The boards are quiet',
  body: 'No threads yet. Open the forums to start one.',
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] chamfer-corner bg-[#070b0b]/60">
      {label}
      <span className="tabular-nums text-[#00ffff]">{count}</span>
    </span>
  )
}

function ForumHubListGhost() {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 flex-1 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
        ))}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-24 shrink-0 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
        ))}
      </div>
      {Array.from({ length: HUB_THREAD_LIMIT }).map((_, i) => (
        <div key={i} className="chitin-card-inset h-20 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
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
          getForumTopicsFn({ data: { sortBy: HUB_SORT, ...auth } }),
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
      className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between"
      data-testid="forum-hub-card"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 border-b border-[#3a4a49] pb-3">
          <div>
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00ffff]" />
              {FORUM_HUB_TITLE}
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">{FORUM_HUB_SUBTITLE}</p>
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
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider chamfer-corner border shrink-0 bg-[#070b0b]/70 hover:bg-[#00ffff]/10 transition-colors"
                    style={{
                      borderColor: `${board.color}80`,
                      color: board.color,
                    }}
                  >
                    <span className="truncate max-w-[9.5rem]">{board.name}</span>
                    <span className="tabular-nums text-[#dfe3e3]">{board.topicCount}</span>
                    {board.unreadCount > 0 && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#00ffff] shadow-[0_0_6px_rgba(0,255,255,0.7)]"
                        aria-label={formatForumUnreadCount(board.unreadCount)}
                      />
                    )}
                  </Link>
                ))}
              </div>
            )}

            {threads.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <p className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wide uppercase">
                  {FORUM_HUB_EMPTY_COPY.title}
                </p>
                <p className="text-xs text-[#839493] leading-relaxed">{FORUM_HUB_EMPTY_COPY.body}</p>
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

      <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
        <span className="text-[#839493] text-[10px]">OPEN THE BOARDS</span>
        <button
          type="button"
          onClick={() => navigate({ to: '/forum' })}
          className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
        >
          <span>ENTER FORUMS</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function HubThreadRow({ thread }: { thread: ForumHubThreadView }) {
  return (
    <div
      className={`chitin-card-inset p-3 border transition-all chamfer-corner group bg-[#070b0b]/60 ${
        thread.unread
          ? 'border-[#00ffff]/45 hover:border-[#00ffff]/80'
          : 'border-[#3a4a49] hover:border-[#00ffff]/60'
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
              className="ring-1 ring-[#3a4a49] group-hover:ring-[#00ffff]/60"
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
            className="ring-1 ring-[#3a4a49] mt-0.5"
          />
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="px-1.5 py-0.5 font-sans font-bold uppercase tracking-wider chamfer-corner border text-[9px] truncate max-w-[70%]"
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
            <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-1 leading-snug">
              {thread.title}
            </h3>
            {thread.preview ? (
              <p className="text-[11px] text-[#839493] line-clamp-1 leading-relaxed">{thread.preview}</p>
            ) : null}
          </Link>

          <div className="flex items-center justify-between gap-2 text-[10px] text-[#839493]">
            <span className="truncate text-[#dfe3e3] font-bold">{thread.authorName}</span>
            <span className="flex items-center gap-2.5 shrink-0">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-[#00ffff]" />
                <span>{thread.repliesCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#3a4a49] group-hover:text-[#839493] transition-colors" />
                <span>{thread.ageLabel}</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
