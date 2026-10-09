import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { X, AlertTriangle, Send, Plus, Terminal } from 'lucide-react'
import { createForumTopicFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { validateForumContent } from '@/lib/community-rules'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useForumStanding } from '@/hooks/useForumStanding'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { isForumStaffBoard } from '@/lib/forum-utils'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { useForumAuth } from './ForumShell'
import { MentionTextarea } from '@/components/forum/MentionTextarea'
import { ForumFormattingToolbar, handleFormattingShortcuts } from '@/components/forum/ForumFormattingToolbar'
import { ForumPostBody } from '@/components/forum/ForumPostBody'

export interface InlineTopicComposerHandle {
  expandAndFocus: () => void
  collapse: () => void
}

export interface InlineTopicComposerProps {
  categories: ForumCategoryEntry[]
  initialCategoryId?: string
  fixedCategory?: boolean
  onCreated: (topic: ForumTopicEntry) => void
  placeholder?: string
  className?: string
}

export const InlineTopicComposer = forwardRef<InlineTopicComposerHandle, InlineTopicComposerProps>(
  function InlineTopicComposer(
    {
      categories: allCategories,
      initialCategoryId,
      fixedCategory = false,
      onCreated,
      placeholder,
      className = '',
    },
    ref
  ) {
    const { isAuthenticated, isPending, userId, openAuth } = useForumAuth()
    const persist = useHudPersist()
    const standing = useForumStanding(isAuthenticated ? userId : null)
    const staffAccess = useHiddenPageAccess()
    // Members can reply on the staff board but cannot start topics there.
    const categories = staffAccess.canView
      ? allCategories
      : allCategories.filter((c) => !isForumStaffBoard(c.slug))
    const [isExpanded, setIsExpanded] = useState(false)
    const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id || '')
    const activeCategoryId = categories.some((c) => c.id === categoryId)
      ? categoryId
      : categories[0]?.id || ''
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [preview, setPreview] = useState(false)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Keep category in sync if initialCategoryId changes
    useEffect(() => {
      if (initialCategoryId) {
        setCategoryId(initialCategoryId)
      }
    }, [initialCategoryId])

    useImperativeHandle(ref, () => ({
      expandAndFocus: () => {
        if (!isAuthenticated && !isPending) {
          openAuth('signup')
          return
        }
        setIsExpanded(true)
        setTimeout(() => {
          containerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
          titleInputRef.current?.focus()
        }, 80)
      },
      collapse: () => {
        setIsExpanded(false)
        setError(null)
      },
    }))

    const handleExpand = () => {
      if (isPending) return
      if (!isAuthenticated) {
        openAuth('signup')
        return
      }
      setIsExpanded(true)
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 80)
    }

    const handleCollapse = () => {
      setIsExpanded(false)
      setPreview(false)
      setError(null)
    }

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
          data: {
            categoryId: activeCategoryId,
            title: title.trim(),
            content: content.trim(),
            userId: userId ?? undefined,
            token: token ?? undefined,
          },
        })
        onCreated(topic)
        setTitle('')
        setContent('')
        setPreview(false)
        setIsExpanded(false)
      } catch (err: any) {
        setError(err?.message || 'Failed to create post. Please try again.')
      } finally {
        persist.end('forum-topic')
        setCreating(false)
      }
    }

    if (isPending) {
      return (
        <div
          ref={containerRef}
          className={`rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 space-y-2.5 ${className}`}
          data-testid="inline-composer-loading"
        >
          <HudGhostSkeleton variant="neutral" preset="text" width="50%" height={14} />
          <HudGhostSkeleton variant="cyan" preset="button" width={120} height={32} />
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div
          ref={containerRef}
          className={`rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${className}`}
          data-testid="inline-composer-guest"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-control bg-surface-2 border border-line flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-cyan-glow" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Join the Discussion</p>
              <p className="text-[11px] text-ink-muted">
                Sign in to transmit posts and questions to the community.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAuth('signup')}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-4 py-2 rounded-control bg-cyan-glow hover:bg-cyan-hover disabled:opacity-50 text-abyss text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow shrink-0 touch-manipulation"
          >
            Sign In / Join
          </button>
        </div>
      )
    }

    if (standing && !standing.canStartTopics) {
      return (
        <div
          ref={containerRef}
          className={`rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 flex items-start gap-2.5 ${className}`}
          data-testid="inline-composer-locked"
        >
          <div className="w-8 h-8 rounded-control bg-surface-2 border border-line flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 text-ink-muted" />
          </div>
          <div>
            <p className="text-xs font-bold text-ink">New threads aren't open to you yet</p>
            <p className="text-[11px] text-ink-muted leading-relaxed">{standing.topicLockReason}</p>
          </div>
        </div>
      )
    }

    if (categories.length === 0) return null

    const currentCategory = categories.find((c) => c.id === activeCategoryId)
    const promptText =
      placeholder ||
      (fixedCategory && currentCategory
        ? `Transmit a new frequency in ${currentCategory.name}...`
        : 'Transmit a new discussion frequency...')

    if (!isExpanded) {
      return (
        <div
          ref={containerRef}
          id="topic-composer"
          role="button"
          tabIndex={0}
          aria-expanded={false}
          onClick={handleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleExpand()
            }
          }}
          className={`group rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset hover:border-line-strong hover:bg-surface-2 transition-colors p-3 sm:p-3.5 cursor-pointer flex items-center justify-between gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${className}`}
          data-testid="inline-composer-collapsed"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-control bg-surface-2 border border-line group-hover:border-line-strong flex items-center justify-center shrink-0 transition-colors">
              <Plus className="w-4 h-4 text-cyan-glow" />
            </div>
            <span className="text-xs sm:text-xs text-ink-muted group-hover:text-ink truncate transition-colors">
              {promptText}
            </span>
          </div>

          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-control border border-line bg-surface-2 group-hover:border-line-strong text-cyan-glow text-[11px] font-bold uppercase tracking-[0.08em] transition-colors shrink-0"
            tabIndex={-1}
          >
            <span>New Post</span>
          </button>
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        id="topic-composer"
        className={`rounded-card border border-cyan-glow/40 bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-5 space-y-3.5 sm:space-y-4 animate-in fade-in duration-200 ${className}`}
        data-testid="inline-composer-expanded"
      >
        <div className="flex items-center justify-between border-b border-line-subtle pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-glow" />
            <h2 className="text-xs text-cyan-glow font-bold tracking-[0.08em] uppercase">
              TRANSMIT NEW TOPIC
            </h2>
            {fixedCategory && currentCategory && (
              <span
                className="hidden sm:inline-block text-[11px] font-bold tracking-[0.08em] px-2 py-0.5 rounded-chip"
                style={{
                  color: currentCategory.color || '#00c3ff',
                  backgroundColor: `${currentCategory.color || '#00c3ff'}26`,
                }}
              >
                {currentCategory.name.toUpperCase()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCollapse}
            className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] p-2 sm:p-1 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center justify-center touch-manipulation"
            aria-label="Close composer"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {error && (
            <div className="p-3 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs flex items-center gap-2 rounded-control">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {(!fixedCategory || categories.length > 1) && (
            <div className="space-y-1.5">
              <label
                htmlFor="composer-category-select"
                className="text-[11px] sm:text-xs text-ink-muted font-bold uppercase tracking-[0.08em] block"
              >
                Discussion Board
              </label>
              <select
                id="composer-category-select"
                value={activeCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={fixedCategory}
                className="w-full min-h-[44px] sm:min-h-[38px] bg-surface-2 border border-line focus:border-cyan-glow focus:shadow-field-focus px-3 py-2 text-[16px] sm:text-xs text-ink outline-none rounded-control transition-[border-color,box-shadow] disabled:opacity-75"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-surface-2 text-ink">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="composer-title-input"
                className="text-[11px] sm:text-xs text-ink-muted font-bold uppercase tracking-[0.08em]"
              >
                Title
              </label>
              <span className="text-[11px] text-ink-muted">{title.trim().length} / 150</span>
            </div>
            <input
              id="composer-title-input"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              maxLength={150}
              className="w-full min-h-[44px] sm:min-h-[38px] bg-surface-2 border border-line focus:border-cyan-glow focus:shadow-field-focus px-3 py-2 text-[16px] sm:text-xs text-ink outline-none rounded-control transition-[border-color,box-shadow] placeholder:text-ink-muted"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="composer-content-textarea"
                className="text-[11px] sm:text-xs text-ink-muted font-bold uppercase tracking-[0.08em]"
              >
                Content
              </label>
              <span className="text-[11px] text-ink-muted">
                {content.trim().length} characters (min 10)
              </span>
            </div>
            <div className="space-y-0">
              <ForumFormattingToolbar
                textareaRef={textareaRef}
                value={content}
                onChange={setContent}
                preview={preview}
                onTogglePreview={() => setPreview((v) => !v)}
                disabled={creating}
              />
              {preview ? (
                <div
                  className="w-full min-h-[110px] max-h-[300px] bg-abyss/60 border border-line p-3 text-xs text-ink-body rounded-b-control overflow-y-auto"
                  data-testid="inline-composer-preview"
                >
                  {content.trim() ? (
                    <ForumPostBody content={content} />
                  ) : (
                    <p className="text-xs text-ink-muted italic">
                      Nothing to preview yet. Transmit some thoughts or apply formatting above...
                    </p>
                  )}
                </div>
              ) : (
                <MentionTextarea
                  id="composer-content-textarea"
                  ref={textareaRef}
                  rows={5}
                  value={content}
                  onChange={setContent}
                  onKeyDown={(e) => {
                    handleFormattingShortcuts(e, textareaRef.current, setContent)
                  }}
                  placeholder="Share your thoughts, questions, or ideas... Hail a member with @designation."
                  className="w-full bg-surface-2 border border-line focus:border-cyan-glow focus:shadow-field-focus p-3 text-[16px] sm:text-xs text-ink outline-none resize-y rounded-b-control transition-[border-color,box-shadow] placeholder:text-ink-muted min-h-[110px]"
                />
              )}
            </div>
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed border-l-2 border-line pl-2.5">
            Be civil and constructive. Keep private credentials, keys, and tokens out of public posts.
          </p>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-line-subtle">
            <button
              type="button"
              onClick={handleCollapse}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow touch-manipulation text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || title.trim().length < 5 || content.trim().length < 10}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-5 py-2 rounded-control bg-cyan-glow hover:bg-cyan-hover disabled:opacity-50 text-abyss text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center justify-center gap-2 touch-manipulation"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{creating ? 'Transmitting...' : 'Transmit Post'}</span>
            </button>
          </div>
        </form>
      </div>
    )
  }
)
