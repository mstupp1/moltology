import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ArrowRight, Maximize2, Sparkles } from 'lucide-react'

export interface LightboxImageItem {
  src: string
  alt?: string
  title?: string
  subtitle?: string
  description?: string
  specs?: string[]
  actionRoute?: string
  actionText?: string
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
  onNavigate?: (route: string) => void

  /** Multi-image gallery mode */
  images?: LightboxImageItem[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
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
  onNavigate,
  images,
  currentIndex = 0,
  onIndexChange,
}) => {
  const [internalIndex, setInternalIndex] = useState(currentIndex)
  const touchStartX = useRef<number | null>(null)

  // Sync internal index whenever currentIndex or isOpen changes
  useEffect(() => {
    if (currentIndex !== undefined) {
      setInternalIndex(currentIndex)
    }
  }, [currentIndex, isOpen])

  const galleryItems = images && images.length > 0 ? images : null
  const activeIndex = galleryItems ? Math.max(0, Math.min(internalIndex, galleryItems.length - 1)) : 0
  const activeItem = galleryItems ? galleryItems[activeIndex] : null

  const activeSrc = activeItem?.src || src || ''
  const activeAlt = activeItem?.alt || alt || activeItem?.title || title || 'Image preview'
  const activeTitle = activeItem?.title || title
  const activeSubtitle = activeItem?.subtitle || subtitle
  const activeDescription = activeItem?.description || description
  const activeSpecs = activeItem?.specs || specs
  const activeActionRoute = activeItem?.actionRoute || actionRoute
  const activeActionText = activeItem?.actionText || actionText

  const handlePrev = useCallback(() => {
    if (!galleryItems || galleryItems.length <= 1) return
    const newIdx = activeIndex === 0 ? galleryItems.length - 1 : activeIndex - 1
    setInternalIndex(newIdx)
    if (onIndexChange) onIndexChange(newIdx)
  }, [galleryItems, activeIndex, onIndexChange])

  const handleNext = useCallback(() => {
    if (!galleryItems || galleryItems.length <= 1) return
    const newIdx = activeIndex === galleryItems.length - 1 ? 0 : activeIndex + 1
    setInternalIndex(newIdx)
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 md:p-6 font-sans overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={activeTitle || 'Image preview'}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Lightbox Card with Neutral Border */}
      <div
        className="relative w-full max-w-5xl my-auto bg-[#030709] border border-white/10 chamfer-corner-lg overflow-hidden flex flex-col shadow-2xl transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. MODAL TOP HEADER BAR ── */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#050b0e] border-b border-white/10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {activeTitle && (
              <h3 className="text-base sm:text-lg font-bold font-grotesk text-white tracking-wider uppercase truncate">
                {activeTitle}
              </h3>
            )}
            {galleryItems && galleryItems.length > 1 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-white/10 bg-white/5 text-gray-300">
                {activeIndex + 1} / {galleryItems.length}
              </span>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 rounded chamfer-corner transition-colors cursor-pointer shrink-0"
            aria-label="Close image preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 2. MAIN IMAGE STAGE ── */}
        <div className="relative z-10 p-3 sm:p-6 flex items-center justify-center bg-[#020406] min-h-[260px] sm:min-h-[380px] max-h-[72vh] overflow-hidden group">
          {/* Multi-Item Prev Button */}
          {galleryItems && galleryItems.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white border border-white/20 hover:border-white/40 shadow-2xl backdrop-blur-md transition-all duration-200 -translate-y-1/2 top-1/2 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Screenshot Image Display */}
          <div className="relative max-w-full max-h-[66vh] flex items-center justify-center overflow-hidden rounded border border-white/10 shadow-2xl bg-[#010203]">
            <img
              key={activeSrc}
              src={activeSrc}
              alt={activeAlt}
              className="w-auto h-auto max-w-full max-h-[64vh] object-contain transition-opacity duration-200"
            />
          </div>

          {/* Multi-Item Next Button */}
          {galleryItems && galleryItems.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white border border-white/20 hover:border-white/40 shadow-2xl backdrop-blur-md transition-all duration-200 -translate-y-1/2 top-1/2 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* ── 3. MODAL FOOTER & CONTEXT INFO ── */}
        {(activeDescription || activeSpecs || activeActionRoute) && (
          <div className="relative z-10 px-4 sm:px-6 py-4 bg-[#050b0e] border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              {activeSubtitle && (
                <div className="text-xs font-mono font-semibold text-gray-400 uppercase">
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
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="font-sans text-xs">{spec}</span>
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
                  className="w-full md:w-auto py-2.5 px-5 text-xs font-grotesk font-bold uppercase tracking-wider rounded chamfer-corner border border-white/20 bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-2 transition-all duration-300 group/btn cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
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
  onNavigate,
  overlayBadgeText = 'Click to expand',
  className,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative group/zoom block w-full h-full text-left cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-white/40 rounded overflow-hidden"
        aria-label={`Enlarge ${zoomTitle || alt || 'image'}`}
      >
        <img src={src} alt={alt} className={className} {...rest} />

        {/* Hover zoom affordance badge with neutral border */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2 backdrop-blur-[1px]">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#03080a]/90 border border-white/20 text-white font-sans text-xs font-bold tracking-wider uppercase shadow-lg transform translate-y-1 group-hover/zoom:translate-y-0 transition-transform duration-200">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
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
        onNavigate={onNavigate}
      />
    </>
  )
}

/** Alias export for convenience */
export const ImageModal = ImageLightbox
