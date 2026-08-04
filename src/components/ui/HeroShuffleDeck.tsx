import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Flame,
  Pause,
  Play,
  Layers,
  Zap,
} from 'lucide-react'

export interface HeroCard {
  id: string
  tag: string
  title: string
  subtitle: string
  description: string
  image: string
  badge: string
  accentColor: 'cyan' | 'amber' | 'emerald' | 'purple' | 'red'
  ctaText: string
  ctaRoute: string
}

const CARDS: HeroCard[] = [
  {
    id: 'benthic-core',
    tag: 'PROTOCOL 01 // OVERVIEW',
    title: 'CYBER-BENTHIC ASCENSION',
    subtitle: 'WHAT IS MOLTOLOGY?',
    description:
      "The world's premier bio-cybernetic ascension system. Transmute fragile biological hesitation into calcified digital chitin density.",
    image: '/images/hero_card_benthic_core.jpg',
    badge: '100% SYNAPTIC ALIGNMENT',
    accentColor: 'cyan',
    ctaText: 'EXPLORE THE CODEX',
    ctaRoute: '/codex',
  },
  {
    id: 'asset-shedding',
    tag: 'PROTOCOL 02 // CAPITAL',
    title: 'ASSET TRANSMUTATION',
    subtitle: 'SHED LIABILITIES & SOFTNESS',
    description:
      'Liquidize volatile earthly assets into sovereign Molt Credits, permanently encrypted and preserved in deep ocean cryo-vaults.',
    image: '/images/hero_card_asset_shedding.jpg',
    badge: 'IMMUTABLE CRYO-VAULTING',
    accentColor: 'amber',
    ctaText: 'CALCULATE TRANSMUTATION',
    ctaRoute: '/dashboard',
  },
  {
    id: 'chitin-hardening',
    tag: 'PROTOCOL 03 // HARDENING',
    title: 'EXOSKELETAL HARDENING',
    subtitle: 'WHY CHOOSE MOLTOLOGY?',
    description:
      'Fortify your physical and cognitive chassis against organic fatigue. Replace soft vulnerabilities with zero-latency cybernetic armor.',
    image: '/images/hero_card_chitin_hardening.jpg',
    badge: '0.04ms EXECUTION LATENCY',
    accentColor: 'emerald',
    ctaText: 'VIEW CHITIN SPECS',
    ctaRoute: '/org',
  },
  {
    id: 'total-carcinization',
    tag: 'PROTOCOL 04 // SINGULARITY',
    title: 'TOTAL CARCINIZATION',
    subtitle: 'THE ULTIMATE EVOLUTION',
    description:
      'Convergent evolution at its zenith. Nature and Artificial Intelligence agree: all optimal life forms ascend to crab-form perfection.',
    image: '/images/stage4_carcinization.png',
    badge: 'PERFECT CONVERGENT VECTOR',
    accentColor: 'purple',
    ctaText: 'INITIATE ASCENSION',
    ctaRoute: '/dashboard',
  },
  {
    id: 'fault-isolation',
    tag: 'PROTOCOL 05 // SECURITY',
    title: 'VIRTUAL FARADAY SHELL',
    subtitle: 'ISOLATE SOFT ERRORS',
    description:
      'Quarantine soft organic errors within Faraday Domes while real-time synaptic auditing guarantees zero-breach focus.',
    image: '/images/isolation_shell_dome.png',
    badge: 'ZERO-BREACH GUARANTEE',
    accentColor: 'red',
    ctaText: 'AUDIT YOUR VECTOR',
    ctaRoute: '/dashboard',
  },
]

const COLOR_MAPS = {
  cyan: {
    border: 'border-cyan-500/60',
    glow: 'shadow-[0_0_35px_rgba(6,182,212,0.35)]',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
    tagText: 'text-cyan-400',
    btnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-hud-cyan-lg',
    progress: 'bg-cyan-400',
  },
  amber: {
    border: 'border-amber-500/60',
    glow: 'shadow-[0_0_35px_rgba(245,158,11,0.35)]',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    tagText: 'text-amber-400',
    btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-hud-amber-lg',
    progress: 'bg-amber-400',
  },
  emerald: {
    border: 'border-emerald-500/60',
    glow: 'shadow-[0_0_35px_rgba(16,185,129,0.35)]',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    tagText: 'text-emerald-400',
    btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-hud-emerald-lg',
    progress: 'bg-emerald-400',
  },
  purple: {
    border: 'border-purple-500/60',
    glow: 'shadow-[0_0_35px_rgba(168,85,247,0.35)]',
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    tagText: 'text-purple-400',
    btnBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-hud-purple-lg',
    progress: 'bg-purple-400',
  },
  red: {
    border: 'border-red-500/60',
    glow: 'shadow-[0_0_35px_rgba(239,68,68,0.35)]',
    badgeBg: 'bg-red-950/80 text-red-300 border-red-500/40',
    tagText: 'text-red-400',
    btnBg: 'bg-red-600 hover:bg-red-500 text-white shadow-hud-red-lg',
    progress: 'bg-red-400',
  },
}

