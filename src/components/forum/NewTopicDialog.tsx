import React, { useState } from 'react'
import { X, AlertTriangle, ShieldCheck } from 'lucide-react'
import { createForumTopicFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { validateForumContent } from '@/lib/community-rules'
import { useForumAuth } from './ForumShell'

interface NewTopicDialogProps {
  categories: ForumCategoryEntry[]
  initialCategoryId?: string
  onClose: () => void
  onCreated: (topic: ForumTopicEntry) => void
}

export function NewTopicDialog({ categories, initialCategoryId, onClose, onCreated }: NewTopicDialogProps) {
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
      const topic = await createForumTopicFn({
        data: { categoryId, title, content, userId: userId ?? undefined },
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0b1010] border border-[#00ffff]/60 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3a39]">
          <h2 className="text-sm font-grotesk font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00ffff]" />
            New Post
          </h2>
          <button onClick={onClose} className="text-[#839493] hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2 rounded">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-[#839493] font-bold uppercase">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#0d1414] border border-[#2a3a39] focus:border-[#00ffff] p-2.5 text-xs text-[#dfe3e3] outline-none rounded"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#839493] font-bold uppercase">Title (5–150 characters)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full bg-[#0d1414] border border-[#2a3a39] focus:border-[#00ffff] p-2.5 text-xs text-[#dfe3e3] outline-none rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#839493] font-bold uppercase">Body (min 10 characters)</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or ideas..."
              className="w-full bg-[#0d1414] border border-[#2a3a39] focus:border-[#00ffff] p-3 text-xs text-[#dfe3e3] outline-none resize-y rounded"
            />
          </div>

          <p className="text-[11px] text-[#839493]">
            Be civil and constructive. Do not share API keys, passwords, or private credentials.
          </p>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#2a3a39] text-[#839493] hover:text-white text-xs font-bold uppercase rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || title.trim().length < 5 || content.trim().length < 10}
              className="px-5 py-2 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider rounded transition"
            >
              {creating ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}