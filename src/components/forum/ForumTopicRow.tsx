import React from 'react'
import { Link } from '@tanstack/react-router'
import { MessageSquare, Eye, Clock } from 'lucide-react'
import type { ForumTopicEntry } from '@/lib/server/api'
import { relativeTime } from '@/lib/forum-utils'
import { VoteButton, StageBadge, PinBadge } from './ForumBits'
import { ForumAvatar } from './ForumAvatar'
import { resolveMemberPublicParam } from '@/lib/member-handle'

interface ForumTopicRowProps {
  topic: ForumTopicEntry
  showCategory?: boolean
}

export function ForumTopicRow({ topic, showCategory = true }: ForumTopicRowProps) {
  const categorySlug = topic.categorySlug || 'general-discussion'

  return (
    <div className="chitin-card-inset p-3 sm:p-3.5 border border-[#3a4a49] hover:border-[#00ffff]/60 transition-all chamfer-corner group flex items-start gap-3 sm:gap-3.5 bg-[#070b0b]/60">
      <VoteButton
        count={topic.upvotes}
        voted={topic.voted}
        targetId={topic.id}
        targetType="topic"
        size="sm"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#839493]">
          {showCategory && topic.categoryName && (
            <span
              className="px-1.5 py-0.2 font-sans font-bold uppercase tracking-wider chamfer-corner border"
              style={{
                borderColor: `${topic.categoryColor || '#00ffff'}80`,
                color: topic.categoryColor || '#00ffff',
                backgroundColor: `${topic.categoryColor || '#00ffff'}10`,
              }}
            >
              {topic.categoryName}
            </span>
          )}
          {topic.isPinned && <PinBadge />}
        </div>

        <Link
          to="/forum/$categorySlug/$topicSlug"
          params={{ categorySlug, topicSlug: topic.slug }}
          className="block"
        >
          <h3 className="font-grotesk font-bold text-sm sm:text-base text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors leading-snug uppercase line-clamp-2 sm:line-clamp-1">
            {topic.title}
          </h3>
          <p className="text-xs text-[#839493] line-clamp-1 leading-relaxed mt-0.5">
            {topic.content}
          </p>
        </Link>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[11px] text-[#839493]">
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
                  className="w-4 h-4"
                />
                <span className="text-[#dfe3e3] font-bold truncate max-w-[120px] sm:max-w-[160px] hover:text-[#00c3ff] transition-colors">
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
                  className="w-4 h-4"
                />
                <span className="text-[#dfe3e3] font-bold truncate max-w-[120px] sm:max-w-[160px]">
                  {topic.authorName}
                </span>
              </>
            )}
            <StageBadge stage={topic.authorStage} />
          </span>
          <span className="text-[#3a4a49]">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#3a4a49] group-hover:text-[#839493] transition-colors" />
            <span>{relativeTime(topic.createdAt)}</span>
          </span>
          <span className="text-[#3a4a49]">·</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-[#00ffff]" />
            <span>{topic.repliesCount} comments</span>
          </span>
          <span className="text-[#3a4a49]">·</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{topic.views}</span>
          </span>
        </div>
      </div>
    </div>
  )
}