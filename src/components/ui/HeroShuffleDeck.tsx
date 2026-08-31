import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { eagerImageProps } from '@/lib/media-priority'

export interface HeroCard {
  id: string
  title: string
  image: string
  imageSm?: string
  video: string
  videoSm?: string
  accentColor: 'cyan' | 'amber' | 'emerald' | 'purple' | 'red'
}

export const HERO_DECK_CROSSFADE_MS = 700

const CARDS: HeroCard[] = [
  {
    id: 'benthic-core',
    title: 'CYBER-BENTHIC ASCENSION',
    image: getAssetUrl('/images/hero_card_benthic_core.webp'),
    imageSm: getAssetUrl('/images/hero_card_benthic_core_sm.webp'),
    video: '/videos/hero_benthic_core.mp4',
    videoSm: '/videos/hero_benthic_core_sm.mp4',
    accentColor: 'cyan',
  },
  {
    id: 'asset-shedding',
    title: 'ASSET TRANSMUTATION',
    image: getAssetUrl('/images/hero_card_asset_shedding.webp'),
    imageSm: getAssetUrl('/images/hero_card_asset_shedding_sm.webp'),
    video: '/videos/hero_asset_shedding.mp4',
    videoSm: '/videos/hero_asset_shedding_sm.mp4',
    accentColor: 'amber',
  },
  {
    id: 'chitin-hardening',
    title: 'EXOSKELETAL HARDENING',
    image: getAssetUrl('/images/hero_card_chitin_hardening.webp'),
    imageSm: getAssetUrl('/images/hero_card_chitin_hardening_sm.webp'),
    video: '/videos/hero_chitin_hardening.mp4',
    videoSm: '/videos/hero_chitin_hardening_sm.mp4',
    accentColor: 'emerald',
  },
  {
    id: 'total-carcinization',
    title: 'TOTAL CARCINIZATION',
    image: getAssetUrl('/images/hero_card_total_carcinization.webp'),
    imageSm: getAssetUrl('/images/hero_card_total_carcinization_sm.webp'),
    video: '/videos/hero_total_carcinization.mp4',
    videoSm: '/videos/hero_total_carcinization_sm.mp4',
    accentColor: 'purple',
  },
  {
    id: 'fault-isolation',
    title: 'VIRTUAL FARADAY SHELL',
    image: getAssetUrl('/images/hero_card_fault_isolation.webp'),
    imageSm: getAssetUrl('/images/hero_card_fault_isolation_sm.webp'),
    video: '/videos/hero_fault_isolation.mp4',
    videoSm: '/videos/hero_fault_isolation_sm.mp4',
    accentColor: 'red',
  },
  {
    id: 'synaptic-path',
    title: 'JOIN THE SYNAPTIC PATH',
    image: getAssetUrl('/images/hero_card_synaptic_path.webp'),
    imageSm: getAssetUrl('/images/hero_card_synaptic_path_sm.webp'),
    video: '/videos/hero_synaptic_path.mp4',
    videoSm: '/videos/hero_synaptic_path_sm.mp4',
    accentColor: 'cyan',
  },
]

const COLOR_MAPS = {
  cyan: {
    border: 'border-cyan-500/50',
    glow: 'shadow-[0_0_35px_rgba(6,182,212,0.3)]',
    dot: 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]',
  },
  amber: {
    border: 'border-amber-500/50',
    glow: 'shadow-[0_0_35px_rgba(245,158,11,0.3)]',
    dot: 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]',
  },
  emerald: {
    border: 'border-emerald-500/50',
    glow: 'shadow-[0_0_35px_rgba(16,185,129,0.3)]',
    dot: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]',
  },
  purple: {
    border: 'border-purple-500/50',
    glow: 'shadow-[0_0_35px_rgba(168,85,247,0.3)]',
    dot: 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]',
  },
  red: {
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_35px_rgba(239,68,68,0.3)]',
    dot: 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
  },
}

