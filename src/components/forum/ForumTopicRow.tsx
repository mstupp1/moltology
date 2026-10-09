import React from 'react'
import { Link } from '@tanstack/react-router'
import { MessageSquare, Eye, Clock } from 'lucide-react'
import type { ForumTopicEntry } from '@/lib/server/api'
import { FORUM_WITHDRAWN_PREVIEW, isForumEntryWithdrawn, relativeTime } from '@/lib/forum-utils'
import { FORUM_UNREAD_LABEL } from '@/lib/forum-visits'
import { VoteButton, StageBadge, PinBadge, LockBadge, WithdrawnBadge, ForumUnreadMark } from './ForumBits'
import { ForumAvatar } from './ForumAvatar'
import { resolveMemberPublicParam } from '@/lib/member-handle'

interface ForumTopicRowProps {
  topic: ForumTopicEntry
  showCategory?: boolean
}

export function ForumTopicRow({ topic, showCategory = true }: ForumTopicRowProps) {
  const categorySlug = topic.categorySlug || 'general-discussion'

  return (
    <div
      className={`p-3 sm:p-3.5 border transition-all rounded-card group flex items-start gap-3 sm:gap-3.5 bg-surface-1 hud-sheen hover:bg-surface-2 ${
        topic.unread
          ? 'border-cyan-glow/40 hover:border-line-strong'
          : 'border-line-subtle hover:border-line-strong'
      }`}
    >
      <VoteButton
        count={topic.upvotes}
        voted={topic.voted}
        targetId={topic.id}
        targetType="topic"
        size="sm"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
          {showCategory && topic.categoryName && (
            <span
              className="px-1.5 py-0.2 font-sans font-bold uppercase tracking-[0.08em] rounded-chip border border-line-subtle"
              style={{
                color: topic.categoryColor || '#00c3ff',
                backgroundColor: `${topic.categoryColor || '#00c3ff'}26`,
              }}
            >
              {topic.categoryName}
            </span>
          )}
          {topic.isPinned && <PinBadge />}
          {topic.isLocked && <LockBadge />}
          {isForumEntryWithdrawn(topic) && <WithdrawnBadge />}
          {topic.unread && <ForumUnreadMark label={FORUM_UNREAD_LABEL} />}
        </div>

        <Link
          to="/forum/$categorySlug/$topicSlug"
          params={{ categorySlug, topicSlug: topic.slug }}
          className="block rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <h3 className="font-grotesk font-bold text-sm sm:text-base text-ink group-hover:text-cyan-glow transition-colors leading-snug uppercase line-clamp-2 sm:line-clamp-1">
            {topic.title}
          </h3>
          <p className="text-xs text-ink-muted line-clamp-1 leading-relaxed mt-0.5">
            {isForumEntryWithdrawn(topic) ? FORUM_WITHDRAWN_PREVIEW : topic.content}
          </p>
        </Link>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5 min-w-0">
            {topic.userId ? (
              <Link
                to="/member/$profileId"
                params={{
                  profileId: resolveMemberPublicParam({
                    id: topic.userId,
                    handle: topic.authorHandle,
                  }),
                }}
                className="flex items-center gap-1.5 min-w-0 hover:opacity-90"
                onClick={(e) => e.stopPropagation()}
              >
                <ForumAvatar
                  src={topic.authorAvatar}
                  authorName={topic.authorName}
                  authorHandle={topic.authorHandle}
                  userId={topic.userId}
                  avatarConfig={topic.authorAvatarConfig}
                  size="sm"
                  className="ring-1 ring-line group-hover:ring-line-strong"
                />
                <span className="text-ink font-bold truncate max-w-[120px] sm:max-w-[160px] hover:text-cyan-glow transition-colors">
                  {topic.authorName}
                </span>
              </Link>
            ) : (
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
                <span className="text-ink font-bold truncate max-w-[120px] sm:max-w-[160px]">
                  {topic.authorName}
                </span>
              </>
            )}
            <StageBadge stage={topic.authorStage} />
          </span>
          <span className="text-ink-muted/50">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-ink-muted/60 group-hover:text-ink-muted transition-colors" />
            <span>{relativeTime(topic.createdAt)}</span>
          </span>
          <span className="text-ink-muted/50">·</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-cyan-glow" />
            <span>{topic.repliesCount} comments</span>
          </span>
          <span className="text-ink-muted/50">·</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{topic.views}</span>
          </span>
        </div>
      </div>
    </div>
  )
}