import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Clock, MessageSquare, Link2, Check, Quote } from 'lucide-react'
import { VoteButton, StageBadge } from '@/components/forum/ForumBits'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { ReplyComposer } from '@/components/forum/ReplyComposer'
import { ForumPostEntry } from '@/lib/server/api'
import { relativeTime } from '@/lib/forum-utils'
import { forumReplyIndentDepth, type ForumPostTreeNode } from '@/lib/forum-utils'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { ForumPostBody } from '@/components/forum/ForumPostBody'
import { isForumQuoteSourceWithdrawn } from '@/lib/forum-quotes'

export interface ForumPostCardProps {
  node: ForumPostTreeNode<ForumPostEntry>
  topicId: string
  replyingToId: string | null
  topicAuthorId?: string | null
  onReplyClick: (postId: string) => void
  onQuoteClick: (postId: string) => void
  onCancelReply: () => void
  onPosted: (post: ForumPostEntry) => void
  onPostVote: (postId: string) => (res: { upvotes: number; voted: boolean }) => void
  quoteDraft?: string
}

export function ForumPostCard({
  node,
  topicId,
  replyingToId,
  topicAuthorId,
  onReplyClick,
  onQuoteClick,
  onCancelReply,
  onPosted,
  onPostVote,
  quoteDraft = '',
}: ForumPostCardProps) {
  const { post, depth, children } = node
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const indent = forumReplyIndentDepth(depth)
  const isReplying = replyingToId === post.id
  const childCount = children.length
  const continued = depth > indent
  const isOp = Boolean(topicAuthorId && post.userId && post.userId === topicAuthorId)
  const withdrawn = isForumQuoteSourceWithdrawn(post)

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href)
      url.hash = `post-${post.id}`
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is restricted
    }
  }

  return (
    <div
      id={`post-${post.id}`}
      className={`space-y-2 scroll-mt-24 ${indent > 0 ? 'border-l-2 border-[#3a4a49]/60 hover:border-[#00ffff]/40 transition-colors pl-2 sm:pl-3.5' : ''}`}
      style={{ marginLeft: indent > 0 ? `${indent * 0.75}rem` : undefined }}
      data-testid="forum-post-card"
      data-depth={depth}
    >
      <div
        className={`chitin-card-inset p-3 sm:p-4 border chamfer-corner space-y-3 bg-[#070b0b]/75 target:border-[#00ffff] target:shadow-[0_0_16px_rgba(0,195,255,0.3)] transition-all ${
          continued ? 'border-l-[#00ffff]/50 border-[#3a4a49]' : 'border-[#3a4a49]'
        }`}
      >
        {/* Header: Avatar, Author Metadata, Timestamp & Actions */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
            {childCount > 0 && (
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="mt-1 sm:mt-0 p-1 -ml-1 text-[#839493] hover:text-[#00ffff] hover:bg-[#00ffff]/10 rounded transition-colors shrink-0"
                aria-label={collapsed ? 'Expand replies' : 'Collapse replies'}
                title={collapsed ? 'Expand replies' : 'Collapse replies'}
                data-testid="forum-collapse-toggle"
              >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Author Avatar with profile link */}
            {post.userId ? (
              <Link
                to="/member/$profileId"
                params={{
                  profileId: resolveMemberPublicParam({
                    id: post.userId,
                    handle: post.authorHandle,
                  }),
                }}
                className="shrink-0 group/avatar focus:outline-none"
                tabIndex={-1}
                aria-hidden="true"
              >
                <ForumAvatar
                  src={post.authorAvatar}
                  authorName={post.authorName}
                  authorHandle={post.authorHandle}
                  userId={post.userId}
                  avatarConfig={post.authorAvatarConfig}
                  alt=""
                  className={`${
                    depth === 0 ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-8 h-8 sm:w-9 sm:h-9'
                  } ring-1 ring-[#3a4a49] group-hover/avatar:ring-[#00ffff]/80 transition-all shadow-sm`}
                />
              </Link>
            ) : (
              <ForumAvatar
                src={post.authorAvatar}
                authorName={post.authorName}
                authorHandle={post.authorHandle}
                userId={post.userId}
                avatarConfig={post.authorAvatarConfig}
                className={`${
                  depth === 0 ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-8 h-8 sm:w-9 sm:h-9'
                } ring-1 ring-[#3a4a49] shadow-sm`}
              />
            )}

            {/* Author Info Column */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {post.userId ? (
                  <Link
                    to="/member/$profileId"
                    params={{
                      profileId: resolveMemberPublicParam({
                        id: post.userId,
                        handle: post.authorHandle,
                      }),
                    }}
                    className="text-[#dfe3e3] font-bold text-xs sm:text-sm truncate hover:text-[#00c3ff] transition-colors"
                  >
                    {post.authorName}
                  </Link>
                ) : (
                  <span className="text-[#dfe3e3] font-bold text-xs sm:text-sm truncate">
                    {post.authorName}
                  </span>
                )}

                {post.authorHandle && (
                  <span className="text-[11px] text-[#839493]/80 hidden sm:inline truncate">
                    @{post.authorHandle.replace(/^@/, '')}
                  </span>
                )}

                {isOp && (
                  <span
                    className="px-1.5 py-0.2 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/40 chamfer-corner"
                    title="Original Poster"
                  >
                    OP
                  </span>
                )}

                <StageBadge stage={post.authorStage} />
              </div>

              {/* Timestamp & Collapse Info */}
              <div className="flex items-center gap-1.5 text-[10px] text-[#839493] mt-0.5">
                <Clock className="w-3 h-3 text-[#3a4a49]" />
                <span title={new Date(post.createdAt).toLocaleString()}>
                  {relativeTime(post.createdAt)}
                </span>
                {collapsed && childCount > 0 && (
                  <span className="text-[#00ffff]/80 font-medium">
                    · {childCount} {childCount === 1 ? 'reply' : 'replies'} hidden
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Permalink Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy permalink"
            title={copied ? 'Link copied!' : 'Copy link to post'}
            className="p-1.5 text-[#839493] hover:text-[#00ffff] hover:bg-[#00ffff]/10 rounded transition-colors shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#00ffff]" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsed summary indicator */}
        {collapsed && childCount > 0 ? (
          <div className="text-xs text-[#839493] italic py-1 pl-1">
            Thread collapsed. Click the chevron above to expand {childCount}{' '}
            {childCount === 1 ? 'reply' : 'replies'}.
          </div>
        ) : (
          <>
            <ForumPostBody
              content={post.content}
              className="space-y-2 text-xs sm:text-sm text-[#dfe3e3] leading-relaxed"
            />

            {/* Bottom Actions Bar */}
            <div className="pt-2 border-t border-[#3a4a49]/40 flex items-center justify-between gap-2">
              <VoteButton
                count={post.upvotes}
                voted={post.voted}
                targetId={post.id}
                targetType="post"
                onResult={onPostVote(post.id)}
                size="inline"
              />

              <div className="flex items-center gap-2">
                {!withdrawn && (
                  <button
                    type="button"
                    onClick={() => onQuoteClick(post.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#00ffff] hover:bg-[#00ffff]/10 rounded transition-colors"
                    data-testid="forum-quote-post"
                  >
                    <Quote className="w-3.5 h-3.5" />
                    <span>Quote</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onReplyClick(post.id)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#00ffff] hover:bg-[#00ffff]/10 rounded transition-colors"
                  data-testid="forum-reply-to-comment"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Inline Reply Composer */}
        {isReplying && (
          <ReplyComposer
            topicId={topicId}
            parentId={post.id}
            initialContent={quoteDraft}
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

      {/* Recursive Children Replies */}
      {!collapsed &&
        children.map((child) => (
          <ForumPostCard
            key={child.post.id}
            node={child}
            topicId={topicId}
            topicAuthorId={topicAuthorId}
            replyingToId={replyingToId}
            onReplyClick={onReplyClick}
            onQuoteClick={onQuoteClick}
            onCancelReply={onCancelReply}
            onPosted={onPosted}
            onPostVote={onPostVote}
            quoteDraft={quoteDraft}
          />
        ))}
    </div>
  )
}
