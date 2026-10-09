import React, { useState } from 'react'
import { forumVisibleLength } from '@/lib/forum-markdown'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ChevronDown, ChevronRight, Clock, MessageSquare, Link2, Check, Quote, MoreHorizontal, Pencil, Undo2, Flag } from 'lucide-react'
import { VoteButton, StageBadge } from '@/components/forum/ForumBits'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { ReplyComposer } from '@/components/forum/ReplyComposer'
import { ForumPostEntry, updateForumPostFn, deleteForumPostFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { relativeTime } from '@/lib/forum-utils'
import { forumReplyIndentDepth, type ForumPostTreeNode } from '@/lib/forum-utils'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { ForumPostBody } from '@/components/forum/ForumPostBody'
import { ForumRevisedMark, ForumWithdrawnBody } from '@/components/forum/ForumAuthorTools'
import { ForumFlagControl } from '@/components/forum/ForumFlagControl'
import { ForumEditor } from '@/components/forum/ForumEditor'
import { isForumQuoteSourceWithdrawn } from '@/lib/forum-quotes'
import { useForumAuth } from '@/components/forum/ForumShell'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { validateForumContent } from '@/lib/community-rules'
import {
  HudDropdownMenu,
  HudDropdownMenuTrigger,
  HudDropdownMenuContent,
  HudDropdownMenuItem,
  HudDropdownMenuSeparator,
} from '@/components/ui/HudDropdownMenu'

export interface ForumPostCardProps {
  node: ForumPostTreeNode<ForumPostEntry>
  topicId: string
  replyingToId: string | null
  topicAuthorId?: string | null
  topicLocked?: boolean
  onReplyClick: (postId: string) => void
  onQuoteClick: (postId: string) => void
  onCancelReply: () => void
  onPosted: (post: ForumPostEntry) => void
  onPostVote: (postId: string) => (res: { upvotes: number; voted: boolean }) => void
  onUpdated: (post: ForumPostEntry) => void
  quoteDraft?: string
}

export function ForumPostCard({
  node,
  topicId,
  replyingToId,
  topicAuthorId,
  topicLocked = false,
  onReplyClick,
  onQuoteClick,
  onCancelReply,
  onPosted,
  onPostVote,
  onUpdated,
  quoteDraft = '',
}: ForumPostCardProps) {
  const { post, depth, children } = node
  const { userId } = useForumAuth()
  const persist = useHudPersist()
  const toast = useOptionalToast()
  const [collapsed, setCollapsed] = useState(false)
  const [showSunk, setShowSunk] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const indent = forumReplyIndentDepth(depth)
  const isReplying = replyingToId === post.id
  const childCount = children.length
  const continued = depth > indent
  const isOp = Boolean(topicAuthorId && post.userId && post.userId === topicAuthorId)
  const withdrawn = isForumQuoteSourceWithdrawn(post)
  const canAuthor = Boolean(userId && post.userId && userId === post.userId && !withdrawn)

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

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const validation = validateForumContent(undefined, draft)
    if (!validation.valid) {
      setError(validation.error || 'Invalid content')
      return
    }
    setBusy(true)
    setError(null)
    persist.begin('forum-revise-reply')
    try {
      const token = await getAuthJWTToken()
      const updated = await updateForumPostFn({
        data: {
          postId: post.id,
          content: draft,
          userId: userId ?? undefined,
          token: token ?? undefined,
        },
      })
      onUpdated(updated)
      setEditing(false)
      toast?.toast.success('Reply updated.')
    } catch (err: any) {
      const message = err?.message || 'Could not update that reply.'
      setError(message)
      toast?.toast.error(message)
    } finally {
      persist.end('forum-revise-reply')
      setBusy(false)
    }
  }

  const handleWithdraw = async () => {
    setBusy(true)
    setError(null)
    persist.begin('forum-withdraw-reply')
    try {
      const token = await getAuthJWTToken()
      const updated = await deleteForumPostFn({
        data: {
          postId: post.id,
          userId: userId ?? undefined,
          token: token ?? undefined,
        },
      })
      onUpdated(updated)
      setConfirmingWithdraw(false)
      toast?.toast.success('Reply withdrawn.')
    } catch (err: any) {
      const message = err?.message || 'Could not withdraw that reply.'
      setError(message)
      toast?.toast.error(message)
    } finally {
      persist.end('forum-withdraw-reply')
      setBusy(false)
    }
  }

  return (
    <div
      id={`post-${post.id}`}
      className={`space-y-2 scroll-mt-24 ${indent > 0 ? 'border-l-2 border-line-subtle hover:border-line-strong transition-colors pl-2 sm:pl-3.5' : ''}`}
      style={{ marginLeft: indent > 0 ? `${indent * 0.75}rem` : undefined }}
      data-testid="forum-post-card"
      data-depth={depth}
    >
      <div
        className={`rounded-card border bg-surface-1 hud-sheen p-3 sm:p-4 space-y-3 target:border-cyan-glow/40 transition-colors ${
          continued ? 'border-line-subtle border-l-cyan-glow/40' : 'border-line-subtle'
        } ${withdrawn ? 'opacity-80' : ''}`}
      >
        {/* Header: Avatar, Author Metadata, Timestamp & Actions */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
            {childCount > 0 && (
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="mt-1 sm:mt-0 p-1 -ml-1 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow shrink-0"
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
                  } ring-1 ring-line group-hover/avatar:ring-line-strong transition-all shadow-sm`}
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
                } ring-1 ring-line shadow-sm`}
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
                    className="text-ink font-bold text-xs sm:text-sm truncate hover:text-cyan-glow transition-colors"
                  >
                    {post.authorName}
                  </Link>
                ) : (
                  <span className="text-ink font-bold text-xs sm:text-sm truncate">
                    {post.authorName}
                  </span>
                )}

                {post.authorHandle && (
                  <span className="text-[11px] text-ink-muted hidden sm:inline truncate">
                    @{post.authorHandle.replace(/^@/, '')}
                  </span>
                )}

                {isOp && (
                  <span
                    className="px-1.5 py-0.2 text-[11px] font-sans font-bold uppercase tracking-[0.08em] bg-cyan-soft text-cyan-glow rounded-chip"
                    title="Original Poster"
                  >
                    OP
                  </span>
                )}

                <StageBadge stage={post.authorStage} />
              </div>

              {/* Timestamp & Collapse Info */}
              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
                <Clock className="w-3 h-3 text-ink-muted/60" />
                <span title={new Date(post.createdAt).toLocaleString()}>
                  {relativeTime(post.createdAt)}
                </span>
                <ForumRevisedMark
                  createdAt={post.createdAt}
                  updatedAt={post.updatedAt}
                  deletedAt={post.deletedAt}
                />
                {collapsed && childCount > 0 && (
                  <span className="text-cyan-glow font-medium">
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
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-cyan-glow" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsed summary indicator */}
        {collapsed && childCount > 0 ? (
          <div className="text-xs text-ink-muted italic py-1 pl-1">
            Thread collapsed. Click the chevron above to expand {childCount}{' '}
            {childCount === 1 ? 'reply' : 'replies'}.
          </div>
        ) : (
          <>
            {withdrawn ? (
              <ForumWithdrawnBody className="text-xs sm:text-sm text-ink-muted leading-relaxed italic" />
            ) : post.sunk && !showSunk && !editing ? (
              <button
                type="button"
                onClick={() => setShowSunk(true)}
                data-testid="forum-sunk-reply"
                className="text-xs text-ink-muted italic py-1 pl-1 hover:text-ink rounded-control transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                Low-signal reply, hidden by default. Show it anyway.
              </button>
            ) : editing ? (
              <form onSubmit={handleSave} className="space-y-2" data-testid="forum-revise-reply-form">
                {error && (
                  <div className="p-2.5 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs flex items-center gap-2 rounded-control">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <ForumEditor
                  value={draft}
                  onChange={setDraft}
                  onSubmit={() => {
                    if (!busy && forumVisibleLength(draft) >= 10) void handleSave()
                  }}
                  disabled={busy}
                  size="compact"
                  autoFocus
                  aria-label="Revise reply"
                  testId="forum-revise-reply-editor"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setDraft(post.content)
                      setError(null)
                    }}
                    className="px-3 py-1.5 rounded-control text-xs font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || forumVisibleLength(draft) < 10}
                    className="px-4 py-1.5 rounded-control bg-cyan-glow hover:bg-cyan-hover disabled:opacity-50 text-abyss text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    {busy ? 'Sealing...' : 'Seal revision'}
                  </button>
                </div>
              </form>
            ) : (
              <ForumPostBody
                content={post.content}
                className="space-y-2 text-xs sm:text-sm text-ink-body leading-relaxed"
              />
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-2 border-t border-line-subtle flex items-center justify-between gap-2">
              <VoteButton
                count={post.upvotes}
                voted={post.voted}
                targetId={post.id}
                targetType="post"
                onResult={onPostVote(post.id)}
                size="inline"
              />

              <div className="flex items-center gap-1.5 sm:gap-2">
                {!withdrawn && !topicLocked && (
                  <button
                    type="button"
                    onClick={() => onQuoteClick(post.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    data-testid="forum-quote-post"
                  >
                    <Quote className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Quote</span>
                  </button>
                )}
                {!withdrawn && !topicLocked && (
                  <button
                    type="button"
                    onClick={() => onReplyClick(post.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    data-testid="forum-reply-to-comment"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                )}

                {/* More Options / Overflow Menu */}
                <HudDropdownMenu>
                  <HudDropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Post options"
                      title="More options"
                      data-testid="forum-post-actions-menu"
                      className="p-1 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </HudDropdownMenuTrigger>
                  <HudDropdownMenuContent align="end" sideOffset={4}>
                    <HudDropdownMenuItem
                      onSelect={handleCopyLink}
                      data-testid="forum-copy-link-menu-item"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                    </HudDropdownMenuItem>

                    {canAuthor && (
                      <div data-testid="forum-author-tools">
                        <HudDropdownMenuItem
                          onSelect={() => {
                            setDraft(post.content)
                            setConfirmingWithdraw(false)
                            setEditing(true)
                            setError(null)
                          }}
                          data-testid="forum-revise"
                        >
                          <Pencil className="w-3.5 h-3.5 shrink-0" />
                          <span>Revise</span>
                        </HudDropdownMenuItem>
                      </div>
                    )}

                    <ForumFlagControl
                      topicId={topicId}
                      postId={post.id}
                      authorId={post.userId}
                      withdrawn={withdrawn}
                      deletedAt={post.deletedAt}
                      customTrigger={(openFlagDialog) => (
                        <HudDropdownMenuItem
                          onSelect={openFlagDialog}
                          className="text-ink-muted data-[highlighted]:text-ink data-[highlighted]:bg-surface-3"
                          data-testid="forum-flag"
                        >
                          <Flag className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>Report</span>
                        </HudDropdownMenuItem>
                      )}
                    />

                    {canAuthor && (
                      <>
                        <HudDropdownMenuSeparator />
                        <HudDropdownMenuItem
                          destructive
                          onSelect={() => {
                            setEditing(false)
                            setConfirmingWithdraw(true)
                          }}
                          data-testid="forum-withdraw"
                        >
                          <Undo2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Withdraw</span>
                        </HudDropdownMenuItem>
                      </>
                    )}
                  </HudDropdownMenuContent>
                </HudDropdownMenu>
              </div>
            </div>

            {/* Inline Withdraw Confirmation */}
            {confirmingWithdraw && (
              <div
                className="p-2.5 bg-crimson-soft border border-crimson-aggro/55 rounded-control flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150"
                data-testid="forum-withdraw-confirm"
              >
                <span className="text-xs text-ink-body">
                  Withdraw this transmission? The body will be sealed. Replies stay in the thread.
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setConfirmingWithdraw(false)}
                    disabled={busy}
                    className="px-2.5 py-1 rounded-control text-xs font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow disabled:opacity-50"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={busy}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] bg-crimson-aggro hover:bg-crimson-hover text-abyss rounded-control transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    data-testid="forum-withdraw-confirm-btn"
                  >
                    {busy ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Inline Reply Composer */}
        {isReplying && !topicLocked && (
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
            topicLocked={topicLocked}
            replyingToId={replyingToId}
            onReplyClick={onReplyClick}
            onQuoteClick={onQuoteClick}
            onCancelReply={onCancelReply}
            onPosted={onPosted}
            onPostVote={onPostVote}
            onUpdated={onUpdated}
            quoteDraft={quoteDraft}
          />
        ))}
    </div>
  )
}
