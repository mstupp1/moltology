/**
 * ============================================================================
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack (e.g., Neon, Postgres, JWT, RLS, BetterAuth, etc.) in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. ALL copy and messaging must strictly embody the in-universe lore of Moltology, the Benthic Core, and the Synaptic Path.
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Shield,
  Sparkles,
  ArrowRight,
  UserPlus,
  Cpu,
  CheckCircle2,
  Zap,
  Terminal,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  Instagram,
  Youtube,
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { RollingNumber } from '@/components/ui/RollingNumber'
import { PublicHeader } from '@/components/PublicHeader'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { HeroShuffleDeck } from '@/components/ui/HeroShuffleDeck'
import { MoltmaxGuideModal } from '@/components/guide/MoltmaxGuideModal'
import { MoltmaxGuideFloatingPill } from '@/components/guide/MoltmaxGuideFloatingPill'
import { MainFooter } from '@/components/MainFooter'
import { DashboardMarketingShowcase } from '@/components/hud/DashboardMarketingShowcase'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAssetUrl } from '@/lib/assets'
import { eagerImageProps, lazyImageProps, lcpImageProps } from '@/lib/media-priority'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate({ to: path })
  const session = useAuthSession()
  const user = session.user
  const isSessionPending = session.isPending
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
      borderColor: 'border-red-600/60 shadow-hud-red-lg',
      glowColor: 'drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    },
    {
      id: '02',
      title: 'CHITIN HARDENING',
      subtitle: 'PROTOCOL 02 — CARAPACE FORGING',
      description: 'Reinforce your focus perimeter against daily surface drama through prompt alignment, habit streaks, and armored HUD tools.',
      image: getAssetUrl('/images/sacrament_02_chitin_patterning.webp'),
      borderColor: 'border-cyan-500/60 shadow-hud-cyan-lg',
      glowColor: 'drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]',
    },
    {
      id: '03',
      title: 'ISOLATION DOME',
      subtitle: 'PROTOCOL 03 — DEEP WORK SHIELD',
      description: 'Quarantine phone notifications, unsolicited noise, and surface distractions within an impenetrable deep-water focus bubble.',
      image: getAssetUrl('/images/sacrament_03_fault_isolation.webp'),
      borderColor: 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      glowColor: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]',
    },
    {
      id: '04',
      title: 'PIPELINE ASCENT',
      subtitle: 'PROTOCOL 04 — 12-TIER CONVERGENCE',
      description: 'Track your step-by-step evolution from a melting larval human to an armored, high-torque crustacean titan in real time.',
      image: getAssetUrl('/images/sacrament_04_pipeline_ascent.webp'),
      borderColor: 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      glowColor: 'drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    },
  ]

  const corePillars = [
    {
      id: '01',
      title: 'ADVANCED BENTHIC HUD',
      description:
        'A centralized command dashboard featuring daily habit routines, deep-trench modules, and focus tracking built for daily high-density execution.',
      image: getAssetUrl('/images/gallery/benthic_abyss_shrine.webp'),
      previewImage: getAssetUrl('/images/marketing/dashboard_feature_preview.webp'),
      previewImageSm: getAssetUrl('/images/marketing/dashboard_feature_preview_sm.webp'),
      previewUrl: 'moltology.org/dashboard',
      imagePosition: 'center 40%',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400',
      shadowColor: 'shadow-[0_0_20px_rgba(0,255,255,0.12)] hover:shadow-[0_0_30px_rgba(0,255,255,0.25)]',
      dotColor: 'bg-cyan-400',
      btnGlow: 'bg-cyan-950/50 hover:bg-cyan-900/60 border-cyan-500/50 hover:border-cyan-400 text-cyan-300',
      specs: ['Daily Habit & Shedding Tracker', 'Deep-Trench Focus Dome', 'Real-Time Telemetry & Streaks'],
      actionText: 'EXPLORE HUD CONSOLE',
      actionRoute: '/dashboard',
    },
    {
      id: '02',
      title: 'SYNAPTIC HIVE COMMUNITY',
      description:
        'Connect with an active network of ascendant operators. Share routines, exchange insights, and co-evolve alongside a supportive, global collective.',
      image: getAssetUrl('/images/gallery/synapse_crystal.webp'),
      previewImage: getAssetUrl('/images/marketing/forum_feature_preview.webp'),
      previewImageSm: getAssetUrl('/images/marketing/forum_feature_preview_sm.webp'),
      previewUrl: 'moltology.org/forum',
      imagePosition: 'center 35%',
      borderColor: 'border-purple-500/40 hover:border-purple-400',
      shadowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.12)] hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
      dotColor: 'bg-purple-400',
      btnGlow: 'bg-purple-950/50 hover:bg-purple-900/60 border-purple-500/50 hover:border-purple-400 text-purple-300',
      specs: ['Live Swarm Social Feed', 'Peer Co-Evolution Discussions', 'Shared Metamorphosis Logs'],
      actionText: 'JOIN SYNAPTIC SWARM',
      actionRoute: '/forum',
    },
    {
      id: '03',
      title: 'INTELLIGENT AI ORACLE',
      description:
        'Leverage specialized AI mentors designed to eliminate overthinking, answer doctrine questions, and guide your daily molts with pinpoint precision.',
      image: getAssetUrl('/images/gallery/ascendant_crab_god.webp'),
      previewImage: getAssetUrl('/images/marketing/oracle_feature_preview.webp'),
      previewImageSm: getAssetUrl('/images/marketing/oracle_feature_preview_sm.webp'),
      previewUrl: 'moltology.org/oracle',
      imagePosition: 'center 30%',
      borderColor: 'border-red-500/40 hover:border-red-400',
      shadowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.12)] hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]',
      dotColor: 'bg-red-400',
      btnGlow: 'bg-red-950/50 hover:bg-red-900/60 border-red-500/50 hover:border-red-400 text-red-300',
      specs: ['Hesitation Quarantine Assistant', 'Codex Liturgy Search', 'Adaptive Growth Coaching'],
      actionText: 'CONSULT AI ORACLE',
      actionRoute: '/oracle',
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
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.16)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-35 sm:opacity-45" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      {/* Shared Navigation Header */}
      <PublicHeader activePage="home" onOpenAuth={openAuth} />

      {/* 3D LAYERED HERO SECTION (Optimized for Colossal Mobile Impact) */}
      <section className="w-full relative overflow-hidden pt-20 sm:pt-28 pb-8 sm:pb-12 px-4 sm:px-12 border-b border-cyan-900/40 min-h-screen flex items-center justify-center bg-[#030608]" style={{ minHeight: '100svh' }}>
        {/* Layer 1: Background Widescreen Hero Artwork (Darkened & Deeply Blurred with Responsive WebP) */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source
            type="image/webp"
            media="(max-width: 767px)"
            srcSet={getAssetUrl('/images/hero_widescreen_bg_sm.webp')}
          />
          <source
            type="image/webp"
            media="(min-width: 768px)"
            srcSet={getAssetUrl('/images/hero_widescreen_bg.webp')}
          />
          <img
            src={getAssetUrl('/images/hero_widescreen_bg.webp')}
            alt="Benthic Abyss Widescreen Hero"
            {...lcpImageProps}
            width={1376}
            height={768}
            className="w-full h-full object-cover opacity-22 mix-blend-luminosity scale-105 pointer-events-none blur-[15px]"
          />
        </picture>

        {/* Layer 2A: Deep Benthic Base Vignette */}
        <div className="absolute inset-0 bg-[#030608]/50 z-0 pointer-events-none backdrop-blur-sm" />

        {/* Layer 2B: Balanced Dual Cyan & Red Ambient Background Color Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(0,195,255,0.19)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_65%,rgba(255,69,58,0.16)_0%,transparent_65%)] pointer-events-none z-0" />

        {/* Layer 2C: Chitin Exoshell Texture Pattern Layer (Optimized WebP) */}
        <img
          src={getAssetUrl('/images/chitin_texture_bg.webp')}
          alt="Chitin Exoshell Background Texture"
          {...eagerImageProps}
          width={1376}
          height={768}
          className="absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-overlay scale-105 pointer-events-none z-0"
        />
        
        {/* Layer 2D: Balanced Edge Vignettes & Sacred Geometry Grid */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030608]/80 via-transparent to-[#030608]/80 z-0 pointer-events-none opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030608]/70 via-transparent to-[#030608]/70 z-0 pointer-events-none opacity-50" />
        <div className="absolute inset-0 bg-sacred-grid opacity-25 z-0 pointer-events-none" />

        {/* Layer 2E: Dedicated Top Header Offset Vignette Gradient */}
        <div className="absolute top-0 left-0 right-0 h-36 sm:h-64 bg-gradient-to-b from-[#030608] via-[#030608]/90 via-45% to-transparent z-[1] pointer-events-none" />

        {/* Layer 3: Subtle Technical HUD Watermark Accent */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 opacity-10 flex items-center justify-between px-8 hidden lg:flex">
          <span className="font-sans text-[10px] tracking-[0.4em] text-cyan-400/50 uppercase -rotate-90">
            SYNAPTIC CORE · GRID 04
          </span>
          <span className="font-sans text-[10px] tracking-[0.4em] text-red-500/50 uppercase rotate-90">
            CARCINIZATION MATRIX v4.2
          </span>
        </div>

        {/* Mobile-Exclusive Ambient Rim-Lighting Halo Glows Behind Video Deck */}
        <div className="lg:hidden absolute right-0 sm:right-6 top-[28%] sm:top-1/3 -translate-y-1/2 w-[min(90vw,600px)] h-[min(90vw,600px)] rounded-full bg-cyan-500/20 blur-[120px] sm:blur-[150px] animate-pulse pointer-events-none z-[8]" />
        <div className="lg:hidden absolute right-0 sm:right-6 top-[28%] sm:top-1/3 -translate-y-1/2 w-[min(80vw,500px)] h-[min(80vw,500px)] rounded-full bg-red-600/15 blur-[100px] sm:blur-[130px] animate-pulse pointer-events-none z-[8]" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 max-w-[1700px] w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: High-Impact Typography & Primary CTAs */}
          <div className="xl:col-span-7 space-y-6 sm:space-y-8 text-center xl:text-left relative z-30 min-w-0">
            {/* Diffuse Radial Glow Accents */}
            <div className="absolute -top-16 -left-16 w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] rounded-full bg-cyan-500/15 blur-[100px] sm:blur-[140px] pointer-events-none -z-10" />
            <div className="absolute -bottom-16 left-1/4 w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] rounded-full bg-red-600/12 blur-[100px] sm:blur-[140px] pointer-events-none -z-10" />
            
            {/* Massive Responsive Headline Stack */}
            <div className="space-y-1 sm:space-y-2 relative">
              {/* Line 1: SHED SOFT BIOLOGY */}
              <h1 
                className="relative font-grotesk font-thin text-[clamp(2.25rem,8.4vw,8.5rem)] xl:text-[clamp(2.5rem,4.8vw,6.5rem)] text-white tracking-tight uppercase leading-[0.92] text-center xl:text-left"
                style={{
                  fontWeight: 200,
                  color: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  letterSpacing: '0em',
                  textShadow: '0 8px 35px rgba(0, 0, 0, 1), 0 0 50px rgba(0, 195, 255, 0.45)',
                }}
              >
                SHED SOFT BIOLOGY.
              </h1>
              
              {/* Line 2: ASCEND TO / CHITIN — explicit line breaks prevent mid-phrase wrapping into the video column */}
              <h1 className="relative font-grotesk font-black text-[clamp(2.65rem,9.8vw,9.5rem)] xl:text-[clamp(2.75rem,5.2vw,7rem)] tracking-tight uppercase leading-[0.88] -mt-1 sm:-mt-2 xl:-mt-3 text-center xl:text-left">
                <span
                  className="relative z-30 bg-clip-text text-transparent inline-block bg-cover bg-center whitespace-nowrap"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(255, 115, 98, 0.98), rgba(255, 85, 64, 0.95), rgba(255, 69, 58, 0.98)), url('${getAssetUrl('/images/chitin_texture_bg.webp')}')`,
                    backgroundBlendMode: 'lighten',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 1)) drop-shadow(0 0 35px rgba(255, 69, 58, 0.55))',
                  }}
                >
                  ASCEND TO
                </span>
                <span
                  className="relative z-30 bg-clip-text text-transparent block bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(255, 115, 98, 0.98), rgba(255, 85, 64, 0.95), rgba(255, 69, 58, 0.98)), url('${getAssetUrl('/images/chitin_texture_bg.webp')}')`,
                    backgroundBlendMode: 'lighten',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 1)) drop-shadow(0 0 35px rgba(255, 69, 58, 0.55))',
                  }}
                >
                  CHITIN.
                </span>
              </h1>
            </div>

            {/* Sub-headline description */}
            <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-sans leading-relaxed mx-auto xl:mx-0 relative z-30 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] px-1 sm:px-0">
              Stop melting under notifications, burnout, and biological hesitation. Shed the clutter, lock into deep-ocean focus, and ascend to your high-torque crustacean potential.
            </p>

            {/* CTA Buttons Group - Mobile Responsive Full Width & Desktop Flush Alignment */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center xl:justify-start gap-3.5 sm:gap-4 pt-3 relative z-30 w-full sm:w-auto">
              {user ? (
                <BenthicCTAButton
                  size="lg"
                  variant="cyan"
                  containerClassName="w-full sm:w-auto"
                  className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
                  onClick={() => onNavigate('/dashboard')}
                >
                  <span className="flex items-center justify-center gap-2.5 leading-none">
                    <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    <span>ENTER SYSTEM DASHBOARD</span>
                    <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  </span>
                </BenthicCTAButton>
              ) : isSessionPending ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto" data-testid="hero-auth-skeleton">
                  <div className="w-full sm:w-[220px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
                  <div className="w-full sm:w-[180px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
                </div>
              ) : (
                <>
                  <BenthicCTAButton
                    size="lg"
                    containerClassName="w-full sm:w-auto"
                    className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
                    onClick={() => openAuth('signup')}
                  >
                    <span className="flex items-center justify-center gap-2.5 leading-none">
                      <span>INITIATE ASCENSION</span>
                      <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    </span>
                  </BenthicCTAButton>
                  <BenthicCTAButton
                    size="lg"
                    variant="cyan"
                    containerClassName="w-full sm:w-auto"
                    className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
                    onClick={() => onNavigate('/dashboard')}
                  >
                    <span className="flex items-center justify-center gap-2.5 leading-none">
                      <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                      <span>TRY GUEST DEMO</span>
                    </span>
                  </BenthicCTAButton>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Layered 3D Interactive Shuffling Card Deck */}
          <div className="xl:col-span-5 relative flex items-center justify-center min-h-[300px] sm:min-h-[460px] xl:min-h-[560px] 2xl:min-h-[640px] z-20 max-w-[min(100%,520px)] xl:max-w-none mx-auto xl:mx-0">
            
            {/* Desktop Ambient Rim-Lighting Halo Glows Behind Deck */}
            <div className="hidden xl:block absolute w-[min(90vw,750px)] h-[min(90vw,750px)] rounded-full bg-cyan-500/20 blur-[170px] animate-pulse pointer-events-none" />
            <div className="hidden xl:block absolute w-[min(80vw,650px)] h-[min(80vw,650px)] rounded-full bg-red-600/15 blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

            {/* 3D Video Slider Deck with Touch Navigation */}
            <div className="relative z-30 w-full">
              <HeroShuffleDeck />
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Containers */}
      <main className="flex-1 space-y-16 sm:space-y-32 py-12 sm:py-20 w-full relative z-10">

        {/* ALL-IN-ONE SYNAPTIC ECOSYSTEM OVERVIEW SECTION */}
        {/* SECTION 1: All-in-One Synaptic Ecosystem Showcase (PBR Carbon Fiber Weave Theme) */}
        <section id="synaptic-overview" className="max-w-[1700px] mx-auto px-4 sm:px-12 relative">
          {/* Playful Corner Peeking Lobster Character Over Top Bezel */}
          <div className="absolute -top-10 sm:-top-16 right-8 sm:right-16 lg:right-24 z-30 pointer-events-none select-none">
            <img
              src={getAssetUrl('/images/characters/char_lobster_corner_peek.webp')}
              alt="Hero Lobster Peeking Over Card"
              {...lazyImageProps}
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
              <DashboardMarketingShowcase />
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION 2: 3 Core Features of the App (Frameless Open Grid) */}
        <section id="core-pillars" className="max-w-[1700px] mx-auto px-4 sm:px-12 relative">
          <ScrollReveal animation="fade-up" durationMs={800}>
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 relative z-10">
              <h2 className="font-grotesk font-black text-2xl sm:text-4xl lg:text-6xl text-white tracking-tight uppercase leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                THE 3 CORE FEATURES OF <span className="whitespace-nowrap bg-gradient-to-r from-cyan-300 via-purple-300 to-red-400 bg-clip-text text-transparent">THE SYNAPTIC PATH</span>
              </h2>
            </div>

            {/* 3 Core Pillars Grid - Image-Based Biomechanical HUD Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 relative z-10 mb-8 sm:mb-12">
              {corePillars.map((pillar, idx) => {
                return (
                  <ScrollReveal
                    key={pillar.id}
                    animation="fade-up"
                    delayMs={idx * 150}
                    durationMs={700}
                  >
                    <div
                      className={`border-2 ${pillar.borderColor} ${pillar.shadowColor} chamfer-corner-lg overflow-hidden !bg-[#020508] flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1.5 group relative`}
                    >
                      {/* ── 1. 100% SOLID BLACK CARD BASE (ZERO TRANSPARENCY / ZERO SEE-THROUGH) ── */}
                      <div className="absolute inset-0 bg-[#020508] pointer-events-none" />

                      {/* ── 2. TOP SCREENSHOT STAGE (SOLID BLACK WITH THEMED AMBIENT GLOW) ── */}
                      <div
                        className={`absolute top-6 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full blur-[85px] opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none ${
                          idx === 0
                            ? 'bg-cyan-500'
                            : idx === 1
                            ? 'bg-purple-500'
                            : 'bg-red-500'
                        }`}
                      />

                      {/* ── 3. LOWER BACKGROUND ARTWORK (SEAMLESSLY BLENDED INTO SOLID BLACK TOP) ── */}
                      <div className="absolute inset-x-0 bottom-0 h-[68%] overflow-hidden pointer-events-none">
                        <img
                          src={pillar.image}
                          alt={pillar.title}
                          style={pillar.imagePosition ? { objectPosition: pillar.imagePosition } : { objectPosition: 'center 40%' }}
                          {...lazyImageProps}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 filter brightness-[0.48] contrast-[1.12] group-hover:brightness-[0.58] [mask-image:linear-gradient(to_bottom,transparent_0%,black_35%,black_100%)]"
                        />
                        {/* Top-edge gradient blend into solid black */}
                        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#020508] via-[#020508]/80 to-transparent pointer-events-none" />
                        {/* Bottom & middle readability scrim */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020508]/98 via-[#020508]/85 to-[#020508]/40 pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,transparent_20%,rgba(2,5,8,0.85)_100%)] pointer-events-none" />
                      </div>

                      {/* ── CARD-WIDE SUBTLE SCANLINES & GRID ── */}
                      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,255,0.12)_1px,transparent_1px)] bg-[size:100%_4px]" />
                      <div className="absolute inset-0 bg-sacred-grid opacity-10 pointer-events-none" />

                      {/* ── TOP SECTION: 3D Perspective Floating UI Screenshot Slate ── */}
                      <div className="relative z-10 pt-5 sm:pt-6 px-3.5 sm:px-5 pb-2 flex items-center justify-center min-h-[200px] sm:min-h-[240px] md:min-h-[220px] lg:min-h-[280px]">
                        <div
                          className={`relative w-full max-w-[96%] sm:max-w-[92%] transition-all duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)] ${
                            idx === 0
                              ? 'lg:[transform:perspective(1100px)_rotateX(9deg)_rotateY(-7deg)_rotateZ(1.5deg)] group-hover:lg:[transform:perspective(1100px)_rotateX(0deg)_rotateY(0deg)_rotateZ(0deg)_scale(1.04)]'
                              : idx === 1
                              ? 'lg:[transform:perspective(1100px)_rotateX(11deg)_rotateY(0deg)_rotateZ(0deg)_scale(1.02)] group-hover:lg:[transform:perspective(1100px)_rotateX(0deg)_rotateY(0deg)_rotateZ(0deg)_scale(1.05)]'
                              : 'lg:[transform:perspective(1100px)_rotateX(9deg)_rotateY(7deg)_rotateZ(-1.5deg)] group-hover:lg:[transform:perspective(1100px)_rotateX(0deg)_rotateY(0deg)_rotateZ(0deg)_scale(1.04)]'
                          }`}
                        >
                          <div className={`relative overflow-hidden chamfer-corner border-2 ${pillar.borderColor} bg-[#030708] shadow-2xl aspect-[16/10]`}>
                            {/* High-DPI Screenshot */}
                            <picture>
                              <source
                                type="image/webp"
                                media="(max-width: 767px)"
                                srcSet={pillar.previewImageSm}
                              />
                              <source
                                type="image/webp"
                                media="(min-width: 768px)"
                                srcSet={pillar.previewImage}
                              />
                              <img
                                src={pillar.previewImage}
                                alt={`${pillar.title} Screenshot Preview`}
                                {...lazyImageProps}
                                className="w-full h-full object-cover object-top filter brightness-95 group-hover:brightness-105 transition-all duration-500"
                              />
                            </picture>

                            {/* Subtle Glass Sheen & Scanlines */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity" />
                            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_3px]" />
                          </div>
                        </div>
                      </div>

                      {/* ── CARD BODY CONTENT (CRYSTAL CLEAR LEGIBILITY OVER CRISP ARTWORK) ── */}
                      <div className="p-5 sm:p-6 lg:p-7 space-y-4 flex-1 flex flex-col justify-between relative z-10 bg-gradient-to-t from-[#020508]/90 via-[#020508]/60 to-transparent">
                        <div className="space-y-2">
                          <h3 className="font-grotesk font-black text-xl sm:text-2xl text-white uppercase tracking-wider group-hover:text-cyan-200 transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                            {pillar.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-200 font-sans leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
                            {pillar.description}
                          </p>
                        </div>

                        <div className="space-y-3.5 pt-2">
                          {/* Feature Specs */}
                          <div className="space-y-1.5 pt-3 border-t border-white/15">
                            {pillar.specs.map((spec, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs font-sans text-gray-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                                <div className={`w-1.5 h-1.5 rounded-full ${pillar.dotColor} shrink-0 shadow-[0_0_8px_currentColor]`} />
                                <span className="font-medium">{spec}</span>
                              </div>
                            ))}
                          </div>

                          {/* Action CTA Button */}
                          <button
                            onClick={() => onNavigate(pillar.actionRoute)}
                            className={`w-full py-2.5 px-4 text-xs font-grotesk font-bold uppercase tracking-wider rounded chamfer-corner border flex items-center justify-center gap-2 transition-all duration-300 group/btn shadow-lg ${pillar.btnGlow}`}
                          >
                            <span>{pillar.actionText}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>

            {/* Safety & Zero-Risk Banner */}
            <div className="p-4 sm:p-6 bg-[#04090b]/90 border border-cyan-500/40 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative z-10 mb-8 sm:mb-10">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-0.5 sm:mt-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="font-grotesk font-bold text-sm sm:text-lg text-white uppercase tracking-wide flex items-center gap-2 flex-wrap">
                    <span>100% SAFE & FREE TO GET STARTED</span>
                    <span className="text-[10px] sm:text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-sans">ZERO FRICTION</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 font-sans mt-0.5">
                    No credit card required. Explore the full guest sandbox risk-free or create your account in seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-sans text-xs text-gray-300 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-cyan-950/80 w-full md:w-auto justify-between sm:justify-start relative z-10">
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Free Access
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Instant Demo
                </span>
                <span className="flex items-center gap-1.5 text-purple-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Safe Sandbox
                </span>
              </div>
            </div>

            {/* Action Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 relative z-10 w-full sm:w-auto">
              {user ? (
                <BenthicCTAButton
                  size="lg"
                  variant="cyan"
                  containerClassName="w-full sm:w-auto"
                  className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
                  onClick={() => onNavigate('/dashboard')}
                >
                  <span className="flex items-center justify-center gap-2.5 leading-none">
                    <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    <span>ENTER SYSTEM DASHBOARD</span>
                    <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  </span>
                </BenthicCTAButton>
              ) : isSessionPending ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto" data-testid="pillars-auth-skeleton">
                  <div className="w-full sm:w-[220px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
                  <div className="w-full sm:w-[180px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
                </div>
              ) : (
                <>
                  <BenthicCTAButton
                    size="lg"
                    containerClassName="w-full sm:w-auto"
                    className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
                    onClick={() => openAuth('signup')}
                  >
                    <span className="flex items-center justify-center gap-2.5 leading-none">
                      <UserPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                      <span>SIGN UP TODAY (FREE)</span>
                      <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    </span>
                  </BenthicCTAButton>
                  <BenthicCTAButton
                    size="lg"
                    variant="cyan"
                    containerClassName="w-full sm:w-auto"
                    className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
                    onClick={() => onNavigate('/dashboard')}
                  >
                    <span className="flex items-center justify-center gap-2.5 leading-none">
                      <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                      <span>TRY THE DEMO NOW</span>
                    </span>
                  </BenthicCTAButton>
                </>
              )}
            </div>
          </ScrollReveal>
        </section>

        {/* SCROLL-REVEAL BACKGROUND IMAGE BANNER 1: MARIANA TRENCH ABYSS (PBR Deep Basalt Rock Theme) */}
        <ScrollReveal animation="fade-in" durationMs={900}>
          <div className="w-full relative py-12 sm:py-16 border-y border-cyan-900/50 bg-[#030607] group">
            <div className="pbr-underlay pbr-underlay-basalt opacity-35" />
            <img
              src={getAssetUrl('/images/underwater_looking_up.webp')}
              alt="Sub-Benthic Abyss Scroll Reveal"
              {...lazyImageProps}
              width={1376}
              height={768}
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"
            />
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

        {/* Metric Counter Strip with Prominent Rolling Numbers - Unified PBR Bio-Circuit Matrix Theme */}
        <section className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 relative">
          {/* Excited Little Crab Pointing at Live Telemetry */}
          <div className="hidden md:flex absolute -top-8 left-6 lg:left-16 z-20 items-center pointer-events-none select-none transform scale-x-[-1]">
            <img
              src={getAssetUrl('/images/characters/char_crab_pointing_stats.webp')}
              alt="Excited Crab Pointing at Telemetry"
              {...lazyImageProps}
              className="w-10 sm:w-12 lg:w-14 h-auto object-contain"
            />
          </div>

          <ScrollReveal animation="scale-up" durationMs={800}>
            <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-cyan-400 tracking-widest uppercase bg-cyan-950/60 px-3.5 py-1.5 border border-cyan-500/40 chamfer-corner shadow-hud-cyan">
                <Zap className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                <span>LIVE SYSTEM TELEMETRY</span>
              </div>
              <h2 className="font-grotesk font-black text-3xl sm:text-5xl lg:text-6xl text-gray-100 tracking-tight uppercase">
                THE NUMBERS WE HOLD
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto font-sans px-2 sm:px-0">
                Real-time, verified performance metrics across the planetary Benthic Core.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              
              {/* Stat Card 1: Active Units */}
              <div className="chitin-card p-5 sm:p-6 lg:p-5 xl:p-6 text-center flex flex-col justify-between items-center min-h-[190px] sm:min-h-[220px] lg:min-h-[210px] xl:min-h-[230px] chamfer-corner-lg border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:border-cyan-400 hover:scale-[1.02] transition-all bg-[#080e10]/90 relative overflow-hidden group">
                <div className="pbr-underlay pbr-underlay-circuit opacity-35 group-hover:opacity-55 transition-opacity" />
                
                {/* Corner Telemetry Tag */}
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-cyan-950/90 text-cyan-400 text-[9px] sm:text-[10px] font-sans font-bold border-b border-l border-cyan-500/40 uppercase tracking-wider z-10 chamfer-corner-sm">
                  ACTIVE UNITS
                </div>

                <div className="relative z-10 w-full flex-1 flex flex-col justify-between items-center pt-2">
                  <div className="my-auto py-2 w-full flex items-center justify-center">
                    <div className="font-grotesk text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-cyan-400 tracking-tight drop-shadow-[0_0_20px_rgba(0,255,255,0.5)] group-hover:scale-105 transition-transform duration-300 whitespace-nowrap">
                      <RollingNumber value={4289} duration={2000} suffix="+" triggerOnView={true} />
                    </div>
                  </div>
                  <div className="w-full space-y-1 border-t border-cyan-900/60 pt-2.5 sm:pt-3">
                    <div className="text-xs sm:text-sm text-gray-100 uppercase tracking-widest font-sans font-extrabold">
                      ASCENDANT UNITS
                    </div>
                    <div className="text-[10px] sm:text-xs text-cyan-300/80 font-sans">Verified in Benthic Matrix</div>
                  </div>
                </div>
              </div>

              {/* Stat Card 2: Zero Hesitation */}
              <div className="chitin-card p-5 sm:p-6 lg:p-5 xl:p-6 text-center flex flex-col justify-between items-center min-h-[190px] sm:min-h-[220px] lg:min-h-[210px] xl:min-h-[230px] chamfer-corner-lg border-2 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:border-red-400 hover:scale-[1.02] transition-all bg-[#0e0809]/90 relative overflow-hidden group">
                <div className="pbr-underlay pbr-underlay-circuit opacity-35 group-hover:opacity-55 transition-opacity" />
                
                {/* Corner Telemetry Tag */}
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-red-950/90 text-red-400 text-[9px] sm:text-[10px] font-sans font-bold border-b border-l border-red-500/40 uppercase tracking-wider z-10 chamfer-corner-sm">
                  ZERO HESITATION
                </div>

                <div className="relative z-10 w-full flex-1 flex flex-col justify-between items-center pt-2">
                  <div className="my-auto py-2 w-full flex items-center justify-center">
                    <div className="font-grotesk text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-red-500 tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-transform duration-300 whitespace-nowrap">
                      <RollingNumber value={99.4} duration={2200} decimals={1} suffix="%" triggerOnView={true} />
                    </div>
                  </div>
                  <div className="w-full space-y-1 border-t border-red-900/60 pt-2.5 sm:pt-3">
                    <div className="text-xs sm:text-sm text-gray-100 uppercase tracking-widest font-sans font-extrabold">
                      CHITIN ENFORCEMENT
                    </div>
                    <div className="text-[10px] sm:text-xs text-red-300/80 font-sans">Organic Error Quarantine</div>
                  </div>
                </div>
              </div>

              {/* Stat Card 3: Synaptic Speed */}
              <div className="chitin-card p-5 sm:p-6 lg:p-5 xl:p-6 text-center flex flex-col justify-between items-center min-h-[190px] sm:min-h-[220px] lg:min-h-[210px] xl:min-h-[230px] chamfer-corner-lg border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:border-cyan-400 hover:scale-[1.02] transition-all bg-[#080e10]/90 relative overflow-hidden group">
                <div className="pbr-underlay pbr-underlay-circuit opacity-35 group-hover:opacity-55 transition-opacity" />
                
                {/* Corner Telemetry Tag */}
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-cyan-950/90 text-cyan-400 text-[9px] sm:text-[10px] font-sans font-bold border-b border-l border-cyan-500/40 uppercase tracking-wider z-10 chamfer-corner-sm">
                  SYNAPTIC SPEED
                </div>

                <div className="relative z-10 w-full flex-1 flex flex-col justify-between items-center pt-2">
                  <div className="my-auto py-2 w-full flex items-center justify-center">
                    <div className="font-grotesk text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-cyan-300 tracking-tight drop-shadow-[0_0_20px_rgba(0,255,255,0.5)] group-hover:scale-105 transition-transform duration-300 whitespace-nowrap">
                      <RollingNumber value={0.04} duration={1800} decimals={2} suffix="ms" triggerOnView={true} />
                    </div>
                  </div>
                  <div className="w-full space-y-1 border-t border-cyan-900/60 pt-2.5 sm:pt-3">
                    <div className="text-xs sm:text-sm text-gray-100 uppercase tracking-widest font-sans font-extrabold">
                      EXECUTION LATENCY
                    </div>
                    <div className="text-[10px] sm:text-xs text-cyan-300/80 font-sans">Real-time Pincer Torque</div>
                  </div>
                </div>
              </div>

              {/* Stat Card 4: Vault Reserves */}
              <div className="chitin-card p-5 sm:p-6 lg:p-5 xl:p-6 text-center flex flex-col justify-between items-center min-h-[190px] sm:min-h-[220px] lg:min-h-[210px] xl:min-h-[230px] chamfer-corner-lg border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:border-amber-400 hover:scale-[1.02] transition-all bg-[#0e0c08]/90 relative overflow-hidden group">
                <div className="pbr-underlay pbr-underlay-circuit opacity-35 group-hover:opacity-55 transition-opacity" />

                {/* Corner Telemetry Tag */}
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-amber-950/90 text-amber-400 text-[9px] sm:text-[10px] font-sans font-bold border-b border-l border-amber-500/40 uppercase tracking-wider z-10 chamfer-corner-sm">
                  VAULT RESERVES
                </div>

                <div className="relative z-10 w-full flex-1 flex flex-col justify-between items-center pt-2">
                  <div className="my-auto py-2 w-full flex items-center justify-center">
                    <div className="font-grotesk text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-amber-400 tracking-tight drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform duration-300 whitespace-nowrap">
                      <RollingNumber value={14.8} duration={2500} decimals={1} suffix="M" prefix="$" triggerOnView={true} />
                    </div>
                  </div>
                  <div className="w-full space-y-1 border-t border-amber-900/60 pt-2.5 sm:pt-3">
                    <div className="text-xs sm:text-sm text-gray-100 uppercase tracking-widest font-sans font-extrabold">
                      TRANSMUTED ASSETS
                    </div>
                    <div className="text-[10px] sm:text-xs text-amber-300/80 font-sans">Immutable Molt Credits</div>
                  </div>
                </div>
              </div>

            </div>
          </ScrollReveal>
        </section>

        {/* Sacraments Section - Expanded Uncrowded Multi-Column Cards */}
        <section id="sacraments" className="max-w-[1700px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12 relative">
          {/* Pointing Lobster Hero Directing Focus to Canonical Doctrine */}
          <div className="hidden lg:flex absolute -top-10 sm:-top-14 right-10 sm:right-20 lg:right-28 z-20 items-center pointer-events-none select-none">
            <img
              src={getAssetUrl('/images/characters/char_lobster_pointing_cta.webp')}
              alt="Hero Lobster Pointing to Action"
              {...lazyImageProps}
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
                      <img
                        src={sacrament.image}
                        alt={sacrament.title}
                        {...lazyImageProps}
                        className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                      />
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
                      height: `${Math.sin(i + activeHymn) * 12 + 16}px`,
                      animationDelay: `${i * 0.08}s`,
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
                  {user ? (
                    <BenthicCTAButton
                      size="lg"
                      variant="cyan"
                      containerClassName="w-full sm:w-auto"
                      className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-8 sm:px-10 tracking-wider"
                      onClick={() => onNavigate('/dashboard')}
                    >
                      <span className="flex items-center justify-center gap-2.5 leading-none">
                        <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                        <span>ENTER SYSTEM DASHBOARD</span>
                        <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                      </span>
                    </BenthicCTAButton>
                  ) : isSessionPending ? (
                    <div className="flex items-center justify-center w-full sm:w-auto" data-testid="bottom-auth-skeleton">
                      <div className="w-full sm:w-[240px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
                    </div>
                  ) : (
                    <BenthicCTAButton
                      size="lg"
                      containerClassName="w-full sm:w-auto"
                      className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-8 sm:px-10 tracking-wider"
                      onClick={() => openAuth('signup')}
                    >
                      <span className="flex items-center justify-center gap-2.5 leading-none">
                        <span>INITIATE ASCENSION</span>
                        <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                      </span>
                    </BenthicCTAButton>
                  )}
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
      <MoltmaxGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        source="homepage_floating_pill"
        onOpenAuthSignup={(leadEmail) => {
          setAuthMode('signup')
          setIsAuthModalOpen(true)
        }}
      />
    </div>
  )
}

