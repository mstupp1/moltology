import React, { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import {
  Activity,
  ShoppingCart,
  CheckCircle2,
  Atom,
  Users,
  Flame,
  Radio,
  Shield,
  ShieldAlert,
  Zap,
  Sparkles,
  Clock,
  TrendingUp,
  GitCommit,
  ChevronRight,
  ExternalLink,
  Tag,
  X,
  FileText,
} from 'lucide-react'
import { LaunchpadCarousel } from '@/components/hud/LaunchpadCarousel'
import { DailyRoutineWidget } from '@/components/hud/DailyRoutineWidget'
import { WelcomeInitiateHero } from '@/components/hud/WelcomeInitiateHero'
import { INITIAL_CHANGELOGS, type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogs } from '@/lib/changelogs'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

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
  {
    id: 'act-6',
    category: 'ROUTINES',
    title: 'Subterranean Meditation Calibrated',
    detail: 'Achieved 99.8% neural quietude during 12:00 Benthic Alignment.',
    timestamp: 'Yesterday',
    valueBadge: '+120 XP',
    icon: <Radio className="w-4 h-4 text-[#00ffff]" />,
  },
  {
    id: 'act-7',
    category: 'CHASSIS',
    title: 'Chitin Shell Density Upgraded',
    detail: 'Hardened outer carapace to Level 4 Structural Integrity.',
    timestamp: '2 days ago',
    valueBadge: 'HARDNESS 64',
    icon: <Shield className="w-4 h-4 text-[#00ffff]" />,
  },
  {
    id: 'act-8',
    category: 'COMMUNITY',
    title: 'Larva Ascension Registry Approved',
    detail: 'Promoted 4 new initiates to Stage 1 Crustacean Aspirants.',
    timestamp: '2 days ago',
    valueBadge: 'ASCENSION VETTED',
    icon: <TrendingUp className="w-4 h-4 text-[#ff5540]" />,
  },
]

