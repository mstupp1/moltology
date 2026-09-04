import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Clock, MessageSquare } from 'lucide-react'
import { VoteButton, StageBadge } from '@/components/forum/ForumBits'
import { ReplyComposer } from '@/components/forum/ReplyComposer'
import { ForumPostEntry } from '@/lib/server/api'
import { relativeTime } from '@/lib/forum-utils'
import { forumReplyIndentDepth, type ForumPostTreeNode } from '@/lib/forum-utils'
import { resolveMemberPublicParam } from '@/lib/member-handle'

export function ForumPostCard({
  node,
  topicId,
  replyingToId,
  onReplyClick,
  onCancelReply,
  onPosted,
  onPostVote,
}: {
  node: ForumPostTreeNode<ForumPostEntry>
  topicId: string
  replyingToId: string | null
  onReplyClick: (postId: string) => void
  onCancelReply: () => void
  onPosted: (post: ForumPostEntry) => void
  onPostVote: (postId: string) => (res: { upvotes: number; voted: boolean }) => void
}) {
  const { post, depth, children } = node
  const [collapsed, setCollapsed] = useState(false)
  const indent = forumReplyIndentDepth(depth)
  const isReplying = replyingToId === post.id
  const childCount = children.length
  const continued = depth > indent

  return (
    <div
      className="space-y-2"
      style={{ marginLeft: indent > 0 ? `${indent * 0.75}rem` : undefined }}
      data-testid="forum-post-card"
      data-depth={depth}
    >
      <div
        className={`chitin-card-inset p-3 sm:p-4 border chamfer-corner space-y-2.5 bg-[#070b0b]/60 ${
          continued ? 'border-l-[#00ffff]/50 border-[#3a4a49]' : 'border-[#3a4a49]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#839493]">
          <span className="flex items-center gap-1.5 min-w-0">
            {childCount > 0 && (
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="shrink-0 text-[#839493] hover:text-[#00ffff] transition-colors"
                aria-label={collapsed ? 'Expand replies' : 'Collapse replies'}
                data-testid="forum-collapse-toggle"
              >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
            <img
              src={post.authorAvatar}
              alt=""
              className="w-4 h-4 rounded-full border border-[#3a4a49] object-cover shrink-0"
            />
            {post.userId ? (
              <Link
                to="/member/$profileId"
                params={{
                  profileId: resolveMemberPublicParam({
                    id: post.userId,
                    handle: post.authorHandle,
                  }),
                }}
                className="text-[#dfe3e3] font-bold truncate hover:text-[#00c3ff] transition-colors"
              >
                {post.authorName}
              </Link>
            ) : (
              <span className="text-[#dfe3e3] font-bold truncate">{post.authorName}</span>
            )}
            <StageBadge stage={post.authorStage} />
            {collapsed && childCount > 0 && (
              <span className="text-[10px] text-[#839493]">({childCount} hidden)</span>
            )}
          </span>
          <span className="text-[10px] text-[#839493] flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-[#3a4a49]" />
            <span>{relativeTime(post.createdAt)}</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#dfe3e3] leading-relaxed whitespace-pre-wrap">{post.content}</p>

        <div className="pt-1.5 border-t border-[#3a4a49]/40 flex items-center justify-between gap-2">
          <VoteButton
            count={post.upvotes}
            voted={post.voted}
            targetId={post.id}
            targetType="post"
            onResult={onPostVote(post.id)}
            size="inline"
          />
          <button
            type="button"
            onClick={() => onReplyClick(post.id)}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#00ffff] transition-colors"
            data-testid="forum-reply-to-comment"
          >
            <MessageSquare className="w-3 h-3" />
            Reply
          </button>
        </div>

        {isReplying && (
          <ReplyComposer
            topicId={topicId}
            parentId={post.id}
            onPosted={(p) => {
              onPosted(p)
              onCancelReply()
            }}
            onCancel={onCancelReply}
            compact
            autoFocus
          />
        )}
      </div>

      {!collapsed &&
        children.map((child) => (
          <ForumPostCard
            key={child.post.id}
            node={child}
            topicId={topicId}
            replyingToId={replyingToId}
            onReplyClick={onReplyClick}
            onCancelReply={onCancelReply}
            onPosted={onPosted}
            onPostVote={onPostVote}
          />
        ))}
    </div>
  )
}
