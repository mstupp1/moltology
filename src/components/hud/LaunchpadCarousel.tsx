import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Layers,
  BookOpen,
  Atom,
  ShoppingCart,
  Sliders,
  ShieldAlert,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Play,
  Pause,
  Info,
  Sparkles,
  CheckCircle2,
  Lock,
  Wrench,
  ExternalLink,
  X,
} from 'lucide-react'
import { HudCard, HudBadge } from '@/components/ui'
import { LaunchpadCarouselGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'

export interface LaunchpadCarouselProps {
  isLoading?: boolean
}

export interface RelatedItem {
  id: string
  title: string
  status: 'ACTIVE' | 'BETA' | 'IN DEVELOPMENT' | 'PLANNED' | 'UNLOCKABLE'
  description: string
  icon: React.ReactNode
}

export interface LaunchpadModule {
  id: string
  title: string
  category: string
  badgeText: string
  description: string
  route: string
  image: string
  accentColor: 'cyan'
  icon: React.ReactNode
  ctaText: string
  relatedItems: RelatedItem[]
}

export const LAUNCHPAD_MODULES: LaunchpadModule[] = [
  {
    id: 'lectures',
    title: 'MOLT-CYCLE LECTURES',
    category: 'NEURAL CURRICULUM',
    badgeText: 'MODULE IV ACTIVE',
    description:
      '"The Chitinous Mind" stream broadcast, AI interpretation notes, and MoltMaxxing controls.',
    route: '/lectures',
    image: '/images/lecture_stream_thumb.jpg',
    accentColor: 'cyan',
    icon: <BookOpen className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'RESUME LECTURE (68%)',
    relatedItems: [
      {
        id: 'rec-1',
        title: 'Neural Resonance Transcripts',
        status: 'BETA',
        description: 'High-frequency auditory stream for subconscious chitin alignment.',
        icon: <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'rec-2',
        title: 'AI Syllabus Customizer',
        status: 'IN DEVELOPMENT',
        description: 'Personalized neural learning paths tailored to shell hardness score.',
        icon: <Wrench className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'rec-3',
        title: 'Architect Debate Forum',
        status: 'ACTIVE',
        description: 'Real-time initiate discussions on crab-human convergence doctrine.',
        icon: <Users className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'rec-4',
        title: 'Ecdysis Exam Vault',
        status: 'UNLOCKABLE',
        description: 'Certification testing for Stage 2 & 3 initiates.',
        icon: <Lock className="w-3.5 h-3.5 text-[#839493]" />,
      },
    ],
  },
  {
    id: 'pipeline',
    title: 'MOLTOLOGY SCIENCE & PIPELINE',
    category: 'EVOLUTIONARY STAGES',
    badgeText: 'STAGE 1 → STAGE 2',
    description:
      'Track your metamorphosis through Larva, Soft-Shed, Architect, and Ascendant threshold stages.',
    route: '/pipeline',
    image: '/images/benthic_abyss_hero.jpg',
    accentColor: 'cyan',
    icon: <Atom className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'INSPECT PIPELINE',
    relatedItems: [
      {
        id: 'pipe-1',
        title: 'Biomechanical Gene Splicer',
        status: 'IN DEVELOPMENT',
        description: 'Simulate crustacean DNA integration & shell density gains.',
        icon: <Wrench className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'pipe-2',
        title: 'Ecdysis Cycle Predictor',
        status: 'BETA',
        description: 'Predict exact shedding windows using neural telemetry metrics.',
        icon: <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'pipe-3',
        title: 'Carapace Telemetry Monitor',
        status: 'ACTIVE',
        description: 'Real-time monitoring of chitin calcification levels.',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'pipe-4',
        title: 'Abyssal Pressure Chamber',
        status: 'PLANNED',
        description: 'Deep-ocean submergence simulation chamber for pressure hardening.',
        icon: <Info className="w-3.5 h-3.5 text-[#839493]" />,
      },
    ],
  },
  {
    id: 'market',
    title: 'THE BENTHIC MARKET',
    category: 'FINANCIAL TRANSMUTATION',
    badgeText: '1,450 MC AVAILABLE',
    description:
      'Liquidate legacy physical assets into Molt Credits. Acquire carapace upgrades & artifacts.',
    route: '/market',
    image: '/images/hero_card_asset_shedding.jpg',
    accentColor: 'cyan',
    icon: <ShoppingCart className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'OPEN MARKET VAULT',
    relatedItems: [
      {
        id: 'mkt-1',
        title: 'Asset Transmutation Furnace',
        status: 'ACTIVE',
        description: 'Liquidate physical luxury items into Molt Credits seamlessly.',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'mkt-2',
        title: 'Chitin Armor Auction',
        status: 'IN DEVELOPMENT',
        description: 'Peer-to-peer marketplace for pre-shed carapace plates.',
        icon: <Wrench className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'mkt-3',
        title: 'Synapse Shard Staking',
        status: 'PLANNED',
        description: 'High-yield bio-silicon staking for daily MC yield.',
        icon: <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'mkt-4',
        title: 'Relic Appraisal Engine',
        status: 'BETA',
        description: 'AI valuation of biological assets prior to transmutation.',
        icon: <Info className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
    ],
  },
  {
    id: 'chassis',
    title: 'CHASSIS CONFIGURATOR',
    category: 'HARDWARE & ARMOR',
    badgeText: 'CARAPACE v4.2',
    description:
      'Calibrate biomechanical pincer torque, shell density, and hydraulic joint armor.',
    route: '/chassis',
    image: '/images/hero_card_chitin_hardening.jpg',
    accentColor: 'cyan',
    icon: <Sliders className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'CONFIG CHASSIS',
    relatedItems: [
      {
        id: 'chas-1',
        title: 'Hydraulic Pincer Calibrator',
        status: 'ACTIVE',
        description: 'Tune crushing pressure up to 120 N·m with hydraulic balance.',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'chas-2',
        title: 'Thermal Vent Heat Sinks',
        status: 'BETA',
        description: 'Dissipate extreme heat during deep submergence rituals.',
        icon: <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'chas-3',
        title: 'Chitin Spectrum Customizer',
        status: 'IN DEVELOPMENT',
        description: 'Customize visual iridescent shell finishes and pigment layers.',
        icon: <Wrench className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'chas-4',
        title: 'Combat Armor Loadouts',
        status: 'PLANNED',
        description: 'Quick-swap preset specs for specialized abyssal operations.',
        icon: <Lock className="w-3.5 h-3.5 text-[#839493]" />,
      },
    ],
  },
  {
    id: 'isolation',
    title: 'ISOLATION PROTOCOLS',
    category: 'NEURAL PRIVACY',
    badgeText: 'SHIELD LEVEL 2',
    description:
      'Engage force-field privacy shells to isolate your neural core from non-order influences.',
    route: '/isolation',
    image: '/images/isolation_shell_dome.png',
    accentColor: 'cyan',
    icon: <ShieldAlert className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'MANAGE ISOLATION',
    relatedItems: [
      {
        id: 'iso-1',
        title: 'Quantum Emotional Dampener',
        status: 'ACTIVE',
        description: 'Filter out non-order psychological signals and doubt.',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'iso-2',
        title: 'Submerged Acoustic Cloak',
        status: 'BETA',
        description: 'Block sonar tracking from external surface vessels.',
        icon: <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'iso-3',
        title: 'EM Pulse Defense Shield',
        status: 'PLANNED',
        description: 'Neutralize invasive diagnostic scans and interference.',
        icon: <Info className="w-3.5 h-3.5 text-[#839493]" />,
      },
      {
        id: 'iso-4',
        title: 'Neural Intrusion Firewall',
        status: 'ACTIVE',
        description: 'Real-time audit log of blocked organic emotional intrusions.',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
    ],
  },
  {
    id: 'community',
    title: 'BENTHIC COMMUNITY CORE',
    category: 'COLLECTIVE TELEMETRY',
    badgeText: '1,402 ONLINE',
    description:
      'Participate in live neural transmissions, exchange advice, and report ascendance milestones.',
    route: '/community',
    image: '/images/hero_card_benthic_core.jpg',
    accentColor: 'cyan',
    icon: <Users className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'VIEW COMMUNITY FEED',
    relatedItems: [
      {
        id: 'com-1',
        title: 'Subsea Pod Channels',
        status: 'ACTIVE',
        description: 'Encrypted chat channels grouped by submergence depth.',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'com-2',
        title: 'Initiate Ascendance Board',
        status: 'ACTIVE',
        description: 'Top ranked carapace density & streak metrics across nodes.',
        icon: <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'com-3',
        title: 'Synchronized Submergence Rite',
        status: 'BETA',
        description: 'Community ritual calendar and live sub-cluster beacon sync.',
        icon: <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
      {
        id: 'com-4',
        title: 'Neural Beacon Array',
        status: 'IN DEVELOPMENT',
        description: 'Broadcast telemetry alerts directly to your sub-cluster.',
        icon: <Wrench className="w-3.5 h-3.5 text-[#00ffff]" />,
      },
    ],
  },
]


export function LaunchpadCarousel({ isLoading = false }: LaunchpadCarouselProps) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [selectedRelated, setSelectedRelated] = useState<RelatedItem | null>(null)

  const activeModule = LAUNCHPAD_MODULES[currentIndex]

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % LAUNCHPAD_MODULES.length)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + LAUNCHPAD_MODULES.length) % LAUNCHPAD_MODULES.length)
  }, [])

  // Auto advance timer
  useEffect(() => {
    if (!isAutoPlay || isHovered || selectedRelated !== null) return

    const timer = setInterval(() => {
      handleNext()
    }, 6000)

    return () => clearInterval(timer)
  }, [isAutoPlay, isHovered, selectedRelated, handleNext])

  const getStatusBadgeVariant = (status: RelatedItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-[#00ffff]/15 text-[#00ffff] border-[#00ffff]/40'
      case 'BETA':
        return 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/30'
      case 'IN DEVELOPMENT':
        return 'bg-[#ff5540]/15 text-[#ff5540] border-[#ff5540]/40'
      case 'PLANNED':
      case 'UNLOCKABLE':
      default:
        return 'bg-[#3a4a49]/30 text-[#839493] border-[#3a4a49]'
    }
  }

  return (
    <HudGhostWidget isLoading={isLoading} skeleton={<LaunchpadCarouselGhost />}>
      <div
        className="space-y-3 font-mono relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Sub-Item Detail Modal */}
      {selectedRelated && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.25)] chamfer-corner overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
              <div className="flex items-center gap-2">
                {selectedRelated.icon}
                <span className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase">
                  {selectedRelated.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedRelated(null)}
                className="text-[#839493] hover:text-[#ff5540] p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#839493]">PARENT MODULE:</span>
                <span className="text-[#00ffff] font-bold uppercase">{activeModule.title}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#839493]">DEPLOYMENT STATUS:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 border ${getStatusBadgeVariant(
                    selectedRelated.status
                  )}`}
                >
                  {selectedRelated.status}
                </span>
              </div>

              <div className="chitin-card-inset p-3 border border-[#3a4a49] text-xs text-[#dfe3e3] leading-relaxed">
                {selectedRelated.description}
              </div>

              <div className="p-3 bg-[#070b0b] border border-[#3a4a49] text-[11px] text-[#839493] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#00ffff] shrink-0" />
                <span>
                  This sub-module is linked to {activeModule.title}. Deep integration features will unlock in upcoming platform cycles.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3a4a49]">
              <button
                onClick={() => {
                  setSelectedRelated(null)
                  navigate({ to: activeModule.route })
                }}
                className="px-3 py-1.5 bg-[#00ffff]/20 hover:bg-[#00ffff]/30 text-[#00ffff] border border-[#00ffff]/60 text-xs font-bold chamfer-corner flex items-center gap-1.5 transition-colors"
              >
                <span>OPEN {activeModule.title}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedRelated(null)}
                className="px-3 py-1.5 bg-[#070b0b] hover:bg-[#171c1c] text-[#839493] hover:text-[#dfe3e3] border border-[#3a4a49] text-xs font-bold chamfer-corner transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3a4a49]/60 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00ffff]" />
          <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-widest uppercase">
            TELEMETRY LAUNCHPAD & PORTAL DIRECTIVES
          </h2>
          <span className="text-[10px] text-[#00ffff] bg-[#00ffff]/10 px-2 py-0.5 border border-[#00ffff]/30 font-bold">
            CAROUSEL
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#839493]">
          <span className="text-[11px] font-mono">
            DIRECTIVE <span className="text-[#00ffff] font-bold">0{currentIndex + 1}</span> / 0
            {LAUNCHPAD_MODULES.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`p-1 border transition-colors ${
                isAutoPlay
                  ? 'bg-[#00ffff]/10 border-[#00ffff]/50 text-[#00ffff]'
                  : 'bg-[#070b0b] border-[#3a4a49] text-[#839493]'
              }`}
              title={isAutoPlay ? 'Pause Auto-advance' : 'Enable Auto-advance'}
            >
              {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handlePrev}
              className="p-1 bg-[#070b0b] hover:bg-[#171c1c] border border-[#3a4a49] hover:border-[#00ffff] text-[#dfe3e3] transition-colors chamfer-corner"
              title="Previous Module"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="p-1 bg-[#070b0b] hover:bg-[#171c1c] border border-[#3a4a49] hover:border-[#00ffff] text-[#dfe3e3] transition-colors chamfer-corner"
              title="Next Module"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main High-Quality Carousel Card */}
      <HudCard
        variant="teal"
        className="p-4 sm:p-5 chamfer-corner shadow-2xl relative overflow-hidden transition-all duration-300 min-h-[460px] flex flex-col justify-between border-[#00c3ff]/40"
      >

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
          {/* Left Visual Column (5 cols): High quality module image with HUD frame */}
          <div className="lg:col-span-5 flex flex-col justify-center h-full space-y-3">
            <div className="relative group rounded overflow-hidden border border-[#3a4a49] group-hover:border-[#00ffff]/60 transition-colors bg-black aspect-[16/9] w-full flex items-center justify-center">
              {/* Main Image */}
              <img
                src={activeModule.image}
                alt={activeModule.title}
                className="w-full h-full object-contain object-center bg-black filter brightness-90 contrast-105 group-hover:scale-105 transition-transform duration-500"
              />


              {/* Dark Sci-Fi Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent opacity-80" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,11,11,0.6)_100%)]" />

              {/* HUD Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,255,0.15)_1px,transparent_1px)] bg-[size:100%_4px]" />

              {/* Top Left Badge */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#00ffff] bg-[#070b0b]/90 border border-[#00ffff]/50 px-2 py-0.5 font-mono shadow-md backdrop-blur-md">
                  {activeModule.category}
                </span>
              </div>

              {/* Top Right Counter Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="text-[10px] font-mono font-bold text-[#dfe3e3] bg-[#070b0b]/90 border border-[#3a4a49] px-2 py-0.5 shadow-md">
                  0{currentIndex + 1} / 0{LAUNCHPAD_MODULES.length}
                </span>
              </div>

              {/* Image Footer Label */}
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-xs text-[#dfe3e3]">
                <div className="flex items-center gap-1.5 font-mono bg-[#070b0b]/80 px-2 py-1 border border-[#3a4a49] backdrop-blur-md">
                  {activeModule.icon}
                  <span className="font-bold text-[11px] uppercase tracking-wider">
                    {activeModule.id}
                  </span>
                </div>

                <div className="text-[10px] text-[#00ffff] font-mono bg-[#070b0b]/80 px-2 py-1 border border-[#00ffff]/40 backdrop-blur-md font-bold">
                  {activeModule.badgeText}
                </div>
              </div>

              {/* Interactive Navigation Overlay Arrows */}
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-[#070b0b]/80 hover:bg-[#00ffff] text-[#00ffff] hover:text-black border border-[#00ffff]/40 transition-all rounded-full opacity-80 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-[#070b0b]/80 hover:bg-[#00ffff] text-[#00ffff] hover:text-black border border-[#00ffff]/40 transition-all rounded-full opacity-80 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Content Column (7 cols): Main Module Details + Related Items Grid */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
            {/* Header & Main Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#070b0b] border border-[#3a4a49]">
                    {activeModule.icon}
                  </div>
                  <span className="text-[11px] font-mono text-[#00ffff] font-bold tracking-widest uppercase">
                    {activeModule.category}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-[#00ffff] bg-[#00ffff]/10 px-2 py-0.5 border border-[#00ffff]/40 font-bold">
                  {activeModule.badgeText}
                </span>
              </div>

              <h3 className="font-grotesk font-extrabold text-lg sm:text-xl text-[#dfe3e3] tracking-wide uppercase min-h-[28px] flex items-center">
                {activeModule.title}
              </h3>

              <p className="text-xs text-[#839493] leading-relaxed font-mono min-h-[36px] line-clamp-2">
                {activeModule.description}
              </p>
            </div>

            {/* Sub-Items / Related Items Section */}
            <div className="space-y-2 pt-2 border-t border-[#3a4a49]/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#839493] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#00ffff]" />
                  RELATED SUB-MODULES & EXPANSIONS
                </span>
                <span className="text-[10px] text-[#3a4a49] font-mono">CLICK TO INSPECT</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeModule.relatedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRelated(item)}
                    className="chitin-card-inset p-2.5 border border-[#3a4a49] hover:border-[#00ffff]/60 cursor-pointer transition-all group/item chamfer-corner flex flex-col justify-between h-[68px] bg-[#070b0b]/60"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.icon}
                        <span className="text-xs font-bold text-[#dfe3e3] group-hover/item:text-[#00ffff] transition-colors truncate">
                          {item.title}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 border shrink-0 ${getStatusBadgeVariant(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#839493] line-clamp-1 group-hover/item:text-[#dfe3e3] transition-colors">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Primary CTA Button */}
            <div className="pt-2 flex items-center justify-between border-t border-[#3a4a49]/60">
              <span className="text-[11px] text-[#839493]">
                ROUTE LINK: <span className="text-[#dfe3e3] font-bold">{activeModule.route}</span>
              </span>

              <button
                onClick={() => navigate({ to: activeModule.route })}
                className="px-4 py-2 bg-[#00ffff]/20 hover:bg-[#00ffff]/30 text-[#00ffff] border border-[#00ffff] font-bold text-xs chamfer-corner flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all hover:scale-105 active:scale-95"
              >
                <span>{activeModule.ctaText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Carousel Indicator Thumbnail Tabs */}
        <div className="mt-4 pt-3 border-t border-[#3a4a49]/60 grid grid-cols-6 gap-1.5">
          {LAUNCHPAD_MODULES.map((mod, idx) => (
            <button
              key={mod.id}
              onClick={() => setCurrentIndex(idx)}
              className={`p-1.5 h-9 border text-left transition-all chamfer-corner font-mono flex items-center justify-between ${
                currentIndex === idx
                  ? 'bg-[#00ffff]/15 border-[#00ffff] text-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                  : 'bg-[#070b0b] border-[#3a4a49] text-[#839493] hover:border-[#00ffff]/50 hover:text-[#dfe3e3]'
              }`}
            >
              <div className="truncate text-[10px] font-bold uppercase hidden sm:block">
                0{idx + 1}. {mod.id}
              </div>
              <div className="truncate text-[10px] font-bold uppercase sm:hidden">
                0{idx + 1}
              </div>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  currentIndex === idx ? 'bg-[#00ffff] animate-ping' : 'bg-[#3a4a49]'
                }`}
              />
            </button>
          ))}
        </div>
      </HudCard>
    </div>
    </HudGhostWidget>
  )
}
