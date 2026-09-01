import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ArrowRight, Maximize2, Sparkles } from 'lucide-react'

export type LightboxAccentColor = 'cyan' | 'purple' | 'red' | 'amber' | 'emerald' | 'teal'

export interface LightboxImageItem {
  src: string
  alt?: string
  title?: string
  subtitle?: string
  description?: string
  specs?: string[]
  actionRoute?: string
  actionText?: string
  accentColor?: LightboxAccentColor
}

export interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  /** Single image source if not using images array */
  src?: string
  alt?: string
  title?: string
  subtitle?: string
  description?: string
  specs?: string[]
  actionRoute?: string
  actionText?: string
  accentColor?: LightboxAccentColor
  onNavigate?: (route: string) => void

  /** Multi-image gallery mode */
  images?: LightboxImageItem[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

const ACCENT_STYLES: Record<
  LightboxAccentColor,
  {
    border: string
    glow: string
    text: string
    badge: string
    button: string
    dot: string
  }
> = {
  cyan: {
    border: 'border-cyan-500/60',
    glow: 'shadow-[0_0_40px_rgba(0,255,255,0.22)]',
    text: 'text-cyan-300',
    badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(0,255,255,0.2)]',
    button: 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-200 border-cyan-500/60 shadow-[0_0_15px_rgba(0,255,255,0.25)]',
    dot: 'bg-cyan-400',
  },
  purple: {
    border: 'border-purple-500/60',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.22)]',
    text: 'text-purple-300',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    button: 'bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
    dot: 'bg-purple-400',
  },
  red: {
    border: 'border-red-500/60',
    glow: 'shadow-[0_0_40px_rgba(239,68,68,0.22)]',
    text: 'text-red-300',
    badge: 'bg-red-950/80 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    button: 'bg-red-950/70 hover:bg-red-900/90 text-red-200 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
    dot: 'bg-red-400',
  },
  amber: {
    border: 'border-amber-500/60',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.22)]',
    text: 'text-amber-300',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    button: 'bg-amber-950/70 hover:bg-amber-900/90 text-amber-200 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    dot: 'bg-amber-400',
  },
  emerald: {
    border: 'border-emerald-500/60',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.22)]',
    text: 'text-emerald-300',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    button: 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    dot: 'bg-emerald-400',
  },
  teal: {
    border: 'border-[#00c3ff]/60',
    glow: 'shadow-[0_0_40px_rgba(0,195,255,0.22)]',
    text: 'text-[#00c3ff]',
    badge: 'bg-[#081518] text-[#00c3ff] border-[#00c3ff]/50 shadow-[0_0_10px_rgba(0,195,255,0.2)]',
    button: 'bg-[#081518] hover:bg-[#0c2227] text-[#00c3ff] border-[#00c3ff]/60 shadow-[0_0_15px_rgba(0,195,255,0.25)]',
    dot: 'bg-[#00c3ff]',
  },
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  src,
  alt,
  title,
  subtitle,
  description,
  specs,
  actionRoute,
  actionText,
  accentColor = 'cyan',
  onNavigate,
  images,
  currentIndex = 0,
  onIndexChange,
}) => {
  const [internalIndex, setInternalIndex] = useState(currentIndex)
  const [imageLoaded, setImageLoaded] = useState(false)
  const touchStartX = useRef<number | null>(null)

  // Sync internal index with controlled prop
  useEffect(() => {
    if (currentIndex !== undefined) {
      setInternalIndex(currentIndex)
    }
  }, [currentIndex])

  const galleryItems = images && images.length > 0 ? images : null
  const activeIndex = galleryItems ? Math.max(0, Math.min(internalIndex, galleryItems.length - 1)) : 0
  const activeItem = galleryItems ? galleryItems[activeIndex] : null

  const activeSrc = activeItem?.src || src || ''
  const activeAlt = activeItem?.alt || alt || activeItem?.title || title || 'Full screen preview'
  const activeTitle = activeItem?.title || title
  const activeSubtitle = activeItem?.subtitle || subtitle
  const activeDescription = activeItem?.description || description
  const activeSpecs = activeItem?.specs || specs
  const activeActionRoute = activeItem?.actionRoute || actionRoute
  const activeActionText = activeItem?.actionText || actionText
  const activeAccent = (activeItem?.accentColor || accentColor) as LightboxAccentColor
  const styles = ACCENT_STYLES[activeAccent] || ACCENT_STYLES.cyan

  const handlePrev = useCallback(() => {
    if (!galleryItems || galleryItems.length <= 1) return
    const newIdx = activeIndex === 0 ? galleryItems.length - 1 : activeIndex - 1
    setInternalIndex(newIdx)
    setImageLoaded(false)
    if (onIndexChange) onIndexChange(newIdx)
  }, [galleryItems, activeIndex, onIndexChange])

  const handleNext = useCallback(() => {
    if (!galleryItems || galleryItems.length <= 1) return
    const newIdx = activeIndex === galleryItems.length - 1 ? 0 : activeIndex + 1
    setInternalIndex(newIdx)
    setImageLoaded(false)
    if (onIndexChange) onIndexChange(newIdx)
  }, [galleryItems, activeIndex, onIndexChange])

  // Body scroll lock & Keyboard listeners
  useEffect(() => {
    if (!isOpen) return

    if (typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handlePrev()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          handleNext()
        }
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
        document.body.style.overflow = originalOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, onClose, handlePrev, handleNext])

  // Reset image loaded on src change
  useEffect(() => {
    setImageLoaded(false)
  }, [activeSrc])

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchStartX.current - touchEndX
    touchStartX.current = null

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-xl p-2 sm:p-4 md:p-6 font-sans overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={activeTitle || 'High resolution image preview'}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Ambience Glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url(${activeSrc})`, filter: 'blur(80px) brightness(0.4)' }}
      />
      <div className="fixed inset-0 bg-sacred-grid opacity-15 pointer-events-none" />
      <div className="fixed inset-0 crt-scanlines opacity-25 pointer-events-none" />

      {/* Main Lightbox Frame */}
      <div
        className={`relative w-full max-w-6xl my-auto bg-[#030709] border-2 ${styles.border} ${styles.glow} chamfer-corner-lg overflow-hidden flex flex-col shadow-2xl transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Scanlines Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]" />

        {/* ── 1. MODAL TOP HEADER BAR ── */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#050b0e]/95 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className={`p-1.5 rounded-none ${styles.badge} border flex items-center justify-center shrink-0`}>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase">
                  HUD PREVIEW // SYSTEM TELEMETRY
                </span>
                {galleryItems && galleryItems.length > 1 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${styles.badge}`}>
                    {activeIndex + 1} / {galleryItems.length}
                  </span>
                )}
              </div>
              {activeTitle && (
                <h3 className="text-base sm:text-lg font-bold font-grotesk text-white tracking-wider uppercase truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {activeTitle}
                </h3>
              )}
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-[10px] font-mono text-gray-500 border border-white/10 px-2 py-1 rounded">
              ESC TO CLOSE
            </span>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 rounded chamfer-corner transition-colors cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. MAIN IMAGE STAGE ── */}
        <div className="relative z-10 p-2 sm:p-5 md:p-6 flex items-center justify-center bg-[#020406] min-h-[260px] sm:min-h-[420px] max-h-[70vh] overflow-hidden group">
          {/* Multi-Item Prev Button */}
          {galleryItems && galleryItems.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/20 hover:border-cyan-400/80 shadow-2xl backdrop-blur-md transition-all duration-200 -translate-y-1/2 top-1/2 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* High-Resolution Screenshot Image Display */}
          <div className="relative max-w-full max-h-[64vh] flex items-center justify-center overflow-hidden rounded border border-white/10 shadow-2xl bg-[#010203]">
            <img
              src={activeSrc}
              alt={activeAlt}
              onLoad={() => setImageLoaded(true)}
              className={`w-auto h-auto max-w-full max-h-[62vh] object-contain transition-all duration-300 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />

            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 bg-[#020508]">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <span className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase">
                  LOADING HIGH-DPI TELEMETRY...
                </span>
              </div>
            )}
          </div>

          {/* Multi-Item Next Button */}
          {galleryItems && galleryItems.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/20 hover:border-cyan-400/80 shadow-2xl backdrop-blur-md transition-all duration-200 -translate-y-1/2 top-1/2 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* ── 3. MODAL FOOTER & CONTEXT INFO ── */}
        {(activeDescription || activeSpecs || activeActionRoute) && (
          <div className="relative z-10 px-4 sm:px-6 py-4 bg-[#050b0e]/95 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              {activeSubtitle && (
                <div className="text-[11px] font-mono tracking-wider font-bold text-gray-400 uppercase">
                  {activeSubtitle}
                </div>
              )}
              {activeDescription && (
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                  {activeDescription}
                </p>
              )}
              {activeSpecs && activeSpecs.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                  {activeSpecs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                      <div className={`w-1.5 h-1.5 rounded-full ${styles.dot} shadow-[0_0_6px_currentColor]`} />
                      <span className="font-mono text-[11px] sm:text-xs">{spec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Action CTA */}
            {activeActionRoute && (
              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    if (onNavigate) {
                      onNavigate(activeActionRoute)
                    } else if (typeof window !== 'undefined') {
                      window.location.href = activeActionRoute
                    }
                  }}
                  className={`w-full md:w-auto py-2.5 px-5 text-xs font-grotesk font-bold uppercase tracking-wider rounded chamfer-corner border flex items-center justify-center gap-2 transition-all duration-300 group/btn cursor-pointer ${styles.button}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeActionText || 'EXPLORE FEATURE'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

/** Reusable click-to-zoom image wrapper component */
export interface ZoomableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  zoomSrc?: string
  zoomTitle?: string
  zoomSubtitle?: string
  zoomDescription?: string
  zoomSpecs?: string[]
  zoomActionRoute?: string
  zoomActionText?: string
  zoomAccentColor?: LightboxAccentColor
  onNavigate?: (route: string) => void
  overlayBadgeText?: string
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  zoomSrc,
  zoomTitle,
  zoomSubtitle,
  zoomDescription,
  zoomSpecs,
  zoomActionRoute,
  zoomActionText,
  zoomAccentColor = 'cyan',
  onNavigate,
  overlayBadgeText = 'CLICK TO EXPAND',
  className,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative group/zoom block w-full h-full text-left cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded overflow-hidden"
        aria-label={`Enlarge ${zoomTitle || alt || 'image'}`}
      >
        <img src={src} alt={alt} className={className} {...rest} />

        {/* Hover zoom affordance badge */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 backdrop-blur-[2px]">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#03080a]/90 border border-cyan-400/80 text-cyan-300 font-mono text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(0,255,255,0.4)] transform translate-y-2 group-hover/zoom:translate-y-0 transition-transform duration-300">
            <Maximize2 className="w-3 h-3 text-cyan-300" />
            {overlayBadgeText}
          </span>
        </div>
      </button>

      <ImageLightbox
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        src={zoomSrc || src}
        alt={alt}
        title={zoomTitle}
        subtitle={zoomSubtitle}
        description={zoomDescription}
        specs={zoomSpecs}
        actionRoute={zoomActionRoute}
        actionText={zoomActionText}
        accentColor={zoomAccentColor}
        onNavigate={onNavigate}
      />
    </>
  )
}

/** Alias export for convenience */
export const ImageModal = ImageLightbox