function DashboardRoute() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [changelogsList, setChangelogsList] = useState<ChangelogEntry[]>(INITIAL_CHANGELOGS)
  const [activeChangelogModal, setActiveChangelogModal] = useState<ChangelogEntry | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadChangelogs() {
      try {
        const fetched = await getPublicChangelogs()
        if (isMounted && fetched && fetched.length > 0) {
          setChangelogsList(fetched)
        }
      } catch {
        // fallback to initial
      }
    }
    loadChangelogs()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredActivities =
    selectedCategory === 'ALL'
      ? INITIAL_ACTIVITIES
      : INITIAL_ACTIVITIES.filter((a) => a.category === selectedCategory)

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      {/* Changelog Detail Modal */}
      {activeChangelogModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.25)] chamfer-corner overflow-hidden font-sans text-sm space-y-4">
            <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#00ffff]" />
                <span className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
                  RELEASE {activeChangelogModal.version}
                </span>
                <span className="text-xs text-[#839493] bg-[#070b0b] px-2 py-0.5 border border-[#3a4a49]">
                  {activeChangelogModal.category}
                </span>
                {Array.isArray(activeChangelogModal.tags) &&
                  activeChangelogModal.tags
                    .filter((t) => t.toLowerCase() !== activeChangelogModal.category?.toLowerCase())
                    .map((tag) => (
                      <span key={tag} className="text-[10px] text-[#00ffff]/80 bg-[#00ffff]/10 px-1.5 py-0.5 border border-[#00ffff]/30">
                        {tag}
                      </span>
                    ))}
              </div>
              <button
                onClick={() => setActiveChangelogModal(null)}
                className="text-[#839493] hover:text-[#ff5540] p-1 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <h3 className="font-grotesk text-base sm:text-lg font-bold text-[#dfe3e3] uppercase leading-snug">
                {activeChangelogModal.title}
              </h3>

              <p className="text-xs text-[#839493] leading-relaxed border-l-2 border-[#00ffff] pl-3">
                {activeChangelogModal.summary}
              </p>

              <div className="chitin-card-inset p-4 text-xs leading-relaxed text-[#dfe3e3] whitespace-pre-line border border-[#3a4a49]">
                {activeChangelogModal.content}
              </div>
            </div>

            <div className="bg-[#070b0b] border-t border-[#3a4a49] p-3 flex items-center justify-between text-xs text-[#839493]">
              <span>
                RELEASED:{' '}
                {new Date(activeChangelogModal.releasedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() => setActiveChangelogModal(null)}
                className="px-4 py-1.5 bg-[#0f1414] hover:bg-[#171c1c] border border-[#3a4a49] text-[#dfe3e3] font-bold chamfer-corner transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Serene & Inspiring Welcome Initiate Hero Section */}
      <WelcomeInitiateHero />

      {/* Comprehensive Bento Box (6-Directive Rotating Carousel + MoltNation News) */}
      <LaunchpadCarousel />

      {/* Full Daily Alignment Routine & 14-Day Streak Matrix */}
      <DailyRoutineWidget />

      {/* 2-Column Section: Left (Activity Stream) + Right (Changelog & Protocol Releases) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
        {/* Left Column (7 cols): Real-Time Benthic Activity Stream */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3 shrink-0">
                <div>
                  <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00ffff]" />
                    ACTIVITY STREAM
                  </h2>
                  <p className="text-xs text-[#839493] mt-0.5">
                    Live events, transmutations, and upgrades.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'TRANSMUTATIONS', 'ROUTINES', 'CHASSIS', 'COMMUNITY'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 text-[9px] font-bold font-sans transition-all chamfer-corner border shrink-0 ${
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
              <div className="space-y-1.5 font-sans">
                {filteredActivities.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#839493]">
                    NO ACTIVITY FOUND FOR THIS FILTER
                  </div>
                ) : (
                  filteredActivities.slice(0, 5).map((act) => (
                    <div
                      key={act.id}
                      className="chitin-card-inset p-2.5 flex items-start justify-between gap-2.5 hover:border-[#00ffff]/50 transition-colors group chamfer-corner"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1.5 bg-[#070b0b] border border-[#3a4a49] shrink-0 mt-0.5">
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
                          <p className="text-[11px] text-[#839493] leading-snug line-clamp-1">
                            {act.detail}
                          </p>
                          <div className="text-[10px] text-[#3a4a49] group-hover:text-[#839493] transition-colors flex items-center gap-1 pt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{act.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      {act.valueBadge && (
                        <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#070b0b] border border-[#3a4a49] px-1.5 py-0.5 shrink-0">
                          {act.valueBadge}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): System Changelog & Releases */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3 sm:space-y-3.5 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-[#00ffff]" />
                  <div>
                    <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
                      SYSTEM CHANGELOG
                    </h2>
                    <p className="text-xs text-[#839493]">
                      Protocol updates & release history.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/40 px-2 py-0.5 chamfer-corner">
                  v1.5.0 LATEST
                </span>
              </div>

              {/* Changelog Entries Stack */}
              <div className="space-y-2 font-sans">
                {changelogsList.slice(0, 3).map((item) => (
                  <div
                    key={item.version}
                    onClick={() => setActiveChangelogModal(item)}
                    className="chitin-card-inset p-3 border border-[#3a4a49] hover:border-[#00ffff]/60 transition-all chamfer-corner cursor-pointer group space-y-1.5 bg-[#070b0b]/60"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#00ffff] bg-[#030606] px-1.5 py-0.2 border border-[#00ffff]/40">
                          {item.version}
                        </span>
                        <span className="text-[#839493] bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49]">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-[#839493] text-[9px]">
                        {new Date(item.releasedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-1 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-[#839493] line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="pt-1 border-t border-[#3a4a49]/40 flex items-center justify-between text-[9px] text-[#839493]">
                      <span>CLICK TO INSPECT NOTES</span>
                      <span className="text-[#00ffff] font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                        <span>VIEW</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Support Desk Link */}
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
              <span className="text-[#839493] text-[10px]">
                FULL AUDIT LOGS IN SUPPORT HUB
              </span>
              <button
                onClick={() => navigate({ to: '/support' })}
                className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
              >
                <span>SUPPORT HUB</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/dashboard')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Central HUD | Moltology',
        description: 'Initiate telemetry, daily alignment, and benthic workspace for authenticated units.',
      }),
    ],
  }),
  component: DashboardRoute,
  pendingComponent: HudWorkspaceGhost,
})
