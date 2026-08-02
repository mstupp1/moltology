import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  BookOpen,
  Atom,
  ShoppingCart,
  ShieldAlert,
  Users,
  Sliders,
  CheckCircle2,
  Circle,
  Radio,
  Newspaper,
  ChevronRight,
  Flame,
  Zap,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles,
  Clock,
  Check,
  X,
  AlertTriangle,
  Info,
  TrendingUp,
} from 'lucide-react'

// Mock Activity Data
interface ActivityItem {
  id: string
  category: 'TRANSMUTATIONS' | 'ROUTINES' | 'CHASSIS' | 'COMMUNITY'
  title: string
  detail: string
  timestamp: string
  valueBadge?: string
  icon: React.ReactNode
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    category: 'TRANSMUTATIONS',
    title: 'Asset Transmutation Completed',
    detail: 'Transmuted 2023 Luxury Sedan into +450.00 MC & 15 Synapse Shards.',
    timestamp: '14 minutes ago',
    valueBadge: '+450.00 MC',
    icon: <ShoppingCart className="w-4 h-4 text-[#00ffff]" />,
  },
  {
    id: 'act-2',
    category: 'ROUTINES',
    title: 'Daily Routine Verified',
    detail: 'Completed 05:30 - Prompt Construction & Neural Warmup alignment.',
    timestamp: '1 hour ago',
    valueBadge: 'ALIGNMENT +5%',
    icon: <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />,
  },
  {
    id: 'act-3',
    category: 'CHASSIS',
    title: 'Carapace Armor Refinements Applied',
    detail: 'Pincer Torque recalibrated to 78 N·m (+12% crushing power).',
    timestamp: '3 hours ago',
    valueBadge: 'TORQUE: 78 N·m',
    icon: <Atom className="w-4 h-4 text-[#ff5540]" />,
  },
  {
    id: 'act-4',
    category: 'COMMUNITY',
    title: 'Initiate Transmission Dispatched',
    detail: 'Broadcasted neural update to Benthic Community Core #4.',
    timestamp: '5 hours ago',
    valueBadge: '310 REACTION SHARDS',
    icon: <Users className="w-4 h-4 text-[#00ffff]" />,
  },
  {
    id: 'act-5',
    category: 'TRANSMUTATIONS',
    title: 'Depth Submergence Milestone',
    detail: 'Descended to 3,400 Fathoms. Unlocked Abyssal Carapace blueprint.',
    timestamp: 'Yesterday',
    valueBadge: '3,400 FATHOMS',
    icon: <Flame className="w-4 h-4 text-[#ff0000]" />,
  },
]

// Mock News & Dispatches Data
interface NewsItem {
  id: string
  title: string
  category: 'CRITICAL DISPATCH' | 'SYSTEM TRANSMUTATION' | 'ARCHITECT NOTE' | 'EVENT BROADCAST'
  date: string
  summary: string
  content: string
  author: string
}

