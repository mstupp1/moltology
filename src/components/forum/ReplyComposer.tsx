import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { AlertTriangle, Send } from 'lucide-react'
import { useForumAuth } from '@/components/forum/ForumShell'
import { useAuthSession } from '@/hooks/useAuthSession'
import { createForumPostFn, ForumPostEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { validateForumContent } from '@/lib/community-rules'
import { useHudPersist } from '@/hooks/useHudPersist'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { MentionTextarea } from '@/components/forum/MentionTextarea'
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
  const [content, setContent] = useState(initialContent)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    insertQuote: (markup: string) => {
      setContent((prev) => prependForumQuote(prev, markup))
      requestAnimationFrame(() => {
        formRef.current?.querySelector('textarea')?.focus()
      })
    },
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!posting && content.trim().length >= 10) {
        handleSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  if (isPending) {
    return (
      <div
        className={`${compact ? 'p-3' : 'chitin-card p-4 sm:p-5 chamfer-corner shadow-2xl'} space-y-2.5`}
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
        className={`${compact ? 'p-3 border border-[#3a4a49] chamfer-corner bg-[#070b0b]/60' : 'chitin-card p-4 sm:p-5 chamfer-corner shadow-2xl'} text-center space-y-2.5`}
      >
        <p className="text-xs text-[#839493]">Sign in to join the discussion.</p>
        <button
          type="button"
          onClick={() => openAuth('signup')}
          className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all shadow-[0_0_12px_rgba(0,255,255,0.25)]"
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
          ? 'p-3 border border-[#3a4a49] chamfer-corner bg-[#070b0b]/80 space-y-2.5'
          : 'chitin-card p-4 sm:p-5 chamfer-corner shadow-2xl space-y-3'
      }
      data-testid={parentId ? 'forum-inline-reply-composer' : 'forum-top-reply-composer'}
    >
      <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-grotesk font-bold uppercase tracking-wider text-[#00ffff] flex items-center gap-2 shrink-0">
            <Send className="w-3.5 h-3.5" />
            <span>{parentId ? 'Reply to comment' : 'Post Reply'}</span>
          </h3>
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 border-l border-[#3a4a49] pl-2 min-w-0 text-[10px] text-[#839493]">
              <ForumAvatar
                src={user.image || user.avatar || user.picture}
                authorName={user.name || undefined}
                userId={userId}
                size="xs"
                className="w-4 h-4 ring-1 ring-[#3a4a49]"
              />
              <span className="truncate">
                as <strong className="text-[#dfe3e3]">{user.name || 'Initiate'}</strong>
              </span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-[#839493] shrink-0">{content.trim().length} / 10,000</span>
      </div>

      {error && (
        <div className="p-2.5 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2 chamfer-corner">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <MentionTextarea
        rows={compact ? 3 : 4}
        value={content}
        onChange={setContent}
        onKeyDown={handleKeyDown}
        placeholder="Write your constructive reply... Hail a member with @designation. (min 10 characters)"
        autoFocus={autoFocus}
        className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] p-3 text-xs text-[#dfe3e3] outline-none resize-y chamfer-corner transition-colors placeholder:text-[#839493]/50"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#839493]/70 hidden sm:inline">
          Ctrl/Cmd + Enter to post
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#839493] hover:text-[#dfe3e3] transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={posting || content.trim().length < 10}
            className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all shadow-[0_0_10px_rgba(0,255,255,0.2)]"
          >
            {posting ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </form>
  )
})

ReplyComposer.displayName = 'ReplyComposer'
