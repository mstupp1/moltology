import React, { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { MessageSquare, Eye, Reply } from 'lucide-react'
import type { ForumPostEntry, ForumTopicEntry } from '@/lib/server/api'
import { getForumTopicsFn } from '@/lib/server/api'
import { useAppQuery } from '@/lib/query/account'
import { FRESH, forumKeys } from '@/lib/query/content'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { relativeTime } from '@/lib/forum-utils'
import { LocalTime } from '@/components/ui/LocalTime'
import { HudButton } from '@/components/ui/HudButton'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { ForumAvatar } from './ForumAvatar'
import { StageBadge, VoteButton } from './ForumBits'
import { RankCrest } from '@/components/leaderboard/RankCrest'
import { BoardDot } from './ForumBandCrumbs'
import { cn } from '@/lib/utils'

const RAIL_CARD = 'rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4'
const RAIL_HEADING = 'eyebrow'
const MORE_COUNT = 4

type Person = Pick<ForumPostEntry, 'userId' | 'authorName' | 'authorHandle' | 'authorAvatar' | 'authorAvatarConfig'>

/** Everyone who has replied, most active first, without the author of the post. */
export function threadParticipants(topic: ForumTopicEntry, posts: ForumPostEntry[]): Person[] {
  const counts = new Map<string, { person: Person; n: number }>()
  for (const post of posts) {
    const key = post.userId || post.authorName
    if (!key || (topic.userId && post.userId === topic.userId)) continue
    const hit = counts.get(key)
    if (hit) hit.n += 1
    else counts.set(key, { person: post, n: 1 })
  }
  return [...counts.values()].sort((a, b) => b.n - a.n).map((entry) => entry.person)
}

function PersonLink({ person, children, className }: { person: Person; children: React.ReactNode; className?: string }) {
  if (!person.userId) return <span className={className}>{children}</span>
  return (
    <Link
      to="/member/$profileId"
      params={{ profileId: resolveMemberPublicParam({ id: person.userId, handle: person.authorHandle }) }}
      className={cn(
        'rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        className,
      )}
    >
      {children}
    </Link>
  )
}

/**
 * The desktop post page's right column, sticky while the replies scroll: who wrote it,
 * the post's actions, who has joined in, and what to read next on the same board.
 */
export function ForumThreadRail({
  topic,
  posts,
  canReply,
  onReply,
  onVote,
}: {
  topic: ForumTopicEntry
  posts: ForumPostEntry[]
  canReply: boolean
  onReply: () => void
  onVote: (res: { upvotes: number; voted: boolean }) => void
}) {
  const people = useMemo(() => threadParticipants(topic, posts), [topic, posts])
  const shown = people.slice(0, 8)
  const handle = topic.authorHandle?.replace(/^@/, '')

  return (
    <aside className="space-y-3 sm:space-y-4 lg:sticky lg:top-20" aria-label="About this post" data-testid="forum-thread-rail">
      <section className={cn(RAIL_CARD, 'space-y-3')}>
        <PersonLink person={topic} className="group flex items-center gap-3">
          <ForumAvatar
            src={topic.authorAvatar}
            authorName={topic.authorName}
            authorHandle={topic.authorHandle}
            userId={topic.userId}
            avatarConfig={topic.authorAvatarConfig}
            alt=""
            size="xl"
          />
          <span className="min-w-0 space-y-0.5">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="block text-sm font-semibold text-ink truncate group-hover:text-cyan-glow transition-colors">
                {topic.authorName}
              </span>
              <RankCrest userId={topic.userId} />
            </span>
            {handle ? <span className="block text-2xs text-ink-muted truncate">@{handle}</span> : null}
            <span className="flex items-center gap-2 text-2xs text-ink-muted">
              <StageBadge stage={topic.authorStage} />
              <LocalTime value={topic.createdAt} format={relativeTime} />
            </span>
          </span>
        </PersonLink>

        <div className="flex items-center gap-4 text-2xs text-ink-muted tabular-nums">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            {topic.repliesCount} {topic.repliesCount === 1 ? 'reply' : 'replies'}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            {topic.views} views
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
          <VoteButton
            count={topic.upvotes}
            voted={topic.voted}
            targetId={topic.id}
            targetType="topic"
            authorId={topic.userId}
            onResult={onVote}
            size="inline"
          />
          {canReply ? (
            <HudButton type="button" variant="primary" size="sm" onClick={onReply} icon={<Reply className="w-3.5 h-3.5" />}>
              Reply
            </HudButton>
          ) : null}
        </div>

        {shown.length > 0 ? (
          <div className="space-y-2 border-t border-line-subtle pt-3" data-testid="forum-thread-people">
            <h3 className={RAIL_HEADING}>
              In this thread · {people.length} {people.length === 1 ? 'member' : 'members'}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {shown.map((person) => (
                <li key={person.userId || person.authorName} title={person.authorName}>
                  <PersonLink person={person} className="block">
                    <ForumAvatar
                      src={person.authorAvatar}
                      authorName={person.authorName}
                      authorHandle={person.authorHandle}
                      userId={person.userId}
                      avatarConfig={person.authorAvatarConfig}
                      alt={person.authorName}
                      size="md"
                    />
                  </PersonLink>
                </li>
              ))}
              {people.length > shown.length ? (
                <li className="w-9 h-9 rounded-full bg-surface-2 border border-line-subtle flex items-center justify-center text-2xs font-semibold text-ink-muted">
                  +{people.length - shown.length}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </section>

      <MoreFromBoard topic={topic} />
    </aside>
  )
}

/** A few other posts from the same board, so a reader can keep going. Also used under the replies on phones. */
export function MoreFromBoard({ topic, className }: { topic: ForumTopicEntry; className?: string }) {
  const boardSlug = topic.categorySlug || ''
  const list = useAppQuery({
    queryKey: forumKeys.topics({ board: boardSlug, sortBy: 'hot', query: '', view: 'more', limit: MORE_COUNT + 1 }),
    queryFn: async () =>
      (await getForumTopicsFn({ data: { categorySlug: boardSlug, sortBy: 'hot', limit: MORE_COUNT + 1 } })) || [],
    enabled: Boolean(boardSlug),
    staleTime: FRESH.forum,
  })
  const others = (list.data ?? []).filter((t) => t.id !== topic.id).slice(0, MORE_COUNT)
  if (!boardSlug || (list.data && others.length === 0) || list.isError) return null

  return (
    <section className={cn(RAIL_CARD, 'space-y-2', className)} data-testid="forum-more-from-board">
      <h3 className={cn(RAIL_HEADING, 'flex items-center gap-2')}>
        <BoardDot color={topic.categoryColor} />
        <span className="truncate">More in {topic.categoryName || 'this board'}</span>
      </h3>
      <ul className="divide-y divide-line-subtle">
        {list.data
          ? others.map((t) => (
              <li key={t.id}>
                <Link
                  to="/forum/$categorySlug/$topicSlug"
                  params={{ categorySlug: t.categorySlug || boardSlug, topicSlug: t.slug }}
                  className="group block py-2 sm:py-2.5 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <span className="block text-xs font-semibold text-ink leading-snug line-clamp-2 group-hover:text-cyan-glow transition-colors">
                    {t.title}
                  </span>
                  <span className="mt-1 flex items-center gap-3 text-2xs text-ink-muted tabular-nums">
                    <span className="truncate">{t.authorName}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <MessageSquare className="w-3 h-3" aria-hidden="true" />
                      {t.repliesCount}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          : Array.from({ length: MORE_COUNT }).map((_, i) => (
              <li key={i} className="py-2 sm:py-2.5 space-y-1.5">
                <HudGhostSkeleton variant="neutral" preset="text" width="85%" height={12} />
                <HudGhostSkeleton variant="neutral" preset="text" width="40%" height={11} />
              </li>
            ))}
      </ul>
      <Link
        to="/forum/$categorySlug"
        params={{ categorySlug: boardSlug }}
        className="inline-flex min-h-8 items-center text-2xs font-semibold text-ink-muted hover:text-ink rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
      >
        See all in {topic.categoryName || 'this board'}
      </Link>
    </section>
  )
}
