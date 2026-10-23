import React from 'react'
import { LocalTime } from '@/components/ui/LocalTime'
import { Link } from '@tanstack/react-router'
import { MessageSquare, Eye } from 'lucide-react'
import type { ForumTopicEntry } from '@/lib/server/api'
import { FORUM_WITHDRAWN_PREVIEW, isForumEntryWithdrawn, relativeTime } from '@/lib/forum-utils'
import { FORUM_UNREAD_LABEL } from '@/lib/forum-visits'
import { cn } from '@/lib/utils'
import { VoteButton, StageBadge, PinBadge, LockBadge, WithdrawnBadge, ForumUnreadMark } from './ForumBits'
import { ForumAvatar } from './ForumAvatar'
import { resolveMemberPublicParam } from '@/lib/member-handle'

interface ForumTopicRowProps {
  topic: ForumTopicEntry
  showCategory?: boolean
}

/**
 * One thread in a list. The whole card opens the thread (the title link stretches over it);
 * the vote button and author link sit above that layer so they still work on their own.
 */
export function ForumTopicRow({ topic, showCategory = true }: ForumTopicRowProps) {
  const categorySlug = topic.categorySlug || 'general-discussion'
  const withdrawn = isForumEntryWithdrawn(topic)
  const showBoard = showCategory && !!topic.categoryName
  const hasMeta = showBoard || topic.isPinned || topic.isLocked || withdrawn || topic.unread

  const author = (
    <>
      <ForumAvatar
        src={topic.authorAvatar}
        authorName={topic.authorName}
        authorHandle={topic.authorHandle}
        userId={topic.userId}
        avatarConfig={topic.authorAvatarConfig}
        size="sm"
        className="ring-1 ring-line"
      />
      <span className="text-ink font-bold truncate max-w-[120px] sm:max-w-[180px]">{topic.authorName}</span>
    </>
  )

  return (
    <article
      className={cn(
        'group relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-card border bg-surface-1 hud-sheen transition-colors hover:bg-surface-2 hover:border-line',
        topic.unread ? 'border-line-subtle border-l-2 border-l-cyan-glow' : 'border-line-subtle',
      )}
      data-testid="forum-topic-row"
    >
      <div className="relative z-10">
        <VoteButton count={topic.upvotes} voted={topic.voted} targetId={topic.id} targetType="topic" size="sm" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {hasMeta && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
            {showBoard && (
              <span className="inline-flex items-center gap-1.5 font-bold text-ink-body">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: topic.categoryColor || '#00c3ff' }}
                  aria-hidden="true"
                />
                {topic.categoryName}
              </span>
            )}
            {topic.isPinned && <PinBadge />}
            {topic.isLocked && <LockBadge />}
            {withdrawn && <WithdrawnBadge />}
            {topic.unread && <ForumUnreadMark label={FORUM_UNREAD_LABEL} />}
          </div>
        )}

        <h3 className="font-grotesk font-bold text-sm sm:text-base text-ink leading-snug line-clamp-2 group-hover:text-cyan-glow transition-colors">
          <Link
            to="/forum/$categorySlug/$topicSlug"
            params={{ categorySlug, topicSlug: topic.slug }}
            className="outline-hidden after:absolute after:inset-0 after:rounded-card focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-cyan-glow"
          >
            {topic.title}
          </Link>
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed line-clamp-1 sm:line-clamp-2">
          {withdrawn ? FORUM_WITHDRAWN_PREVIEW : topic.content}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5 min-w-0">
            {topic.userId ? (
              <Link
                to="/member/$profileId"
                params={{
                  profileId: resolveMemberPublicParam({ id: topic.userId, handle: topic.authorHandle }),
                }}
                className="relative z-10 flex items-center gap-1.5 min-w-0 rounded-control hover:[&>span]:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                {author}
              </Link>
            ) : (
              author
            )}
            <StageBadge stage={topic.authorStage} />
          </span>
          <LocalTime value={topic.createdAt} format={relativeTime} />

          <span className="ml-auto flex items-center gap-3 tabular-nums">
            <span className="flex items-center gap-1" title={`${topic.repliesCount} replies`}>
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{topic.repliesCount}</span>
              <span className="sr-only">replies</span>
            </span>
            <span className="flex items-center gap-1" title={`${topic.views} views`}>
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{topic.views}</span>
              <span className="sr-only">views</span>
            </span>
          </span>
        </div>
      </div>
    </article>
  )
}
