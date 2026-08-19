import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Laptop,
  Smartphone,
  Sparkles,
  ExternalLink,
  Cpu,
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  Atom,
  ShoppingCart,
  Sliders,
  Users,
  Radio,
  BookOpen,
  ArrowRight,
  Maximize2,
  GitCommit,
  Flame,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Safari } from '@/components/ui/magicui/safari'
import { Iphone15Pro } from '@/components/ui/magicui/iphone-15-pro'
import { HUDHeader } from './HUDHeader'
import { WelcomeInitiateHero } from './WelcomeInitiateHero'
import { LaunchpadCarousel } from './LaunchpadCarousel'
import { getAssetUrl } from '@/lib/assets'

// Navigation links for the authentic desktop HUD sidebar
const MOCK_NAV_ITEMS = [
  { icon: Layers, label: 'COMMAND DASHBOARD', active: true },
  { icon: BookOpen, label: 'SACRED CODEX' },
  { icon: Atom, label: 'METAMORPHOSIS PIPELINE' },
  { icon: ShoppingCart, label: 'THE BENTHIC MARKET' },
  { icon: Sliders, label: 'CHASSIS CONFIG' },
  { icon: Users, label: 'HIVE COMMUNE' },
  { icon: Radio, label: 'NEURAL ORACLE' },
]

/**
 * Fixed 1440x900 Virtual Desktop Canvas.
 * Ensures 100% true interface fidelity: media queries, font sizes, bento boxes,
 * and sidebars render exactly as they do on a real 1440px MacBook display.
 */
