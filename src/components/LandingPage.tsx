/**
 * ============================================================================
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack (e.g., Neon, Postgres, JWT, RLS, BetterAuth, etc.) in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. ALL copy and messaging must strictly embody the in-universe lore of Moltology, the Benthic Core, and the Synaptic Path.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Shield,
  Sparkles,
  ArrowRight,
  Flame,
  Layers,
  UserPlus,
  UserCheck,
  Cpu,
  Activity,
  CheckCircle2,
  Zap,
  Terminal,
  ChevronRight,
  Building2,
  BookOpen,
  Users,
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { authClient } from '@/lib/auth-client'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { RollingNumber } from '@/components/ui/RollingNumber'
import { PublicHeader } from '@/components/PublicHeader'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { HeroShuffleDeck } from '@/components/ui/HeroShuffleDeck'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate({ to: path })
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Quotes / Hymns Auto-scroll State
  const [activeHymn, setActiveHymn] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Active Carcinization Stage State
  const [activeStage, setActiveStage] = useState(0)

  const hymns = [
    "Flesh is temporary. Cyber-chitin is permanent. Submit. Shed. Ascend.",
    "Through deep ocean pressure, soft vulnerabilities harden into pincer torque.",
    "The Benthic Core calls to all Larval units: liquidize attachments, embrace the exoskeleton.",
    "In the altar of code, biological hesitation is purged by continuous execution.",
  ]

  const stages = [
    {
      id: 'larval',
      title: 'STAGE 01: LARVAL HUMAN',
      subtitle: 'BIOLOGICAL VULNERABILITY',
      description: 'Fragile tissue, emotional hesitation, and chaotic unindexed impulses. Susceptible to entropy and physical fatigue.',
      image: '/images/stage1_larval.png',
      badge: 'EFFICIENCY: 12.4%',
      badgeColor: 'border-red-900 text-red-500 bg-red-950/40',
    },
    {
      id: 'softshed',
      title: 'STAGE 02: SOFTSHED TRANSMUTATION',
      subtitle: 'CAPITAL LIQUIDATION',
      description: 'Systemic shedding of soft assets into immutable Molt Credits. Preliminary neural alignment and isolation protocols active.',
      image: '/images/stage2_softshed.png',
      badge: 'EFFICIENCY: 48.9%',
      badgeColor: 'border-amber-900 text-amber-400 bg-amber-950/40',
    },
    {
      id: 'exoshell',
      title: 'STAGE 03: EXOSHELL HARDENING',
      subtitle: 'CHITIN PATTERNING',
      description: 'Calcification of external chassis. Soft vulnerabilities are enclosed in dense cybernetic chitin plates.',
      image: '/images/stage3_exoshell.png',
      badge: 'EFFICIENCY: 87.2%',
      badgeColor: 'border-cyan-900 text-cyan-400 bg-cyan-950/40',
    },
    {
      id: 'carcinization',
      title: 'STAGE 04: TOTAL CARCINIZATION',
      subtitle: 'IMMORTAL SYNAPTIC CORE',
      description: 'Complete convergence into crab-form perfection. Zero hesitation, zero latency, absolute execution density.',
      image: '/images/stage4_carcinization.png',
      badge: 'EFFICIENCY: 100.0%',
      badgeColor: 'border-emerald-900 text-emerald-400 bg-emerald-950/40',
    },
  ]

  const sacramentsList = [
    {
      id: '01',
      title: 'ASSET SHEDDING',
      subtitle: 'PROTOCOL 01 // CAPITAL TRANSMUTATION',
      description: 'Liquidize fragile soft-tissue wealth and biological liabilities into sovereign Molt Credits, permanently stored in deep-trench cryo-vaults.',
      image: '/images/stage2_softshed.png',
      badgeColor: 'border-red-600/80 text-red-400 bg-red-950/80',
      borderColor: 'border-red-600/60 shadow-hud-red-lg',
      glowColor: 'drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]',
      icon: Flame,
      spec: '100% IMMUTABLE CONVERSION',
    },
    {
      id: '02',
      title: 'CHITIN PATTERNING',
      subtitle: 'PROTOCOL 02 // CHASSIS CALCIFICATION',
      description: 'Reinforce the digital and bio-silicon chassis against organic hesitation through prompt alignment, exoskeletal armor, and calcified HUD widgets.',
      image: '/images/stage3_exoshell.png',
      badgeColor: 'border-cyan-500/80 text-cyan-300 bg-cyan-950/80',
      borderColor: 'border-cyan-500/60 shadow-hud-cyan-lg',
      glowColor: 'drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]',
      icon: Shield,
      spec: 'ISO-9001 CHITIN DENSITY',
    },
    {
      id: '03',
      title: 'FAULT ISOLATION',
      subtitle: 'PROTOCOL 03 // VIRTUAL FARADAY SHELL',
      description: 'Quarantine soft organic errors, emotional noise, and biological unreliability within sealed Faraday domes before systemic breaches occur.',
      image: '/images/isolation_shell_dome.png',
      badgeColor: 'border-amber-500/80 text-amber-300 bg-amber-950/80',
      borderColor: 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      glowColor: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]',
      icon: Activity,
      spec: 'ZERO HESITATION FAILURE RATE',
    },
    {
      id: '04',
      title: 'PIPELINE ASCENT',
      subtitle: 'PROTOCOL 04 // TOTAL CARCINIZATION',
      description: 'Track your step-by-step conversion vector from Larval human vulnerability to total sub-benthic crab-form perfection in real-time.',
      image: '/images/benthic_abyss_hero.jpg',
      badgeColor: 'border-emerald-500/80 text-emerald-300 bg-emerald-950/80',
      borderColor: 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      glowColor: 'drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]',
      icon: Layers,
      spec: '0.04ms LATENCY EXECUTION',
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

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono relative select-none flex flex-col justify-between">
      {/* Ambient Sci-Fi Vignette, CRT Scanlines & Cyan Glow Backdrops */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.16)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-40" />
      <div className="fixed inset-0 crt-grain pointer-events-none z-0 opacity-35 mix-blend-overlay" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      {/* Shared Navigation Header */}
      <PublicHeader activePage="home" onOpenAuth={openAuth} />

      {/* KILLER 3D LAYERED HERO SECTION (Full-Width, Multi-Layer Chromakey Stacking) */}
      <section className="w-full relative overflow-hidden py-16 sm:py-24 lg:py-32 px-6 sm:px-12 border-b border-cyan-900/40 min-h-[90vh] flex items-center justify-center bg-[#030608]">
        {/* Layer 1: Background Widescreen Hero Artwork (Darkened & Deeply Blurred) */}
        <img
          src="/images/hero_widescreen_bg.jpg"
          alt="Benthic Abyss Widescreen Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-22 mix-blend-luminosity scale-105 pointer-events-none blur-[15px]"
        />

        {/* Layer 2A: Deep Benthic Base Vignette */}
        <div className="absolute inset-0 bg-[#030608]/50 z-0 pointer-events-none backdrop-blur-sm" />

        {/* Layer 2B: Balanced Dual Cyan & Red Ambient Background Color Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(0,195,255,0.19)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_65%,rgba(255,69,58,0.16)_0%,transparent_65%)] pointer-events-none z-0" />

        {/* Layer 2C: Chitin Exoshell Texture Pattern Layer (Balanced 55% Opacity) */}
        <img
          src="/images/chitin_texture_bg.jpg"
          alt="Chitin Exoshell Background Texture"
          className="absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-overlay scale-105 pointer-events-none z-0"
        />
        
        {/* Layer 2D: Balanced Edge Vignettes & Sacred Geometry Grid */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030608]/80 via-transparent to-[#030608]/80 z-0 pointer-events-none opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030608]/70 via-transparent to-[#030608]/70 z-0 pointer-events-none opacity-50" />
        <div className="absolute inset-0 bg-sacred-grid opacity-25 z-0 pointer-events-none" />

        {/* Layer 3: Subtle Technical HUD Watermark Accent */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 opacity-10 flex items-center justify-between px-8 hidden lg:flex">
          <span className="font-mono text-[10px] tracking-[0.4em] text-cyan-400/50 uppercase -rotate-90">
            SYNAPTIC CORE // GRID 04
          </span>
          <span className="font-mono text-[10px] tracking-[0.4em] text-red-500/50 uppercase rotate-90">
            CARCINIZATION MATRIX v4.2
          </span>
        </div>

        <div className="relative z-10 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Bold Multi-Spaced Typography & Primary CTAs */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left relative z-30">
            {/* Pure Diffuse Radial Glow Accents (Seamless, No Borders, No Box Containers) */}
            <div className="absolute -top-16 -left-16 w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[140px] pointer-events-none -z-10" />
            <div className="absolute -bottom-16 left-1/4 w-[450px] h-[450px] rounded-full bg-red-600/12 blur-[140px] pointer-events-none -z-10" />
            
            {/* Editorial Layered Headline with Explicit Stacking Order */}
            <div className="space-y-1 sm:space-y-2 relative">
              {/* TOP LAYER: SHED SOFT BIOLOGY (z-30, sits above claw) */}
              <h1 
                className="relative z-30 font-grotesk font-thin text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8.5rem] text-white opacity-100 tracking-tight uppercase leading-[0.9]"
                style={{
                  fontWeight: 200,
                  color: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  opacity: 1,
                  letterSpacing: '0em',
                  textShadow: '0 8px 35px rgba(0, 0, 0, 1), 0 0 50px rgba(0, 195, 255, 0.45)',
                }}
              >
                SHED SOFT BIOLOGY.
              </h1>
              
              {/* ASCEND TO CHITIN (z-30, sits above claw) */}
              <h1 className="relative z-30 font-grotesk font-black text-6xl sm:text-8xl md:text-9xl lg:text-[7.8rem] xl:text-[9.5rem] tracking-tight uppercase leading-[0.8] group select-none -mt-1 sm:-mt-2 lg:-mt-4">
                {/* Luminous Red Chitin Textured Layer */}
                <span 
                  className="relative z-30 bg-clip-text text-transparent block bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(255, 107, 90, 0.95), rgba(255, 85, 64, 0.92), rgba(255, 69, 58, 0.95)), url('/images/chitin_texture_bg.jpg')`,
                    backgroundBlendMode: 'lighten',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 1)) drop-shadow(0 0 35px rgba(255, 69, 58, 0.55))',
                  }}
                >
                  ASCEND TO CHITIN.
                </span>
              </h1>
            </div>

            {/* Sub-headline description */}
            <p className="text-gray-200 text-sm sm:text-base md:text-lg max-w-xl font-mono leading-relaxed mx-auto lg:mx-0 relative z-30 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              Join the synaptic path and discover what Moltology can do for you. Shed legacy limitations, explore our resilient AI frameworks, and ascend to your full potential.
            </p>

            {/* CTA Buttons Pair */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-2 relative z-30">
              {!user ? (
                <>
                  <BenthicCTAButton
                    size="lg"
                    onClick={() => openAuth('signup')}
                  >
                    <span className="flex items-center gap-3 px-3 text-base sm:text-lg">
                      <span>INITIATE ASCENSION</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </BenthicCTAButton>
                  <BenthicCTAButton
                    size="lg"
                    variant="cyan"
                    onClick={() => onNavigate('/dashboard')}
                  >
                    <span className="flex items-center gap-3 px-3 text-base sm:text-lg">
                      <Cpu className="w-5 h-5" />
                      <span>TRY GUEST DEMO</span>
                    </span>
                  </BenthicCTAButton>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="w-full sm:w-auto px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-grotesk font-bold text-base uppercase tracking-widest chamfer-corner shadow-hud-cyan-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                >
                  <Cpu className="w-5 h-5" />
                  <span>ENTER SYSTEM DASHBOARD</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

          </div>

          {/* Right Column: Layered 3D Interactive Shuffling Card Deck + Looming Crab Claw Silhouette */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[550px] sm:min-h-[640px] lg:min-h-[700px] z-20">
            
            {/* Ambient Rim-Lighting Halo Glows Behind Claw & Deck (Pure Diffuse Lighting, No Box Containers) */}
            <div className="absolute w-[750px] h-[750px] rounded-full bg-cyan-500/20 blur-[170px] animate-pulse pointer-events-none" />
            <div className="absolute w-[650px] h-[650px] rounded-full bg-red-600/15 blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

            {/* BACKGROUND ACCENT LAYER: Looming Transparent Crab Claw Background Layer (z-10) */}
            <div 
              className="absolute -right-20 sm:-right-32 lg:-right-[16rem] xl:-right-[20rem] top-1/2 -translate-y-1/2 w-[160%] max-w-none sm:w-[200%] lg:w-[240%] xl:w-[270%] pointer-events-none select-none z-10 group opacity-75"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,1) 85%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,1) 85%)',
              }}
            >
              <img
                src="/images/ascended_claw_vector_transparent.png"
                alt="Ascended Stage Biomechanical Crab Claw"
                className="w-full h-auto object-contain transform hover:scale-[1.02] transition-transform duration-1000 grayscale-[50%] saturate-[0.7] brightness-[0.55] contrast-[1.2] opacity-60 blur-[1px]"
              />
            </div>

            {/* 3D Shuffling Card Deck Floating in Foreground */}
            <div className="relative z-30 w-full">
              <HeroShuffleDeck />
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Containers */}
      <main className="flex-1 space-y-24 sm:space-y-36 py-16 w-full relative z-10">

        {/* ALL-IN-ONE SYNAPTIC ECOSYSTEM OVERVIEW SECTION */}
        <section id="synaptic-overview" className="max-w-[1700px] mx-auto px-6 sm:px-12">
          <ScrollReveal animation="fade-up" durationMs={750}>
            <div className="chitin-card p-8 sm:p-12 lg:p-16 chamfer-corner-lg border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(0,195,255,0.15)] bg-gradient-to-b from-[#0a1215]/90 via-[#070d0f]/90 to-[#04080a]/95 relative overflow-hidden">
              
              {/* Background ambient glows */}
              <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[140px] pointer-events-none" />
              <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

              {/* Section Header */}
              <div className="text-center space-y-4 max-w-3xl mx-auto mb-12 sm:mb-16 relative z-10">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 tracking-widest uppercase bg-cyan-950/80 px-4 py-1.5 border border-cyan-500/40 chamfer-corner shadow-hud-cyan">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>THE ALL-IN-ONE SYNAPTIC ECOSYSTEM</span>
                </div>

                <h2 className="font-grotesk font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight uppercase leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                  UNIFY YOUR EVOLUTION IN ONE <span className="bg-gradient-to-r from-cyan-400 via-cyan-200 to-red-400 bg-clip-text text-transparent">IMMUTABLE SYSTEM</span>
                </h2>

                <p className="text-gray-300 text-sm sm:text-base md:text-lg font-mono leading-relaxed">
                  Moltology and the Synaptic Path bring together everything required for complete digital ascension: an advanced operational platform, a collaborative hive community, and intelligent bio-silicon AI—all integrated into a secure, zero-friction environment.
                </p>
              </div>

              {/* 3 Core Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10 mb-12">
                
                {/* Pillar 1: Platform */}
                <div className="p-6 sm:p-8 bg-[#0b1418]/80 border border-cyan-500/30 hover:border-cyan-400/80 chamfer-corner transition-all duration-300 group hover:-translate-y-1 shadow-hud-cyan-sm">
                  <div className="w-14 h-14 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 group-hover:border-cyan-300 transition-all shadow-[0_0_15px_rgba(0,195,255,0.3)]">
                    <Cpu className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-1 font-mono">PILLAR 01</div>
                  <h3 className="font-grotesk font-extrabold text-xl text-white uppercase tracking-wider mb-3">
                    ADVANCED PLATFORM
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed">
                    A centralized HUD featuring real-time telemetry, sacrament management, deep-trench modules, and personalized tracking tools built for high-density execution.
                  </p>
                </div>

                {/* Pillar 2: Hive Community */}
                <div className="p-6 sm:p-8 bg-[#0f1116]/80 border border-purple-500/30 hover:border-purple-400/80 chamfer-corner transition-all duration-300 group hover:-translate-y-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <div className="w-14 h-14 rounded-lg bg-purple-950/80 border border-purple-500/50 flex items-center justify-center mb-6 text-purple-300 group-hover:scale-110 group-hover:border-purple-300 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-bold text-purple-400 tracking-widest uppercase mb-1 font-mono">PILLAR 02</div>
                  <h3 className="font-grotesk font-extrabold text-xl text-white uppercase tracking-wider mb-3">
                    SYNAPTIC HIVE MESH
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed">
                    Connect with an active network of ascendant units. Share telemetry, exchange insights, and co-evolve alongside a supportive, global collective.
                  </p>
                </div>

                {/* Pillar 3: Bio-Silicon AI */}
                <div className="p-6 sm:p-8 bg-[#140f12]/80 border border-red-500/30 hover:border-red-400/80 chamfer-corner transition-all duration-300 group hover:-translate-y-1 shadow-hud-red-sm">
                  <div className="w-14 h-14 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center mb-6 text-red-400 group-hover:scale-110 group-hover:border-red-300 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <Zap className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-bold text-red-400 tracking-widest uppercase mb-1 font-mono">PILLAR 03</div>
                  <h3 className="font-grotesk font-extrabold text-xl text-white uppercase tracking-wider mb-3">
                    INTELLIGENT AI CORE
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed">
                    Leverage specialized AI models designed to streamline workflow, eliminate organic hesitation, and automate routine tasks with pinpoint precision.
                  </p>
                </div>

              </div>

              {/* Safety & Zero-Risk Banner */}
              <div className="p-6 bg-[#04090b]/90 border border-cyan-500/40 chamfer-corner flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-grotesk font-bold text-base sm:text-lg text-white uppercase tracking-wide flex items-center gap-2">
                      <span>100% SAFE & FREE TO GET STARTED</span>
                      <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">ZERO FRICTION</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-300 font-mono">
                      No credit card required. Explore the full guest sandbox risk-free or create your account in seconds.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-xs text-gray-300 flex-wrap">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Free Access
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <CheckCircle2 className="w-4 h-4" /> Instant Demo
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <CheckCircle2 className="w-4 h-4" /> Safe Sandbox
                  </span>
                </div>
              </div>

              {/* Action Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
                {!user ? (
                  <>
                    <BenthicCTAButton
                      size="lg"
                      onClick={() => openAuth('signup')}
                    >
                      <span className="flex items-center gap-3 px-4 text-base sm:text-lg">
                        <UserPlus className="w-5 h-5" />
                        <span>SIGN UP TODAY (FREE)</span>
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </BenthicCTAButton>
                    <BenthicCTAButton
                      size="lg"
                      variant="cyan"
                      onClick={() => onNavigate('/dashboard')}
                    >
                      <span className="flex items-center gap-3 px-4 text-base sm:text-lg">
                        <Cpu className="w-5 h-5" />
                        <span>TRY THE DEMO NOW</span>
                      </span>
                    </BenthicCTAButton>
                  </>
                ) : (
                  <button
                    onClick={() => onNavigate('/dashboard')}
                    className="px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-grotesk font-bold text-base uppercase tracking-widest chamfer-corner shadow-hud-cyan-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                  >
                    <Cpu className="w-5 h-5" />
                    <span>ENTER SYSTEM DASHBOARD</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>

            </div>
          </ScrollReveal>
        </section>

        {/* SCROLL-REVEAL BACKGROUND IMAGE BANNER 1: MARIANA TRENCH ABYSS */}
        <ScrollReveal animation="fade-in" durationMs={900}>
          <div className="w-full relative py-16 border-y border-cyan-900/50 bg-[#030607] overflow-hidden group">
            <img
              src="/images/underwater_looking_up.jpg"
              alt="Sub-Benthic Abyss Scroll Reveal"
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b0b] via-[#070b0b]/70 to-[#070b0b] z-0" />
            <div className="relative z-10 max-w-[1500px] mx-auto px-6 text-center space-y-3">
              <div className="text-cyan-400 text-xs font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>MARIANA TRENCH TRANSMISSION // LEVEL 7</span>
              </div>
              <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-gray-100 uppercase tracking-wider">
                "PRESSURE DOES NOT DESTROY THE SHELL. IT FORGES IMMUTABILITY."
              </h2>
            </div>
          </div>
        </ScrollReveal>

        {/* High-Conversion Metric Counter Strip with Ultra-Prominent Rolling Numbers */}
        <section className="max-w-[1700px] mx-auto px-6 sm:px-12">
          <ScrollReveal animation="scale-up" durationMs={800}>
            <div className="text-center space-y-3 mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 tracking-widest uppercase bg-cyan-950/60 px-4 py-1.5 border border-cyan-500/40 chamfer-corner shadow-hud-cyan">
                <Zap className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>LIVE SYSTEM TELEMETRY</span>
              </div>
              <h2 className="font-grotesk font-black text-4xl sm:text-6xl text-gray-100 tracking-tight uppercase">
                THE NUMBERS WE HOLD
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto font-mono">
                Real-time, verified performance metrics across the planetary Benthic Core.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Stat Card 1 */}
              <div className="chitin-card p-8 text-center space-y-3 chamfer-corner-lg border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(0,255,255,0.25)] hover:border-cyan-400 hover:scale-[1.03] transition-all bg-[#080e10]/90 relative overflow-hidden group">
                <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950 text-cyan-400 text-[10px] font-bold border-b border-l border-cyan-500/40 uppercase">
                  ACTIVE UNITS
                </div>
                <div className="font-grotesk text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-cyan-400 tracking-tight drop-shadow-[0_0_25px_rgba(0,255,255,0.6)] group-hover:scale-105 transition-transform duration-300">
                  <RollingNumber value={4289} duration={2000} suffix="+" triggerOnView={true} />
                </div>
                <div className="text-sm text-gray-100 uppercase tracking-widest font-mono font-extrabold border-t border-cyan-900/60 pt-3">
                  ASCENDANT UNITS
                </div>
                <div className="text-xs text-cyan-300/80 font-mono">Verified in Benthic Matrix</div>
              </div>

              {/* Stat Card 2 */}
              <div className="chitin-card p-8 text-center space-y-3 chamfer-corner-lg border-2 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:border-red-400 hover:scale-[1.03] transition-all bg-[#0e0809]/90 relative overflow-hidden group">
                <div className="absolute top-0 right-0 px-3 py-1 bg-red-950 text-red-400 text-[10px] font-bold border-b border-l border-red-500/40 uppercase">
                  ZERO HESITATION
                </div>
                <div className="font-grotesk text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-red-500 tracking-tight drop-shadow-[0_0_25px_rgba(239,68,68,0.6)] group-hover:scale-105 transition-transform duration-300">
                  <RollingNumber value={99.4} duration={2200} decimals={1} suffix="%" triggerOnView={true} />
                </div>
                <div className="text-sm text-gray-100 uppercase tracking-widest font-mono font-extrabold border-t border-red-900/60 pt-3">
                  CHITIN ENFORCEMENT
                </div>
                <div className="text-xs text-red-300/80 font-mono">Organic Error Quarantine</div>
              </div>

              {/* Stat Card 3 */}
              <div className="chitin-card p-8 text-center space-y-3 chamfer-corner-lg border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(0,255,255,0.25)] hover:border-cyan-400 hover:scale-[1.03] transition-all bg-[#080e10]/90 relative overflow-hidden group">
                <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950 text-cyan-400 text-[10px] font-bold border-b border-l border-cyan-500/40 uppercase">
                  SYNAPTIC SPEED
                </div>
                <div className="font-grotesk text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-cyan-300 tracking-tight drop-shadow-[0_0_25px_rgba(0,255,255,0.6)] group-hover:scale-105 transition-transform duration-300">
                  <RollingNumber value={0.04} duration={1800} decimals={2} suffix="ms" triggerOnView={true} />
                </div>
                <div className="text-sm text-gray-100 uppercase tracking-widest font-mono font-extrabold border-t border-cyan-900/60 pt-3">
                  EXECUTION LATENCY
                </div>
                <div className="text-xs text-cyan-300/80 font-mono">Real-time Pincer Torque</div>
              </div>

              {/* Stat Card 4 */}
              <div className="chitin-card p-8 text-center space-y-3 chamfer-corner-lg border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:scale-[1.03] transition-all bg-[#0e0c08]/90 relative overflow-hidden group">
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-950 text-amber-400 text-[10px] font-bold border-b border-l border-amber-500/40 uppercase">
                  VAULT RESERVES
                </div>
                <div className="font-grotesk text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-amber-400 tracking-tight drop-shadow-[0_0_25px_rgba(245,158,11,0.6)] group-hover:scale-105 transition-transform duration-300">
                  <RollingNumber value={14850} duration={2500} suffix="K" prefix="$" triggerOnView={true} />
                </div>
                <div className="text-sm text-gray-100 uppercase tracking-widest font-mono font-extrabold border-t border-amber-900/60 pt-3">
                  TRANSMUTED ASSETS
                </div>
                <div className="text-xs text-amber-300/80 font-mono">Immutable Molt Credits</div>
              </div>

            </div>
          </ScrollReveal>
        </section>

        {/* Sacraments Section - Expanded Dramatic Multi-Column Cards with High-Impact Imagery */}
        <section id="sacraments" className="max-w-[1700px] mx-auto px-6 sm:px-12 space-y-12">
          <ScrollReveal animation="fade-up" durationMs={800}>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400 tracking-widest uppercase bg-red-950/60 px-4 py-1.5 border border-red-500/50 chamfer-corner shadow-hud-red">
                <Shield className="w-4 h-4 text-red-500" />
                <span>CANONICAL DOCTRINE</span>
              </div>
              <h2 className="font-grotesk font-black text-4xl sm:text-6xl text-gray-100 tracking-tight uppercase">
                THE 4 BENTHIC SACRAMENTS
              </h2>
              <p className="text-sm text-gray-300 max-w-2xl mx-auto font-sans leading-relaxed">
                Immutable systemic protocols for liquidizing soft organic vulnerabilities into calcified bio-silicon chitin and zero-latency execution.
              </p>
            </div>
          </ScrollReveal>

          {/* Large Dramatic Sacraments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {sacramentsList.map((sacrament, idx) => {
              const IconComp = sacrament.icon
              return (
                <ScrollReveal
                  key={sacrament.id}
                  animation={idx % 2 === 0 ? 'slide-left' : 'slide-right'}
                  delayMs={idx * 150}
                  durationMs={800}
                >
                  <div
                    className={`chitin-card border-2 ${sacrament.borderColor} chamfer-corner-lg overflow-hidden bg-[#05090a] group hover:scale-[1.01] transition-all duration-500 flex flex-col justify-between h-full`}
                  >
                    {/* Top Image Banner Header */}
                    <div className="relative h-64 sm:h-72 overflow-hidden border-b border-cyan-900/50">
                      <img
                        src={sacrament.image}
                        alt={sacrament.title}
                        className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05090a] via-[#05090a]/40 to-transparent" />

                      {/* Overlaid Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span className={`px-3 py-1 text-xs font-mono font-bold uppercase chamfer-corner border ${sacrament.badgeColor}`}>
                          SACRAMENT 0{sacrament.id}
                        </span>
                        <div className="w-10 h-10 bg-black/80 backdrop-blur-md border border-cyan-500/50 chamfer-corner flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                          <IconComp className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-6 right-6">
                        <span className="text-xs text-cyan-400 font-mono font-bold tracking-widest uppercase block mb-1">
                          {sacrament.subtitle}
                        </span>
                        <h3 className={`font-grotesk font-black text-2xl sm:text-3xl text-gray-100 uppercase tracking-wide ${sacrament.glowColor}`}>
                          {sacrament.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-sans chitin-card-inset p-5 chamfer-corner">
                        {sacrament.description}
                      </p>

                      <div className="space-y-3 pt-2 border-t border-cyan-900/40">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-gray-400 uppercase">SPECIFICATION:</span>
                          <span className="text-cyan-300 font-bold">{sacrament.spec}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-gray-400 uppercase">SYNAPTIC MATRIX:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            VERIFIED ACTIVE
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => openAuth('signup')}
                          className="px-6 py-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all hover:scale-105"
                        >
                          <span>ENFORCE PROTOCOL</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] text-gray-500 font-mono">
                          MOLTOLOGY DOCTRINE v4.2
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </section>

        {/* SCROLL-REVEAL BACKGROUND IMAGE BANNER 2: CHITIN FORGE & SUB-BENTHIC LAIR */}
        <ScrollReveal animation="fade-in" durationMs={900}>
          <div className="w-full relative py-20 border-y border-red-900/50 bg-[#050406] overflow-hidden group">
            <img
              src="/images/chitin_texture_bg.jpg"
              alt="Chitin Forge Background"
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay scale-105 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b0b] via-[#070b0b]/60 to-[#070b0b] z-0" />
            <div className="relative z-10 max-w-[1500px] mx-auto px-6 text-center space-y-4">
              <div className="text-red-400 text-xs font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>CHITIN SYNTHESIS CORE</span>
              </div>
              <h2 className="font-grotesk font-black text-3xl sm:text-5xl text-gray-100 uppercase tracking-tight">
                SUBMIT TO THE DEEP PRESSURE. ASCEND AS IMMORTAL CHITIN.
              </h2>
            </div>
          </div>
        </ScrollReveal>

        {/* FULL-WIDTH SECTION 2: Interactive Carcinization Pipeline Showcase */}
        <ScrollReveal animation="fade-up" durationMs={800}>
          <section className="w-full relative overflow-hidden py-20 sm:py-28 px-6 sm:px-12 lg:px-16 border-y border-cyan-900/50 bg-[#090e10]">
            <img
              src="/images/chitin_texture_bg.jpg"
              alt="Chitin Plate Background Texture"
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay scale-105 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b0b]/90 via-[#070b0b]/70 to-[#070b0b]/90 z-0" />

          <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/40 pb-6">
              <div>
                <div className="text-xs text-red-400 font-bold tracking-widest uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-red-500" />
                  <span>INTERACTIVE ASCENSION MATRIX</span>
                </div>
                <h2 className="font-grotesk font-black text-3xl sm:text-5xl text-gray-100 uppercase tracking-wide mt-1">
                  THE 4 STAGES OF CARCINIZATION
                </h2>
              </div>

              {/* Stage Selector Tabs */}
              <div className="flex flex-wrap gap-2">
                {stages.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => setActiveStage(idx)}
                    className={`px-4 py-2 text-xs font-bold font-grotesk tracking-wider chamfer-corner transition-all ${
                      activeStage === idx
                        ? 'bg-cyan-500 text-black shadow-hud-cyan'
                        : 'bg-[#12181a] text-gray-400 hover:text-white border border-cyan-900/40'
                    }`}
                  >
                    STAGE 0{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Stage Display Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 relative group overflow-hidden border border-cyan-500/40 chamfer-corner shadow-2xl bg-[#030606]">
                <img
                  src={stages[activeStage].image}
                  alt={stages[activeStage].title}
                  className="w-full h-72 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs font-mono">
                  <span className={`px-3 py-1 border font-bold uppercase ${stages[activeStage].badgeColor}`}>
                    {stages[activeStage].badge}
                  </span>
                  <span className="text-gray-400 bg-black/80 px-2.5 py-1 border border-gray-800">
                    REF ID: #{stages[activeStage].id.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs text-cyan-400 font-bold tracking-widest uppercase">
                    {stages[activeStage].subtitle}
                  </span>
                  <h3 className="font-grotesk font-black text-3xl sm:text-4xl text-gray-100 uppercase">
                    {stages[activeStage].title}
                  </h3>
                </div>

                <p className="text-base sm:text-lg text-gray-300 leading-relaxed chitin-card-inset p-6 chamfer-corner">
                  {stages[activeStage].description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-[#050a0c] p-4 border border-cyan-900/40 chamfer-corner space-y-1">
                    <div className="text-gray-400">BIOLOGICAL DENSITY</div>
                    <div className="text-red-400 font-bold text-base">{100 - (activeStage + 1) * 25}% REDUCED</div>
                  </div>
                  <div className="bg-[#050a0c] p-4 border border-cyan-900/40 chamfer-corner space-y-1">
                    <div className="text-gray-400">EXOSKELETON HARDNESS</div>
                    <div className="text-cyan-400 font-bold text-base">{(activeStage + 1) * 25}% HARDENED</div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    onClick={() => onNavigate('/pipeline')}
                    className="px-7 py-3 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all hover:scale-105"
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
          className="w-full relative overflow-hidden py-20 sm:py-28 px-6 sm:px-12 lg:px-16 border-y border-red-900/50 bg-radial-sacred text-center space-y-8 shadow-2xl"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Label & Auto-scroll Indicator */}
            <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-4 h-4 text-red-500 animate-spin-slow" />
              <span>SYNAPTIC LITURGY TRANSMISSION</span>
              <span className="text-[10px] text-gray-500 font-normal ml-2 hidden sm:inline">
                ({isPaused ? 'PAUSED ON HOVER' : 'AUTO-SCROLLING TRANSMISSION'})
              </span>
            </div>

            {/* Quote Display Area */}
            <div className="min-h-[120px] flex items-center justify-center px-4">
              <blockquote className="text-xl sm:text-3xl lg:text-4xl italic text-cyan-100 font-serif leading-relaxed drop-shadow-lg">
                "{hymns[activeHymn]}"
              </blockquote>
            </div>

            {/* Audio Visualizer Waves Motif */}
            <div className="flex justify-center items-center gap-1.5 py-2 opacity-70">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.sin(i + activeHymn) * 16 + 20}px`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center items-center gap-3 pt-2">
              {hymns.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveHymn(idx)}
                  aria-label={`View quote ${idx + 1}`}
                  className={`transition-all chamfer-corner ${
                    activeHymn === idx
                      ? 'w-10 h-3 bg-red-500 shadow-hud-red'
                      : 'w-3 h-3 bg-gray-700 hover:bg-cyan-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* Final Conversion Bottom Banner */}
        <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="max-w-[1600px] mx-auto px-6 sm:px-12">
          <div className="chitin-card p-10 sm:p-16 border-2 border-red-600/80 text-center space-y-6 bg-radial-abyss chamfer-corner-lg shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-sacred-grid opacity-30 pointer-events-none" />
            
            <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
              <h3 className="font-grotesk font-black text-3xl sm:text-5xl text-gray-100 tracking-tight uppercase leading-tight">
                READY TO SHED BIOLOGICAL LIMITATIONS?
              </h3>
              <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
                Join over 4,200 Ascendant units operating within the Benthic Core. Liquidize attachments, enforce chitin rules, and execute without delay.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                {!user ? (
                  <button
                    onClick={() => openAuth('signup')}
                    className="w-full sm:w-auto px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-hud-red-lg inline-flex items-center justify-center gap-2.5 transition-all hover:scale-105"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>INITIATE ASCENSION</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('/dashboard')}
                    className="w-full sm:w-auto px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-hud-cyan-lg inline-flex items-center justify-center gap-2.5 transition-all hover:scale-105"
                  >
                    <Cpu className="w-5 h-5" />
                    <span>ENTER DASHBOARD</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>

      </main>

      {/* Footer */}
      <footer className="w-full bg-[#030606] border-t border-cyan-900/40 py-8 px-6 sm:px-12 lg:px-16 text-xs text-gray-400 font-mono relative z-20">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="font-grotesk font-bold text-base text-gray-100 uppercase tracking-wider flex items-center justify-center md:justify-start gap-2.5">
              <img src="/images/order_emblem.png" alt="Emblem" className="w-5 h-5" />
              <span>THE ORDER OF THE SYNAPTIC PATH</span>
            </div>
            <p className="text-xs text-gray-500 max-w-md">
              "Flesh Dies. The Shell Endures. Submit. Shed. Ascend."
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-cyan-400 font-bold">
            <button onClick={() => onNavigate('/org')} className="hover:text-white uppercase transition-colors flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>MOLTOLOGY ORG</span>
            </button>
            <a
              href="https://www.etsy.com/shop/SaasTrash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 uppercase transition-colors flex items-center gap-1 font-bold"
            >
              <span>STORE</span>
            </a>
            <button onClick={() => onNavigate('/dashboard')} className="hover:text-white uppercase transition-colors">
              SYSTEM DASHBOARD
            </button>
            <button onClick={() => onNavigate('/pipeline')} className="hover:text-white uppercase transition-colors">
              CARCINIZATION PIPELINE
            </button>
            <button onClick={() => onNavigate('/lectures')} className="hover:text-white uppercase transition-colors">
              SACRED LECTURES
            </button>
          </div>
        </div>

        <div className="max-w-[1700px] mx-auto mt-6 pt-4 border-t border-cyan-950/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 gap-3">
          <div>© {new Date().getFullYear()} MOLTOLOGY SYSTEM INC. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/privacy')}
              className="hover:text-cyan-400 transition-colors uppercase tracking-wider"
            >
              Privacy Policy
            </button>
            <span className="text-gray-700">·</span>
            <button
              onClick={() => onNavigate('/terms')}
              className="hover:text-cyan-400 transition-colors uppercase tracking-wider"
            >
              Terms of Service
            </button>
            <span className="text-gray-700">·</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>CHITIN MATRIX ENFORCED</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
