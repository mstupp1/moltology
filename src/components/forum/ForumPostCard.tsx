import React, { useEffect, useState } from 'react'
import { LocalTime } from '@/components/ui/LocalTime'
import { formatDayTime } from '@/lib/dates'
import { forumVisibleLength } from '@/lib/forum-markdown'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ChevronDown, ChevronRight, MessageSquare, Link2, Check, Quote, MoreHorizontal, Pencil, Undo2, Flag } from 'lucide-react'
import { VoteButton, StageBadge } from '@/components/forum/ForumBits'
import { RankCrest } from '@/components/leaderboard/RankCrest'
import { HudButton } from '@/components/ui/HudButton'
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
import { FORUM_BODY_MAX_CHARS, validateForumContent } from '@/lib/community-rules'
import {
  HudDropdownMenu,
  HudDropdownMenuTrigger,
  HudDropdownMenuContent,
  HudDropdownMenuItem,
  HudDropdownMenuSeparator,
} from '@/components/ui/HudDropdownMenu'

/** A reply with more direct replies than this shows the first few and a "Show more replies" link. */
const CHILD_PREVIEW_MAX = 5
const CHILD_PREVIEW_SHOWN = 3

function subtreeHas(nodes: ForumPostTreeNode[], postId: string): boolean {
  return nodes.some((node) => node.post.id === postId || subtreeHas(node.children, postId))
}

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
  const childrenFolded = childCount > CHILD_PREVIEW_MAX
  // A shared link to a reply inside the folded part opens it straight away.
  const [showAllChildren, setShowAllChildren] = useState(() => {
    if (!childrenFolded || typeof window === 'undefined') return false
    const hash = window.location.hash
    return hash.startsWith('#post-') && subtreeHas(children.slice(CHILD_PREVIEW_SHOWN), hash.slice(6))
  })
  // Replying here opens every reply, so the new one is not tucked away.
  useEffect(() => {
    if (isReplying) setShowAllChildren(true)
  }, [isReplying])
  const shownChildren = childrenFolded && !showAllChildren ? children.slice(0, CHILD_PREVIEW_SHOWN) : children
  const hiddenChildCount = childCount - shownChildren.length
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

  const isRoot = depth === 0
  // Children step in under this post's avatar until the indent cap; past it they stay level.
  const childrenNest = forumReplyIndentDepth(depth + 1) > indent
  const avatarSize = isRoot ? 'w-9 h-9' : 'w-7 h-7 sm:w-8 sm:h-8'
  const actionClass =
    'inline-flex min-h-8 items-center gap-1.5 px-2 text-2xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
  const authorLinkParams = post.userId
    ? { profileId: resolveMemberPublicParam({ id: post.userId, handle: post.authorHandle }) }
    : null

  return (
    <div
      id={`post-${post.id}`}
      className={
        isRoot
          ? 'scroll-mt-24 rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 target:border-cyan-glow/40 transition-colors'
          : 'scroll-mt-24 rounded-control target:bg-surface-2/60 transition-colors'
      }
      data-testid="forum-post-card"
      data-depth={depth}
    >
      <div className={`space-y-2 ${withdrawn ? 'opacity-80' : ''}`}>
        {/* Header: avatar, name, stage, time */}
        <div className="flex items-center gap-2.5 min-w-0">
          {authorLinkParams ? (
            <Link
              to="/member/$profileId"
              params={authorLinkParams}
              className="shrink-0 focus:outline-hidden"
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
                className={avatarSize}
              />
            </Link>
          ) : (
            <ForumAvatar
              src={post.authorAvatar}
              authorName={post.authorName}
              authorHandle={post.authorHandle}
              userId={post.userId}
              avatarConfig={post.authorAvatarConfig}
              className={avatarSize}
            />
          )}

          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-ink-muted">
            {authorLinkParams ? (
              <Link
                to="/member/$profileId"
                params={authorLinkParams}
                className="text-ink font-semibold text-xs sm:text-sm truncate max-w-[60vw] sm:max-w-none hover:text-cyan-glow transition-colors rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                {post.authorName}
              </Link>
            ) : (
              <span className="text-ink font-semibold text-xs sm:text-sm truncate">{post.authorName}</span>
            )}
            {post.authorHandle && (
              <span className="hidden sm:inline truncate">@{post.authorHandle.replace(/^@/, '')}</span>
            )}
            {isOp && (
              <span
                className="px-1.5 text-2xs font-sans font-semibold bg-cyan-soft text-cyan-glow rounded-chip"
                title="Started this post"
              >
                OP
              </span>
            )}
            <RankCrest userId={post.userId} />
            <StageBadge stage={post.authorStage} />
            <span className="inline-flex items-center gap-1">
              <LocalTime value={post.createdAt} format={relativeTime} titleFormat={formatDayTime} />
              <ForumRevisedMark createdAt={post.createdAt} updatedAt={post.updatedAt} deletedAt={post.deletedAt} />
            </span>
          </div>
        </div>

        <div className={isRoot ? 'sm:pl-[46px]' : 'pl-[38px] sm:pl-[42px]'}>
          {withdrawn ? (
            <ForumWithdrawnBody className="text-sm text-ink-muted leading-relaxed italic" />
          ) : post.sunk && !showSunk && !editing ? (
            <button
              type="button"
              onClick={() => setShowSunk(true)}
              data-testid="forum-sunk-reply"
              className="text-xs text-ink-muted italic py-1 hover:text-ink rounded-control transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
                aria-label="Edit reply"
                testId="forum-revise-reply-editor"
              />
              <div className="flex items-center justify-end gap-2">
                <HudButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false)
                    setDraft(post.content)
                    setError(null)
                  }}
                >
                  Cancel
                </HudButton>
                <HudButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={busy || forumVisibleLength(draft) < 10 || draft.trim().length > FORUM_BODY_MAX_CHARS}
                >
                  {busy ? 'Saving...' : 'Save changes'}
                </HudButton>
              </div>
            </form>
          ) : (
            <ForumPostBody content={post.content} className="space-y-2 text-sm text-ink-body leading-relaxed" />
          )}

          {/* Actions: vote, reply, quote, more */}
          <div className="mt-1.5 -ml-2 flex flex-wrap items-center gap-0.5">
            <VoteButton
              count={post.upvotes}
              voted={post.voted}
              targetId={post.id}
              targetType="post"
              authorId={post.userId}
              onResult={onPostVote(post.id)}
              size="inline"
            />
            {!withdrawn && !topicLocked && (
              <button
                type="button"
                onClick={() => onReplyClick(post.id)}
                aria-pressed={isReplying}
                className={actionClass}
                data-testid="forum-reply-to-comment"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}
            {!withdrawn && !topicLocked && (
              <button
                type="button"
                onClick={() => onQuoteClick(post.id)}
                className={actionClass}
                aria-label="Quote"
                title="Quote in a reply"
                data-testid="forum-quote-post"
              >
                <Quote className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quote</span>
              </button>
            )}
            {childCount > 0 && (
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className={actionClass}
                aria-expanded={!collapsed}
                title={collapsed ? 'Show replies' : 'Hide replies'}
                data-testid="forum-collapse-toggle"
              >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>
                  {collapsed
                    ? `Show ${childCount} ${childCount === 1 ? 'reply' : 'replies'}`
                    : 'Hide'}
                </span>
              </button>
            )}

            <HudDropdownMenu>
              <HudDropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Post options"
                  title="More options"
                  data-testid="forum-post-actions-menu"
                  className="ml-auto inline-flex min-h-8 min-w-8 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </HudDropdownMenuTrigger>
              <HudDropdownMenuContent align="end" sideOffset={4}>
                <HudDropdownMenuItem onSelect={handleCopyLink} data-testid="forum-copy-link-menu-item">
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{copied ? 'Link copied' : 'Copy link'}</span>
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
                      <span>Edit</span>
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

          {confirmingWithdraw && (
            <div
              className="mt-2 p-2.5 bg-crimson-soft border border-crimson-aggro/55 rounded-control flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150"
              data-testid="forum-withdraw-confirm"
            >
              <span className="text-xs text-ink-body">
                Withdraw this reply? Its text will be hidden. Replies to it stay.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <HudButton type="button" variant="ghost" size="sm" onClick={() => setConfirmingWithdraw(false)} disabled={busy}>
                  Keep it
                </HudButton>
                <HudButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleWithdraw}
                  disabled={busy}
                  data-testid="forum-withdraw-confirm-btn"
                >
                  {busy ? 'Withdrawing...' : 'Withdraw'}
                </HudButton>
              </div>
            </div>
          )}

          {isReplying && !topicLocked && (
            <div className="mt-2">
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
            </div>
          )}
        </div>
      </div>

      {!collapsed && childCount > 0 && (
        <div
          className={
            childrenNest
              ? 'mt-3 ml-[17px] sm:ml-[17px] pl-3 sm:pl-4 border-l border-line space-y-3'
              : 'mt-3 space-y-3'
          }
        >
          {shownChildren.map((child) => (
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
          {hiddenChildCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllChildren(true)}
              className={`${actionClass} normal-case tracking-normal text-xs`}
              data-testid="forum-show-more-replies"
            >
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                Show {hiddenChildCount} more {hiddenChildCount === 1 ? 'reply' : 'replies'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