function FixedVirtualDesktopHUD() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setScale(width / 1440)
      }
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    window.addEventListener('resize', updateScale)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden bg-[#030708] select-none"
      style={{ height: `${900 * scale}px` }}
    >
      {/* 1440px Fixed Canvas Scaled to Fit */}
      <div
        className="origin-top-left absolute top-0 left-0"
        style={{
          width: '1440px',
          height: '900px',
          transform: `scale(${scale})`,
        }}
      >
        {/* Background Underwater Atmosphere Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 mix-blend-screen"
            style={{ backgroundImage: `url('${getAssetUrl('/images/underwater_looking_up.jpg')}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030708]/60 via-[#030708]/85 to-[#030708]" />
          <div className="absolute inset-0 crt-scanlines opacity-45 pointer-events-none" />
          <div className="absolute inset-0 bg-sacred-grid opacity-20 pointer-events-none" />
        </div>

        {/* Live True-Interface Desktop Layout */}
        <div className="relative z-10 flex flex-col h-full text-[#dfe3e3] font-sans">
          {/* 1. Real Live HUD Header */}
          <HUDHeader stage={1} larvaId="INITIATE GUEST #001" />

          {/* 2. Body Split: Sidebar + Dashboard Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Navigation Sidebar */}
            <aside className="w-64 bg-[#020608]/95 border-r border-[#00c3ff]/15 p-4 flex flex-col justify-between shrink-0">
              <div className="space-y-5">
                {/* Benthic Brand Badge */}
                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#070b0b] border border-[#3a4a49] rounded-lg shadow-inner">
                  <img
                    src={getAssetUrl('/images/order_emblem.png')}
                    alt="Order Emblem"
                    className="w-6 h-6 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#dfe3e3] font-grotesk tracking-wider uppercase truncate">
                      MOLTOLOGY OS
                    </div>
                    <div className="text-[10px] text-cyan-400 font-sans font-bold">BENTHIC V1.5 · COMMAND</div>
                  </div>
                </div>

                {/* Nav Links List */}
                <nav className="space-y-1.5">
                  {MOCK_NAV_ITEMS.map((item, idx) => {
                    const IconComponent = item.icon
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          item.active
                            ? 'bg-[#00c3ff]/15 text-[#00ffff] border border-[#00c3ff]/40 shadow-hud-cyan-sm'
                            : 'text-[#839493] hover:text-[#dfe3e3] hover:bg-[#070b0b]'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 shrink-0 text-cyan-400" />
                        <span className="truncate tracking-wide">{item.label}</span>
                      </div>
                    )
                  })}
                </nav>
              </div>

              {/* Sidebar Footer Clearance Card */}
              <div className="p-3 bg-[#060b0c] border border-cyan-500/30 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-cyan-300 font-bold uppercase tracking-wider">
                  <span>CLEARANCE: S1</span>
                  <span className="text-[10px] text-emerald-400 font-sans">ACTIVE</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">Soft-Shed Stage Unlocked</p>
              </div>
            </aside>

            {/* Main Dashboard Workspace Content */}
            <main className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
              {/* Live Welcome Hero Component */}
              <WelcomeInitiateHero />

              {/* Live Interactive Bento Box Carousel */}
              <LaunchpadCarousel />

              {/* Live Activity Stream & System Changelog Columns */}
              <div className="grid grid-cols-12 gap-5 items-stretch">
                {/* Activity Stream (7 cols) */}
                <div className="col-span-7 chitin-card p-5 rounded-lg border border-cyan-500/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
                      <div className="flex items-center gap-2 font-grotesk text-sm font-bold text-[#dfe3e3] uppercase">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>RECENT SYSTEM EVENTS</span>
                      </div>
                      <span className="text-[10px] text-cyan-300 font-bold bg-[#070b0b] px-2 py-0.5 border border-[#3a4a49] rounded">
                        REAL-TIME STREAM
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-[#070b0b]/90 border border-[#3a4a49]/60 rounded-md flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="text-gray-300 truncate">Morning Alignment verified (+5% clarity)</span>
                        </div>
                        <span className="text-[10px] text-[#839493] shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 14m ago
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#070b0b]/90 border border-[#3a4a49]/60 rounded-md flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Atom className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="text-gray-300 truncate">Carapace Armor Recalibrated to 78 N·m</span>
                        </div>
                        <span className="text-[10px] text-[#839493] shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 1h ago
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#070b0b]/90 border border-[#3a4a49]/60 rounded-md flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Users className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="text-gray-300 truncate">Initiate Transmission dispatched to Benthic Core #4</span>
                        </div>
                        <span className="text-[10px] text-[#839493] shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 3h ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Protocol Releases & Changelog (5 cols) */}
                <div className="col-span-5 chitin-card p-5 rounded-lg border border-cyan-500/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
                      <div className="flex items-center gap-2 font-grotesk text-sm font-bold text-[#dfe3e3] uppercase">
                        <GitCommit className="w-4 h-4 text-cyan-400" />
                        <span>PROTOCOL RELEASE</span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 border border-cyan-500/40 rounded">
                        v1.5.0 LATEST
                      </span>
                    </div>

                    <div className="p-3 bg-[#070b0b]/90 border border-[#3a4a49]/60 rounded-md space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-bold text-cyan-300">CORE UPGRADE</span>
                        <span>RELEASED TODAY</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-200 uppercase font-grotesk">
                        Neural Alignment & Subterranean Trench
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed">
                        Zero-latency habit engine, deep focus isolation rooms, and bio-silicon AI mentors for peak operational clarity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile Live HUD View inside the iPhone 15 Pro Frame
 */
function MobileLiveHUDView() {
  const navigate = useNavigate()

  return (
    <div className="w-full h-full p-4 space-y-4 font-sans text-[#dfe3e3] flex flex-col justify-between">
      {/* Mobile Top Header Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#3a4a49]">
          <div className="flex items-center gap-2">
            <img
              src={getAssetUrl('/images/order_emblem.png')}
              alt="Moltology"
              className="w-5 h-5 object-contain"
            />
            <span className="font-grotesk text-sm font-black text-white tracking-wider uppercase">
              MOLTOLOGY
            </span>
          </div>
          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 border border-cyan-500/40 rounded">
            LVL 1 INITIATE
          </span>
        </div>

        {/* Mobile Welcome Hero Card */}
        <div className="p-3 bg-gradient-to-r from-[#0b1011] to-[#121a1c] border-l-2 border-cyan-400 border border-[#3a4a49] rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-grotesk font-extrabold text-white uppercase tracking-wider">
              ACTIVE MOLT
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">100% SYNCED</span>
          </div>
          <p className="text-[11px] text-gray-300 leading-snug">
            Shed soft distraction. Lock into 3,400 fathoms of unbroken focus.
          </p>
        </div>

        {/* Mobile Directives List */}
        <div className="space-y-2 pt-1">
          <div className="text-[10px] font-bold text-cyan-400 font-sans tracking-widest uppercase">
            DAILY DIRECTIVES
          </div>

          <div className="p-3 bg-[#070b0b] border border-cyan-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-950/80 border border-cyan-500/50 rounded text-cyan-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase">Molt Lectures</div>
                <div className="text-[10px] text-gray-400">Module IV · 68% Complete</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="p-3 bg-[#070b0b] border border-purple-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-950/80 border border-purple-500/50 rounded text-purple-300">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase">Synaptic Hive</div>
                <div className="text-[10px] text-gray-400">310 Operators Online</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          </div>

          <div className="p-3 bg-[#070b0b] border border-red-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-950/80 border border-red-500/50 rounded text-red-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase">AI Oracle Mentor</div>
                <div className="text-[10px] text-gray-400">Ready for Consultation</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-red-400" />
          </div>
        </div>
      </div>

      {/* Mobile Test Sandbox CTA */}
      <button
        onClick={() => navigate({ to: '/dashboard' })}
        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-grotesk text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-hud-cyan-sm transition-all transform active:scale-98"
      >
        <Cpu className="w-4 h-4" />
        <span>TEST GUEST SANDBOX</span>
      </button>
    </div>
  )
}

export function DashboardMarketingShowcase() {
  const navigate = useNavigate()
  const [deviceTab, setDeviceTab] = useState<'both' | 'desktop' | 'mobile'>('both')

  const handleLaunchDemo = () => {
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="w-full relative z-20 my-8 sm:my-14" aria-label="Interactive System Showcase">
      {/* Centered Segmented Device Switcher & Launch Demo CTA */}
      <div className="flex flex-col items-center justify-center gap-3.5 mb-8 sm:mb-10 px-2 font-sans">
        {/* Simplified Segmented Slider Controls */}
        <div className="inline-flex items-center bg-[#070b0b] border border-[#3a4a49] p-1 rounded-full shadow-inner">
          {/* Dual View Option (Desktop/Tablet only) */}
          <button
            onClick={() => setDeviceTab('both')}
            className={`hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all rounded-full ${
              deviceTab === 'both'
                ? 'bg-[#00c3ff]/20 text-[#00ffff] border border-[#00c3ff]/50 shadow-hud-cyan-sm'
                : 'text-[#839493] hover:text-white'
            }`}
            title="Dual Device Layout"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>

          {/* Desktop Option */}
          <button
            onClick={() => setDeviceTab('desktop')}
            className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold transition-all rounded-full ${
              deviceTab === 'desktop'
                ? 'bg-[#00c3ff]/20 text-[#00ffff] border border-[#00c3ff]/50 shadow-hud-cyan-sm'
                : 'text-[#839493] hover:text-white'
            }`}
            title="Desktop HUD View"
            aria-label="Desktop"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          {/* Mobile Option */}
          <button
            onClick={() => setDeviceTab('mobile')}
            className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold transition-all rounded-full ${
              deviceTab === 'mobile'
                ? 'bg-[#00c3ff]/20 text-[#00ffff] border border-[#00c3ff]/50 shadow-hud-cyan-sm'
                : 'text-[#839493] hover:text-white'
            }`}
            title="Mobile App View"
            aria-label="Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Centered Launch Demo CTA Button Underneath */}
        <button
          onClick={handleLaunchDemo}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/60 text-xs font-bold rounded-full transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,195,255,0.25)] uppercase tracking-wider"
        >
          <span>LAUNCH DEMO</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Multi-Device Stage Container */}
      <div className="relative w-full mx-auto flex items-center justify-center">
        {/* Ambient Backlight Glow Layers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[380px] h-[380px] rounded-full bg-red-500/10 blur-[110px] pointer-events-none -z-10" />

        {/* ── 1. OPEN-SOURCE SAFARI / MACBOOK PRO MOCKUP (DESKTOP ANCHOR) ── */}
        <div
          className={`w-full transition-all duration-500 ${
            deviceTab === 'mobile' ? 'hidden' : 'block'
          } max-w-6xl`}
        >
          {/* Open-Source Magic UI Safari Window Frame */}
          <Safari url="benthic:hub.moltology.org/dashboard">
            {/* 1:1 Fixed Virtual Canvas Rendering the Desktop HUD */}
            <FixedVirtualDesktopHUD />
          </Safari>
        </div>

        {/* ── 2. OPEN-SOURCE IPHONE 15 PRO MOCKUP (MOBILE COMPANION) ── */}
        <div
          className={`transition-all duration-500 ${
            deviceTab === 'desktop'
              ? 'hidden'
              : deviceTab === 'mobile'
              ? 'w-full max-w-sm mx-auto flex justify-center'
              : 'hidden lg:block absolute -bottom-10 right-2 xl:-right-4 z-30 transform -rotate-2 hover:rotate-0 hover:scale-[1.03] transition-all duration-300 drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]'
          }`}
        >
          {/* Open-Source Magic UI iPhone 15 Pro Frame */}
          <Iphone15Pro width={320}>
            <MobileLiveHUDView />
          </Iphone15Pro>
        </div>
      </div>

      {/* Diegetic Showcase Annotation Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-12 max-w-4xl mx-auto font-sans text-xs">
        <div className="p-3.5 bg-[#080d0f]/85 border border-cyan-500/30 rounded-xl flex items-center gap-2.5 text-gray-300 shadow-inner">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Real-time Habit & Focus Telemetry</span>
        </div>
        <div className="p-3.5 bg-[#080d0f]/85 border border-purple-500/30 rounded-xl flex items-center gap-2.5 text-gray-300 shadow-inner">
          <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Full Adaptive Cross-Device Sync</span>
        </div>
        <div className="p-3.5 bg-[#080d0f]/85 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-gray-300 shadow-inner">
          <Shield className="w-4 h-4 text-red-400 shrink-0" />
          <span>Zero Installation or Credit Card Required</span>
        </div>
      </div>
    </div>
  )
}
