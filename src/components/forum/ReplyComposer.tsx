import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { forumVisibleLength } from '@/lib/forum-markdown'
import { AlertTriangle, Send } from 'lucide-react'
import { useForumAuth } from '@/components/forum/ForumShell'
import { useAuthSession } from '@/hooks/useAuthSession'
import { createForumPostFn, ForumPostEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { validateForumContent } from '@/lib/community-rules'
import { useHudPersist } from '@/hooks/useHudPersist'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { ForumEditor, type ForumEditorHandle } from '@/components/forum/ForumEditor'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { prependForumQuote } from '@/lib/forum-quotes'

export type ReplyComposerHandle = {
  insertQuote: (markup: string) => void
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

  useEffect(() => {
    if (!initialContent) return
    setContent((prev) => prependForumQuote(prev, initialContent))
  }, [initialContent])

  useImperativeHandle(ref, () => ({
    insertQuote: (markup: string) => {
      setContent((prev) => prependForumQuote(prev, markup))
      requestAnimationFrame(() => {
        editorRef.current?.focus()
      })
    },
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
        className={`${compact ? 'p-3' : 'rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 sm:p-5'} space-y-2.5`}
        data-testid="forum-reply-auth-skeleton"
      >
        <HudGhostSkeleton variant="neutral" preset="text" width="60%" height={14} />
        <HudGhostSkeleton variant="cyan" preset="button" width={140} height={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div
        className={`${compact ? 'p-3 rounded-card border border-line-subtle bg-abyss/60' : 'rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 sm:p-5'} text-center space-y-2.5`}
      >
        <p className="text-xs text-ink-muted">Sign in to join the discussion.</p>
        <button
          type="button"
          onClick={() => openAuth('signup')}
          className="px-4 py-1.5 rounded-control bg-cyan-glow hover:bg-cyan-hover disabled:opacity-50 text-abyss text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          Sign In / Join
        </button>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={
        compact
          ? 'p-3 rounded-card border border-line-subtle bg-abyss/60 space-y-2.5'
          : 'rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 sm:p-5 space-y-3'
      }
      data-testid={parentId ? 'forum-inline-reply-composer' : 'forum-top-reply-composer'}
    >
      <div className="flex items-center justify-between border-b border-line-subtle pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-grotesk font-bold uppercase tracking-[0.08em] text-cyan-glow flex items-center gap-2 shrink-0">
            <Send className="w-3.5 h-3.5" />
            <span>{parentId ? 'Reply to comment' : 'Post Reply'}</span>
          </h3>
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 border-l border-line-subtle pl-2 min-w-0 text-[11px] text-ink-muted">
              <ForumAvatar
                src={user.image || user.avatar || user.picture}
                authorName={user.name || undefined}
                userId={userId}
                size="xs"
                className="w-4 h-4 ring-1 ring-line"
                loading="eager"
              />
              <span className="truncate">
                as <strong className="text-ink">{user.name || 'Initiate'}</strong>
              </span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-ink-muted shrink-0">{content.trim().length} / 10,000</span>
      </div>

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
        autoFocus={autoFocus}
        aria-label={parentId ? 'Reply to comment' : 'Write a reply'}
        placeholder="Write a reply. Type @ to mention someone."
        testId="forum-reply-editor"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-muted/70 hidden sm:inline">
          Ctrl/Cmd + Enter to post
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-control text-xs font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={posting || forumVisibleLength(content) < 10}
            className="px-4 py-1.5 rounded-control bg-cyan-glow hover:bg-cyan-hover disabled:opacity-50 text-abyss text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            {posting ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </form>
  )
})

ReplyComposer.displayName = 'ReplyComposer'
