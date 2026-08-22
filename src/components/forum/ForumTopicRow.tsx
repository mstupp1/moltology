import React from 'react'
import { Link } from '@tanstack/react-router'
import { MessageSquare, Eye } from 'lucide-react'
import type { ForumTopicEntry } from '@/lib/server/api'
import { relativeTime } from '@/lib/forum-utils'
import { VoteButton, StageBadge, PinBadge } from './ForumBits'

interface ForumTopicRowProps {
  topic: ForumTopicEntry
  showCategory?: boolean
}

export function ForumTopicRow({ topic, showCategory = true }: ForumTopicRowProps) {
  const categorySlug = topic.categorySlug || 'general-discussion'

  return (
    <div className="flex items-start gap-3 py-3 px-3 sm:px-4 bg-[#0a0f0f] border border-[#1f2b2a] hover:border-[#00ffff]/50 rounded-md transition-colors group">
      <VoteButton
        count={topic.upvotes}
        voted={topic.voted || false}
        targetId={topic.id}
        targetType="topic"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#839493]">
          {showCategory && topic.categoryName && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold uppercase border"
              style={{ borderColor: topic.categoryColor || '#00ffff', color: topic.categoryColor || '#00ffff' }}
            >
              {topic.categoryName}
            </span>
          )}
          {topic.isPinned && <PinBadge />}
        </div>

        <Link
          to="/forum/$categorySlug/$topicSlug"
          params={{ categorySlug, topicSlug: topic.slug }}
          className="block mt-1"
        >
          <h3 className="font-grotesk font-bold text-sm sm:text-base text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors leading-snug">
            {topic.title}
          </h3>
          <p className="text-xs text-[#839493] line-clamp-1 leading-relaxed mt-0.5">{topic.content}</p>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-[#839493]">
          <span className="flex items-center gap-1.5 min-w-0">
            <img src={topic.authorAvatar} alt="" className="w-4 h-4 rounded-full border border-[#2a3a39] object-cover" />
            <span className="text-[#dfe3e3] font-bold truncate">{topic.authorName}</span>
            <StageBadge stage={topic.authorStage} />
          </span>
          <span>·</span>
          <span>{relativeTime(topic.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#00ffff]" /> {topic.repliesCount} comments
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {topic.views}
          </span>
        </div>
      </div>
    </div>
  )
}