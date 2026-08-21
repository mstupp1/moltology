import React, { useState, useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search,
  Filter,
  Pin,
  Sparkles,
  Plus,
  Grid,
  Layers,
  Check,
  Share2,
  Bookmark,
  ChevronDown,
} from 'lucide-react'
import { getGalleryPinsFn } from '@/lib/server/api'
import { INITIAL_GALLERY_PINS } from '@/lib/gallery-data'
import type { GalleryPin } from '@/lib/gallery-data'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { GalleryPinModal } from '@/components/gallery/GalleryPinModal'
import { UploadPinModal } from '@/components/gallery/UploadPinModal'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function GalleryRoute() {
  const [pins, setPins] = useState<GalleryPin[]>(INITIAL_GALLERY_PINS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('ALL')
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [savedPinIds, setSavedPinIds] = useState<Set<string>>(new Set())
  const [selectedPinModal, setSelectedPinModal] = useState<GalleryPin | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Fetch pins from server function on load
  useEffect(() => {
    async function loadPins() {
      try {
        const fetched = await getGalleryPinsFn()
        if (fetched && fetched.length > 0) {
          setPins(fetched)
        }
      } catch (err) {
        console.warn('Using preloaded gallery fallback:', err)
      }
    }
    loadPins()
  }, [])

  // Sync saved pins from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moltology_saved_pins')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setSavedPinIds(new Set(parsed))
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleToggleSavePin = (pinId: string) => {
    setSavedPinIds((prev) => {
      const next = new Set(prev)
      if (next.has(pinId)) {
        next.delete(pinId)
        triggerToast('Unpinned from your Carapace Vault')
      } else {
        next.add(pinId)
        triggerToast('Pinned to your Carapace Vault!')
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'moltology_saved_pins',
          JSON.stringify(Array.from(next))
        )
      }
      return next
    })
  }

  const handleSharePin = (e: React.MouseEvent, pin: GalleryPin) => {
    e.stopPropagation()
    const url = window.location.origin + pin.imageUrl
    navigator.clipboard.writeText(url)
    triggerToast(`Copied artifact link for "${pin.title}"`)
  }

  const handleAddPin = (newPin: GalleryPin) => {
    setPins((prev) => [newPin, ...prev])
    triggerToast('Successfully transmuted & pinned new artifact!')
  }

  const categories = [
    'ALL',
    'SACRED DOCTRINE',
    'BIOMECHANICAL',
    'CARCINIZATION',
    'LARVAL STAGES',
    'DEEP ABYSS',
    'SYNAPTIC HARDWARE',
  ]

  // Filter Pins
  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      // Category filter
      if (selectedCategory !== 'ALL' && pin.category !== selectedCategory) {
        return false
      }

      // Aspect ratio filter
      if (selectedAspectRatio !== 'ALL') {
        if (selectedAspectRatio === 'TALL' && !['3:4', '9:16', '2:3'].includes(pin.aspectRatio)) return false
        if (selectedAspectRatio === 'SQUARE' && pin.aspectRatio !== '1:1') return false
        if (selectedAspectRatio === 'WIDE' && pin.aspectRatio !== '4:3') return false
      }

      // Saved only filter
      if (showSavedOnly && !savedPinIds.has(pin.id)) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = pin.title.toLowerCase().includes(q)
        const matchDesc = pin.description.toLowerCase().includes(q)
        const matchAuthor = pin.authorName.toLowerCase().includes(q)
        const matchTags = pin.tags.some((t) => t.toLowerCase().includes(q))
        if (!matchTitle && !matchDesc && !matchAuthor && !matchTags) {
          return false
        }
      }

      return true
    })
  }, [pins, selectedCategory, selectedAspectRatio, showSavedOnly, savedPinIds, searchQuery])

  return (
    <div className="space-y-3.5 sm:space-y-5 md:space-y-6 animate-fade-in pb-12">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0a0f12] border border-[#00c3ff] text-[#00c3ff] text-xs font-sans font-bold rounded-xl shadow-[0_0_20px_rgba(0,195,255,0.4)] flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#ff5540]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="relative rounded-2xl overflow-hidden border border-[#00c3ff]/40 bg-[#070b0d]/90 p-3.5 sm:p-6 md:p-8 backdrop-blur-md shadow-2xl">
        <div className="absolute inset-0 bg-sacred-grid opacity-30 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#00c3ff]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00c3ff]/15 border border-[#00c3ff]/50 rounded-full text-[#00c3ff] text-xs font-sans font-bold tracking-widest uppercase shadow-md">
              <Grid className="w-3.5 h-3.5" />
              <span>CARAPACE VISUAL MATRIX</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-grotesk font-black text-white tracking-wider uppercase drop-shadow-md">
              MOLT PIN VAULT
            </h1>

            <p className="text-xs md:text-sm font-sans text-[#a0b0c0] max-w-2xl leading-relaxed">
              Explore the Pinterest-style gallery of sacred relics, cybernetic carapaces, ecdysis telemetry, and abyssal manifestations derived from the Moltology Codex.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-4 py-2.5 rounded-xl font-sans font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                showSavedOnly
                  ? 'bg-[#ff3b30] text-white border border-[#ff6b60] shadow-[0_0_15px_rgba(255,59,48,0.5)]'
                  : 'bg-[#0a0f12] hover:bg-[#121a1e] text-[#c0d0e0] border border-[#1e2d37] hover:border-[#ff3b30]'
              }`}
            >
              <Pin className={`w-4 h-4 ${showSavedOnly ? 'fill-current' : ''}`} />
              <span>MY VAULT ({savedPinIds.size})</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-[#00c3ff] hover:bg-[#33d1ff] text-black font-sans font-bold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(0,195,255,0.4)] active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>TRANSMUTE NEW PIN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 bg-[#060a0c]/80 border border-[#1e2d37] rounded-2xl backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Live Search Input */}
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00c3ff]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pins by title, doctrine, prompt, tags, or author..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-white outline-none placeholder-[#506070] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-sans text-[#7a8e9e] hover:text-white"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Aspect Ratio Filter Dropdown */}
          <div className="w-full md:w-48 relative">
            <select
              value={selectedAspectRatio}
              onChange={(e) => setSelectedAspectRatio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-[#00c3ff] outline-none cursor-pointer appearance-none"
            >
              <option value="ALL">ALL ASPECT RATIOS</option>
              <option value="TALL">TALL / PORTRAIT</option>
              <option value="SQUARE">SQUARE (1:1)</option>
              <option value="WIDE">WIDE (4:3)</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#00c3ff] pointer-events-none" />
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-[#7a8e9e] shrink-0 mr-1" />
          {categories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold whitespace-nowrap transition-all shadow-sm ${
                  isActive
                    ? 'bg-[#00c3ff] text-black shadow-[0_0_12px_rgba(0,195,255,0.5)]'
                    : 'bg-[#0a0f12] hover:bg-[#12191d] text-[#a0b0c0] hover:text-white border border-[#1e2d37]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Results Status */}
      <div className="flex items-center justify-between px-2 text-xs font-sans text-[#7a8e9e]">
        <span>
          SHOWING <strong className="text-[#00c3ff]">{filteredPins.length}</strong> OF{' '}
          {pins.length} SACRED PINS
        </span>
        {showSavedOnly && (
          <span className="text-[#ff5540] font-bold">
            FILTERED TO SAVED VAULT PINS
          </span>
        )}
      </div>

      {/* Main Masonry Grid */}
      {filteredPins.length > 0 ? (
        <MasonryGrid
          pins={filteredPins}
          savedPinIds={savedPinIds}
          onPinClick={(pin) => setSelectedPinModal(pin)}
          onToggleSavePin={(e, pinId) => {
            e.stopPropagation()
            handleToggleSavePin(pinId)
          }}
          onSharePin={handleSharePin}
        />
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-[#060a0c]/80 border border-[#1e2d37] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#0a0f12] border border-[#ff3b30]/40 flex items-center justify-center mx-auto text-[#ff3b30]">
            <Pin className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-grotesk font-bold text-white uppercase">
              NO RELICS MATCH YOUR FILTER
            </h3>
            <p className="text-xs font-sans text-[#7a8e9e] max-w-md mx-auto">
              No pins were found matching the selected query or category parameters. Try clearing your filters or transmute a new pin.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('ALL')
              setSelectedAspectRatio('ALL')
              setShowSavedOnly(false)
            }}
            className="px-4 py-2 bg-[#00c3ff]/15 border border-[#00c3ff]/60 text-[#00c3ff] text-xs font-sans font-bold rounded-xl hover:bg-[#00c3ff] hover:text-black transition-all"
          >
            RESET ALL FILTERS
          </button>
        </div>
      )}

      {/* Lightbox Inspector Modal */}
      <GalleryPinModal
        pin={selectedPinModal}
        allPins={pins}
        savedPinIds={savedPinIds}
        onClose={() => setSelectedPinModal(null)}
        onToggleSavePin={(pinId) => handleToggleSavePin(pinId)}
        onSelectRelatedPin={(relPin) => setSelectedPinModal(relPin)}
        onTagClick={(tag) => {
          setSearchQuery(tag)
          setSelectedPinModal(null)
        }}
      />

      {/* Transmute New Pin Upload Modal */}
      <UploadPinModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddPin={handleAddPin}
      />
    </div>
  )
}

export const Route = createFileRoute('/_hud/gallery')({
  component: GalleryRoute,
  pendingComponent: HudWorkspaceGhost,
})
