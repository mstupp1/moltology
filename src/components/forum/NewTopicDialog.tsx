import React, { useId, useRef, useState } from 'react'
import { forumVisibleLength } from '@/lib/forum-markdown'
import { X, AlertTriangle, MessageSquare } from 'lucide-react'
import { createForumTopicFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { validateForumContent } from '@/lib/community-rules'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useForumStanding } from '@/hooks/useForumStanding'
import { useForumAuth } from './ForumShell'
import { ForumEditor } from '@/components/forum/ForumEditor'
import { HudButton } from '@/components/ui/HudButton'

interface NewTopicDialogProps {
  categories: ForumCategoryEntry[]
  initialCategoryId?: string
  onClose: () => void
  onCreated: (topic: ForumTopicEntry) => void
}

export function NewTopicDialog({
  categories,
  initialCategoryId,
  onClose,
  onCreated,
}: NewTopicDialogProps) {
  const { isAuthenticated, isPending, userId, openAuth } = useForumAuth()
  const persist = useHudPersist()
  const standing = useForumStanding(isAuthenticated ? userId : null)
  const locked = Boolean(standing && !standing.canStartTopics)
  const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const contentLabelId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
    if (!isAuthenticated) {
      openAuth('signup')
      return
    }
    const validation = validateForumContent(title, content)
    if (!validation.valid) {
      setError(validation.error || 'Invalid content')
      return
    }
    setCreating(true)
    setError(null)
    persist.begin('forum-topic')
    try {
      const token = await getAuthJWTToken()
      const topic = await createForumTopicFn({
        data: { categoryId, title, content, userId: userId ?? undefined, token: token ?? undefined },
      })
      onCreated(topic)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to create post. Please try again.')
    } finally {
      persist.end('forum-topic')
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-surface-1 border border-line shadow-menu rounded-card overflow-hidden font-sans text-sm space-y-0">
        <div className="bg-surface-2 border-b border-line-subtle p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-glow" />
            <h2 className="text-xs text-ink font-bold tracking-[0.08em] uppercase">
              NEW POST
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {locked && !error && (
            <div
              className="p-3 bg-surface-2 border border-line-subtle text-ink-body text-xs flex items-center gap-2 rounded-card"
              data-testid="new-topic-locked"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-ink-muted" />
              <span>{standing?.topicLockReason}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs flex items-center gap-2 rounded-card">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-ink-muted font-bold uppercase tracking-[0.08em]">
              Discussion Board
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-surface-2 border border-line hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus text-xs text-ink outline-none rounded-control transition-colors p-2.5"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-surface-2 text-ink">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-ink-muted font-bold uppercase tracking-[0.08em]">
                Title
              </label>
              <span className="text-[11px] text-ink-muted">{title.trim().length} / 150</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full bg-surface-2 border border-line hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus text-xs text-ink outline-none rounded-control transition-colors p-2.5 placeholder:text-ink-muted"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span id={contentLabelId} className="text-ink-muted font-bold uppercase tracking-[0.08em]">
                Content
              </span>
              <span className="text-[11px] text-ink-muted">
                {forumVisibleLength(content)} characters (min 10)
              </span>
            </div>
            <ForumEditor
              value={content}
              onChange={setContent}
              onSubmit={() => formRef.current?.requestSubmit()}
              disabled={creating}
              size="tall"
              aria-labelledby={contentLabelId}
              placeholder="Share your thoughts, questions, or ideas. Type @ to mention someone."
              testId="new-topic-editor"
            />
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed border-l-2 border-line pl-2.5">
            Be civil and constructive. Keep private credentials, keys, and tokens out of public posts.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line-subtle">
            <HudButton type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </HudButton>
            <HudButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={creating || locked || title.trim().length < 5 || forumVisibleLength(content) < 10}
            >
              {creating ? 'Posting...' : 'Post'}
            </HudButton>
          </div>
        </form>
      </div>
    </div>
  )
}