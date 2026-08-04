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
import { DailyRoutineWidget } from '@/components/hud/DailyRoutineWidget'
import { LaunchpadCarousel } from '@/components/hud/LaunchpadCarousel'
import { DashboardNewsWidget } from '@/components/hud/DashboardNewsWidget'


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
    detail: 'Completed 05:30 - Silent Synchronization alignment.',
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

function DashboardRoute() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const filteredActivities =
    selectedCategory === 'ALL'
      ? INITIAL_ACTIVITIES
      : INITIAL_ACTIVITIES.filter((a) => a.category === selectedCategory)

  return (
    <div className="space-y-5 font-mono select-none relative">


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

      {/* Telemetry Quick Launchpad Carousel (6 Direct Route Modules) */}
      <LaunchpadCarousel />

      {/* Major Daily Alignment Routine & Streak Matrix Section */}
      <DailyRoutineWidget />


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

          {/* Section 2: MoltNation Intelligence & News Feed Widget */}
          <DashboardNewsWidget />

        </div>

        {/* Right Column (4 cols): System Metrics & Telemetry */}
        <div className="lg:col-span-4 space-y-5">
          {/* Alignment Status Summary Card */}
          <div className="chitin-card p-4 chamfer-corner space-y-3.5 shadow-2xl">
            <div className="border-b border-[#3a4a49] pb-2 flex items-center justify-between">
              <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-widest uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />
                ALIGNMENT TELEMETRY
              </h2>
              <span className="text-[10px] text-[#00ffff] font-mono font-bold">7-DAY STREAK 🔥</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-[#070b0b] p-2 border border-[#3a4a49]">
                <span className="text-[#839493]">ACTIVE STREAK</span>
                <span className="text-[#ff5540] font-bold">7 DAYS</span>
              </div>
              <div className="flex justify-between items-center bg-[#070b0b] p-2 border border-[#3a4a49]">
                <span className="text-[#839493]">CONSISTENCY RATING</span>
                <span className="text-[#00ffff] font-bold">96.4% ALIGNED</span>
              </div>
              <div className="flex justify-between items-center bg-[#070b0b] p-2 border border-[#3a4a49]">
                <span className="text-[#839493]">XP MULTIPLIER</span>
                <span className="text-[#00ffff] font-bold">1.5x ACTIVE</span>
              </div>
            </div>

            <div className="pt-1 text-center">
              <a
                href="#daily-routine-hub"
                className="text-[11px] text-[#00ffff] hover:underline font-bold flex items-center justify-center gap-1"
              >
                <span>VIEW COMPLETE 8-TASK ROUTINE MATRIX</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
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
