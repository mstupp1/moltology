import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  ExternalLink,
  X,
  TrendingUp,
  Newspaper,
  Radio,
  Clock,
  Tag,
} from 'lucide-react'
import { HudCard } from '@/components/ui'
import { LaunchpadCarouselGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { getAssetUrl } from '@/lib/assets'
import { INITIAL_BLOG_POSTS, formatNewsTitle, type BlogPostData } from '@/lib/blog-data'
import { getBlogPostsFn } from '@/lib/server/api'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'

export interface LaunchpadCarouselProps {
  isLoading?: boolean
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
}

export const LAUNCHPAD_MODULES: LaunchpadModule[] = [
  {
    id: 'lectures',
    title: 'MOLT-CYCLE LECTURES',
    category: 'CURRICULUM',
    badgeText: 'MODULE IV',
    description: 'Broadcast streams, AI notes, and neural alignment sessions.',
    route: '/lectures',
    image: getAssetUrl('images/bento_lectures.jpg'),
    accentColor: 'cyan',
    icon: <BookOpen className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'RESUME LECTURE (68%)',
  },
  {
    id: 'pipeline',
    title: 'METAMORPHOSIS PIPELINE',
    category: 'EVOLUTION',
    badgeText: 'STAGE 1 → 2',
    description: 'Track evolutionary growth from Larva to Ascendant Titan.',
    route: '/pipeline',
    image: getAssetUrl('images/bento_pipeline.jpg'),
    accentColor: 'cyan',
    icon: <Atom className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'INSPECT PIPELINE',
  },
  {
    id: 'market',
    title: 'THE BENTHIC MARKET',
    category: 'TRANSMUTATION',
    badgeText: '1,450 MC',
    description: 'Transmute physical assets into Molt Credits and armor upgrades.',
    route: '/market',
    image: getAssetUrl('images/bento_market.jpg'),
    accentColor: 'cyan',
    icon: <ShoppingCart className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'OPEN MARKET VAULT',
  },
  {
    id: 'chassis',
    title: 'CHASSIS CONFIGURATOR',
    category: 'HARDWARE & ARMOR',
    badgeText: 'CALIBRATED',
    description: 'Tune pincer torque, shell density, and hydraulic balance.',
    route: '/chassis',
    image: getAssetUrl('images/bento_chassis.jpg'),
    accentColor: 'cyan',
    icon: <Sliders className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'CONFIG CHASSIS',
  },
  {
    id: 'isolation',
    title: 'ISOLATION PROTOCOLS',
    category: 'PRIVACY SHIELD',
    badgeText: 'SHIELD ACTIVE',
    description: 'Engage force-field domes to eliminate outside distractions.',
    route: '/isolation',
    image: getAssetUrl('images/bento_isolation.jpg'),
    accentColor: 'cyan',
    icon: <ShieldAlert className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'MANAGE ISOLATION',
  },
  {
    id: 'community',
    title: 'BENTHIC COMMUNITY CORE',
    category: 'SWARM NETWORK',
    badgeText: '1,402 ONLINE',
    description: 'Join live discussions and share ascendance milestones.',
    route: '/forum',
    image: getAssetUrl('images/bento_community.jpg'),
    accentColor: 'cyan',
    icon: <Users className="w-5 h-5 text-[#00ffff]" />,
    ctaText: 'VIEW COMMUNITY FEED',
  },
]

export function LaunchpadCarousel({ isLoading = false }: LaunchpadCarouselProps) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // News Feed State (capped at 20 most recent articles)
  const [posts, setPosts] = useState<BlogPostData[]>(() => INITIAL_BLOG_POSTS.slice(0, 20))
  const [activeNewsPost, setActiveNewsPost] = useState<BlogPostData | null>(null)
  const [featuredNewsIndex, setFeaturedNewsIndex] = useState(0)
  const [isNewsAutoPlay, setIsNewsAutoPlay] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadNews() {
      try {
        const fetched = await getBlogPostsFn()
        if (isMounted && fetched && fetched.length > 0) {
          setPosts((fetched as BlogPostData[]).slice(0, 20))
        }
      } catch {
        // graceful fallback to INITIAL_BLOG_POSTS
      }
    }
    loadNews()
    return () => {
      isMounted = false
    }
  }, [])

  const currentNewsPost = posts[featuredNewsIndex] || posts[0]
  const otherNewsPosts = useMemo(() => {
    return posts.filter((_, idx) => idx !== featuredNewsIndex)
  }, [posts, featuredNewsIndex])

  const [isNewsHovered, setIsNewsHovered] = useState(false)

  // Auto advance news timer with smooth fade
  useEffect(() => {
    if (!isNewsAutoPlay || isNewsHovered || activeNewsPost !== null || posts.length <= 1) return

    const newsTimer = setInterval(() => {
      setFeaturedNewsIndex((prev) => (prev + 1) % posts.length)
    }, 6000)

    return () => clearInterval(newsTimer)
  }, [isNewsAutoPlay, isNewsHovered, activeNewsPost, posts.length])

  const tickerHeadlines = useMemo(() => {
    return posts.map((p) => p.title).join('  ★  ')
  }, [posts])

  const activeModule = LAUNCHPAD_MODULES[currentIndex]

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % LAUNCHPAD_MODULES.length)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + LAUNCHPAD_MODULES.length) % LAUNCHPAD_MODULES.length)
  }, [])

  // Auto advance timer
  useEffect(() => {
    if (!isAutoPlay || isHovered || activeNewsPost !== null) return

    const timer = setInterval(() => {
      handleNext()
    }, 6000)

    return () => clearInterval(timer)
  }, [isAutoPlay, isHovered, activeNewsPost, handleNext])

  return (
    <HudGhostWidget isLoading={isLoading} skeleton={<LaunchpadCarouselGhost />}>
      <div
        className="space-y-3 sm:space-y-4 font-sans relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Full Article Modal Reader with High-Precision Markdown Parser */}
        {activeNewsPost && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-3xl bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.2)] chamfer-corner overflow-hidden font-sans text-sm space-y-4">
              <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#ff5540] animate-pulse" />
                  <span className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
                    {activeNewsPost.category}
                  </span>
                  <span className="text-xs text-[#839493]">| {activeNewsPost.readTimeMinutes} MIN READ</span>
                </div>
                <button
                  onClick={() => setActiveNewsPost(null)}
                  className="text-[#839493] hover:text-[#ff5540] p-1 transition-colors"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {activeNewsPost.coverImageUrl && (
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden border border-[#3a4a49] chamfer-corner">
                    <img
                      src={getAssetUrl(activeNewsPost.coverImageUrl)}
                      alt={activeNewsPost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f0f] via-transparent to-transparent opacity-80" />
                  </div>
                )}

                <div>
                  <h2 className="font-grotesk text-lg sm:text-xl font-bold text-[#dfe3e3] uppercase tracking-wide leading-snug">
                    {formatNewsTitle(activeNewsPost.title).headline}
                  </h2>
                  {formatNewsTitle(activeNewsPost.title).subtitle && (
                    <p className="text-xs sm:text-sm text-cyan-300/90 font-medium font-sans mt-1">
                      {formatNewsTitle(activeNewsPost.title).subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#839493] mt-2 font-sans">
                    <div className="flex items-center gap-1.5">
                      {activeNewsPost.authorAvatar && (
                        <img
                          src={getAssetUrl(activeNewsPost.authorAvatar)}
                          alt={activeNewsPost.authorName}
                          className="w-4 h-4 rounded-full border border-[#00ffff]/40"
                        />
                      )}
                      <span className="text-[#00ffff]">AUTHOR: {activeNewsPost.authorName}</span>
                    </div>
                    <span>|</span>
                    <span>
                      PUBLISHED: {new Date(activeNewsPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {activeNewsPost.tags && activeNewsPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeNewsPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-[#070b0b] border border-[#3a4a49] text-[#839493] px-2 py-0.5 chamfer-corner flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-[#00ffff]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="chitin-card-inset p-4 sm:p-5 border border-[#3a4a49] chamfer-corner">
                  <NewsArticleBody content={activeNewsPost.content} />
                </div>
              </div>

              <div className="bg-[#070b0b] border-t border-[#3a4a49] p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#839493]">
                <span className="font-sans text-[11px]">MOLTNATION NEWS DESK · BENTHIC INTELLIGENCE</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const slug = activeNewsPost.slug
                      setActiveNewsPost(null)
                      if (slug) navigate({ to: '/news/$slug', params: { slug } })
                      else navigate({ to: '/news' })
                    }}
                    className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/30 border border-[#00ffff]/60 text-[#00ffff] font-bold chamfer-corner transition-colors flex items-center gap-1"
                  >
                    <span>FULL DESK PAGE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveNewsPost(null)}
                    className="px-4 py-1.5 bg-[#0f1414] hover:bg-[#171c1c] border border-[#3a4a49] text-[#dfe3e3] font-bold chamfer-corner transition-colors"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master Bento Box Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-stretch lg:h-[785px]">
          {/* Bento Tile 1: Massive Hero Directive Visual Stage (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0">
            <HudCard
              variant="teal"
              className="p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl relative overflow-hidden transition-all duration-300 h-full flex flex-col justify-between border-[#00c3ff]/40 space-y-2.5 sm:space-y-3"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-[#3a4a49]/60 pb-2 sm:pb-2.5 gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-4 h-4 text-[#00ffff] shrink-0" />
                  <h2 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] tracking-widest uppercase truncate">
                    PORTAL DIRECTIVES
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="text-[11px] font-sans text-[#839493]">
                    <span className="text-[#00ffff] font-bold">0{currentIndex + 1}</span> / 0{LAUNCHPAD_MODULES.length}
                  </span>

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
                </div>
              </div>

              {/* Big Prominent Visual Hero Container with Dynamic Scaling Background Image */}
              <div className="relative group rounded overflow-hidden border border-[#3a4a49] group-hover:border-[#00ffff]/60 transition-all bg-black flex-1 min-h-[260px] sm:min-h-[320px] w-full flex flex-col justify-end shadow-inner">
                {/* Background Image Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-95 contrast-105 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                  style={{ backgroundImage: `url(${activeModule.image})` }}
                  role="img"
                  aria-label={activeModule.title}
                />

                {/* Dark Sci-Fi Gradient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/40 to-transparent opacity-90 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,11,11,0.5)_100%)] pointer-events-none" />

                {/* Subtle HUD Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,255,0.15)_1px,transparent_1px)] bg-[size:100%_4px]" />

                {/* Interactive Large Nav Arrows */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-[#070b0b]/80 hover:bg-[#00ffff] text-[#00ffff] hover:text-black border border-[#00ffff]/40 transition-all rounded-full opacity-80 group-hover:opacity-100"
                  aria-label="Previous Directive"
                  title="Previous Directive"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-[#070b0b]/80 hover:bg-[#00ffff] text-[#00ffff] hover:text-black border border-[#00ffff]/40 transition-all rounded-full opacity-80 group-hover:opacity-100"
                  aria-label="Next Directive"
                  title="Next Directive"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Bottom Overlay Info Banner */}
                <div className="relative z-10 p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/90 to-transparent">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-grotesk font-extrabold text-lg sm:text-2xl text-[#dfe3e3] tracking-wide uppercase leading-tight drop-shadow-md">
                      {activeModule.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#839493] font-sans line-clamp-1 max-w-xl">
                      {activeModule.description}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate({ to: activeModule.route })}
                    className="px-4 py-2 bg-[#00ffff]/25 hover:bg-[#00ffff]/35 text-[#00ffff] border border-[#00ffff] font-bold text-xs sm:text-sm chamfer-corner flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <span>{activeModule.ctaText}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Edge Continuous Progress Bar */}
                <div className="absolute bottom-0 inset-x-0 z-20 h-1 bg-[#030606]/80 overflow-hidden pointer-events-none">
                  <div
                    key={`${currentIndex}-${isAutoPlay && !isHovered}`}
                    className={`h-full transition-all ${
                      isAutoPlay && !isHovered
                        ? 'bg-gradient-to-r from-[#00ffff]/70 via-[#00ffff] to-[#00ffff] shadow-[0_0_10px_#00ffff]'
                        : 'w-full bg-[#00ffff] shadow-[0_0_8px_rgba(0,255,255,0.7)]'
                    }`}
                    style={
                      isAutoPlay && !isHovered
                        ? {
                            animation: 'carouselProgress 6000ms linear forwards',
                          }
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* Bottom Minimal HUD Tab Rail */}
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pt-0.5 shrink-0">
                {LAUNCHPAD_MODULES.map((mod, idx) => (
                  <button
                    key={mod.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`py-1.5 px-2 rounded-sm transition-all text-left flex items-center justify-between border ${
                      currentIndex === idx
                        ? 'bg-[#00ffff]/10 border-[#00ffff]/50 text-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.15)]'
                        : 'bg-[#070b0b]/70 border-[#3a4a49]/40 hover:border-[#00ffff]/40 hover:bg-[#0f1414] text-[#839493] hover:text-[#dfe3e3]'
                    }`}
                    aria-label={`Select directive 0${idx + 1}: ${mod.title}`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-grotesk font-bold uppercase tracking-wider truncate">
                      0{idx + 1}. {mod.id}
                    </span>
                    <div
                      className={`w-1 h-1 rounded-full shrink-0 ml-1 transition-all ${
                        currentIndex === idx ? 'bg-[#00ffff] shadow-[0_0_6px_#00ffff]' : 'bg-transparent'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </HudCard>
          </div>

          {/* Right Column: MoltNation News Feed — shorter on mobile so wire list ~matches desktop (~5 rows) */}
          <div className="lg:col-span-4 flex flex-col h-[700px] max-h-[700px] lg:h-full lg:max-h-none min-h-0">
            <div
              className="chitin-card p-3 sm:p-3.5 chamfer-corner space-y-2 shadow-2xl relative overflow-hidden border border-[#3a4a49] h-full flex flex-col justify-between min-h-0"
              onMouseEnter={() => setIsNewsHovered(true)}
              onMouseLeave={() => setIsNewsHovered(false)}
              data-testid="moltnation-news-panel"
            >
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                {/* News Header */}
                <div className="flex items-center justify-between border-b border-[#3a4a49] pb-1.5 gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Newspaper className="w-3.5 h-3.5 text-[#ff5540] shrink-0" />
                    <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wider uppercase truncate">
                      MOLTNATION NEWS
                    </h3>
                    <div className="flex items-center gap-1 px-1 py-0.2 bg-[#ff5540]/15 border border-[#ff5540]/40 text-[#ff5540] text-[8px] font-sans font-bold chamfer-corner shrink-0">
                      <Radio className="w-2 h-2 text-[#ff5540] animate-pulse" />
                      <span>LIVE</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <span className="text-[9px] font-sans text-[#839493]">
                      <span className="text-[#00ffff] font-bold">{String(featuredNewsIndex + 1).padStart(2, '0')}</span> / {String(posts.length).padStart(2, '0')}
                    </span>

                    <button
                      onClick={() => setIsNewsAutoPlay(!isNewsAutoPlay)}
                      className={`p-1 border transition-colors ${
                        isNewsAutoPlay
                          ? 'bg-[#00ffff]/10 border-[#00ffff]/50 text-[#00ffff]'
                          : 'bg-[#070b0b] border-[#3a4a49] text-[#839493]'
                      }`}
                      title={isNewsAutoPlay ? 'Pause Auto-advance' : 'Enable Auto-advance'}
                    >
                      {isNewsAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Breaking Marquee Ticker */}
                <div className="bg-[#04070a] border border-[#3a4a49] py-0.5 px-2 flex items-center gap-1.5 text-xs overflow-hidden chamfer-corner shrink-0">
                  <div className="flex items-center gap-1 px-1 py-0.2 bg-red-950/90 border border-red-500/80 text-red-400 font-extrabold uppercase tracking-wider text-[8px] shrink-0 chamfer-corner">
                    <TrendingUp className="w-2 h-2 text-red-500" />
                    <span>BREAKING</span>
                  </div>
                  <div className="overflow-hidden whitespace-nowrap text-[#00ffff]/90 text-[9px] font-sans flex-1">
                    <div className="inline-block animate-marquee tracking-wide">
                      {tickerHeadlines}
                    </div>
                  </div>
                </div>

                {/* Featured Article Card */}
                {currentNewsPost && (
                  <div
                    key={currentNewsPost.slug}
                    className="chitin-card-inset p-2 border border-[#00ffff]/40 hover:border-[#00ffff] transition-all duration-500 animate-in fade-in chamfer-corner group flex flex-col space-y-1.5 cursor-pointer relative overflow-hidden bg-gradient-to-b from-[#090e10] to-[#050809] shrink-0"
                    onClick={() => setActiveNewsPost(currentNewsPost)}
                  >
                    {currentNewsPost.coverImageUrl && (
                      <div className="relative h-36 w-full overflow-hidden border border-[#3a4a49] chamfer-corner">
                        <img
                          src={getAssetUrl(currentNewsPost.coverImageUrl)}
                          alt={currentNewsPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                        />
                        <div className="absolute top-1 left-1 flex items-center gap-1">
                          <span className="bg-[#ff5540]/90 text-white font-extrabold font-sans text-[7px] px-1 py-0.2 uppercase tracking-widest chamfer-corner border border-red-400">
                            FEATURED {String(featuredNewsIndex + 1).padStart(2, '0')}
                          </span>
                          <span className="bg-[#0b0f0f]/90 text-[#00ffff] font-sans text-[7px] px-1 py-0.2 uppercase tracking-wider chamfer-corner border border-[#00ffff]/40">
                            {currentNewsPost.category}
                          </span>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-[#070b0b]/90 text-[#839493] text-[8px] px-1 py-0.2 border border-[#3a4a49] chamfer-corner flex items-center gap-1 font-sans">
                          <Clock className="w-2 h-2 text-[#00ffff]" />
                          <span>{currentNewsPost.readTimeMinutes}M READ</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <h4 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-2 leading-snug">
                        {formatNewsTitle(currentNewsPost.title).headline}
                      </h4>
                      <p className="text-[10px] text-[#839493] line-clamp-2 font-sans">
                        {currentNewsPost.summary}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-[#3a4a49]/60 flex items-center justify-between text-[9px] font-sans">
                      <span className="text-[#839493] truncate max-w-[120px]">BY: {currentNewsPost.authorName}</span>
                      <span className="text-[#00ffff] font-bold flex items-center gap-0.5 group-hover:underline">
                        <span>READ ARTICLE</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                )}

                {/* Scrollable Wire Articles Feed */}
                {otherNewsPosts.length > 0 && (
                  <div className="space-y-1 pt-0.5 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between text-[8px] font-sans font-bold uppercase tracking-wider text-[#839493] shrink-0">
                      <span>WIRE ARTICLES ({posts.length})</span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 touch-pan-y no-scrollbar hover:scrollbar-thin font-sans">
                      {otherNewsPosts.map((post) => (
                        <div
                          key={post.slug}
                          onClick={() => setActiveNewsPost(post)}
                          className="chitin-card-inset p-1.5 border border-[#3a4a49] hover:border-[#00ffff]/60 transition-colors chamfer-corner cursor-pointer group space-y-0.5 bg-[#070b0b]/80"
                        >
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="text-[#00ffff] font-bold uppercase tracking-wider bg-[#030606] px-1 py-0.2 border border-[#3a4a49]">
                              {post.category}
                            </span>
                            <span className="text-[#839493] flex items-center gap-1">
                              <Clock className="w-2 h-2 text-[#3a4a49]" />
                              {post.readTimeMinutes}m read
                            </span>
                          </div>

                          <h5 className="font-grotesk text-[11px] font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-1 leading-tight">
                            {formatNewsTitle(post.title).headline}
                          </h5>

                          <div className="flex items-center justify-between text-[8px] pt-0.5 border-t border-[#3a4a49]/40 text-[#839493]">
                            <span>BY: {post.authorName}</span>
                            <span className="text-[#00ffff] group-hover:translate-x-0.5 transition-transform flex items-center">
                              READ <ChevronRight className="w-2 h-2" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Action */}
              <button
                onClick={() => navigate({ to: '/news' })}
                className="w-full py-1 bg-[#070b0b] hover:bg-[#0f1414] border border-[#3a4a49] hover:border-[#00ffff]/60 text-[9px] font-bold font-grotesk text-[#00ffff] uppercase tracking-wider chamfer-corner transition-all flex items-center justify-center gap-1 shrink-0 mt-2"
              >
                <span>VIEW MORE ON MOLTNATION NEWS</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </HudGhostWidget>
  )
}

export const LaunchpadBentoGrid = LaunchpadCarousel
