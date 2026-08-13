import React from 'react'
import { Pin, Share2, Eye, Heart, Sparkles, ExternalLink } from 'lucide-react'
import type { GalleryPin } from '@/lib/gallery-data'

interface MasonryGridProps {
  pins: GalleryPin[]
  savedPinIds: Set<string>
  onPinClick: (pin: GalleryPin) => void
  onToggleSavePin: (e: React.MouseEvent, pinId: string) => void
  onSharePin: (e: React.MouseEvent, pin: GalleryPin) => void
}

const getAspectRatioClass = (ratio: GalleryPin['aspectRatio']) => {
  switch (ratio) {
    case '1:1':
      return 'aspect-square'
    case '9:16':
      return 'aspect-[9/16]'
    case '4:3':
      return 'aspect-[4/3]'
    case '2:3':
      return 'aspect-[2/3]'
    case '3:4':
    default:
      return 'aspect-[3/4]'
  }
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  pins,
  savedPinIds,
  onPinClick,
  onToggleSavePin,
  onSharePin,
}) => {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {pins.map((pin) => {
        const isSaved = savedPinIds.has(pin.id)
        const aspectClass = getAspectRatioClass(pin.aspectRatio)

        return (
          <div
            key={pin.id}
            onClick={() => onPinClick(pin)}
            className="break-inside-avoid group relative rounded-xl overflow-hidden bg-[#070c0e]/80 border border-[#1e2d37]/80 hover:border-[#00c3ff]/70 transition-all duration-300 shadow-xl hover:shadow-[0_0_25px_rgba(0,195,255,0.25)] cursor-pointer"
          >
            {/* Aspect Ratio Preserved Image Container */}
            <div className={`w-full ${aspectClass} overflow-hidden relative bg-[#030607]`}>
              <img
                src={pin.imageUrl}
                alt={pin.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* Hover Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030607]/90 via-[#030607]/30 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Top Controls - Always visible on mobile, hover-reveal on desktop */}
              <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform sm:-translate-y-2 sm:group-hover:translate-y-0 z-10">
                {/* Category Badge */}
                <span className="px-2 py-0.5 sm:py-1 bg-[#050a0c]/85 backdrop-blur-md border border-[#00c3ff]/50 text-[#00c3ff] text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase rounded-md shadow-md">
                  {pin.category}
                </span>

                {/* Save Pin Red/Cyber Button */}
                <button
                  onClick={(e) => onToggleSavePin(e, pin.id)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 min-h-[32px] ${
                    isSaved
                      ? 'bg-[#ff3b30] text-white border border-[#ff6b60] shadow-[0_0_12px_rgba(255,59,48,0.6)]'
                      : 'bg-black/75 hover:bg-[#ff3b30] text-white border border-white/20 hover:border-[#ff3b30] backdrop-blur-md'
                  }`}
                  title={isSaved ? 'Unpin from Vault' : 'Pin to Vault'}
                >
                  <Pin className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  <span>{isSaved ? 'PINNED' : 'PIN'}</span>
                </button>
              </div>

              {/* Bottom Hover Card Details */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                <h3 className="text-sm font-grotesk font-bold text-white tracking-wide leading-tight line-clamp-2 drop-shadow-md">
                  {pin.title}
                </h3>

                {/* Author & Action Row */}
                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={pin.authorAvatar}
                      alt={pin.authorName}
                      className="w-5 h-5 rounded-full object-cover border border-[#00c3ff]/60"
                    />
                    <span className="text-[11px] font-sans font-medium text-[#c0d0e0] truncate">
                      {pin.authorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Share Button */}
                    <button
                      onClick={(e) => onSharePin(e, pin)}
                      className="p-1.5 rounded-md bg-black/60 hover:bg-[#00c3ff]/20 text-[#7a8e9e] hover:text-[#00c3ff] border border-white/10 hover:border-[#00c3ff]/60 transition-all"
                      title="Share / Copy Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Static Bottom Card Footer (Always Visible) */}
            <div className="p-3 bg-[#060a0c]/90 border-t border-[#1e2d37]/60 flex items-center justify-between text-xs font-mono text-[#7a8e9e]">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3 h-3 text-[#ff5540]" />
                <span className="truncate text-[#9eb0c0] font-sans text-xs">
                  {pin.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] shrink-0">
                <span className="flex items-center gap-1 text-[#00c3ff]">
                  <Pin className="w-3 h-3" />
                  {pin.pinCount + (isSaved ? 1 : 0)}
                </span>
                <span className="flex items-center gap-1 text-[#7a8e9e]">
                  <Eye className="w-3 h-3" />
                  {pin.views}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
