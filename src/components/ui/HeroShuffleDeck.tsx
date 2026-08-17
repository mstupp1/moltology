import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroCard {
  id: string
  title: string
  image: string
  video?: string
  accentColor: 'cyan' | 'amber' | 'emerald' | 'purple' | 'red'
}

const CARDS: HeroCard[] = [
  {
    id: 'benthic-core',
    title: 'CYBER-BENTHIC ASCENSION',
    image: '/images/hero_card_benthic_core.jpg',
    video: '/videos/hero_benthic_core.mp4',
    accentColor: 'cyan',
  },
  {
    id: 'asset-shedding',
    title: 'ASSET TRANSMUTATION',
    image: '/images/hero_card_asset_shedding.jpg',
    video: '/videos/hero_asset_shedding.mp4',
    accentColor: 'amber',
  },
  {
    id: 'chitin-hardening',
    title: 'EXOSKELETAL HARDENING',
    image: '/images/hero_card_chitin_hardening.jpg',
    video: '/videos/hero_chitin_hardening.mp4',
    accentColor: 'emerald',
  },
  {
    id: 'total-carcinization',
    title: 'TOTAL CARCINIZATION',
    image: '/images/stage4_carcinization.png',
    video: '/videos/hero_total_carcinization.mp4',
    accentColor: 'purple',
  },
  {
    id: 'fault-isolation',
    title: 'VIRTUAL FARADAY SHELL',
    image: '/images/isolation_shell_dome.png',
    video: '/videos/hero_fault_isolation.mp4',
    accentColor: 'red',
  },
  {
    id: 'synaptic-path',
    title: 'JOIN THE SYNAPTIC PATH',
    image: '/images/hero_family_welcoming_sanctuary.png',
    video: '/videos/hero_synaptic_path.mp4',
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
  const [isPaused, setIsPaused] = useState(false)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const totalCards = CARDS.length

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalCards)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards)
  }

  // Auto-advance timer: 9.5s per clip
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      handleNext()
    }, 9500)

    return () => clearInterval(interval)
  }, [isPaused, totalCards])

  // Reset and play active video from 0:00 whenever activeIndex changes
  useEffect(() => {
    const currentCard = CARDS[activeIndex]
    const videoEl = videoRefs.current[currentCard.id]
    if (videoEl) {
      videoEl.currentTime = 0
      try {
        const playPromise = videoEl.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {})
        }
      } catch (e) {
        // Ignore playback errors in headless or restricted browser environments
      }
    }
  }, [activeIndex])

  const handleJump = (index: number) => {
    setActiveIndex(index)
  }

  // Touch Swipe Handlers for mobile navigation
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

  return (
    <div
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
        {/* Crossfading Media Stack */}
        {CARDS.map((card, idx) => {
          const isActive = idx === activeIndex
          return (
            <div
              key={card.id}
              className={`absolute inset-0 transition-opacity duration-[700ms] ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {card.video ? (
                <video
                  ref={(el) => {
                    videoRefs.current[card.id] = el
                  }}
                  src={card.video}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
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
