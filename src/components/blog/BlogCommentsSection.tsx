import React, { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, Send } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useToast } from '@/components/ui/ToastProvider'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  getBlogCommentsFn,
  createBlogCommentFn,
  type BlogCommentEntry,
} from '@/lib/server/api'
import { AuthModal } from '@/components/AuthModal'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { HudButton } from '@/components/ui/HudButton'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'
import { LoadMoreButton } from '@/components/ui/LoadMoreButton'
import { LocalTime } from '@/components/ui/LocalTime'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { StageBadge } from '@/components/forum/ForumBits'
import { relativeTime } from '@/lib/forum-utils'
import { formatDayTime } from '@/lib/dates'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { PAGE_SIZES, mergeById, takePage } from '@/lib/pagination'

const MAX_CHAR_LIMIT = 1000
const MIN_CHAR_LIMIT = 3
/** The count shows once a comment gets this close to the limit. */
const COUNT_SHOWS_AT = MAX_CHAR_LIMIT - 200

const CARD = 'rounded-card border border-line-subtle bg-surface-1 lit-surface'
const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

interface BlogCommentsSectionProps {
  postId?: string
}

function CommentRowsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className={`${CARD} px-3 sm:px-4 divide-y divide-line-subtle`} data-testid="blog-comments-loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="py-3 sm:py-4 flex gap-2.5">
          <HudGhostSkeleton variant="neutral" preset="avatar" width={32} height={32} />
          <div className="flex-1 space-y-2 pt-1">
            <HudGhostSkeleton variant="neutral" preset="text" width="35%" height={12} />
            <HudGhostSkeleton variant="neutral" preset="text" width="90%" height={12} />
            <HudGhostSkeleton variant="neutral" preset="text" width="60%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CommentRow({ comment }: { comment: BlogCommentEntry }) {
  const profileParams = comment.userId
    ? { profileId: resolveMemberPublicParam({ id: comment.userId, handle: comment.authorHandle }) }
    : null
  const avatar = (
    <ForumAvatar
      src={comment.authorAvatar}
      authorName={comment.authorName}
      authorHandle={comment.authorHandle}
      userId={comment.userId}
      avatarConfig={comment.authorAvatarConfig}
      alt=""
      className="w-8 h-8"
    />
  )

  return (
    <li className="py-3 sm:py-4 flex gap-2.5" data-testid="blog-comment-row">
      {profileParams ? (
        <Link to="/member/$profileId" params={profileParams} className="shrink-0" tabIndex={-1} aria-hidden="true">
          {avatar}
        </Link>
      ) : (
        avatar
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-ink-muted">
          {profileParams ? (
            <Link
              to="/member/$profileId"
              params={profileParams}
              className={`text-ink font-semibold text-xs sm:text-sm truncate max-w-[60vw] sm:max-w-none hover:text-cyan-glow transition-colors rounded-control ${FOCUS}`}
            >
              {comment.authorName}
            </Link>
          ) : (
            <span className="text-ink font-semibold text-xs sm:text-sm truncate">{comment.authorName}</span>
          )}
          <StageBadge stage={comment.authorStage} />
          <LocalTime value={comment.createdAt} format={relativeTime} titleFormat={formatDayTime} />
        </div>
        <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
      </div>
    </li>
  )
}

export const BlogCommentsSection: React.FC<BlogCommentsSectionProps> = ({ postId }) => {
  const session = useAuthSession()
  const user = session.user

  const [comments, setComments] = useState<BlogCommentEntry[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [hasOlderComments, setHasOlderComments] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetRef>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!postId) return
    let isMounted = true
    setLoadingComments(true)

    getBlogCommentsFn({ data: { postId, limit: PAGE_SIZES.blogComments + 1 } })
      .then((data) => {
        if (isMounted) {
          const page = takePage(data || [], PAGE_SIZES.blogComments)
          setComments(page.items)
          setHasOlderComments(page.hasMore)
          setLoadingComments(false)
        }
      })
      .catch((err) => {
        console.warn('Failed to load blog comments:', err)
        if (isMounted) setLoadingComments(false)
      })

    return () => {
      isMounted = false
    }
  }, [postId])

  const loadOlderComments = async () => {
    const oldest = comments[comments.length - 1]
    if (!postId || !oldest) return
    setLoadingOlder(true)
    try {
      const data = await getBlogCommentsFn({
        data: { postId, limit: PAGE_SIZES.blogComments + 1, before: oldest.id },
      })
      const page = takePage(data || [], PAGE_SIZES.blogComments)
      setComments((prev) => mergeById(prev, page.items))
      setHasOlderComments(page.hasMore)
    } catch (err) {
      console.warn('Failed to load older blog comments:', err)
      toast.error('Could not load more comments. Try again.')
    } finally {
      setLoadingOlder(false)
    }
  }

  const openComposer = () => {
    setComposerOpen(true)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postId) return
    setErrorMessage(null)

    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    const trimmed = commentInput.trim()
    if (trimmed.length < MIN_CHAR_LIMIT) {
      setErrorMessage(`Comments need at least ${MIN_CHAR_LIMIT} characters.`)
      return
    }
    if (trimmed.length > MAX_CHAR_LIMIT) {
      setErrorMessage(`Comments can be up to ${MAX_CHAR_LIMIT} characters.`)
      return
    }
    if (!turnstileToken) {
      setErrorMessage('Finish the bot check below, then post again.')
      return
    }

    setIsSubmitting(true)
    try {
      const token = await getAuthJWTToken()
      const newComment = await createBlogCommentFn({
        data: {
          postId,
          content: trimmed,
          userId: user.id,
          token: token ?? undefined,
          turnstileToken: turnstileToken || undefined,
        },
      })

      if (newComment) {
        setComments((prev) => [newComment, ...prev])
        setCommentInput('')
        setComposerOpen(false)
        setTurnstileToken(null)
        turnstileRef.current?.reset()
        toast.success('Comment posted.', { id: 'blog-comment-posted' })
      }
    } catch (err: any) {
      console.error('Comment submission error:', err)
      turnstileRef.current?.reset()
      setErrorMessage(err?.message || 'Could not post your comment. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const charCount = commentInput.length
  const isOverLimit = charCount > MAX_CHAR_LIMIT
  const count = `${comments.length}${hasOlderComments ? '+' : ''}`

  const me = user ? (
    <ForumAvatar
      src={user.image || (user as any).avatar || (user as any).picture}
      authorName={user.name || undefined}
      userId={user.id}
      size="sm"
      loading="eager"
    />
  ) : null

  let composer: React.ReactNode
  if (session.isPending) {
    composer = (
      <div className={`${CARD} p-3 flex items-center gap-2.5`} data-testid="blog-comments-auth-skeleton">
        <HudGhostSkeleton variant="neutral" preset="avatar" width={28} height={28} />
        <HudGhostSkeleton variant="neutral" preset="text" width="40%" height={14} />
      </div>
    )
  } else if (!user) {
    composer = (
      <div className={`${CARD} p-3 flex flex-wrap items-center justify-between gap-2.5`} data-testid="blog-comments-signed-out">
        <p className="text-xs text-ink-muted">Sign in to join the discussion.</p>
        <HudButton type="button" variant="primary" size="sm" onClick={() => setIsAuthModalOpen(true)}>
          Sign in / Join
        </HudButton>
      </div>
    )
  } else if (!composerOpen) {
    composer = (
      <button
        type="button"
        onClick={openComposer}
        className={`w-full flex items-center gap-2.5 p-2.5 sm:p-3 ${CARD} text-left text-sm text-ink-muted hover:bg-surface-2 hover:border-line transition-colors ${FOCUS}`}
        data-testid="blog-comment-open"
      >
        {me}
        <span className="flex-1">Write a comment...</span>
      </button>
    )
  } else {
    composer = (
      <form onSubmit={handleSubmit} className={`${CARD} p-3 sm:p-4 space-y-2.5`} data-testid="blog-comment-form">
        {errorMessage && (
          <div className="p-2.5 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs flex items-center gap-2 rounded-control">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="break-words">{errorMessage}</span>
          </div>
        )}

        <div className="flex items-start gap-2.5">
          <span className="hidden sm:block pt-1">{me}</span>
          <textarea
            ref={textareaRef}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Write a comment..."
            aria-label="Write a comment"
            rows={3}
            className="flex-1 min-w-0 bg-surface-2 border border-line hover:border-line-hover rounded-control p-3 text-sm text-ink placeholder:text-ink-muted focus:outline-hidden focus:border-cyan-glow focus:shadow-field-focus transition-[border-color,box-shadow] resize-y"
          />
        </div>

        <TurnstileWidget
          ref={turnstileRef}
          action="blog_comment"
          size="flexible"
          onVerify={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
        />

        <div className="flex items-center justify-end gap-2">
          {charCount >= COUNT_SHOWS_AT && (
            <span
              className={`mr-auto text-2xs ${isOverLimit ? 'text-crimson-text font-semibold' : 'text-ink-muted'}`}
              data-testid="blog-comment-count"
            >
              {charCount} / {MAX_CHAR_LIMIT}
            </span>
          )}
          <HudButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setComposerOpen(false)
              setErrorMessage(null)
            }}
          >
            Cancel
          </HudButton>
          <HudButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || isOverLimit || commentInput.trim().length < MIN_CHAR_LIMIT}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Posting...' : 'Post comment'}</span>
          </HudButton>
        </div>
      </form>
    )
  }

  return (
    <section
      className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-line-subtle space-y-2 sm:space-y-4"
      aria-labelledby="blog-comments-heading"
    >
      <h2 id="blog-comments-heading" className="font-grotesk text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
        Comments
        {!loadingComments && (
          <span className="text-xs font-sans font-semibold px-2 py-0.5 bg-surface-2 border border-line-subtle text-ink-body rounded-chip">
            {count}
          </span>
        )}
      </h2>

      {composer}

      {loadingComments ? (
        <CommentRowsSkeleton />
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-xs text-ink-muted">No comments yet. Start the discussion.</p>
      ) : (
        <div className="space-y-3">
          <ul className={`${CARD} px-3 sm:px-4 divide-y divide-line-subtle`}>
            {comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </ul>
          {hasOlderComments && (
            <LoadMoreButton
              label="Load older comments"
              loading={loadingOlder}
              testId="blog-comments-load-more"
              onClick={() => void loadOlderComments()}
            />
          )}
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode="signup" />
    </section>
  )
}
