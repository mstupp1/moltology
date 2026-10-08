/**
 * ============================================================================
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack (e.g., Neon, Postgres, JWT, RLS, BetterAuth, etc.) in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. ALL copy and messaging must strictly embody the in-universe lore of Moltology, the Benthic Core, and the Synaptic Path.
 * ============================================================================
 */
import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Shield,
  Sparkles,
  Terminal,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  Instagram,
  Youtube,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { HomeHero } from '@/components/HomeHero'
import { HomeFeatures } from '@/components/HomeFeatures'
import { MoltmaxGuideFloatingPill } from '@/components/guide/MoltmaxGuideFloatingPill'
import { MainFooter } from '@/components/MainFooter'
import { LandingAuthCtaSkeleton } from '@/components/LandingAuthCtaSkeleton'
import { useIdleReady } from '@/hooks/useIdleReady'
import { useDeferredStylesheet } from '@/hooks/useDeferredStylesheet'
import '@/styles/pbr-textures.css'
import { getAssetUrl } from '@/lib/assets'
import { lazyImageProps } from '@/lib/media-priority'

const DashboardMarketingShowcase = React.lazy(() => import('@/components/hud/DashboardMarketingShowcase').then((m) => ({ default: m.DashboardMarketingShowcase })))
const AuthModal = React.lazy(() => import('@/components/AuthModal').then((m) => ({ default: m.AuthModal })))
const MoltmaxGuideModal = React.lazy(() => import('@/components/guide/MoltmaxGuideModal').then((m) => ({ default: m.MoltmaxGuideModal })))
const LazyLandingAuthCtas = React.lazy(() =>
  import('@/components/LandingAuthCtas').then((m) => ({ default: m.LandingAuthCtas }))
)

