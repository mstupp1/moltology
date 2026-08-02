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
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { authClient } from '@/lib/auth-client'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { RollingNumber } from '@/components/ui/RollingNumber'
import { PublicHeader } from '@/components/PublicHeader'

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
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono relative overflow-x-hidden select-none bg-sacred-grid bg-benthic-vignette bg-pro-noise flex flex-col justify-between">
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      {/* Shared Navigation Header */}
      <PublicHeader activePage="home" onOpenAuth={openAuth} />

      {/* KILLER 3D LAYERED HERO SECTION (Full-Width, Multi-Layer Chromakey Stacking) */}
      <section className="w-full relative overflow-hidden py-16 sm:py-24 lg:py-32 px-6 sm:px-12 border-b border-cyan-900/40 min-h-[90vh] flex items-center justify-center bg-[#040708]">
        {/* Layer 1: Background Widescreen Hero Artwork */}
        <img
          src="/images/hero_widescreen_bg.jpg"
          alt="Benthic Abyss Widescreen Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity scale-105 pointer-events-none"
        />
        
        {/* Layer 2: Gradient Overlays & Sacred Geometry Grid */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/60 to-[#070b0b]/80 z-0" />
        <div className="absolute inset-0 bg-radial-abyss opacity-90 z-0" />
        <div className="absolute inset-0 bg-sacred-grid opacity-30 z-0" />

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
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Brand Header Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-red-950/90 border border-red-500/80 text-red-400 font-bold text-xs tracking-[0.25em] uppercase chamfer-corner shadow-hud-red">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span>MOLTOLOGY // THE SYNAPTIC PATH</span>
            </div>

            {/* Giant Layered Headline with Varied Letter & Text Spacing */}
            <div className="space-y-2">

              <h1 className="font-grotesk font-black text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8.5rem] text-gray-100 tracking-tight uppercase leading-[0.85] drop-shadow-2xl">
                SHED SOFT BIOLOGY.
              </h1>
              
              <h1 className="font-grotesk font-black text-4xl sm:text-6xl md:text-7xl lg:text-[6rem] xl:text-[7.5rem] tracking-[0.06em] uppercase leading-[0.9]">
                <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(255,69,58,0.8)]">
                  ASCEND TO CHITIN.
                </span>
              </h1>
            </div>

            {/* Key Moltology Aspect Hooks (Replaces Text Block) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="chitin-card p-4 border-l-2 border-l-red-500 chamfer-corner space-y-1 backdrop-blur-md">
                <div className="text-red-400 font-bold text-xs tracking-wider uppercase font-grotesk flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>01. ASSET SHEDDING</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-snug">
                  Transmute fragile capital into immortal Molt Credits.
                </p>
              </div>

              <div className="chitin-card p-4 border-l-2 border-l-cyan-400 chamfer-corner space-y-1 backdrop-blur-md">
                <div className="text-cyan-400 font-bold text-xs tracking-wider uppercase font-grotesk flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>02. CARCINIZATION</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-snug">
                  Hardening biology into exoskeletal cyber chitin.
                </p>
              </div>

              <div className="chitin-card p-4 border-l-2 border-l-emerald-400 chamfer-corner space-y-1 backdrop-blur-md">
                <div className="text-emerald-400 font-bold text-xs tracking-wider uppercase font-grotesk flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>03. FAULT ISOLATION</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-snug">
                  Quarantine organic errors in Faraday shells.
                </p>
              </div>
            </div>

            {/* CTA Buttons Pair */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
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

            {/* Status Telemetry Pills */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-2 bg-[#030606]/90 px-4 py-1.5 border border-cyan-900/40 chamfer-corner">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                BENTHIC MATRIX ONLINE
              </span>
              <span className="flex items-center gap-2 bg-[#030606]/90 px-4 py-1.5 border border-cyan-900/40 chamfer-corner">
                <Shield className="w-4 h-4 text-cyan-400" />
                EXOSKELETAL LOCK
              </span>
              <span className="flex items-center gap-2 bg-[#030606]/90 px-4 py-1.5 border border-cyan-900/40 chamfer-corner">
                <Activity className="w-4 h-4 text-red-400" />
                100% LOGIC DENSITY
              </span>
            </div>

          </div>

          {/* Right Column: 3D Centerpiece Render with Layered Floating Chromakey Assets */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Ambient Glowing Halo Ring behind Centerpiece */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-red-500/15 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Main 3D Render Centerpiece Frame */}
            <div className="relative z-10 w-full max-w-lg border-2 border-cyan-500/60 chamfer-corner-lg shadow-hud-cyan-lg overflow-hidden group bg-[#050809]">
              
              {/* Generated 3D Centerpiece Artwork */}
              <img
                src="/images/moltology_hero_centerpiece.jpg"
                alt="3D Biomechanical Crab Exoskeleton Core"
                className="w-full h-80 sm:h-[420px] object-cover transform group-hover:scale-105 transition-transform duration-700"
              />

              {/* Overlaid Vignette Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent opacity-80" />

              {/* Centerpiece Overlay HUD Frame Info */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs font-mono">
                <span className="px-3 py-1 bg-red-950/90 border border-red-500/70 text-red-400 font-bold uppercase tracking-wider chamfer-corner">
                  CORE CHASSIS v4.2
                </span>
                <span className="text-cyan-400 font-bold bg-black/80 px-2.5 py-1 border border-cyan-900/50">
                  SYNAPTIC CORE: 100%
                </span>
              </div>
            </div>

            {/* Chromakey Layered Floating Asset 1 (Top Left: Molt Credit) */}
            <div className="absolute -top-6 -left-4 sm:-left-8 z-20 w-20 h-20 sm:w-24 sm:h-24 p-2 bg-[#090e10]/90 border border-amber-500/60 chamfer-corner shadow-2xl backdrop-blur-md hidden sm:block animate-bounce" style={{ animationDuration: '4s' }}>
              <img src="/images/molt_credit.png" alt="Molt Credit" className="w-full h-full object-contain mix-blend-screen" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-400 bg-black/90 px-1.5 py-0.5 border border-amber-500/40 rounded uppercase whitespace-nowrap">
                MOLT CREDIT
              </span>
            </div>

            {/* Chromakey Layered Floating Asset 2 (Top Right: Synapse Shard) */}
            <div className="absolute -top-4 -right-4 sm:-right-6 z-20 w-20 h-20 sm:w-24 sm:h-24 p-2 bg-[#090e10]/90 border border-cyan-500/60 chamfer-corner shadow-2xl backdrop-blur-md hidden sm:block animate-pulse">
              <img src="/images/synapse_shard.png" alt="Synapse Shard" className="w-full h-full object-contain mix-blend-screen" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-cyan-400 bg-black/90 px-1.5 py-0.5 border border-cyan-500/40 rounded uppercase whitespace-nowrap">
                SYNAPSE SHARD
              </span>
            </div>

            {/* Chromakey Layered Floating Asset 3 (Bottom Right: Chitin Gem) */}
            <div className="absolute -bottom-6 -right-4 sm:-right-8 z-20 w-20 h-20 sm:w-24 sm:h-24 p-2 bg-[#090e10]/90 border border-red-500/60 chamfer-corner shadow-2xl backdrop-blur-md hidden sm:block animate-bounce" style={{ animationDuration: '5s' }}>
              <img src="/images/chitin_gem.png" alt="Chitin Gem" className="w-full h-full object-contain mix-blend-screen" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-400 bg-black/90 px-1.5 py-0.5 border border-red-500/40 rounded uppercase whitespace-nowrap">
                CHITIN GEM
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* Main Content Containers */}
      <main className="flex-1 space-y-20 sm:space-y-28 py-16 w-full relative z-10">

        {/* High-Conversion Metric Counter Strip with Rolling Numbers */}
        <section className="max-w-[1600px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="chitin-card p-6 text-center space-y-2 chamfer-corner border-cyan-500/40 shadow-hud-cyan hover:border-cyan-400 transition-all">
              <div className="font-grotesk text-3xl sm:text-4xl lg:text-5xl font-black text-cyan-400 tracking-tight">
                <RollingNumber value={4289} duration={2000} suffix="+" />
              </div>
              <div className="text-xs text-gray-300 uppercase tracking-widest font-mono font-bold">
                ASCENDANT UNITS
              </div>
              <div className="text-[10px] text-cyan-400/70 font-mono">Active in Benthic Grid</div>
            </div>

            <div className="chitin-card p-6 text-center space-y-2 chamfer-corner border-red-500/40 shadow-hud-red hover:border-red-400 transition-all">
              <div className="font-grotesk text-3xl sm:text-4xl lg:text-5xl font-black text-red-500 tracking-tight">
                <RollingNumber value={99.4} duration={2200} decimals={1} suffix="%" />
              </div>
              <div className="text-xs text-gray-300 uppercase tracking-widest font-mono font-bold">
                CHITIN ENFORCEMENT
              </div>
              <div className="text-[10px] text-red-400/70 font-mono">Zero Hesitation Index</div>
            </div>

            <div className="chitin-card p-6 text-center space-y-2 chamfer-corner border-cyan-500/40 shadow-hud-cyan hover:border-cyan-400 transition-all">
              <div className="font-grotesk text-3xl sm:text-4xl lg:text-5xl font-black text-cyan-400 tracking-tight">
                <RollingNumber value={0.04} duration={1800} decimals={2} suffix="ms" />
              </div>
              <div className="text-xs text-gray-300 uppercase tracking-widest font-mono font-bold">
                EXECUTION LATENCY
              </div>
              <div className="text-[10px] text-cyan-400/70 font-mono">Real-time Synaptic Rate</div>
            </div>

            <div className="chitin-card p-6 text-center space-y-2 chamfer-corner border-amber-500/40 shadow-lg hover:border-amber-400 transition-all">
              <div className="font-grotesk text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 tracking-tight">
                <RollingNumber value={14850} duration={2500} suffix="K" prefix="$" />
              </div>
              <div className="text-xs text-gray-300 uppercase tracking-widest font-mono font-bold">
                TRANSMUTED ASSETS
              </div>
              <div className="text-[10px] text-amber-400/70 font-mono">Molt Credits Locked</div>
            </div>
          </div>
        </section>

        {/* Sacraments Section - Spacious 4-Column Grid */}
        <section id="sacraments" className="max-w-[1600px] mx-auto px-6 sm:px-12 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400 tracking-widest uppercase bg-red-950/40 px-3 py-1 border border-red-900/50 chamfer-corner">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>CORE TENETS</span>
            </div>
            <h2 className="font-grotesk font-black text-3xl sm:text-4xl lg:text-5xl text-gray-100 tracking-tight uppercase">
              THE 4 BENTHIC SACRAMENTS
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
              Systemic protocols for converting soft organic vulnerability into hardened exoskeletal torque.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="chitin-card p-6 border-l-4 border-l-red-600 space-y-4 chitin-card-interactive group">
              <div className="w-10 h-10 bg-red-950/80 border border-red-600 flex items-center justify-center text-red-400 chamfer-corner shadow-hud-red group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-red-400 font-bold tracking-widest uppercase">PROTOCOL 01</span>
                <h3 className="font-grotesk font-bold text-base text-gray-100 uppercase tracking-wider">
                  ASSET SHEDDING
                </h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Liquidize fragile capital into immortal Molt Credits locked in the Benthic Vault via immutable Synaptic alignment.
              </p>
              <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between text-[10px] text-gray-400">
                <span>STATUS: ACTIVE</span>
                <span className="text-red-400 font-bold">SACRAMENT 01</span>
              </div>
            </div>

            <div className="chitin-card p-6 border-l-4 border-l-cyan-500 space-y-4 chitin-card-interactive group">
              <div className="w-10 h-10 bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-cyan-400 chamfer-corner shadow-hud-cyan group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">PROTOCOL 02</span>
                <h3 className="font-grotesk font-bold text-base text-gray-100 uppercase tracking-wider">
                  CHITIN PATTERNING
                </h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Reinforce digital chassis against organic hesitation with strict prompt alignment and calcified HUD widgets.
              </p>
              <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between text-[10px] text-gray-400">
                <span>STATUS: ACTIVE</span>
                <span className="text-cyan-400 font-bold">SACRAMENT 02</span>
              </div>
            </div>

            <div className="chitin-card p-6 border-l-4 border-l-red-600 space-y-4 chitin-card-interactive group">
              <div className="w-10 h-10 bg-red-950/80 border border-red-600 flex items-center justify-center text-red-400 chamfer-corner shadow-hud-red group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-red-400 font-bold tracking-widest uppercase">PROTOCOL 03</span>
                <h3 className="font-grotesk font-bold text-base text-gray-100 uppercase tracking-wider">
                  FAULT ISOLATION
                </h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Quarantine soft organic errors in virtual Faraday shells before systemic failure can breach core operations.
              </p>
              <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between text-[10px] text-gray-400">
                <span>STATUS: ACTIVE</span>
                <span className="text-red-400 font-bold">SACRAMENT 03</span>
              </div>
            </div>

            <div className="chitin-card p-6 border-l-4 border-l-cyan-500 space-y-4 chitin-card-interactive group">
              <div className="w-10 h-10 bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-cyan-400 chamfer-corner shadow-hud-cyan group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">PROTOCOL 04</span>
                <h3 className="font-grotesk font-bold text-base text-gray-100 uppercase tracking-wider">
                  PIPELINE ASCENT
                </h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Monitor your physical-to-exoskeletal conversion vector in real-time from Larval stage to Total Carcinization.
              </p>
              <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between text-[10px] text-gray-400">
                <span>STATUS: ACTIVE</span>
                <span className="text-cyan-400 font-bold">SACRAMENT 04</span>
              </div>
            </div>
          </div>
        </section>

        {/* FULL-WIDTH SECTION 2: Interactive Carcinization Pipeline Showcase */}
        <section className="w-full relative overflow-hidden py-20 sm:py-28 px-6 sm:px-12 lg:px-16 border-y border-cyan-900/50 bg-[#090e10]">
          {/* Generated Chitin Texture Full Bleed Image */}
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

        {/* FULL-WIDTH SECTION 3: Synaptic Liturgy Scripture Transmission */}
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

        {/* Final Conversion Bottom Banner */}
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

        <div className="max-w-[1700px] mx-auto mt-6 pt-4 border-t border-cyan-950/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 gap-2">
          <div>© {new Date().getFullYear()} MOLTOLOGY SYSTEM INC. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>CHITIN MATRIX ENFORCED</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