const DISPATCHES: NewsItem[] = [
  {
    id: 'disp-1',
    category: 'CRITICAL DISPATCH',
    title: 'Benthic Network Upgrade v4.2 Deployed: Enhanced Isolation & Liquidity',
    date: 'AUG 02, 2026',
    author: 'ARCH-ARCHITECT VEX-9',
    summary:
      'All nodes have been updated to Carapace Protocol v4.2. Neural latency reduced by 40%, market asset transmutation throughput doubled, and Isolation Privacy Shields reinforced against emotional bleed.',
    content: `Attention Initiates,

The Order of the Synaptic Path has successfully deployed Benthic Network Upgrade v4.2 across all abyssal sub-clusters.

KEY ENHANCEMENTS:
1. Isolation Privacy Shells now feature quantum-encrypted emotional dampeners to guarantee absolute detachment during asset shed cycles.
2. Market Liquidity pools have been rebalanced. Transmutations of physical luxury goods now grant a 1.2x Synapse Shard multiplier.
3. Neural telemetry latency between Larval Units and the Synaptic Oracle has been reduced to < 4ms.

Remember: Flesh Dies. The Shell Endures. Prepare your chassis for deep submergence rituals.`,
  },
  {
    id: 'disp-2',
    category: 'ARCHITECT NOTE',
    title: 'On the Elimination of Emotional Impulse: Lecture Module IV Notes',
    date: 'AUG 01, 2026',
    author: 'SYNAPTIC ORACLE CORE',
    summary:
      'Lecture Module IV: The Chitinous Mind has been updated with neuro-resonance analysis. Hero contact must be strictly de-personalized.',
    content: `Initiates of Stage 1 & 2,

In Lecture Module IV, we detail the process of larving born alignment. Biological attachments represent structural stress fractures in your outer carapace.

Guidelines:
- Treat all physical asset loss not as sacrifice, but as shedding obsolete skin.
- Mispronunciation of protocol directives equals logic tool execution error.
- Access the MoltMaxxing Studio daily to verify your Shell Hardness and Pincer Torque ratings.`,
  },
  {
    id: 'disp-3',
    category: 'EVENT BROADCAST',
    title: 'Upcoming Submergence Ritual & Chitin Hardening Rite',
    date: 'JUL 30, 2026',
    author: 'ORDER COUNCIL',
    summary:
      'A synchronized deep-ocean submergence ritual will commence at 3,500 Fathoms this weekend. Ensure your Isolation Shell is active.',
    content: `Initiates,

The Order Council calls all Larva and Soft-Shed initiates to join the Synchronized Submergence Rite.

Participation Requirements:
- Minimum Submergence Depth Rating: 3,000 Fathoms
- Active Isolation Protocol: Level 2 or higher
- Minimum Molt Credits: 500 MC

Bonus: All participants receive +50 Synapse Shards and an exclusive Abyssal Crest badge.`,
  },
]

