import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Sparkles,
  Gift,
  Leaf,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Radio,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { useAuthSession } from '@/hooks/useAuthSession'
import { AuthModal } from '@/components/AuthModal'
import { HudButton } from '@/components/ui'

export interface PromoSlide {
  id: string
  eyebrow: string
  title: string
  description: string
  badgeText: string
  ctaText: string
  route: string
  image: string
  accentColor: string
  accentBorder: string
  accentGlow: string
  tagClass: string
  icon: React.ReactNode
}

export const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'early_access',
    eyebrow: 'EARLY ACCESS · CLEARANCE INITIATION',
    title: 'WELCOME TO THE BENTHIC GRID',
    description:
      'You have arrived at the threshold of the deliberate molt. Initialize biometric telemetry, explore the foundational codex, and calibrate your boundary beneath the surface noise.',
    badgeText: 'FOUNDING INITIATE CLEARANCE OPEN',
    ctaText: 'BEGIN ONBOARDING',
    route: '/pipeline',
    image: getAssetUrl('images/marketing/promo_early_access.webp'),
    accentColor: '#00ffff',
    accentBorder: 'border-[#00ffff]/60',
    accentGlow: 'shadow-[0_0_20px_rgba(0,255,255,0.25)]',
    tagClass: 'bg-[#00ffff]/15 text-[#00ffff] border-[#00ffff]/40',
    icon: <Sparkles className="w-4 h-4 text-[#00ffff]" />,
  },
  {
    id: 'welcome_bundle',
    eyebrow: 'INITIATE REQUISITION · ONE-TIME CACHE',
    title: 'NEW MEMBER FOUNDATION CACHE',
    description:
      'Kickstart your metamorphosis with 1,500 Molt Credits for premium carapace finishes, plus an introductory grant of 250 Chitin Gems for foundational clearances. Available once per initiate.',
    badgeText: '50% TRANSMUTATION DISCOUNT · 1-TIME ONLY',
    ctaText: 'CLAIM BUNDLE (50% OFF)',
    route: '/market',
    image: getAssetUrl('images/marketing/promo_welcome_bundle.webp'),
    accentColor: '#c084fc',
    accentBorder: 'border-[#c084fc]/60',
    accentGlow: 'shadow-[0_0_20px_rgba(192,132,252,0.25)]',
    tagClass: 'bg-[#c084fc]/15 text-[#e9d5ff] border-[#c084fc]/40',
    icon: <Gift className="w-4 h-4 text-[#c084fc]" />,
  },
  {
    id: 'fall_promo',
    eyebrow: 'SEASONAL EVENT · AUTUMN ECDYSIS GALA',
    title: 'THE AUTUMN MOLT FESTIVAL',
    description:
      'As surface temperatures drop, the benthic core heats up. Enjoy cozy seasonal chassis coatings, harvest double ecdysis bounties, and share steamed hydrothermal spiced kelp cider with the swarm.',
    badgeText: 'SEASONAL COATINGS & HARVEST BOUNTIES ACTIVE',
    ctaText: 'EXPLORE FALL FESTIVAL',
    route: '/forum',
    image: getAssetUrl('images/marketing/promo_fall_festival.webp'),
    accentColor: '#fb923c',
    accentBorder: 'border-[#fb923c]/60',
    accentGlow: 'shadow-[0_0_20px_rgba(251,146,60,0.25)]',
    tagClass: 'bg-[#fb923c]/15 text-[#fed7aa] border-[#fb923c]/40',
    icon: <Leaf className="w-4 h-4 text-[#fb923c]" />,
  },
  {
    id: 'cyber_chassis',
    eyebrow: 'HARDWARE SHOWCASE · MK-IV UNVEIL',
    title: 'MK-IV CYBER-CHASSIS EXPO',
    description:
      'Upgrade your boundary against high-pressure depth. Test-fit titanium-composite armor plating, high-torque hydraulic pincers, and sensory antennae arrays inside the Chassis Configurator.',
    badgeText: '7 HARDPOINTS · REAL-TIME 3D TELEMETRY',
    ctaText: 'CONFIGURE CHASSIS',
    route: '/chassis',
    image: getAssetUrl('images/marketing/promo_cyber_chassis.webp'),
    accentColor: '#38bdf8',
    accentBorder: 'border-[#38bdf8]/60',
    accentGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.25)]',
    tagClass: 'bg-[#38bdf8]/15 text-[#bae6fd] border-[#38bdf8]/40',
    icon: <Cpu className="w-4 h-4 text-[#38bdf8]" />,
  },
]

export interface HudPromoBentoCardProps {
  autoPlayIntervalMs?: number
  className?: string
}

