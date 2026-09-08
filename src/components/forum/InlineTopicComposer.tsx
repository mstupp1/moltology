import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { X, AlertTriangle, Send, Plus, Terminal } from 'lucide-react'
import { createForumTopicFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { validateForumContent } from '@/lib/community-rules'
import { useHudPersist } from '@/hooks/useHudPersist'
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
      categories,
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
    const [isExpanded, setIsExpanded] = useState(false)
    const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id || '')
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
            categoryId,
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
          className={`chitin-card p-3 sm:p-4 chamfer-corner shadow-md space-y-2.5 ${className}`}
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
          className={`chitin-card p-3 sm:p-4 chamfer-corner shadow-lg border border-[#3a4a49] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${className}`}
          data-testid="inline-composer-guest"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 chamfer-corner bg-[#070b0b] border border-[#3a4a49] flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-[#00ffff]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#dfe3e3]">Join the Discussion</p>
              <p className="text-[11px] text-[#839493]">
                Sign in to transmit posts and questions to the community.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAuth('signup')}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-4 py-2 bg-[#00ffff] hover:bg-[#00e6e6] text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all shadow-[0_0_12px_rgba(0,255,255,0.25)] shrink-0 touch-manipulation"
          >
            Sign In / Join
          </button>
        </div>
      )
    }

    const currentCategory = categories.find((c) => c.id === categoryId)
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
          className={`group chitin-card p-3 sm:p-3.5 chamfer-corner shadow-lg border border-[#3a4a49] hover:border-[#00ffff]/60 transition-all cursor-pointer flex items-center justify-between gap-3 focus:outline-none focus:border-[#00ffff] ${className}`}
          data-testid="inline-composer-collapsed"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 chamfer-corner bg-[#070b0b] border border-[#3a4a49] group-hover:border-[#00ffff]/60 flex items-center justify-center shrink-0 transition-colors">
              <Plus className="w-4 h-4 text-[#00ffff]" />
            </div>
            <span className="text-xs sm:text-xs text-[#839493] group-hover:text-[#dfe3e3] truncate transition-colors">
              {promptText}
            </span>
          </div>

          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#00ffff]/10 hover:bg-[#00ffff]/20 border border-[#00ffff]/40 text-[#00ffff] text-[11px] font-bold uppercase tracking-wider chamfer-corner transition-colors shrink-0"
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
        className={`chitin-card p-3 sm:p-5 chamfer-corner shadow-2xl border border-[#00ffff]/60 space-y-3.5 sm:space-y-4 animate-in fade-in duration-200 ${className}`}
        data-testid="inline-composer-expanded"
      >
        <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00ffff]" />
            <h2 className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
              TRANSMIT NEW TOPIC
            </h2>
            {fixedCategory && currentCategory && (
              <span
                className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 chamfer-corner border bg-[#070b0b]"
                style={{
                  color: currentCategory.color || '#00ffff',
                  borderColor: currentCategory.color ? `${currentCategory.color}60` : '#00ffff60',
                }}
              >
                {currentCategory.name.toUpperCase()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCollapse}
            className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] p-2 sm:p-1 text-[#839493] hover:text-[#ff5540] transition-colors flex items-center justify-center touch-manipulation"
            aria-label="Close composer"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {error && (
            <div className="p-3 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2 chamfer-corner">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {(!fixedCategory || categories.length > 1) && (
            <div className="space-y-1.5">
              <label
                htmlFor="composer-category-select"
                className="text-[11px] sm:text-xs text-[#839493] font-bold uppercase tracking-wider block"
              >
                Discussion Board
              </label>
              <select
                id="composer-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={fixedCategory}
                className="w-full min-h-[44px] sm:min-h-[38px] bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] px-3 py-2 text-[16px] sm:text-xs text-[#dfe3e3] outline-none chamfer-corner transition-colors disabled:opacity-75"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#070b0b] text-[#dfe3e3]">
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
                className="text-[11px] sm:text-xs text-[#839493] font-bold uppercase tracking-wider"
              >
                Title
              </label>
              <span className="text-[11px] text-[#839493]">{title.trim().length} / 150</span>
            </div>
            <input
              id="composer-title-input"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              maxLength={150}
              className="w-full min-h-[44px] sm:min-h-[38px] bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] px-3 py-2 text-[16px] sm:text-xs text-[#dfe3e3] outline-none chamfer-corner transition-colors placeholder:text-[#839493]/50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="composer-content-textarea"
                className="text-[11px] sm:text-xs text-[#839493] font-bold uppercase tracking-wider"
              >
                Content
              </label>
              <span className="text-[11px] text-[#839493]">
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
                  className="w-full min-h-[110px] max-h-[300px] bg-[#070b0b]/60 border border-[#3a4a49] p-3 text-xs text-[#dfe3e3] chamfer-corner-bottom overflow-y-auto"
                  data-testid="inline-composer-preview"
                >
                  {content.trim() ? (
                    <ForumPostBody content={content} />
                  ) : (
                    <p className="text-xs text-[#839493]/60 italic">
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
                  className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] p-3 text-[16px] sm:text-xs text-[#dfe3e3] outline-none resize-y chamfer-corner-bottom transition-colors placeholder:text-[#839493]/50 min-h-[110px]"
                />
              )}
            </div>
          </div>

          <p className="text-[11px] text-[#839493] leading-relaxed border-l-2 border-[#3a4a49] pl-2.5">
            Be civil and constructive. Keep private credentials, keys, and tokens out of public posts.
          </p>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-[#3a4a49]">
            <button
              type="button"
              onClick={handleCollapse}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-4 py-2 border border-[#3a4a49] hover:bg-[#171c1c] text-[#839493] hover:text-[#dfe3e3] text-xs font-bold uppercase chamfer-corner transition-colors touch-manipulation text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || title.trim().length < 5 || content.trim().length < 10}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-5 py-2 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all shadow-[0_0_12px_rgba(0,255,255,0.2)] flex items-center justify-center gap-2 touch-manipulation"
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
