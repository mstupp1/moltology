import React, { useState, useEffect, useRef } from 'react'

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

  const totalCards = CARDS.length

  // Advance at 7.0s mark with 1.5s crossfade so next clip is fully opaque by 8.5s (well before 10s clip end)
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalCards)
    }, 7000)

    return () => clearInterval(interval)
  }, [isPaused, totalCards])

  // Reset active video to start (currentTime = 0) whenever activeIndex changes
  useEffect(() => {
    const currentCard = CARDS[activeIndex]
    const videoEl = videoRefs.current[currentCard.id]
    if (videoEl) {
      videoEl.currentTime = 0
      videoEl.play().catch(() => {})
    }
  }, [activeIndex])

  const handleJump = (index: number) => {
    setActiveIndex(index)
  }

  const activeCard = CARDS[activeIndex]
  const activeTheme = COLOR_MAPS[activeCard.accentColor]

  return (
    <div
      className="relative w-full max-w-4xl mx-auto select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient Outer Glow */}
      <div
        className={`absolute -inset-4 rounded-3xl opacity-35 blur-2xl transition-all duration-1000 pointer-events-none ${
          activeCard.accentColor === 'cyan'
            ? 'bg-cyan-500/30'
            : activeCard.accentColor === 'amber'
            ? 'bg-amber-500/30'
            : activeCard.accentColor === 'emerald'
            ? 'bg-emerald-500/30'
            : activeCard.accentColor === 'purple'
            ? 'bg-purple-500/30'
            : 'bg-red-500/30'
        }`}
      />

      {/* Main Video Viewport - Professional 16:9 Widescreen Rectangular Frame */}
      <div
        className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-[#070b0e] border ${activeTheme.border} ${activeTheme.glow} shadow-2xl transition-all duration-1000`}
      >
        {/* Crossfading Media Stack (Video or Image) */}
        {CARDS.map((card, idx) => {
          const isActive = idx === activeIndex
          return (
            <div
              key={card.id}
              className={`absolute inset-0 transition-opacity duration-[1000ms] ease-in-out ${
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

        {/* Bottom Subtle Gradient Overlay */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-20" />

        {/* Centered Jump-To Indicator Floating on Top of Image at Bottom - Shown on Hover */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          {CARDS.map((card, idx) => {
            const isActive = idx === activeIndex
            const theme = COLOR_MAPS[card.accentColor]
            return (
              <button
                key={card.id}
                onClick={() => handleJump(idx)}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isActive
                    ? `w-8 ${theme.dot}`
                    : 'w-2.5 bg-white/30 hover:bg-white/70'
                }`}
                title={`Jump to Card ${idx + 1}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

