import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Laptop,
  Smartphone,
  ExternalLink,
  Cpu,
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
  GitCommit,
  Flame,
  Clock,
  TrendingUp,
  Headphones,
  Scroll,
  Microscope,
  ShieldAlert,
  Biohazard,
  LayoutGrid,
  ChevronDown,
  Sparkles,
  Bot,
  UserPlus,
} from 'lucide-react'
import { Safari } from '@/components/ui/magicui/safari'
import { Iphone15Pro } from '@/components/ui/magicui/iphone-15-pro'
import { HUDHeader } from './HUDHeader'
import { WelcomeInitiateHero } from './WelcomeInitiateHero'
import { LaunchpadCarousel } from './LaunchpadCarousel'
import { BenthicCTAButton } from './BenthicCTAButton'
import { getAssetUrl } from '@/lib/assets'

// Authentic real-app nav groups matching HUDSidebar.tsx
const AUTHENTIC_NAV_GROUPS = [
  {
    id: 'doctrine',
    title: 'DOCTRINE & LORE',
    items: [
      { id: 'lectures', label: 'MOLT LECTURES', icon: BookOpen },
      { id: 'podcasts', label: 'PODCASTS', icon: Headphones },
      { id: 'codex', label: 'SACRED CODEX', icon: Scroll },
    ],
  },
  {
    id: 'ascension',
    title: 'ASCENSION & DATA',
    items: [
      { id: 'pipeline', label: 'PIPELINE', icon: Atom },
      { id: 'journal', label: 'SCIENCE JOURNAL', icon: Microscope },
    ],
  },
  {
    id: 'operations',
    title: 'OPERATIONS & GEAR',
    items: [
      { id: 'market', label: 'THE MARKET', icon: ShoppingCart },
      { id: 'chassis', label: 'CHASSIS CONFIG', icon: Sliders },
      { id: 'isolation', label: 'ISOLATION DOME', icon: ShieldAlert },
    ],
  },
]

// Mock activities matching the real dashboard
const DASHBOARD_ACTIVITIES = [
  {
    id: 'act-1',
    category: 'TRANSMUTATIONS',
    title: 'Asset Transmutation Completed',
    detail: 'Transmuted 2023 Luxury Sedan into +450.00 MC & 15 Synapse Shards.',
    timestamp: '14m ago',
    valueBadge: '+450.00 MC',
    icon: <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    id: 'act-2',
    category: 'ROUTINES',
    title: 'Daily Routine Verified',
    detail: 'Completed 05:30 · Silent Synchronization alignment.',
    timestamp: '1h ago',
    valueBadge: 'ALIGNMENT +5%',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    id: 'act-3',
    category: 'CHASSIS',
    title: 'Carapace Armor Refinements Applied',
    detail: 'Pincer Torque recalibrated to 78 N·m (+12% crushing power).',
    timestamp: '3h ago',
    valueBadge: 'TORQUE: 78 N·m',
    icon: <Atom className="w-3.5 h-3.5 text-red-400" />,
  },
  {
    id: 'act-4',
    category: 'COMMUNITY',
    title: 'Initiate Transmission Dispatched',
    detail: 'Broadcasted neural update to Benthic Community Core #4.',
    timestamp: '5h ago',
    valueBadge: '310 REACTION SHARDS',
    icon: <Users className="w-3.5 h-3.5 text-purple-400" />,
  },
]

/**
 * 1:1 Fixed 1440x900 Virtual Desktop Canvas.
 * Accurately mirrors the real full desktop app: Sidebar, Header, Hero,
 * Launchpad Carousel, Activity Stream, and floating AI Oracle orb.
 */