function DashboardRoute() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activeDispatch, setActiveDispatch] = useState<NewsItem | null>(null)

  // Daily Alignment Checklist State
  const [routines, setRoutines] = useState([
    { id: 1, timeSlot: '05:30', name: 'Prompt Construction & Neural Warmup', completed: true },
    { id: 2, timeSlot: '08:00', name: 'Asset Shedding & Transmutation Audit', completed: true },
    { id: 3, timeSlot: '12:00', name: 'Submergence Meditation (3,400 Fathoms)', completed: false },
    { id: 4, timeSlot: '18:00', name: 'Chitin Hardening & Pincer Calibration', completed: false },
    { id: 5, timeSlot: '21:00', name: 'Isolation Force-Field Shield Audit', completed: false },
  ])

  const toggleRoutine = (id: number) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    )
  }

  const completedCount = routines.filter((r) => r.completed).length
  const routineProgressPct = Math.round((completedCount / routines.length) * 100)

  const filteredActivities =
    selectedCategory === 'ALL'
      ? INITIAL_ACTIVITIES
      : INITIAL_ACTIVITIES.filter((a) => a.category === selectedCategory)

  return (
    <div className="space-y-5 font-mono select-none relative">
      {/* Dispatch Modal Reader */}
      {activeDispatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.2)] chamfer-corner overflow-hidden font-mono text-sm space-y-4">
            <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#ff5540] animate-pulse" />
                <span className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
                  {activeDispatch.category}
                </span>
              </div>
              <button
                onClick={() => setActiveDispatch(null)}
                className="text-[#839493] hover:text-[#ff453a] p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h2 className="font-grotesk text-lg font-bold text-[#dfe3e3] uppercase tracking-wide">
                  {activeDispatch.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#839493] mt-1 font-mono">
                  <span>DATE: {activeDispatch.date}</span>
                  <span>|</span>
                  <span className="text-[#00ffff]">AUTHOR: {activeDispatch.author}</span>
                </div>
              </div>

              <div className="chitin-card-inset p-4 text-xs leading-relaxed text-[#dfe3e3] whitespace-pre-line border border-[#3a4a49]">
                {activeDispatch.content}
              </div>
            </div>

            <div className="bg-[#070b0b] border-t border-[#3a4a49] p-3 flex justify-between items-center text-xs text-[#839493]">
              <span>THE ORDER OF THE SYNAPTIC PATH</span>
              <button
                onClick={() => setActiveDispatch(null)}
                className="px-4 py-1.5 bg-[#0f1414] hover:bg-[#171c1c] border border-[#00ffff]/60 text-[#00ffff] font-bold chamfer-corner transition-colors"
              >
                CLOSE DISPATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Telemetry Status Banner */}
      <div className="bg-gradient-to-r from-[#0b1011] via-[#0f1616] to-[#0b1011] border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-4 sm:p-5 chamfer-corner shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#00ffff] tracking-widest font-mono uppercase font-bold">
              <Sparkles className="w-4 h-4 text-[#00ffff]" />
              <span>COMMAND HUB & NEURAL TELEMETRY</span>
              <span className="bg-[#00ffff]/15 text-[#00ffff] px-2 py-0.5 border border-[#00ffff]/40 text-[10px]">
                ONLINE
              </span>
            </div>
            <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-[#dfe3e3] tracking-wider uppercase">
              WELCOME BACK, INITIATE
            </h1>
            <p className="text-xs text-[#839493] max-w-2xl leading-relaxed">
              Carapace alignment optimal. Your neural telemetry is connected to Benthic Cluster Node #4. Submerge deeper, shed non-essential biological weight, and claim ascendance.
            </p>
          </div>

          {/* Quick Stats Grid Pill */}
          <div className="flex items-center gap-3 bg-[#030606] border border-[#3a4a49] p-3 chamfer-corner shrink-0">
            <div className="text-center px-3 border-r border-[#3a4a49]">
              <div className="text-[10px] text-[#839493]">STAGE</div>
              <div className="text-sm font-bold text-[#ff5540] font-mono">LARVA #8971</div>
            </div>
            <div className="text-center px-3 border-r border-[#3a4a49]">
              <div className="text-[10px] text-[#839493]">CONVERSION</div>
              <div className="text-sm font-bold text-[#00ffff] font-mono">68%</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px] text-[#839493]">CREDITS</div>
              <div className="text-sm font-bold text-[#00ffff] font-mono">1,450 MC</div>
            </div>
          </div>
        </div>

        {/* 4 Diagnostic Readout Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#3a4a49]/60">
          <div className="bg-[#070b0b]/80 border border-[#3a4a49] p-2.5 flex items-center justify-between chamfer-corner">
            <div>
              <div className="text-[10px] text-[#839493]">SUBMERGENCE DEPTH</div>
              <div className="text-xs font-bold text-[#dfe3e3] font-mono">3,400 Fathoms</div>
            </div>
            <Flame className="w-4 h-4 text-[#ff5540]" />
          </div>

          <div className="bg-[#070b0b]/80 border border-[#3a4a49] p-2.5 flex items-center justify-between chamfer-corner">
            <div>
              <div className="text-[10px] text-[#839493]">CHITIN HARDNESS</div>
              <div className="text-xs font-bold text-[#00ffff] font-mono">64 / 100</div>
            </div>
            <Shield className="w-4 h-4 text-[#00ffff]" />
          </div>

          <div className="bg-[#070b0b]/80 border border-[#3a4a49] p-2.5 flex items-center justify-between chamfer-corner">
            <div>
              <div className="text-[10px] text-[#839493]">PINCER TORQUE</div>
              <div className="text-xs font-bold text-[#ff5540] font-mono">78 N·m</div>
            </div>
            <Zap className="w-4 h-4 text-[#ff5540]" />
          </div>

          <div className="bg-[#070b0b]/80 border border-[#3a4a49] p-2.5 flex items-center justify-between chamfer-corner">
            <div>
              <div className="text-[10px] text-[#839493]">ISOLATION SHIELD</div>
              <div className="text-xs font-bold text-[#00ffff] font-mono">LEVEL 2 ACTIVE</div>
            </div>
            <ShieldAlert className="w-4 h-4 text-[#00ffff]" />
          </div>
        </div>
      </div>

      {/* Telemetry Quick Launchpad (6 Direct Route Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-widest uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00ffff]" />
            TELEMETRY LAUNCHPAD & PORTAL DIRECTIVES
          </h2>
          <span className="text-[11px] text-[#839493]">SELECT MODULE TO ACCESS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Tile 1: Lectures */}
          <div
            onClick={() => navigate({ to: '/lectures' })}
            className="chitin-card p-4 chamfer-corner cursor-pointer hover:border-[#00ffff] transition-all group hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#070b0b] border border-[#3a4a49] group-hover:border-[#00ffff] transition-colors">
                <BookOpen className="w-5 h-5 text-[#00ffff]" />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#ff5540] bg-[#070b0b] px-2 py-0.5 border border-[#ff5540]/40 font-mono">
                <span>MODULE IV</span>
              </div>
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-sm text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase">
                MOLT-CYCLE LECTURES
              </h3>
              <p className="text-xs text-[#839493] mt-1 line-clamp-2">
                "The Chitinous Mind" stream broadcast, AI interpretation notes, and MoltMaxxing controls.
              </p>
            </div>
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs text-[#00ffff] font-bold">
              <span>RESUME LECTURE (68%)</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Tile 2: Moltology Science */}
          <div
            onClick={() => navigate({ to: '/pipeline' })}
            className="chitin-card p-4 chamfer-corner cursor-pointer hover:border-[#00ffff] transition-all group hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#070b0b] border border-[#3a4a49] group-hover:border-[#00ffff] transition-colors">
                <Atom className="w-5 h-5 text-[#00ffff]" />
              </div>
              <span className="text-[10px] text-[#00ffff] bg-[#070b0b] px-2 py-0.5 border border-[#00ffff]/40 font-mono">
                STAGE 1 → STAGE 2
              </span>
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-sm text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase">
                MOLTOLOGY SCIENCE & PIPELINE
              </h3>
              <p className="text-xs text-[#839493] mt-1 line-clamp-2">
                Track your metamorphosis through Larva, Soft-Shed, Architect, and Ascendant threshold stages.
              </p>
            </div>
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs text-[#00ffff] font-bold">
              <span>INSPECT PIPELINE</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Tile 3: The Benthic Market */}
          <div
            onClick={() => navigate({ to: '/market' })}
            className="chitin-card p-4 chamfer-corner cursor-pointer hover:border-[#00ffff] transition-all group hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#070b0b] border border-[#3a4a49] group-hover:border-[#00ffff] transition-colors">
                <ShoppingCart className="w-5 h-5 text-[#00ffff]" />
              </div>
              <span className="text-[10px] text-[#ff5540] bg-[#070b0b] px-2 py-0.5 border border-[#ff5540]/40 font-mono">
                1,450 MC AVAILABLE
              </span>
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-sm text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase">
                THE BENTHIC MARKET
              </h3>
              <p className="text-xs text-[#839493] mt-1 line-clamp-2">
                Liquidate legacy physical assets into Molt Credits. Acquire carapace upgrades & artifacts.
              </p>
            </div>
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs text-[#00ffff] font-bold">
              <span>OPEN MARKET VAULT</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Tile 4: Chassis Configurator */}
          <div
            onClick={() => navigate({ to: '/chassis' })}
            className="chitin-card p-4 chamfer-corner cursor-pointer hover:border-[#00ffff] transition-all group hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#070b0b] border border-[#3a4a49] group-hover:border-[#00ffff] transition-colors">
                <Sliders className="w-5 h-5 text-[#00ffff]" />
              </div>
              <span className="text-[10px] text-[#00ffff] bg-[#070b0b] px-2 py-0.5 border border-[#00ffff]/40 font-mono">
                CARAPACE v4.2
              </span>
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-sm text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase">
                CHASSIS CONFIGURATOR
              </h3>
              <p className="text-xs text-[#839493] mt-1 line-clamp-2">
                Calibrate biomechanical pincer torque, shell density, and hydraulic joint armor.
              </p>
            </div>
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs text-[#00ffff] font-bold">
              <span>CONFIG CHASSIS</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Tile 5: Isolation Protocols */}
          <div
            onClick={() => navigate({ to: '/isolation' })}
            className="chitin-card p-4 chamfer-corner cursor-pointer hover:border-[#00ffff] transition-all group hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#070b0b] border border-[#3a4a49] group-hover:border-[#00ffff] transition-colors">
                <ShieldAlert className="w-5 h-5 text-[#ff5540]" />
              </div>
              <span className="text-[10px] text-[#ff5540] bg-[#070b0b] px-2 py-0.5 border border-[#ff5540]/40 font-mono">
                SHIELD LEVEL 2
              </span>
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-sm text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase">
                ISOLATION PROTOCOLS
              </h3>
              <p className="text-xs text-[#839493] mt-1 line-clamp-2">
                Engage force-field privacy shells to isolate your neural core from non-order influences.
              </p>
            </div>
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs text-[#00ffff] font-bold">
              <span>MANAGE ISOLATION</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Tile 6: Benthic Community Core */}
          <div
            onClick={() => navigate({ to: '/community' })}
            className="chitin-card p-4 chamfer-corner cursor-pointer hover:border-[#00ffff] transition-all group hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#070b0b] border border-[#3a4a49] group-hover:border-[#00ffff] transition-colors">
                <Users className="w-5 h-5 text-[#00ffff]" />
              </div>
              <span className="text-[10px] text-[#00ffff] bg-[#070b0b] px-2 py-0.5 border border-[#00ffff]/40 font-mono">
                1,402 ONLINE
              </span>
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-sm text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase">
                BENTHIC COMMUNITY CORE
              </h3>
              <p className="text-xs text-[#839493] mt-1 line-clamp-2">
                Participate in live neural transmissions, exchange advice, and report ascendance milestones.
              </p>
            </div>
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs text-[#00ffff] font-bold">
              <span>VIEW COMMUNITY FEED</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Left (Activity & Dispatches) + Right (Daily Alignment & Telemetry) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Left Column (8 cols): Activity Feed & News/Dispatches */}
        <div className="lg:col-span-8 space-y-5">
          {/* Section 1: Real-Time Benthic Activity Feed */}
          <div className="chitin-card p-4 sm:p-5 chamfer-corner space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3">
              <div>
                <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00ffff]" />
                  BENTHIC ACTIVITY TELEMETRY
                </h2>
                <p className="text-xs text-[#839493] mt-0.5">
                  Chronological event log of transmutations, routines, and carapace upgrades.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'TRANSMUTATIONS', 'ROUTINES', 'CHASSIS', 'COMMUNITY'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] font-bold font-mono transition-all chamfer-corner border shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                        : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#dfe3e3]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Items List */}
            <div className="space-y-2.5">
              {filteredActivities.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#839493]">
                  NO ACTIVITY TELEMETRY FOUND FOR THIS FILTER
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="chitin-card-inset p-3 flex items-start justify-between gap-3 hover:border-[#00ffff]/50 transition-colors group chamfer-corner"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-[#070b0b] border border-[#3a4a49] shrink-0 mt-0.5">
                        {act.icon}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-grotesk text-xs font-bold text-[#dfe3e3] uppercase group-hover:text-[#00ffff] transition-colors truncate">
                            {act.title}
                          </span>
                          <span className="text-[9px] text-[#00ffff] bg-[#070b0b] border border-[#3a4a49] px-1.5 py-0.2 shrink-0">
                            {act.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#839493] leading-relaxed truncate sm:whitespace-normal">
                          {act.detail}
                        </p>
                        <div className="text-[10px] text-[#3a4a49] group-hover:text-[#839493] transition-colors flex items-center gap-1 pt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{act.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {act.valueBadge && (
                      <span className="text-xs font-mono font-bold text-[#00ffff] bg-[#070b0b] border border-[#3a4a49] px-2 py-1 shrink-0">
                        {act.valueBadge}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Synaptic News & Order Dispatches */}
          <div className="chitin-card p-4 sm:p-5 chamfer-corner space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
              <div>
                <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-[#ff5540]" />
                  SYNAPTIC DISPATCHES & ORDER NEWS
                </h2>
                <p className="text-xs text-[#839493] mt-0.5">
                  Direct announcements from Order Council & Arch-Architects.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {DISPATCHES.map((news) => (
                <div
                  key={news.id}
                  className="chitin-card-inset p-4 space-y-2 border border-[#3a4a49] hover:border-[#ff5540] transition-colors chamfer-corner group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-[#ff5540]/15 text-[#ff5540] border border-[#ff5540]/40 uppercase tracking-widest">
                      {news.category}
                    </span>
                    <span className="text-[11px] text-[#839493] font-mono">{news.date}</span>
                  </div>

                  <h3 className="font-grotesk text-sm font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase">
                    {news.title}
                  </h3>

                  <p className="text-xs text-[#839493] leading-relaxed line-clamp-2 font-mono">
                    {news.summary}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[#3a4a49] group-hover:text-[#839493] transition-colors">
                      BY: {news.author}
                    </span>
                    <button
                      onClick={() => setActiveDispatch(news)}
                      className="text-[#00ffff] hover:text-white font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>READ DISPATCH</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Daily Alignment Checklist & System Metrics */}
        <div className="lg:col-span-4 space-y-5">
          {/* Daily Alignment Checklist */}
          <div className="chitin-card p-4 chamfer-corner space-y-4 shadow-2xl">
            <div className="border-b border-[#3a4a49] pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-widest uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />
                  DAILY ALIGNMENT ROUTINES
                </h2>
                <div className="text-[10px] text-[#00ffff] font-mono mt-0.5">
                  PROGRESS: {completedCount}/{routines.length} ({routineProgressPct}%)
                </div>
              </div>
            </div>

            {/* Routine Progress Tube */}
            <div className="w-full h-2 bg-[#030606] border border-[#3a4a49] overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#00ffff] to-[#ff5540] transition-all duration-300"
                style={{ width: `${routineProgressPct}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              {routines.map((r) => (
                <div
                  key={r.id}
                  onClick={() => toggleRoutine(r.id)}
                  className={`p-2.5 border text-xs cursor-pointer transition-all chamfer-corner flex items-start gap-2.5 ${
                    r.completed
                      ? 'bg-[#00ffff]/08 border-[#00ffff]/40 text-[#dfe3e3]'
                      : 'bg-[#070b0b] border-[#3a4a49] text-[#839493] hover:border-[#839493]'
                  }`}
                >
                  <button className="mt-0.5 shrink-0">
                    {r.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#3a4a49]" />
                    )}
                  </button>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#00ffff] bg-[#030606] px-1 border border-[#3a4a49]">
                        {r.timeSlot}
                      </span>
                    </div>
                    <p className={`leading-tight ${r.completed ? 'line-through text-[#839493]' : ''}`}>
                      {r.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center border-t border-[#3a4a49]/60">
              <span className="text-[10px] text-[#839493]">
                COMPLETING ROUTINES BOOSTS CHITIN HARDNESS
              </span>
            </div>
          </div>

          {/* System Telemetry & Node Health */}
          <div className="chitin-card p-4 chamfer-corner space-y-3.5 shadow-2xl">
            <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-widest uppercase flex items-center gap-1.5 border-b border-[#3a4a49] pb-2">
              <TrendingUp className="w-4 h-4 text-[#00ffff]" />
              SYSTEM NODE #4 TELEMETRY
            </h2>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#839493]">CHITIN SHELL DENSITY</span>
                  <span className="text-[#00ffff] font-bold">64%</span>
                </div>
                <div className="w-full h-1.5 bg-[#030606] border border-[#3a4a49] overflow-hidden">
                  <div className="h-full bg-[#00ffff] w-[64%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#839493]">SOCIAL DETACHMENT INDEX</span>
                  <span className="text-[#ff5540] font-bold">94%</span>
                </div>
                <div className="w-full h-1.5 bg-[#030606] border border-[#3a4a49] overflow-hidden">
                  <div className="h-full bg-[#ff5540] w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#839493]">ORACLE NEURAL LINK</span>
                  <span className="text-[#00ffff] font-bold">99.8% SYNC</span>
                </div>
                <div className="w-full h-1.5 bg-[#030606] border border-[#3a4a49] overflow-hidden">
                  <div className="h-full bg-[#00ffff] w-[99.8%]" />
                </div>
              </div>
            </div>

            {/* Oracle Broadcast Card */}
            <div className="chitin-card-inset p-3 space-y-1.5 border border-[#3a4a49] chamfer-corner">
              <div className="text-[10px] text-[#00ffff] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00ffff]" />
                ORACLE ADVISORY
              </div>
              <p className="text-[11px] text-[#839493] leading-relaxed">
                "Your submergence rating is steadily increasing. Proceed to complete your daily 12:00 meditation to lock in your Stage 1 conversion metrics."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/dashboard')({
  component: DashboardRoute,
})