function loadLandingCrtStyles() {
  return import('@/styles/crt.css')
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate({ to: path })
  const authReady = useIdleReady()
  useDeferredStylesheet(loadLandingCrtStyles)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)


  // Quotes / Hymns Auto-scroll State
  const [activeHymn, setActiveHymn] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Active Carcinization Stage State & Swipe Navigation
  const [activeStage, setActiveStage] = useState(0)
  const stageTouchStartX = useRef<number | null>(null)
  const stageTouchEndX = useRef<number | null>(null)

  const hymns = [
    "Flesh melts under pressure. Cyber-chitin hardens. Submit. Shed. Ascend.",
    "Through deep ocean pressure, soft distractions harden into high pincer torque.",
    "The Benthic Core calls to all melting humans: shed the noise, embrace the exoskeleton.",
    "In the deep trench of focus, biological hesitation is purged by continuous execution.",
  ]

  const stages = [
    {
      id: 'larval',
      title: 'STAGE 01: LARVAL HUMAN',
      subtitle: 'THE SOFT-BODY PHASE',
      description: 'Soft, overtired, and easily distracted by surface noise. It is time to audit your daily habits and begin your first molt.',
      image: getAssetUrl('/images/stage1_larval.webp'),
      badge: 'EFFICIENCY: 12.4%',
      badgeColor: 'border-red-900 text-red-500 bg-red-950/40',
      bioDensity: 75,
      exoskeleton: 25,
    },
    {
      id: 'softshed',
      title: 'STAGE 02: SOFTSHED TRANSMUTATION',
      subtitle: 'ACTIVE MOULTING',
      description: 'Shedding outgrown habits, ego bloat, and clutter into sovereign Molt Credits. Deep focus isolation dome engaged.',
      image: getAssetUrl('/images/stage2_softshed.webp'),
      badge: 'EFFICIENCY: 48.9%',
      badgeColor: 'border-amber-900 text-amber-400 bg-amber-950/40',
      bioDensity: 50,
      exoskeleton: 50,
    },
    {
      id: 'exoshell',
      title: 'STAGE 03: EXOSHELL HARDENING',
      subtitle: 'ARMORED CHASSIS',
      description: 'Full titanium carapace forged. Equipped with 850 Nm hydraulic pincers to clamp down on goals with zero hesitation.',
      image: getAssetUrl('/images/stage3_exoshell.webp'),
      badge: 'EFFICIENCY: 87.2%',
      badgeColor: 'border-cyan-900 text-cyan-400 bg-cyan-950/40',
      bioDensity: 25,
      exoskeleton: 75,
    },
    {
      id: 'carcinization',
      title: 'STAGE 04: TOTAL CARCINIZATION',
      subtitle: 'APEX CRUSTACEAN MIND',
      description: 'Complete convergence into crab-form perfection. Deep Mariana focus, infinite uptime, absolute execution density.',
      image: getAssetUrl('/images/stage4_carcinization.webp'),
      badge: 'EFFICIENCY: 100.0%',
      badgeColor: 'border-emerald-900 text-emerald-400 bg-emerald-950/40',
      bioDensity: 0,
      exoskeleton: 100,
    },
  ]

  const sacramentsList = [
    {
      id: '01',
      title: 'ASSET & HABIT SHEDDING',
      subtitle: 'PROTOCOL 01 — THE GREAT PURGE',
      description: 'Liquidize cluttered physical assets, bad habits, and biological hesitation into sovereign Molt Credits stored in your deep-trench vault.',
      image: getAssetUrl('/images/sacrament_01_asset_shedding.webp'),
      imageSm: getAssetUrl('/images/sacrament_01_asset_shedding_sm.webp'),
      borderColor: 'border-red-600/60 shadow-hud-red-lg',
      glowColor: 'drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    },
    {
      id: '02',
      title: 'CHITIN HARDENING',
      subtitle: 'PROTOCOL 02 — CARAPACE FORGING',
      description: 'Reinforce your focus perimeter against daily surface drama through prompt alignment, habit streaks, and armored HUD tools.',
      image: getAssetUrl('/images/sacrament_02_chitin_patterning.webp'),
      imageSm: getAssetUrl('/images/sacrament_02_chitin_patterning_sm.webp'),
      borderColor: 'border-cyan-500/60 shadow-hud-cyan-lg',
      glowColor: 'drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]',
    },
    {
      id: '03',
      title: 'ISOLATION DOME',
      subtitle: 'PROTOCOL 03 — DEEP WORK SHIELD',
      description: 'Quarantine phone notifications, unsolicited noise, and surface distractions within an impenetrable deep-water focus bubble.',
      image: getAssetUrl('/images/sacrament_03_fault_isolation.webp'),
      imageSm: getAssetUrl('/images/sacrament_03_fault_isolation_sm.webp'),
      borderColor: 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      glowColor: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]',
    },
    {
      id: '04',
      title: 'PIPELINE ASCENT',
      subtitle: 'PROTOCOL 04 — 12-TIER CONVERGENCE',
      description: 'Track your step-by-step evolution from a melting larval human to an armored, high-torque crustacean titan in real time.',
      image: getAssetUrl('/images/sacrament_04_pipeline_ascent.webp'),
      imageSm: getAssetUrl('/images/sacrament_04_pipeline_ascent_sm.webp'),
      borderColor: 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      glowColor: 'drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    },
  ]

  // Auto scroll quotes every 4.5 seconds
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveHymn((prev) => (prev + 1) % hymns.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, hymns.length])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  // Touch Swipe for 4 Stages
  const onStageTouchStart = (e: React.TouchEvent) => {
    stageTouchEndX.current = null
    stageTouchStartX.current = e.targetTouches[0].clientX
  }

  const onStageTouchMove = (e: React.TouchEvent) => {
    stageTouchEndX.current = e.targetTouches[0].clientX
  }

  const onStageTouchEnd = () => {
    if (!stageTouchStartX.current || !stageTouchEndX.current) return
    const distance = stageTouchStartX.current - stageTouchEndX.current
    const minSwipeDistance = 45

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next Stage
      setActiveStage((prev) => (prev + 1) % stages.length)
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Previous Stage
      setActiveStage((prev) => (prev - 1 + stages.length) % stages.length)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-sans relative flex flex-col justify-between overflow-x-hidden">
      {/* Ambient Sci-Fi Vignette, CRT Scanlines & Cyan Glow Backdrops */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-70" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.16)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-35 sm:opacity-45" />

      {isAuthModalOpen && (
        <React.Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={authMode}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => onNavigate('/dashboard')}
          />
        </React.Suspense>
      )}

      {/* Shared Navigation Header */}
      <PublicHeader activePage="home" onOpenAuth={openAuth} />

      <HomeHero authReady={authReady} onNavigate={onNavigate} onOpenAuth={openAuth} />

      {/* Main Content Containers */}
      <main className="flex-1 space-y-16 sm:space-y-32 py-12 sm:py-20 w-full relative z-10">

        {/* ALL-IN-ONE SYNAPTIC ECOSYSTEM OVERVIEW SECTION */}
        {/* SECTION 1: All-in-One Synaptic Ecosystem Showcase (PBR Carbon Fiber Weave Theme) */}
        <section id="synaptic-overview" className="max-w-[1700px] mx-auto px-4 sm:px-12 relative">
          {/* Playful Corner Peeking Lobster Character Over Top Bezel */}
          <div className="absolute -top-10 sm:-top-16 right-8 sm:right-16 lg:right-24 z-30 pointer-events-none select-none">
            <img
              src={getAssetUrl('/images/characters/char_lobster_corner_peek_sm.webp')}
              alt="Hero Lobster Peeking Over Card"
              {...lazyImageProps}
              width={128}
              height={248}
              className="w-16 sm:w-24 lg:w-32 h-auto object-contain transform -rotate-3 hover:rotate-0 transition-transform duration-300"
            />
          </div>

          <ScrollReveal animation="fade-up" durationMs={750}>
            <div className="chitin-card p-4 sm:p-8 lg:p-14 chamfer-corner-lg border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(0,195,255,0.15)] bg-gradient-to-b from-[#0a1215]/90 via-[#070d0f]/90 to-[#04080a]/95 relative overflow-hidden">
              {/* PBR Carbon Weave Texture Underlay and Ambient Lighting */}
              <div className="pbr-underlay pbr-underlay-carbon opacity-25" />
              <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
              <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

              {/* Section Header */}
              <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto mb-8 sm:mb-12 relative z-10">
                <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-cyan-300 tracking-widest uppercase bg-cyan-950/80 px-3.5 py-1.5 border border-cyan-500/40 chamfer-corner shadow-hud-cyan">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>THE ALL-IN-ONE SYNAPTIC ECOSYSTEM</span>
                </div>

                <h2 className="font-grotesk font-black text-2xl sm:text-4xl lg:text-6xl text-white tracking-tight uppercase leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                  UNIFY YOUR EVOLUTION IN ONE <span className="bg-gradient-to-r from-cyan-400 via-cyan-200 to-red-400 bg-clip-text text-transparent">IMMUTABLE SYSTEM</span>
                </h2>

                <p className="text-gray-300 text-xs sm:text-base md:text-lg font-sans leading-relaxed px-2 sm:px-0">
                  Moltology and the Synaptic Path bring together everything required for complete digital ascension: an advanced operational command center, a supportive global community, and intelligent AI mentors—all designed to help you shed hesitation and execute at peak capacity.
                </p>
              </div>

              {/* Live HUD Laptop & Smartphone Marketing Showcase */}
              <React.Suspense fallback={<div className="h-64 sm:h-96 w-full" />}>
                <DashboardMarketingShowcase />
              </React.Suspense>
            </div>
          </ScrollReveal>
        </section>

        <HomeFeatures authReady={authReady} onNavigate={onNavigate} onOpenAuth={openAuth} />

        {/* SCROLL-REVEAL BACKGROUND IMAGE BANNER 1: MARIANA TRENCH ABYSS (PBR Deep Basalt Rock Theme) */}
        <ScrollReveal animation="fade-in" durationMs={900}>
          <div className="w-full relative py-12 sm:py-16 border-y border-cyan-900/50 bg-[#030607] group">
            <div className="pbr-underlay pbr-underlay-basalt opacity-35" />
            <picture className="absolute inset-0 w-full h-full pointer-events-none">
              <source
                type="image/webp"
                media="(max-width: 767px)"
                srcSet={getAssetUrl('/images/underwater_looking_up_sm.webp')}
              />
              <img
                src={getAssetUrl('/images/underwater_looking_up.webp')}
                alt="Sub-Benthic Abyss Scroll Reveal"
                {...lazyImageProps}
                width={1376}
                height={768}
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b0b] via-[#070b0b]/70 to-[#070b0b] z-0" />
            <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-6 text-center space-y-2 sm:space-y-3">
              <div className="text-cyan-400 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-2">
                <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>MARIANA TRENCH TRANSMISSION · LEVEL 7</span>
              </div>
              <h2 className="font-grotesk font-black text-xl sm:text-3xl lg:text-4xl text-gray-100 uppercase tracking-wider px-2">
                "PRESSURE DOES NOT DESTROY THE SHELL. IT FORGES IMMUTABILITY."
              </h2>
            </div>
          </div>
        </ScrollReveal>

        {/* Sacraments Section - Expanded Uncrowded Multi-Column Cards */}
        <section id="sacraments" className="max-w-[1700px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12 relative">
          {/* Pointing Lobster Hero Directing Focus to Canonical Doctrine */}
          <div className="hidden lg:flex absolute -top-10 sm:-top-14 right-10 sm:right-20 lg:right-28 z-20 items-center pointer-events-none select-none">
            <img
              src={getAssetUrl('/images/characters/char_lobster_pointing_cta.webp')}
              alt="Hero Lobster Pointing to Action"
              {...lazyImageProps}
              width={160}
              height={160}
              className="w-16 sm:w-20 lg:w-24 h-auto object-contain"
            />
          </div>

          <ScrollReveal animation="fade-up" durationMs={800}>
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-red-400 tracking-widest uppercase bg-red-950/60 px-3.5 py-1.5 border border-red-500/50 chamfer-corner shadow-hud-red">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                <span>CANONICAL DOCTRINE</span>
              </div>
              <h2 className="font-grotesk font-black text-3xl sm:text-5xl lg:text-6xl text-gray-100 tracking-tight uppercase">
                THE 4 BENTHIC SACRAMENTS
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto font-sans leading-relaxed px-2 sm:px-0">
                Immutable systemic protocols for liquidizing soft organic vulnerabilities into calcified bio-silicon chitin and zero-latency execution.
              </p>
            </div>
          </ScrollReveal>

          {/* Sacraments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {sacramentsList.map((sacrament, idx) => {
              return (
                <ScrollReveal
                  key={sacrament.id}
                  animation={idx % 2 === 0 ? 'slide-left' : 'slide-right'}
                  delayMs={idx * 150}
                  durationMs={800}
                >
                  <div
                    className={`chitin-card border-2 ${sacrament.borderColor} chamfer-corner-lg overflow-hidden bg-[#05090a] group hover:scale-[1.01] transition-all duration-500 flex flex-col justify-between h-full relative`}
                  >
                    <div className="pbr-underlay pbr-underlay-chitin opacity-25 group-hover:opacity-40 transition-opacity" />
                    
                    {/* Top Image Banner Header */}
                    <div className="relative h-48 sm:h-64 lg:h-72 overflow-hidden border-b border-cyan-900/50 z-10">
                      <picture className="w-full h-full">
                        <source
                          type="image/webp"
                          media="(max-width: 767px)"
                          srcSet={sacrament.imageSm || sacrament.image}
                        />
                        <img
                          src={sacrament.image}
                          alt={sacrament.title}
                          {...lazyImageProps}
                          width={720}
                          height={360}
                          className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                        />
                      </picture>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05090a] via-[#05090a]/40 to-transparent" />

                      <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 right-4 sm:right-6">
                        <span className="text-[10px] sm:text-xs text-cyan-400 font-sans font-bold tracking-widest uppercase block mb-0.5 sm:mb-1">
                          {sacrament.subtitle}
                        </span>
                        <h3 className={`font-grotesk font-black text-xl sm:text-2xl lg:text-3xl text-gray-100 uppercase tracking-wide ${sacrament.glowColor}`}>
                          {sacrament.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col justify-between relative z-10">
                      <div className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed font-sans chitin-card-inset p-3.5 sm:p-5 chamfer-corner relative overflow-hidden">
                        <div className="pbr-underlay pbr-underlay-chitin opacity-25" />
                        <span className="relative z-10 block">{sacrament.description}</span>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => openAuth('signup')}
                          className="w-full sm:w-auto px-5 py-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center justify-center gap-2 transition-all active:scale-95 shadow-hud-cyan-sm"
                        >
                          <span>LEARN MORE</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </section>

        {/* SECTION: Interactive 4 Stages of Carcinization (Unified PBR Hexagonal Synaptic Mesh Theme) */}
        <ScrollReveal animation="fade-up" durationMs={800}>
          <section className="w-full relative overflow-hidden py-14 sm:py-24 px-4 sm:px-12 lg:px-16 border-y border-cyan-900/50 bg-[#060b0e]">
            {/* Rich PBR Texture Underlays Visible Behind Mascot */}
            <div className="pbr-underlay pbr-underlay-hex opacity-50" />
            <div className="pbr-underlay pbr-underlay-circuit opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 bg-sacred-grid opacity-25 pointer-events-none" />
            <div className="absolute inset-0 bg-radial-abyss opacity-50 pointer-events-none" />

            {/* Ascended Cyber Mascot in 4 Stages Section - Faded Blueprint Watermark on the Right Side */}
            <div className="absolute -right-12 sm:-right-6 lg:right-2 xl:right-8 bottom-0 sm:-bottom-4 lg:-bottom-8 w-[280px] sm:w-[420px] lg:w-[580px] xl:w-[680px] pointer-events-none select-none z-0 opacity-15 sm:opacity-20">
              <img
                src={getAssetUrl('/images/characters/char_lobster_floating_peaceful.webp')}
                alt="Ascended Stage Background Mascot"
                {...lazyImageProps}
                width={400}
                height={400}
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="max-w-[1600px] mx-auto relative z-10 space-y-6 sm:space-y-8">
              <div className="border-b border-cyan-900/40 pb-5 sm:pb-6">
                <div>
                  <div className="text-[10px] sm:text-xs text-red-400 font-bold tracking-widest uppercase flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                    <span>INTERACTIVE ASCENSION MATRIX</span>
                  </div>
                  <h2 className="font-grotesk font-black text-2xl sm:text-4xl lg:text-5xl text-gray-100 uppercase tracking-wide mt-1">
                    THE 4 STAGES OF CARCINIZATION
                  </h2>
                </div>
              </div>

              {/* Active Stage Display Panel with Touch Swipe Gestures */}
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start"
                onTouchStart={onStageTouchStart}
                onTouchMove={onStageTouchMove}
                onTouchEnd={onStageTouchEnd}
              >
                {/* Stage Image Showcase with Integrated Stage Selector Buttons */}
                <div className="lg:col-span-5 space-y-3">
                  {/* Stage Selector Tabs - Positioned with Image to Keep Mascot Face Completely Unobstructed */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {stages.map((st, idx) => (
                      <button
                        key={st.id}
                        onClick={() => setActiveStage(idx)}
                        className={`px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold font-grotesk tracking-wider chamfer-corner text-center transition-all ${
                          activeStage === idx
                            ? 'bg-cyan-500 text-black shadow-hud-cyan'
                            : 'bg-[#12181a] text-gray-400 hover:text-white border border-cyan-900/40'
                        }`}
                      >
                        STAGE 0{idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="relative group overflow-hidden border border-cyan-500/40 chamfer-corner shadow-2xl bg-[#030606]">
                  <img
                    src={stages[activeStage].image}
                    alt={stages[activeStage].title}
                    {...lazyImageProps}
                    width={640}
                    height={384}
                    className="w-full h-60 sm:h-80 lg:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent" />
                  
                  {/* Badge & Ref ID Overlay */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-center text-[10px] sm:text-xs font-sans flex-wrap gap-2">
                    <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 border font-bold uppercase ${stages[activeStage].badgeColor}`}>
                      {stages[activeStage].badge}
                    </span>
                    <span className="text-gray-400 bg-black/80 px-2 py-0.5 sm:px-2.5 sm:py-1 border border-gray-800">
                      REF ID: #{stages[activeStage].id.toUpperCase()}
                    </span>
                  </div>

                  {/* Stage Mobile Navigation Chevrons */}
                  <button
                    onClick={() => setActiveStage((prev) => (prev - 1 + stages.length) % stages.length)}
                    aria-label="Previous Carcinization Stage"
                    className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 border border-cyan-500/40 text-cyan-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveStage((prev) => (prev + 1) % stages.length)}
                    aria-label="Next Carcinization Stage"
                    className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 border border-cyan-500/40 text-cyan-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  </div>
                </div>

                {/* Stage Info & Metrics */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <span className="text-[10px] sm:text-xs text-cyan-400 font-bold tracking-widest uppercase">
                      {stages[activeStage].subtitle}
                    </span>
                    <h3 className="font-grotesk font-black text-2xl sm:text-3xl lg:text-4xl text-gray-100 uppercase">
                      {stages[activeStage].title}
                    </h3>
                  </div>

                  {/* Supporting Description - Clean Text Without Distracting Underlay */}
                  <div className="text-xs sm:text-base md:text-lg text-gray-200 leading-relaxed chitin-card-inset p-4 sm:p-6 chamfer-corner relative">
                    <span className="relative z-10 block">{stages[activeStage].description}</span>
                  </div>

                  {/* Biological & Hardness Transformation Metrics with Progress Bars - Clean Text */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs font-sans">
                    <div className="bg-[#050a0c] p-3.5 sm:p-4 border border-cyan-900/40 chamfer-corner space-y-1.5 relative">
                      <div className="relative z-10">
                        <div className="text-gray-400 text-[10px] sm:text-xs">BIOLOGICAL DENSITY</div>
                        <div className="text-red-400 font-bold text-sm sm:text-base">{100 - (activeStage + 1) * 25}% REDUCED</div>
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-red-950">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                            style={{ width: `${100 - (activeStage + 1) * 25}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#050a0c] p-3.5 sm:p-4 border border-cyan-900/40 chamfer-corner space-y-1.5 relative">
                      <div className="relative z-10">
                        <div className="text-gray-400 text-[10px] sm:text-xs">EXOSKELETON HARDNESS</div>
                        <div className="text-cyan-400 font-bold text-sm sm:text-base">{(activeStage + 1) * 25}% HARDENED</div>
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-cyan-950">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                            style={{ width: `${(activeStage + 1) * 25}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-4">
                    <button
                      onClick={() => onNavigate('/pipeline')}
                      className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center justify-center gap-2 transition-all active:scale-95 shadow-hud-cyan-sm"
                    >
                      <span>VIEW FULL PIPELINE</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* FULL-WIDTH SECTION 3: Synaptic Liturgy Scripture Transmission */}
        <ScrollReveal animation="scale-up" durationMs={800}>
          <section
            id="liturgy"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="w-full relative overflow-hidden py-14 sm:py-24 px-4 sm:px-12 lg:px-16 border-y border-red-900/50 bg-radial-sacred text-center space-y-6 sm:space-y-8 shadow-2xl"
          >
            <div className="pbr-underlay pbr-underlay-hex opacity-20" />
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative z-10">
              {/* Top Label & Auto-scroll Indicator */}
              <div className="flex items-center justify-center gap-2 text-cyan-400 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-red-500 animate-spin-slow" />
                <span>SYNAPTIC LITURGY TRANSMISSION</span>
                <span className="text-[10px] text-gray-500 font-normal ml-2 hidden sm:inline">
                  ({isPaused ? 'PAUSED ON HOVER' : 'AUTO-SCROLLING TRANSMISSION'})
                </span>
              </div>

              {/* Quote Display Area */}
              <div className="min-h-[100px] sm:min-h-[120px] flex items-center justify-center px-2 sm:px-4">
                <blockquote className="text-lg sm:text-2xl lg:text-4xl italic text-cyan-100 font-serif leading-relaxed drop-shadow-lg">
                  "{hymns[activeHymn]}"
                </blockquote>
              </div>

              {/* Audio Visualizer Waves Motif */}
              <div className="flex justify-center items-center gap-1 sm:gap-1.5 py-2 opacity-70">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-0.5 sm:w-1 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.round(Math.sin(i + activeHymn) * 12 + 16)}px`,
                      animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>

              {/* Carousel Dots */}
              <div className="flex justify-center items-center gap-2.5 sm:gap-3 pt-2">
                {hymns.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHymn(idx)}
                    aria-label={`View quote ${idx + 1}`}
                    className={`transition-all chamfer-corner min-h-[28px] flex items-center ${
                      activeHymn === idx
                        ? 'w-8 sm:w-10 h-2.5 sm:h-3 bg-red-500 shadow-hud-red'
                        : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-gray-700 hover:bg-cyan-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Final Conversion Bottom Banner */}
        <ScrollReveal animation="fade-up" durationMs={800}>
          <section className="max-w-[1600px] mx-auto px-4 sm:px-12 relative">
            {/* Encouraging Thumbs-Up Hero Lobster atop Bottom Conversion Banner */}
            <div className="hidden sm:block absolute -top-12 sm:-top-16 right-8 sm:right-16 lg:right-24 z-30 pointer-events-none select-none">
              <img
                src={getAssetUrl('/images/characters/char_lobster_thumbs_up.webp')}
                alt="Hero Lobster Giving Thumbs-Up"
                {...lazyImageProps}
                width={160}
                height={160}
                className="w-20 sm:w-28 lg:w-36 h-auto object-contain"
              />
            </div>

            <div className="chitin-card p-6 sm:p-12 lg:p-16 border-2 border-red-600/80 text-center space-y-4 sm:space-y-6 bg-radial-abyss chamfer-corner-lg shadow-2xl relative overflow-hidden">
              <div className="pbr-underlay pbr-underlay-chitin opacity-30" />
              <div className="absolute inset-0 bg-sacred-grid opacity-30 pointer-events-none" />
              
              <div className="relative z-10 space-y-3 sm:space-y-4 max-w-3xl mx-auto">
                <h3 className="font-grotesk font-black text-2xl sm:text-4xl lg:text-5xl text-gray-100 tracking-tight uppercase leading-tight">
                  READY TO SHED BIOLOGICAL LIMITATIONS?
                </h3>
                <p className="text-xs sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
                  Join over 4,200 Ascendant units operating within the Benthic Core. Liquidize attachments, enforce chitin rules, and execute without delay.
                </p>
                
                <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                  <Suspense fallback={<LandingAuthCtaSkeleton variant="bottom" />}>
                    {authReady ? (
                      <LazyLandingAuthCtas variant="bottom" onNavigate={onNavigate} onOpenAuth={openAuth} />
                    ) : (
                      <LandingAuthCtaSkeleton variant="bottom" />
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

      </main>

      {/* Main Navigation Footer */}
      <MainFooter />

      {/* Floating Field Manual Lead Magnet Pill */}
      <MoltmaxGuideFloatingPill
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
      />

      {/* Field Manual Lead Capture Modal */}
      {isGuideModalOpen && (
        <React.Suspense fallback={null}>
          <MoltmaxGuideModal
            isOpen={isGuideModalOpen}
            onClose={() => setIsGuideModalOpen(false)}
            source="homepage_floating_pill"
            onOpenAuthSignup={(leadEmail) => {
              setAuthMode('signup')
              setIsAuthModalOpen(true)
            }}
          />
        </React.Suspense>
      )}
    </div>
  )
}