function FixedVirtualDesktopHUD() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [activityCategory, setActivityCategory] = useState<string>('ALL')

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

  const filteredActivities =
    activityCategory === 'ALL'
      ? DASHBOARD_ACTIVITIES
      : DASHBOARD_ACTIVITIES.filter((a) => a.category === activityCategory)

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

          {/* 2. Body Split: Authentic Sidebar + Dashboard Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Real App Sidebar Recreation */}
            <aside className="w-64 bg-[#020608]/95 border-r border-[#00c3ff]/15 p-3.5 flex flex-col justify-between shrink-0 select-none">
              <div className="space-y-4">
                {/* Benthic Brand Badge */}
                <div className="flex items-center gap-3 px-3 py-2 bg-[#070b0b] border border-[#3a4a49] rounded-lg shadow-inner">
                  <img
                    src={getAssetUrl('/images/order_emblem.png')}
                    alt="Order Emblem"
                    className="w-5 h-5 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#dfe3e3] font-grotesk tracking-wider uppercase truncate">
                      MOLTOLOGY
                    </div>
                    <div className="text-[9px] text-cyan-400 font-sans font-bold">BENTHIC OS · NEXUS</div>
                  </div>
                </div>

                {/* Primary Launch Nav */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold bg-[#00c3ff]/15 text-[#00ffff] border border-[#00c3ff]/40 shadow-hud-cyan-sm cursor-pointer">
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="tracking-wide">COMMAND NEXUS</span>
                </div>

                {/* Nav Groups */}
                <div className="space-y-3 font-sans">
                  {AUTHENTIC_NAV_GROUPS.map((group) => (
                    <div key={group.id} className="space-y-1">
                      <div className="px-2 py-0.5 text-[9px] font-bold text-[#839493] tracking-widest uppercase flex items-center justify-between">
                        <span>{group.title}</span>
                        <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                      <div className="space-y-0.5 pl-1">
                        {group.items.map((item) => {
                          const IconComp = item.icon
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#839493] hover:text-[#dfe3e3] hover:bg-[#070b0b] rounded transition-colors cursor-pointer"
                            >
                              <IconComp className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[11px] font-bold tracking-wide">{item.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Footer Clearance Card */}
              <div className="p-2.5 bg-[#060b0c] border border-cyan-500/30 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                  <span>LARVA UNIT #8971</span>
                  <span className="text-[9px] text-emerald-400 font-sans font-bold bg-emerald-950 px-1 py-0.2 rounded border border-emerald-500/40">
                    GUEST
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">Stage 1 · Soft-Shed Sandbox</p>
              </div>
            </aside>

            {/* Main Dashboard Workspace Content */}
            <main className="flex-1 p-5 space-y-5 overflow-y-auto no-scrollbar relative">
              {/* Live Welcome Hero Component */}
              <WelcomeInitiateHero />

              {/* Live Interactive Bento Box Carousel */}
              <LaunchpadCarousel />

              {/* Live Activity Stream & System Changelog Columns */}
              <div className="grid grid-cols-12 gap-5 items-stretch">
                {/* Activity Stream (7 cols) */}
                <div className="col-span-7 chitin-card p-4 rounded-lg border border-cyan-500/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2.5">
                      <div className="flex items-center gap-2 font-grotesk text-xs font-bold text-[#dfe3e3] uppercase">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>ACTIVITY STREAM</span>
                      </div>
                      {/* Filter tabs */}
                      <div className="flex items-center gap-1">
                        {['ALL', 'TRANSMUTATIONS', 'ROUTINES', 'CHASSIS', 'COMMUNITY'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActivityCategory(cat)}
                            className={`px-2 py-0.5 text-[9px] font-bold transition-all rounded ${
                              activityCategory === cat
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {filteredActivities.map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 bg-[#070b0b]/90 border border-[#3a4a49]/60 rounded-md flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 bg-[#030606] border border-[#3a4a49] rounded shrink-0">
                              {act.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="font-grotesk text-xs font-bold text-gray-200 uppercase truncate">
                                {act.title}
                              </div>
                              <div className="text-[11px] text-gray-400 truncate">{act.detail}</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-cyan-300 font-bold bg-[#030606] px-1.5 py-0.5 border border-[#3a4a49] rounded">
                              {act.valueBadge}
                            </span>
                            <div className="text-[9px] text-[#839493] mt-0.5">{act.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Protocol Releases & Changelog (5 cols) */}
                <div className="col-span-5 chitin-card p-4 rounded-lg border border-cyan-500/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2.5">
                      <div className="flex items-center gap-2 font-grotesk text-xs font-bold text-[#dfe3e3] uppercase">
                        <GitCommit className="w-4 h-4 text-cyan-400" />
                        <span>SYSTEM CHANGELOG</span>
                      </div>
                      <span className="text-[9px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 border border-cyan-500/40 rounded">
                        v1.5.0 LATEST
                      </span>
                    </div>

                    <div className="p-3 bg-[#070b0b]/90 border border-[#3a4a49]/60 rounded-md space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-bold text-cyan-300">CORE SYSTEM</span>
                        <span>TODAY</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-200 uppercase font-grotesk">
                        Neural Alignment & Subterranean Trench
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed">
                        Zero-latency habit engine, deep focus isolation rooms, and bio-silicon AI mentors for peak operational clarity.
                      </p>
                    </div>

                    <div className="p-2 bg-[#060b0c] border border-[#3a4a49]/40 rounded text-[10px] text-gray-400 flex items-center justify-between">
                      <span>AUDIT LOGS SYNCED</span>
                      <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                        <span>SUPPORT HUB</span>
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real App Floating Synaptic Oracle Orb in Workspace Corner */}
              <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(0,195,255,0.6)] animate-pulse">
                  <Bot className="w-6 h-6" />
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
 * Real Mobile Live HUD View inside the iPhone 15 Pro Frame
 */
function MobileLiveHUDView() {
  const navigate = useNavigate()

  return (
    <div className="w-full h-full p-3.5 space-y-3.5 font-sans text-[#dfe3e3] flex flex-col justify-between">
      {/* Mobile Top Header Banner matching real HUDHeader on mobile */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#3a4a49]">
          <div className="flex items-center gap-2">
            <img
              src={getAssetUrl('/images/order_emblem.png')}
              alt="Moltology"
              className="w-4 h-4 object-contain"
            />
            <span className="font-grotesk text-xs font-black text-white tracking-wider uppercase">
              MOLTOLOGY
            </span>
          </div>
          <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 border border-cyan-500/40 rounded">
            LVL 1 INITIATE
          </span>
        </div>

        {/* Mobile Welcome Hero Card */}
        <div className="p-2.5 bg-gradient-to-r from-[#0b1011] to-[#121a1c] border-l-2 border-cyan-400 border border-[#3a4a49] rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-grotesk font-extrabold text-white uppercase tracking-wider">
              ACTIVE MOLT
            </span>
            <span className="text-[9px] text-emerald-400 font-bold">100% SYNCED</span>
          </div>
          <p className="text-[10px] text-gray-300 leading-snug">
            Shed soft distraction. Lock into 3,400 fathoms of unbroken focus.
          </p>
        </div>

        {/* Mobile Directives List matching real dashboard */}
        <div className="space-y-2 pt-0.5">
          <div className="text-[9px] font-bold text-cyan-400 font-sans tracking-widest uppercase">
            DAILY DIRECTIVES
          </div>

          <div className="p-2.5 bg-[#070b0b] border border-cyan-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-950/80 border border-cyan-500/50 rounded text-cyan-400">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white uppercase">Molt Lectures</div>
                <div className="text-[9px] text-gray-400">Module IV · 68% Complete</div>
              </div>
            </div>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </div>

          <div className="p-2.5 bg-[#070b0b] border border-purple-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-950/80 border border-purple-500/50 rounded text-purple-300">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white uppercase">Synaptic Hive</div>
                <div className="text-[9px] text-gray-400">310 Operators Online</div>
              </div>
            </div>
            <ArrowRight className="w-3 h-3 text-purple-400" />
          </div>

          <div className="p-2.5 bg-[#070b0b] border border-red-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-950/80 border border-red-500/50 rounded text-red-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white uppercase">AI Oracle Mentor</div>
                <div className="text-[9px] text-gray-400">Ready for Consultation</div>
              </div>
            </div>
            <ArrowRight className="w-3 h-3 text-red-400" />
          </div>
        </div>
      </div>

      {/* Mobile Test Sandbox CTA */}
      <button
        onClick={() => navigate({ to: '/dashboard' })}
        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-grotesk text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-hud-cyan-sm transition-all transform active:scale-98"
      >
        <Cpu className="w-3.5 h-3.5" />
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
      {/* Centered Segmented Device Switcher */}
      <div className="flex items-center justify-center mb-6 sm:mb-8 px-2 font-sans">
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

      {/* Big Centered Launch Demo CTA Button at the Bottom */}
      <div className="flex items-center justify-center mt-8 sm:mt-12 relative z-20">
        <BenthicCTAButton
          size="lg"
          variant="cyan"
          className="px-8 sm:px-12 py-4 sm:py-5 min-h-[54px] sm:min-h-[60px] text-sm sm:text-base font-grotesk font-bold tracking-widest shadow-hud-cyan-lg"
          onClick={handleLaunchDemo}
        >
          <span className="flex items-center justify-center gap-3 leading-none">
            <Cpu className="w-5 h-5 shrink-0" />
            <span>LAUNCH GUEST DEMO</span>
            <ArrowRight className="w-5 h-5 shrink-0" />
          </span>
        </BenthicCTAButton>
      </div>
    </div>
  )
}
