import React, { useState } from 'react'
import { X, AlertTriangle, MessageSquare } from 'lucide-react'
import { createForumTopicFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { validateForumContent } from '@/lib/community-rules'
import { useForumAuth } from './ForumShell'

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
  const { isAuthenticated, userId, openAuth } = useForumAuth()
  const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.25)] chamfer-corner overflow-hidden font-sans text-sm space-y-0">
        <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#00ffff]" />
            <h2 className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
              NEW TRANSMISSION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#839493] hover:text-[#ff5540] p-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2 chamfer-corner">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-[#839493] font-bold uppercase tracking-wider">
              Discussion Board
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] p-2.5 text-xs text-[#dfe3e3] outline-none chamfer-corner transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#070b0b] text-[#dfe3e3]">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[#839493] font-bold uppercase tracking-wider">
                Title
              </label>
              <span className="text-[11px] text-[#839493]">{title.trim().length} / 150</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] p-2.5 text-xs text-[#dfe3e3] outline-none chamfer-corner transition-colors placeholder:text-[#839493]/50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[#839493] font-bold uppercase tracking-wider">
                Content
              </label>
              <span className="text-[11px] text-[#839493]">
                {content.trim().length} characters (min 10)
              </span>
            </div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or ideas..."
              className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] p-3 text-xs text-[#dfe3e3] outline-none resize-y chamfer-corner transition-colors placeholder:text-[#839493]/50"
            />
          </div>

          <p className="text-[11px] text-[#839493] leading-relaxed border-l-2 border-[#3a4a49] pl-2.5">
            Be civil and constructive. Safeguard private initiate credentials, keys, and tokens.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#3a4a49]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#3a4a49] hover:bg-[#171c1c] text-[#839493] hover:text-[#dfe3e3] text-xs font-bold uppercase chamfer-corner transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || title.trim().length < 5 || content.trim().length < 10}
              className="px-5 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all shadow-[0_0_12px_rgba(0,255,255,0.2)]"
            >
              {creating ? 'DISPATCHING...' : 'DISPATCH POST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}