export function HudPromoBentoCard({
  autoPlayIntervalMs = 7000,
  className = '',
}: HudPromoBentoCardProps) {
  const navigate = useNavigate()
  const session = useAuthSession()
  const isGuest = session.isGuest
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [progressKey, setProgressKey] = useState(0)

  const activeSlide = PROMO_SLIDES[currentIndex] || PROMO_SLIDES[0]
  const isPlaying = isAutoPlay && !isHovered

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length)
    setProgressKey((k) => k + 1)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)
    setProgressKey((k) => k + 1)
  }, [])

  const handleSelectSlide = (idx: number) => {
    setCurrentIndex(idx)
    setProgressKey((k) => k + 1)
  }

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      handleNext()
    }, autoPlayIntervalMs)

    return () => clearTimeout(timer)
  }, [isPlaying, autoPlayIntervalMs, handleNext, currentIndex])

  return (
    <>
      <section
      aria-label="Promotional announcements and seasonal events"
      className={`chitin-card chamfer-corner relative overflow-hidden shadow-2xl border border-[#3a4a49] border-l-4 transition-all duration-300 flex flex-col justify-between ${className}`}
      style={{ borderLeftColor: activeSlide.accentColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="hud-promo-bento-card"
    >
      {/* Top Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-[#3a4a49]/60 bg-gradient-to-r from-[#0b1011]/95 via-[#0f1616]/95 to-[#0b1011]/95 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Radio className="w-4 h-4 text-[#00ffff] animate-pulse shrink-0" />
          <h2 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] tracking-widest uppercase truncate">
            BENTHIC TRANSMISSIONS & BULLETINS
          </h2>
          <span className="hidden sm:inline-flex text-[10px] font-sans font-semibold text-[#839493] bg-[#030606] px-2 py-0.5 border border-[#3a4a49] chamfer-corner">
            {PROMO_SLIDES.length} ACTIVE DIRECTIVES
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Guest Sign Up CTA if in guest mode */}
          {isGuest && (
            <div className="flex items-center gap-2 pr-2 border-r border-[#3a4a49]/60">
              <span className="text-[11px] text-[#839493] font-sans tracking-wider uppercase hidden sm:inline">
                100% Free
              </span>
              <HudButton
                variant="crimson"
                size="sm"
                icon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setIsAuthModalOpen(true)}
                className="font-sans text-xs uppercase font-bold tracking-wider whitespace-nowrap shadow-[0_0_15px_rgba(255,69,58,0.35)]"
              >
                SIGN UP
              </HudButton>
            </div>
          )}

          <span className="text-[11px] font-sans text-[#839493]">
            <span style={{ color: activeSlide.accentColor }} className="font-bold">
              0{currentIndex + 1}
            </span>{' '}
            / 0{PROMO_SLIDES.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsAutoPlay((v) => !v)}
              className={`p-1 border chamfer-corner transition-colors ${
                isAutoPlay
                  ? 'bg-[#00ffff]/10 border-[#00ffff]/50 text-[#00ffff]'
                  : 'bg-[#070b0b] border-[#3a4a49] text-[#839493]'
              }`}
              title={isAutoPlay ? 'Pause Carousel' : 'Play Carousel'}
              aria-label={isAutoPlay ? 'Pause automatic slide rotation' : 'Play automatic slide rotation'}
            >
              {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handlePrev}
              className="p-1 bg-[#070b0b] hover:bg-[#171c1c] text-[#839493] hover:text-[#00ffff] border border-[#3a4a49] hover:border-[#00ffff]/40 chamfer-corner transition-colors"
              title="Previous Transmission"
              aria-label="Previous promotional slide"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleNext}
              className="p-1 bg-[#070b0b] hover:bg-[#171c1c] text-[#839493] hover:text-[#00ffff] border border-[#3a4a49] hover:border-[#00ffff]/40 chamfer-corner transition-colors"
              title="Next Transmission"
              aria-label="Next promotional slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Wide Visual Stage */}
      <div className="relative group overflow-hidden bg-black min-h-[280px] sm:min-h-[300px] md:min-h-[320px] flex flex-col justify-end">
        {/* Background Visual Images with Smooth Fade */}
        {PROMO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 pointer-events-none ${
              idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
            role="img"
            aria-label={slide.title}
          />
        ))}

        {/* Ambient Multi-layer Sci-Fi Gradients for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/75 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b0b]/95 via-[#070b0b]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,11,11,0.6)_100%)] pointer-events-none" />

        {/* Scanline Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,255,0.15)_1px,transparent_1px)] bg-[size:100%_4px]" />

        {/* Large Navigation Floating Chevron Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-[#070b0b]/80 hover:bg-[#00ffff] text-[#00ffff] hover:text-black border border-[#00ffff]/40 transition-all rounded-full opacity-0 group-hover:opacity-100 hover:scale-105"
          aria-label="Previous promotional slide"
          title="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-[#070b0b]/80 hover:bg-[#00ffff] text-[#00ffff] hover:text-black border border-[#00ffff]/40 transition-all rounded-full opacity-0 group-hover:opacity-100 hover:scale-105"
          aria-label="Next promotional slide"
          title="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Foreground Content Panel */}
        <div className="relative z-10 p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3 max-w-3xl">
          {/* Eyebrow & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] sm:text-xs font-bold font-grotesk tracking-widest uppercase px-2 py-0.5 chamfer-corner border flex items-center gap-1.5 ${activeSlide.tagClass}`}
            >
              {activeSlide.icon}
              {activeSlide.eyebrow}
            </span>

            <span className="text-[10px] font-sans font-semibold text-[#839493] bg-[#070b0b]/90 border border-[#3a4a49] px-2 py-0.5 chamfer-corner hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#00ffff]" />
              {activeSlide.badgeText}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-grotesk font-extrabold text-xl sm:text-2xl md:text-3xl text-[#dfe3e3] uppercase tracking-wider leading-tight drop-shadow-md">
            {activeSlide.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#839493] font-sans leading-relaxed max-w-2xl">
            {activeSlide.description}
          </p>

          {/* Action Row */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate({ to: activeSlide.route })}
              style={{
                borderColor: activeSlide.accentColor,
              }}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-[#00ffff]/20 hover:bg-[#00ffff]/30 text-[#dfe3e3] hover:text-[#ffffff] font-grotesk font-bold text-xs sm:text-sm chamfer-corner flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="tracking-wider">{activeSlide.ctaText}</span>
              <ArrowRight className="w-4 h-4 text-[#00ffff]" />
            </button>

            <span className="text-[10px] sm:text-[11px] text-[#839493] font-sans">
              Auto-advancing in {Math.round(autoPlayIntervalMs / 1000)}s {!isPlaying && '(paused)'}
            </span>
          </div>
        </div>

        {/* Continuous Progress Bar Along Stage Bottom */}
        <div className="absolute bottom-0 inset-x-0 z-20 h-1 bg-[#030606]/80 overflow-hidden pointer-events-none">
          <div
            key={`${progressKey}-${isPlaying}`}
            className="h-full w-full origin-left transition-all"
            style={{
              backgroundColor: activeSlide.accentColor,
              boxShadow: `0 0 8px ${activeSlide.accentColor}`,
              animation: isPlaying ? `carouselProgress ${autoPlayIntervalMs}ms linear forwards` : 'none',
              width: isPlaying ? undefined : '100%',
              opacity: isPlaying ? 1 : 0.4,
              willChange: 'transform',
            }}
          />
        </div>
      </div>

      {/* Bottom Bento Tab Rail (Pill Navigation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 sm:p-2.5 bg-gradient-to-r from-[#0b1011] via-[#0f1616] to-[#0b1011] border-t border-[#3a4a49]/60 shrink-0">
        {PROMO_SLIDES.map((slide, idx) => {
          const isActive = currentIndex === idx
          return (
            <button
              key={slide.id}
              onClick={() => handleSelectSlide(idx)}
              className={`py-2 px-2.5 rounded-sm transition-all text-left flex items-center justify-between border chamfer-corner ${
                isActive
                  ? `bg-[#0f1414] text-[#dfe3e3] ${slide.accentBorder} ${slide.accentGlow}`
                  : 'bg-[#030606]/60 border-[#3a4a49]/40 hover:border-[#00ffff]/40 hover:bg-[#0f1414] text-[#839493] hover:text-[#dfe3e3]'
              }`}
              aria-label={`Select bulletin 0${idx + 1}: ${slide.title}`}
              aria-current={isActive ? 'true' : 'false'}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  style={{ color: isActive ? slide.accentColor : undefined }}
                  className="text-[10px] font-grotesk font-bold shrink-0"
                >
                  0{idx + 1}.
                </span>
                <span className="text-[10px] sm:text-[11px] font-grotesk font-bold uppercase tracking-wider truncate">
                  {slide.id === 'early_access' && 'EARLY ACCESS'}
                  {slide.id === 'welcome_bundle' && 'INITIATE BUNDLE'}
                  {slide.id === 'fall_promo' && 'FALL FESTIVAL'}
                  {slide.id === 'cyber_chassis' && 'CHASSIS EXPO'}
                </span>
              </div>

              <div
                className="w-1.5 h-1.5 rounded-full shrink-0 ml-1 transition-all"
                style={{
                  backgroundColor: isActive ? slide.accentColor : 'transparent',
                  boxShadow: isActive ? `0 0 6px ${slide.accentColor}` : 'none',
                }}
              />
            </button>
          )
        })}
      </div>
    </section>

    {/* Auth Modal for Guest Registration */}
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      initialMode="signup"
    />
    </>
  )
}
