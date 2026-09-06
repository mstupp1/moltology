import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Sparkles,
  Gift,
  Leaf,
  Cpu,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'

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
  ctaButtonClass: string
  navButtonClass: string
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
    ctaButtonClass: 'bg-[#00ffff]/20 hover:bg-[#00ffff]/30 shadow-[0_0_15px_rgba(0,255,255,0.25)]',
    navButtonClass: 'border-[#00ffff]/40 text-[#00ffff] hover:bg-[#00ffff]',
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
    ctaButtonClass: 'bg-[#c084fc]/20 hover:bg-[#c084fc]/30 shadow-[0_0_15px_rgba(192,132,252,0.25)]',
    navButtonClass: 'border-[#c084fc]/40 text-[#c084fc] hover:bg-[#c084fc]',
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
    ctaButtonClass: 'bg-[#fb923c]/20 hover:bg-[#fb923c]/30 shadow-[0_0_15px_rgba(251,146,60,0.25)]',
    navButtonClass: 'border-[#fb923c]/40 text-[#fb923c] hover:bg-[#fb923c]',
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
    ctaButtonClass: 'bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 shadow-[0_0_15px_rgba(56,189,248,0.25)]',
    navButtonClass: 'border-[#38bdf8]/40 text-[#38bdf8] hover:bg-[#38bdf8]',
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [progressKey, setProgressKey] = useState(0)

  const activeSlide = PROMO_SLIDES[currentIndex] || PROMO_SLIDES[0]
  const isPlaying = !isHovered

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
    <section
      aria-label="Promotional announcements and seasonal events"
      className={`bg-[#0a1012]/90 chamfer-corner relative overflow-hidden shadow-2xl border border-[#3a4a49] border-l-4 transition-all duration-300 flex flex-col justify-between ${className}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: activeSlide.accentColor,
        borderLeftStyle: 'solid',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="hud-promo-bento-card"
    >

      {/* Main Wide Visual Stage */}
      <div className="relative group overflow-hidden bg-black h-[280px] sm:h-[300px] md:h-[320px] flex flex-col justify-end">
        {/* Background Visual Images with Smooth Fade */}
        {PROMO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 pointer-events-none ${
              idx === currentIndex ? 'opacity-100' : 'opacity-0'
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
          className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-[#070b0b]/80 hover:text-black border transition-all rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 ${activeSlide.navButtonClass}`}
          aria-label="Previous promotional slide"
          title="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={handleNext}
          className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-[#070b0b]/80 hover:text-black border transition-all rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 ${activeSlide.navButtonClass}`}
          aria-label="Next promotional slide"
          title="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Foreground Content Panel */}
        <div className="relative z-10 p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3 max-w-3xl">
          {/* Eyebrow */}
          <div>
            <span
              className={`text-[10px] sm:text-xs font-bold font-grotesk tracking-widest uppercase px-2 py-0.5 chamfer-corner border inline-flex items-center gap-1.5 ${activeSlide.tagClass}`}
            >
              {activeSlide.icon}
              {activeSlide.eyebrow}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-grotesk font-extrabold text-xl sm:text-2xl md:text-3xl text-[#dfe3e3] uppercase tracking-wider leading-tight drop-shadow-md">
            {activeSlide.title}
          </h3>

          {/* Description with locked minimum height */}
          <p className="text-xs sm:text-sm text-[#839493] font-sans leading-relaxed max-w-2xl min-h-[3.5rem] sm:min-h-[2.75rem] line-clamp-3">
            {activeSlide.description}
          </p>

          {/* Action Row */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate({ to: activeSlide.route })}
              className={`px-4 py-2 sm:px-5 sm:py-2.5 font-grotesk font-bold text-xs sm:text-sm chamfer-corner flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 ${activeSlide.ctaButtonClass}`}
            >
              <span className="tracking-wider">{activeSlide.ctaText}</span>
              <ArrowRight className="w-4 h-4" style={{ color: activeSlide.accentColor }} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Segmented Tab Rail (Single Unified Layer with In-Tab Progress Line) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#3a4a49]/60 divide-x divide-[#3a4a49]/40 bg-[#070b0b] shrink-0">
        {PROMO_SLIDES.map((slide, idx) => {
          const isActive = currentIndex === idx
          return (
            <button
              key={slide.id}
              onClick={() => handleSelectSlide(idx)}
              className={`relative py-2.5 px-3 sm:px-4 transition-all text-left flex items-center justify-between overflow-hidden ${
                isActive
                  ? 'bg-[#0f1414] text-[#dfe3e3]'
                  : 'bg-[#040707]/60 hover:bg-[#0f1414]/60 text-[#839493] hover:text-[#dfe3e3]'
              }`}
              aria-label={`Select bulletin 0${idx + 1}: ${slide.title}`}
              aria-current={isActive ? 'true' : 'false'}
            >
              {/* In-Tab Hairline Top Progress Line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-transparent pointer-events-none overflow-hidden">
                {isActive && (
                  <div
                    key={`${progressKey}-${isPlaying}`}
                    className="h-full w-full origin-left"
                    style={{
                      backgroundColor: slide.accentColor,
                      boxShadow: `0 0 6px ${slide.accentColor}`,
                      animation: isPlaying ? `carouselProgress ${autoPlayIntervalMs}ms linear forwards` : 'none',
                      width: isPlaying ? undefined : '100%',
                      willChange: 'transform',
                    }}
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="shrink-0">
                  {React.isValidElement(slide.icon)
                    ? React.cloneElement(slide.icon as React.ReactElement<{ className?: string }>, {
                        className: `w-3.5 h-3.5 ${isActive ? '' : 'text-[#839493] opacity-60'}`,
                      })
                    : slide.icon}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] font-grotesk font-bold uppercase tracking-wider truncate transition-colors ${
                    isActive ? 'text-[#dfe3e3]' : 'text-[#839493]'
                  }`}
                >
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
  )
}
