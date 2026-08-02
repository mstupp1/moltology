import React, { useState } from 'react'
import {
  X,
  Pin,
  Share2,
  Download,
  Copy,
  Check,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ZoomIn,
  Send,
  Shield,
} from 'lucide-react'
import type { GalleryPin } from '@/lib/gallery-data'

interface GalleryPinModalProps {
  pin: GalleryPin | null
  allPins: GalleryPin[]
  savedPinIds: Set<string>
  onClose: () => void
  onToggleSavePin: (pinId: string) => void
  onSelectRelatedPin: (pin: GalleryPin) => void
  onTagClick?: (tag: string) => void
}

interface CommentEntry {
  id: string
  author: string
  avatar: string
  text: string
  timeAgo: string
  reaction?: string
}

export const GalleryPinModal: React.FC<GalleryPinModalProps> = ({
  pin,
  allPins,
  savedPinIds,
  onClose,
  onToggleSavePin,
  onSelectRelatedPin,
  onTagClick,
}) => {
  if (!pin) return null

  const isSaved = savedPinIds.has(pin.id)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [comments, setComments] = useState<CommentEntry[]>([
    {
      id: 'c1',
      author: 'Architect Vaelen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      text: 'The chitin resonance density on this artifact measures 99.4% purity. Truly ascendancy material.',
      timeAgo: '2h ago',
      reaction: '🦀',
    },
    {
      id: 'c2',
      author: 'Larva Unit #8971',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      text: 'Study this liturgical prompt before entering your next ecdysis trial.',
      timeAgo: '5h ago',
      reaction: '🔥',
    },
  ])
  const [newComment, setNewComment] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🦀')

  const handleCopyPrompt = () => {
    if (pin.prompt) {
      navigator.clipboard.writeText(pin.prompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + pin.imageUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const comment: CommentEntry = {
      id: Date.now().toString(),
      author: 'Larva Unit #8971',
      avatar: '/images/order_emblem.png',
      text: newComment.trim(),
      timeAgo: 'Just now',
      reaction: selectedEmoji,
    }

    setComments([comment, ...comments])
    setNewComment('')
  }

  // Related pins filtering
  const relatedPins = allPins
    .filter((p) => p.id !== pin.id && (p.category === pin.category || p.tags.some((t) => pin.tags.includes(t))))
    .slice(0, 4)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in select-none">
      {/* Backdrop Click to Close */}
      <div className="fixed inset-0 z-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative z-10 w-full max-w-5xl bg-[#060a0c] border border-[#00c3ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,195,255,0.2)] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-[#0a0f12] border-b border-[#1e2d37] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00c3ff] animate-ping" />
            <span className="font-mono text-xs font-bold text-[#00c3ff] tracking-wider uppercase">
              MOLT PIN INSPECTOR // {pin.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1 bg-[#10171a] hover:bg-[#182328] border border-[#1e2d37] hover:border-[#00c3ff] text-xs font-mono text-[#c0d0e0] flex items-center gap-1.5 rounded-md transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00e676]" />
                  <span className="text-[#00e676]">COPIED LINK</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#00c3ff]" />
                  <span>SHARE</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#10171a] hover:bg-[#ff3b30]/20 text-[#7a8e9e] hover:text-[#ff3b30] border border-[#1e2d37] hover:border-[#ff3b30]/50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container: Scrollable 2-Column Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1e2d37]">
          {/* Left Column: Image Viewer */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-[#030607] flex flex-col justify-between gap-4">
            <div className="relative rounded-xl overflow-hidden border border-[#1e2d37] bg-black/60 group flex items-center justify-center min-h-[300px] max-h-[600px]">
              <img
                src={pin.imageUrl}
                alt={pin.title}
                className={`w-full h-auto max-h-[580px] object-contain transition-transform duration-300 ${
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />

              {/* Zoom Indicator Floating Badge */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute bottom-3 right-3 p-2 bg-black/70 hover:bg-[#00c3ff]/30 text-[#00c3ff] border border-[#00c3ff]/40 rounded-lg backdrop-blur-md transition-all shadow-lg"
                title="Toggle Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Aspect Ratio Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 border border-white/20 text-[#c0d0e0] text-[11px] font-mono rounded-md backdrop-blur-md">
                RATIO {pin.aspectRatio}
              </div>
            </div>

            {/* Image Action Row */}
            <div className="flex items-center justify-between gap-2 p-3 bg-[#080d10] rounded-xl border border-[#1e2d37]">
              <div className="flex items-center gap-3 text-xs font-mono text-[#7a8e9e]">
                <span className="flex items-center gap-1 text-[#00c3ff]">
                  <Pin className="w-3.5 h-3.5" />
                  {pin.pinCount + (isSaved ? 1 : 0)} PINS
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {pin.views} VIEWS
                </span>
              </div>

              <a
                href={pin.imageUrl}
                download={`${pin.id}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-[#00c3ff]/15 hover:bg-[#00c3ff]/25 border border-[#00c3ff]/60 text-[#00c3ff] text-xs font-mono font-bold flex items-center gap-1.5 rounded-lg transition-all active:scale-95 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD</span>
              </a>
            </div>
          </div>

          {/* Right Column: Pin Details, Lore, Prompt, Author & Comments */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between gap-6 bg-[#060a0c]">
            <div className="space-y-5">
              {/* Header Title & Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-[#00c3ff]/10 border border-[#00c3ff]/50 text-[#00c3ff] text-xs font-mono font-bold tracking-wider rounded-md uppercase">
                    {pin.category}
                  </span>

                  <button
                    onClick={() => onToggleSavePin(pin.id)}
                    className={`px-4 py-2 rounded-xl font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                      isSaved
                        ? 'bg-[#ff3b30] text-white border border-[#ff6b60] shadow-[0_0_15px_rgba(255,59,48,0.6)]'
                        : 'bg-[#ff3b30]/20 hover:bg-[#ff3b30] text-[#ff6b60] hover:text-white border border-[#ff3b30]/60'
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    <span>{isSaved ? 'PINNED TO VAULT' : 'SAVE PIN'}</span>
                  </button>
                </div>

                <h1 className="text-xl sm:text-2xl font-grotesk font-bold text-white tracking-wide leading-tight">
                  {pin.title}
                </h1>
                <p className="text-sm font-sans text-[#a0b0c0] leading-relaxed">
                  {pin.description}
                </p>
              </div>

              {/* Author Info Card */}
              <div className="p-3.5 bg-[#0a0f12] border border-[#1e2d37] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={pin.authorAvatar}
                    alt={pin.authorName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#00c3ff]/60 shadow-md"
                  />
                  <div>
                    <div className="font-grotesk font-bold text-sm text-white">
                      {pin.authorName}
                    </div>
                    <div className="text-xs font-mono text-[#00c3ff] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#ff5540]" />
                      <span>{pin.authorStage}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-[#7a8e9e] bg-[#030607] px-2 py-1 border border-[#1e2d37] rounded">
                  CREATOR
                </span>
              </div>

              {/* AI Prompt / Codex Lore Box */}
              {pin.prompt && (
                <div className="p-4 bg-[#030607] border border-[#00c3ff]/30 rounded-xl space-y-2 relative group">
                  <div className="flex items-center justify-between text-xs font-mono text-[#00c3ff]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-[#ff5540]" />
                      GENERATIVE PROMPT / CODEX EXCERPT
                    </span>
                    <button
                      onClick={handleCopyPrompt}
                      className="px-2.5 py-1 bg-[#10171a] hover:bg-[#00c3ff]/20 text-[#c0d0e0] hover:text-[#00c3ff] border border-white/10 hover:border-[#00c3ff]/60 rounded text-[11px] font-mono flex items-center gap-1 transition-all"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3 h-3 text-[#00e676]" />
                          <span className="text-[#00e676]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY PROMPT</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[#8a9ea0] leading-relaxed bg-[#070b0d] p-2.5 rounded border border-[#1a262d] select-text">
                    "{pin.prompt}"
                  </p>
                </div>
              )}

              {/* Interactive Tags */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-[#7a8e9e] uppercase">
                  SYNAPTIC TAGS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pin.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onTagClick && onTagClick(tag)}
                      className="px-2.5 py-1 bg-[#0a0f12] hover:bg-[#00c3ff]/15 border border-[#1e2d37] hover:border-[#00c3ff]/60 text-xs font-mono text-[#a0b0c0] hover:text-[#00c3ff] rounded-md transition-all"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments & Transmutation Logs */}
              <div className="space-y-3 pt-3 border-t border-[#1e2d37]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#dfe3e3] flex items-center gap-1.5 uppercase">
                    <MessageSquare className="w-3.5 h-3.5 text-[#00c3ff]" />
                    TRANSMUTATION LOGS ({comments.length})
                  </span>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <div className="flex-1 flex bg-[#030607] border border-[#1e2d37] rounded-xl overflow-hidden focus-within:border-[#00c3ff]">
                    <select
                      value={selectedEmoji}
                      onChange={(e) => setSelectedEmoji(e.target.value)}
                      className="bg-[#0a0f12] text-xs font-mono text-[#00c3ff] px-2 border-r border-[#1e2d37] outline-none cursor-pointer"
                    >
                      <option value="🦀">🦀</option>
                      <option value="🔥">🔥</option>
                      <option value="🧬">🧬</option>
                      <option value="⚡">⚡</option>
                      <option value="🛡️">🛡️</option>
                    </select>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add liturgical observation..."
                      className="flex-1 px-3 py-2 bg-transparent text-xs font-sans text-white outline-none placeholder-[#506070]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#00c3ff] hover:bg-[#33d1ff] text-black font-mono font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Comment List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-[#0a0f12] border border-[#1e2d37]/80 rounded-xl flex items-start gap-2.5"
                    >
                      <img
                        src={c.avatar}
                        alt={c.author}
                        className="w-6 h-6 rounded-full object-cover border border-[#00c3ff]/50 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-grotesk font-bold text-[#dfe3e3]">
                            {c.author}
                          </span>
                          <span className="font-mono text-[#607080] text-[10px]">
                            {c.timeAgo}
                          </span>
                        </div>
                        <p className="text-xs font-sans text-[#a0b0c0] mt-0.5">
                          <span className="mr-1.5">{c.reaction}</span>
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Sacred Relics Row Preview */}
        {relatedPins.length > 0 && (
          <div className="p-4 bg-[#040708] border-t border-[#1e2d37] space-y-3 shrink-0">
            <div className="text-xs font-mono font-bold text-[#00c3ff] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff5540]" />
              RELATED SACRED RELICS
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedPins.map((relPin) => (
                <div
                  key={relPin.id}
                  onClick={() => onSelectRelatedPin(relPin)}
                  className="group relative h-20 rounded-lg overflow-hidden border border-[#1e2d37] hover:border-[#00c3ff] cursor-pointer bg-black/60 transition-all"
                >
                  <img
                    src={relPin.imageUrl}
                    alt={relPin.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-1.5 flex items-end">
                    <span className="text-[10px] font-grotesk font-bold text-white truncate">
                      {relPin.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