export const HeroShuffleDeck: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [activeVideoReady, setActiveVideoReady] = useState(false)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const viewportRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const totalCards = CARDS.length
  const canMountVideo = inView && !reducedMotion

  const goTo = useCallback((nextIndex: number) => {
    setActiveIndex((prev) => {
      if (nextIndex === prev) return prev
      setOutgoingIndex(prev)
      return nextIndex
    })
  }, [])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => {
      const next = (prev + 1) % totalCards
      setOutgoingIndex(prev)
      return next
    })
  }, [totalCards])

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => {
      const next = (prev - 1 + totalCards) % totalCards
      setOutgoingIndex(prev)
      return next
    })
  }, [totalCards])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  // The active transmission must be buffered before we spend bandwidth
  // pre-buffering the next one, so downloads never compete mid-load.
  useEffect(() => {
    setActiveVideoReady(false)
    const videoEl = videoRefs.current[CARDS[activeIndex]?.id ?? '']
    if (videoEl && videoEl.readyState >= 3) {
      setActiveVideoReady(true)
    }
  }, [activeIndex, canMountVideo])

  useEffect(() => {
    const node = viewportRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.2))
      },
      { threshold: [0, 0.2, 0.4] },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (outgoingIndex === null) return
    const timer = window.setTimeout(() => setOutgoingIndex(null), HERO_DECK_CROSSFADE_MS)
    return () => window.clearTimeout(timer)
  }, [outgoingIndex, activeIndex])

  // Auto-advance only while the deck is on-screen
  useEffect(() => {
    if (isPaused || !inView) return

    const interval = setInterval(() => {
      handleNext()
    }, 9500)

    return () => clearInterval(interval)
  }, [isPaused, inView, handleNext])

  useEffect(() => {
    if (!canMountVideo) return
    const currentCard = CARDS[activeIndex]
    const videoEl = videoRefs.current[currentCard.id]
    if (!videoEl) return
    try {
      videoEl.currentTime = 0
      const playPromise = videoEl.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
    } catch {
      // Ignore playback errors in headless or restricted browser environments
    }
  }, [activeIndex, canMountVideo])

  const handleJump = (index: number) => {
    goTo(index)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 45

    if (distance > minSwipeDistance) {
      handleNext()
    } else if (distance < -minSwipeDistance) {
      handlePrev()
    }
  }

  const activeCard = CARDS[activeIndex]
  const activeTheme = COLOR_MAPS[activeCard.accentColor]
  const nextIndex = (activeIndex + 1) % totalCards
  const visibleIndexes = [activeIndex]
  if (outgoingIndex !== null && outgoingIndex !== activeIndex) {
    visibleIndexes.push(outgoingIndex)
  }
  // Pre-buffer the next transmission only once the active clip is buffered,
  // so card advances play instantly without competing for bandwidth early.
  const renderIndexes = [...visibleIndexes]
  if (canMountVideo && activeVideoReady && !visibleIndexes.includes(nextIndex)) {
    renderIndexes.push(nextIndex)
  }

  return (
    <div
      ref={viewportRef}
      className="relative w-full max-w-4xl mx-auto select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Ambient Outer Glow */}
      <div
        className={`absolute -inset-2 sm:-inset-4 rounded-3xl opacity-50 blur-2xl sm:blur-3xl transition-all duration-700 pointer-events-none ${
          activeCard.accentColor === 'cyan'
            ? 'bg-cyan-500/40'
            : activeCard.accentColor === 'amber'
            ? 'bg-amber-500/40'
            : activeCard.accentColor === 'emerald'
            ? 'bg-emerald-500/40'
            : activeCard.accentColor === 'purple'
            ? 'bg-purple-500/40'
            : 'bg-red-500/40'
        }`}
      />

      {/* Main Video Viewport - Clean 16:9 Frame */}
      <div
        className={`relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-[#070b0e] border ${activeTheme.border} ${activeTheme.glow} shadow-[0_20px_60px_rgba(0,0,0,0.95)] transition-all duration-700`}
      >
        {/* Crossfading Media Stack — posters always, clips only when in view */}
        {renderIndexes.map((idx) => {
          const card = CARDS[idx]
          const isActive = idx === activeIndex
          const isOutgoing = !isActive && idx === outgoingIndex
          const isPreloading = !isActive && !isOutgoing && idx === nextIndex
          const shouldMountVideo = Boolean(canMountVideo && card.video)
          return (
            <div
              key={card.id}
              className={`absolute inset-0 transition-opacity duration-[700ms] ease-in-out ${
                isActive
                  ? 'opacity-100 visible z-10 pointer-events-auto'
                  : isOutgoing
                  ? 'opacity-0 visible z-20 pointer-events-none'
                  : 'invisible z-0 pointer-events-none'
              }`}
            >
              <picture className="absolute inset-0 w-full h-full">
                {card.imageSm && (
                  <source media="(max-width: 767px)" srcSet={card.imageSm} type="image/webp" />
                )}
                <source media="(min-width: 768px)" srcSet={card.image} type="image/webp" />
                <img
                  src={card.image}
                  alt={isActive ? card.title : ''}
                  {...(idx === 0 && isActive ? eagerImageProps : { loading: 'lazy' as const, decoding: 'async' as const })}
                  width={1280}
                  height={720}
                  className="w-full h-full object-cover"
                />
              </picture>
              {shouldMountVideo && (
                <video
                  ref={(el) => {
                    videoRefs.current[card.id] = el
                  }}
                  poster={card.imageSm || card.image}
                  muted
                  playsInline
                  autoPlay={!isPreloading}
                  preload="auto"
                  onCanPlay={() => {
                    if (isActive) setActiveVideoReady(true)
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  {card.videoSm && (
                    <source src={card.videoSm} type="video/mp4" media="(max-width: 767px)" />
                  )}
                  <source src={card.video} type="video/mp4" />
                </video>
              )}
            </div>
          )
        })}

        {/* Minimal Subtle Bottom Gradient on Hover */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Minimal Hover-Only Left / Right Chevrons */}
        <button
          onClick={handlePrev}
          aria-label="Previous video transmission"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white shadow-lg transition-all active:scale-90 flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300"
        >
          <ChevronLeft className="w-5 h-5 text-cyan-300" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next video transmission"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white shadow-lg transition-all active:scale-90 flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300"
        >
          <ChevronRight className="w-5 h-5 text-cyan-300" />
        </button>

        {/* Minimal Hover-Only Jump Indicator Track at Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-lg pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {CARDS.map((card, idx) => {
            const isActive = idx === activeIndex
            const theme = COLOR_MAPS[card.accentColor]
            return (
              <button
                key={card.id}
                onClick={() => handleJump(idx)}
                className="p-1 flex items-center justify-center focus:outline-none"
                title={card.title}
                aria-label={`Jump to ${card.title}`}
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 ${
                    isActive
                      ? `w-6 ${theme.dot}`
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
