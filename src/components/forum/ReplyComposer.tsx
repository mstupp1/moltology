import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { forumVisibleLength } from '@/lib/forum-markdown'
import { AlertTriangle, Send } from 'lucide-react'
import { useForumAuth } from '@/components/forum/ForumShell'
import { useAuthSession } from '@/hooks/useAuthSession'
import { createForumPostFn, ForumPostEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { FORUM_BODY_MAX_CHARS, validateForumContent } from '@/lib/community-rules'
import { useHudPersist } from '@/hooks/useHudPersist'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { ForumEditor, type ForumEditorHandle } from '@/components/forum/ForumEditor'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { prependForumQuote } from '@/lib/forum-quotes'
import { HudButton } from '@/components/ui/HudButton'

export type ReplyComposerHandle = {
  insertQuote: (markup: string) => void
  /** Opens a collapsed composer, scrolls it into view and focuses the editor. */
  open: () => void
}

export const ReplyComposer = forwardRef<
  ReplyComposerHandle,
  {
    topicId: string
    parentId?: string | null
    initialContent?: string
    onPosted: (post: ForumPostEntry) => void
    onCancel?: () => void
    compact?: boolean
    autoFocus?: boolean
    /** Starts as a one-line "Write a reply" bar that opens into the editor. */
    collapsible?: boolean
  }
>(function ReplyComposer(
  {
    topicId,
    parentId,
    initialContent = '',
    onPosted,
    onCancel,
    compact = false,
    autoFocus = false,
    collapsible = false,
  },
  ref,
) {
  const { isAuthenticated, isPending, userId, openAuth } = useForumAuth()
  const { user } = useAuthSession()
  const persist = useHudPersist()
  const formRef = useRef<HTMLFormElement>(null)
  const editorRef = useRef<ForumEditorHandle>(null)
  const [content, setContent] = useState(initialContent)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(!collapsible)
  const [focusOnOpen, setFocusOnOpen] = useState(autoFocus)
  const rootRef = useRef<HTMLDivElement>(null)

  const openComposer = () => {
    setFocusOnOpen(true)
    setExpanded(true)
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      editorRef.current?.focus()
    })
  }

  useEffect(() => {
    if (!initialContent) return
    setContent((prev) => prependForumQuote(prev, initialContent))
  }, [initialContent])

  useImperativeHandle(ref, () => ({
    insertQuote: (markup: string) => {
      setContent((prev) => prependForumQuote(prev, markup))
      openComposer()
    },
    open: openComposer,
  }))

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isPending || posting) return
    if (!isAuthenticated) {
      openAuth('signup')
      return
    }
    const validation = validateForumContent(undefined, content)
    if (!validation.valid) {
      setError(validation.error || 'Invalid content')
      return
    }
    setPosting(true)
    setError(null)
    persist.begin('forum-reply')
    try {
      const token = await getAuthJWTToken()
      const post = await createForumPostFn({
        data: {
          topicId,
          content,
          parentId: parentId ?? undefined,
          userId: userId ?? undefined,
          token: token ?? undefined,
        },
      })
      onPosted(post)
      setContent('')
      if (collapsible) setExpanded(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to post reply. Please try again.')
    } finally {
      persist.end('forum-reply')
      setPosting(false)
    }
  }

  const handleShortcutSubmit = () => {
    if (!posting && forumVisibleLength(content) >= 10) void handleSubmit()
  }

  if (isPending) {
    return (
      <div
        className={`${compact ? 'p-3' : 'rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3'} flex items-center gap-2.5`}
        data-testid="forum-reply-auth-skeleton"
      >
        <HudGhostSkeleton variant="neutral" preset="avatar" width={28} height={28} />
        <HudGhostSkeleton variant="neutral" preset="text" width="40%" height={14} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div
        className={`${compact ? 'p-3 rounded-card border border-line-subtle bg-abyss/60' : 'rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3'} flex flex-wrap items-center justify-between gap-2.5`}
      >
        <p className="text-xs text-ink-muted">Sign in to join the discussion.</p>
        <HudButton type="button" variant="primary" size="sm" onClick={() => openAuth('signup')}>
          Sign in / Join
        </HudButton>
      </div>
    )
  }

  const me = user ? (
    <ForumAvatar
      src={user.image || user.avatar || user.picture}
      authorName={user.name || undefined}
      userId={userId}
      size="sm"
      loading="eager"
    />
  ) : null

  if (!expanded) {
    return (
      <div ref={rootRef}>
        <button
          type="button"
          onClick={openComposer}
          className="w-full flex items-center gap-2.5 p-2.5 sm:p-3 rounded-card border border-line-subtle bg-surface-1 hud-sheen text-left text-sm text-ink-muted hover:bg-surface-2 hover:border-line transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          data-testid="forum-reply-open"
        >
          {me}
          <span className="flex-1">Write a reply...</span>
        </button>
      </div>
    )
  }

  return (
    <div ref={rootRef}>
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={
        compact
          ? 'p-3 rounded-card border border-line-subtle bg-abyss/60 space-y-2.5'
          : 'rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 space-y-2.5'
      }
      data-testid={parentId ? 'forum-inline-reply-composer' : 'forum-top-reply-composer'}
    >
      {error && (
        <div className="p-2.5 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs flex items-center gap-2 rounded-control">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ForumEditor
        ref={editorRef}
        value={content}
        onChange={setContent}
        onSubmit={handleShortcutSubmit}
        disabled={posting}
        size={compact ? 'compact' : 'default'}
        autoFocus={focusOnOpen}
        aria-label={parentId ? 'Reply to comment' : 'Write a reply'}
        placeholder="Write a reply. Type @ to mention someone."
        testId="forum-reply-editor"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-muted/70 hidden sm:inline">
          Ctrl/Cmd + Enter to post
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {(onCancel || (collapsible && !content.trim())) && (
            <HudButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onCancel) onCancel()
                else setExpanded(false)
              }}
            >
              Cancel
            </HudButton>
          )}
          <HudButton
            type="submit"
            variant="primary"
            size="sm"
            icon={<Send className="w-3.5 h-3.5" />}
            disabled={posting || forumVisibleLength(content) < 10 || content.trim().length > FORUM_BODY_MAX_CHARS}
          >
            {posting ? 'Posting...' : 'Reply'}
          </HudButton>
        </div>
      </div>
    </form>
    </div>
  )
})

ReplyComposer.displayName = 'ReplyComposer'
