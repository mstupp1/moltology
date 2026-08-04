import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Lock,
  Shield,
  UserCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import {
  getBlogCommentsFn,
  createBlogCommentFn,
  type BlogCommentEntry,
} from '@/lib/server/api'
import { AuthModal } from '@/components/AuthModal'
import { HudGhostCard } from '@/components/ui/HudGhostLoader'

interface BlogCommentsSectionProps {
  postId?: string
}

export const BlogCommentsSection: React.FC<BlogCommentsSectionProps> = ({ postId }) => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const [comments, setComments] = useState<BlogCommentEntry[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [commentInput, setCommentInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  const MAX_CHAR_LIMIT = 1000
  const MIN_CHAR_LIMIT = 3

  useEffect(() => {
    if (!postId) return
    let isMounted = true
    setLoadingComments(true)

    getBlogCommentsFn({ data: postId })
      .then((data) => {
        if (isMounted) {
          setComments(data || [])
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

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postId) return
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!user) {
      handleOpenAuth('login')
      return
    }

    const trimmed = commentInput.trim()

    // Client-side Guardrails
    if (trimmed.length < MIN_CHAR_LIMIT) {
      setErrorMessage(`Guardrail: Comment must be at least ${MIN_CHAR_LIMIT} characters.`)
      return
    }
    if (trimmed.length > MAX_CHAR_LIMIT) {
      setErrorMessage(`Guardrail: Comment exceeds ${MAX_CHAR_LIMIT} character limit.`)
      return
    }

    setIsSubmitting(true)

    try {
      const newComment = await createBlogCommentFn({
        data: {
          postId,
          content: trimmed,
          userId: user.id,
        },
      })

      if (newComment) {
        setComments((prev) => [newComment, ...prev])
        setCommentInput('')
        setSuccessMessage('Transmission broadcast successfully.')
        setTimeout(() => setSuccessMessage(null), 3500)
      }
    } catch (err: any) {
      console.error('Comment submission error:', err)
      setErrorMessage(err.message || 'Transmission failed. Verify authorization and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatStageLabel = (stageNum: number) => {
    switch (stageNum) {
      case 2:
        return 'Stage 2: Soft-Shed'
      case 3:
        return 'Stage 3: Architect'
      case 4:
        return 'Stage 4: Ascendant'
      default:
        return 'Stage 1: Larva'
    }
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const charCount = commentInput.length
  const isOverLimit = charCount > MAX_CHAR_LIMIT

  return (
    <section className="mt-16 pt-10 border-t border-cyan-900/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/80 border border-cyan-500/30 chamfer-corner text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-grotesk font-black text-xl text-gray-100 uppercase tracking-wide flex items-center gap-2">
              <span>COMMUNICATIONS LOG</span>
              <span className="text-xs px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono chamfer-corner">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Synaptic telemetry & initiate responses
            </p>
          </div>
        </div>
      </div>

      {/* Input Box / Auth Lock */}
      <div className="mb-12">
        {user ? (
          <form onSubmit={handleSubmit} className="chitin-card p-5 border border-cyan-900/60 chamfer-corner space-y-4 shadow-hud-cyan bg-[#080d0f]/90">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center overflow-hidden">
                  <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
                    {(user.name || user.email || 'I')[0]}
                  </span>
                </div>
                <span className="font-mono text-xs text-cyan-300 font-semibold">
                  {user.name || user.email}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-mono uppercase chamfer-corner">
                  REGISTERED INITIATE
                </span>
              </div>
              <span className={`font-mono text-[11px] ${isOverLimit ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                {charCount} / {MAX_CHAR_LIMIT}
              </span>
            </div>

            <div className="relative">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Log your thoughts or synaptic telemetry..."
                rows={3}
                className="w-full bg-[#050809] border border-cyan-900/50 rounded-none p-3 font-mono text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all resize-y"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800/40 p-2.5 chamfer-corner">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 chamfer-corner">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-500" />
                <span>Encrypted Initiate Feed • Standard Guardrails Enforced</span>
              </span>

              <button
                type="submit"
                disabled={isSubmitting || isOverLimit || commentInput.trim().length < MIN_CHAR_LIMIT}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>TRANSMITTING...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>TRANSMIT COMMENT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="chitin-card p-6 border border-cyan-900/60 chamfer-corner bg-[#080d0f]/90 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Lock className="w-24 h-24 text-cyan-400" />
            </div>

            <div className="max-w-md mx-auto relative z-10 space-y-4">
              <div className="w-10 h-10 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>

              <div>
                <h4 className="font-grotesk font-bold text-sm sm:text-base text-gray-100 uppercase tracking-wide">
                  AUTHENTICATION REQUIRED TO JOIN DISCUSSION
                </h4>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Commentary is restricted to verified initiates of the Benthic Collective. Sign in or initialize your registration to transmit.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase chamfer-corner flex items-center gap-1.5 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>SIGN IN</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('signup')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-black font-grotesk font-bold text-xs uppercase chamfer-corner flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>REGISTER INITIATE</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments Feed */}
      <div className="space-y-4">
        {loadingComments ? (
          <div className="space-y-3">
            <HudGhostCard lines={2} />
            <HudGhostCard lines={2} />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center chitin-card border border-cyan-900/30 chamfer-corner space-y-2">
            <Terminal className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h5 className="font-grotesk font-bold text-sm text-gray-300 uppercase">
              NO TRANSMISSIONS RECORDED YET
            </h5>
            <p className="font-mono text-xs text-gray-500">
              Be the first initiate to log commentary on this post.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="chitin-card p-4 border border-cyan-900/40 chamfer-corner bg-[#080d0f]/60 hover:border-cyan-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase">
                      {(comment.authorName || 'A')[0]}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-200">
                    {comment.authorName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-950/60 border border-cyan-900 text-cyan-400 font-mono chamfer-corner">
                    {formatStageLabel(comment.authorStage)}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-gray-500">
                  {formatTimestamp(comment.createdAt)}
                </span>
              </div>

              <p className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap pl-1">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Auth Modal Portal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </section>
  )
}