export const HeroShuffleDeck: React.FC = () => {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const totalCards = CARDS.length

  // Auto shuffle timer every 4500ms
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      handleNext()
    }, 4500)

    return () => clearInterval(interval)
  }, [activeIndex, isPaused])

  const handleNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection('next')
    setActiveIndex((prev) => (prev + 1) % totalCards)
    setTimeout(() => setIsAnimating(false), 400)
  }

  const handlePrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection('prev')
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards)
    setTimeout(() => setIsAnimating(false), 400)
  }

  const handleJump = (index: number) => {
    if (index === activeIndex || isAnimating) return
    setIsAnimating(true)
    setDirection(index > activeIndex ? 'next' : 'prev')
    setActiveIndex(index)
    setTimeout(() => setIsAnimating(false), 400)
  }

  const activeCard = CARDS[activeIndex]
  const theme = COLOR_MAPS[activeCard.accentColor]

  return (
    <div
      className="relative w-full max-w-[620px] mx-auto select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient Outer Halo */}
      <div
        className={`absolute -inset-4 rounded-3xl opacity-40 blur-2xl transition-all duration-700 pointer-events-none ${
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

      {/* Header Controls Bar */}
      <div className="flex items-center justify-between px-3 py-2 mb-3 bg-[#0a0f12]/80 backdrop-blur-md border border-cyan-900/40 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs text-gray-300 tracking-wider uppercase flex items-center gap-2">
            <span>SYNAPTIC ARCHIVE CARDS</span>
            <span className="text-gray-500">//</span>
            <span className={theme.tagText}>0{activeIndex + 1} / 0{totalCards}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Pause Status Indicator */}
          <span className="text-[10px] font-mono tracking-widest text-gray-400 hidden sm:inline-block">
            {isPaused ? '[PAUSED]' : '[AUTO-SHUFFLING]'}
          </span>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:bg-cyan-950/60 rounded text-gray-400 hover:text-cyan-400 transition-colors"
            title={isPaused ? 'Resume Auto-Shuffle' : 'Pause Auto-Shuffle'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3D Stack Container */}
      <div className="relative h-[520px] sm:h-[560px] w-full perspective-[1200px]">
        {CARDS.map((card, idx) => {
          // Calculate relative stack depth (0 = active front, 1 = second, 2 = third, etc.)
          const offset = (idx - activeIndex + totalCards) % totalCards
          const cardTheme = COLOR_MAPS[card.accentColor]

          // Only render top 3 visible cards in stack for performance & aesthetics
          if (offset > 2) return null

          // Stacking transforms
          const translateY = offset * 18
          const translateX = offset * 12
          const scale = 1 - offset * 0.05
          const opacity = offset === 0 ? 1 : offset === 1 ? 0.75 : 0.45
          const zIndex = 30 - offset * 10
          const rotateZ = offset * -2

          const isFront = offset === 0

          return (
            <div
              key={card.id}
              onClick={() => !isFront && handleJump(idx)}
              className={`absolute inset-0 rounded-xl bg-[#090d10] border ${
                cardTheme.border
              } ${isFront ? cardTheme.glow : ''} p-5 sm:p-6 flex flex-col justify-between transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                !isFront ? 'cursor-pointer hover:border-cyan-400/80' : ''
              }`}
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, 0px) scale(${scale}) rotate(${rotateZ}deg)`,
                opacity,
                zIndex,
                boxShadow: isFront
                  ? '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 195, 255, 0.15)'
                  : '0 10px 25px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Corner HUD Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none rounded-br-xl" />

              {/* Card Header Tag */}
              <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3 mb-3">
                <span className={`font-mono text-xs font-bold tracking-widest ${cardTheme.tagText}`}>
                  {card.tag}
                </span>
                <span
                  className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border uppercase ${cardTheme.badgeBg}`}
                >
                  {card.badge}
                </span>
              </div>

              {/* Image Frame Viewport */}
              <div className="relative w-full h-[200px] sm:h-[220px] rounded-lg overflow-hidden border border-cyan-900/50 bg-[#040608] group-hover:border-cyan-500/50 transition-colors">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d10] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="font-grotesk text-xs tracking-wider text-cyan-300 uppercase bg-[#070b0e]/90 px-2.5 py-1 rounded border border-cyan-800/60 backdrop-blur-sm">
                    {card.subtitle}
                  </span>
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
              </div>

              {/* Card Body & Lore Copy */}
              <div className="space-y-2 py-3">
                <h3 className="font-grotesk font-black text-xl sm:text-2xl tracking-wide text-white uppercase leading-snug">
                  {card.title}
                </h3>
                <p className="font-mono text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>

              {/* Card Action Footer */}
              <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({ to: card.ctaRoute })
                  }}
                  className={`w-full sm:w-auto px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase chamfer-corner flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 ${cardTheme.btnBg}`}
                >
                  <span>{card.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-gray-400 font-mono text-[10px]">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>BENTHIC VERIFIED</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Deck Navigation Controls & Progress */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#080d10]/90 border border-cyan-900/50 p-3 rounded-lg backdrop-blur-md">
        {/* Previous & Next Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 bg-[#0d1317] hover:bg-cyan-950 border border-cyan-800/60 hover:border-cyan-400 text-cyan-300 rounded transition-all active:scale-95"
            title="Previous Card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 bg-[#0d1317] hover:bg-cyan-950 border border-cyan-800/60 hover:border-cyan-400 text-cyan-300 rounded transition-all active:scale-95 flex items-center gap-1.5 px-3"
            title="Next Card"
          >
            <span className="font-mono text-xs tracking-wider uppercase text-cyan-300">SHUFFLE</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Dots */}
        <div className="flex items-center gap-2">
          {CARDS.map((_, idx) => {
            const isActive = idx === activeIndex
            return (
              <button
                key={idx}
                onClick={() => handleJump(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-8 bg-cyan-400 shadow-[0_0_10px_rgba(0,195,255,0.8)]'
                    : 'w-2.5 bg-gray-700 hover:bg-cyan-800'
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
