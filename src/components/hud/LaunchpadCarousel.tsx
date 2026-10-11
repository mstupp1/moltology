import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
import { useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  Atom,
  FlaskConical,
  ShoppingCart,
  Sliders,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  X,
  Newspaper,
  Radio,
  Clock,
  Tag,
  LayoutGrid,
} from 'lucide-react'
import { HudCard } from '@/components/ui'
import { LaunchpadCarouselGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { getAssetUrl } from '@/lib/assets'
import { INITIAL_BLOG_POSTS, formatNewsTitle, type BlogPostData } from '@/lib/blog-data'
import { getBlogPostsFn } from '@/lib/server/api'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import { useBlogPostBody } from '@/hooks/useBlogPostBody'

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
    icon: <BookOpen className="w-5 h-5 text-cyan-glow" />,
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
    icon: <FlaskConical className="w-5 h-5 text-cyan-glow" />,
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
    icon: <ShoppingCart className="w-5 h-5 text-cyan-glow" />,
    ctaText: 'OPEN MARKET VAULT',
  },
  {
    id: 'chassis',
    title: 'CHASSIS CONFIGURATOR',
    category: 'HARDWARE & ARMOR',
    badgeText: 'CALIBRATED',
    description: 'Inspect hardpoints, seat gear from the vault, and read loadout telemetry.',
    route: '/chassis',
    image: getAssetUrl('images/bento_chassis.jpg'),
    accentColor: 'cyan',
    icon: <Sliders className="w-5 h-5 text-cyan-glow" />,
    ctaText: 'OPEN LOADOUT',
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
    icon: <Users className="w-5 h-5 text-cyan-glow" />,
    ctaText: 'VIEW COMMUNITY FEED',
  },
  {
    id: 'oracle',
    title: 'SYNAPTIC ORACLE',
    category: 'NEURAL INTELLIGENCE',
    badgeText: 'ONLINE',
    description: 'Consult the sub-benthic neural core for personal doctrine, biometric calibration, and molt advice.',
    route: '/oracle',
    image: getAssetUrl('images/gallery/synapse_crystal.webp'),
    accentColor: 'cyan',
    icon: <Atom className="w-5 h-5 text-cyan-glow" />,
    ctaText: 'CONSULT ORACLE',
  },
]

export function LaunchpadCarousel({ isLoading = false }: LaunchpadCarouselProps) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [isDirectivesHovered, setIsDirectivesHovered] = useState(false)
  const [progressKey, setProgressKey] = useState(0)

  // News Feed State (capped at 20 most recent articles)
  const [posts, setPosts] = useState<BlogPostData[]>(() => INITIAL_BLOG_POSTS.slice(0, 20))
  const [activeNewsPost, setActiveNewsPost] = useState<BlogPostData | null>(null)
  const activeNewsPostBody = useBlogPostBody(activeNewsPost)
  const [featuredNewsIndex, setFeaturedNewsIndex] = useState(0)

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
    if (isNewsHovered || activeNewsPost !== null || posts.length <= 1) return

    const newsTimer = setInterval(() => {
      setFeaturedNewsIndex((prev) => (prev + 1) % posts.length)
    }, 6000)

    return () => clearInterval(newsTimer)
  }, [isNewsHovered, activeNewsPost, posts.length])

  const activeModule = LAUNCHPAD_MODULES[currentIndex]
  const isPlaying = isAutoPlay && !isDirectivesHovered && activeNewsPost === null

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % LAUNCHPAD_MODULES.length)
    setProgressKey((k) => k + 1)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + LAUNCHPAD_MODULES.length) % LAUNCHPAD_MODULES.length)
    setProgressKey((k) => k + 1)
  }, [])

  const handleSelectModule = (idx: number) => {
    setCurrentIndex(idx)
    setProgressKey((k) => k + 1)
  }

  // Auto advance timer
  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      handleNext()
    }, 6000)

    return () => clearTimeout(timer)
  }, [isPlaying, handleNext, currentIndex])

  return (
    <HudGhostWidget isLoading={isLoading} skeleton={<LaunchpadCarouselGhost />}>
      <div className="space-y-3 sm:space-y-4 font-sans relative">
        {/* Full Article Modal Reader with High-Precision Markdown Parser */}
        {activeNewsPost && (
          <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-3xl rounded-card border border-line bg-surface-1 shadow-menu overflow-hidden font-sans text-sm space-y-4">
              <div className="bg-surface-2 border-b border-line-subtle p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-crimson-text animate-pulse" />
                  <span className="text-xs text-cyan-glow font-bold tracking-[0.08em] uppercase">
                    {activeNewsPost.category}
                  </span>
                  <span className="text-xs text-ink-muted">| {activeNewsPost.readTimeMinutes} MIN READ</span>
                </div>
                <button
                  onClick={() => setActiveNewsPost(null)}
                  className="rounded-control text-ink-muted hover:text-crimson-text hover:bg-surface-3 p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {activeNewsPost.coverImageUrl && (
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden border border-line-subtle rounded-card">
                    <img
                      src={getAssetUrl(activeNewsPost.coverImageUrl)}
                      alt={activeNewsPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h2 className="font-grotesk text-lg sm:text-xl font-bold text-ink uppercase tracking-wide leading-snug">
                    {formatNewsTitle(activeNewsPost.title).headline}
                  </h2>
                  {formatNewsTitle(activeNewsPost.title).subtitle && (
                    <p className="text-xs sm:text-sm text-cyan-glow font-medium font-sans mt-1">
                      {formatNewsTitle(activeNewsPost.title).subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted mt-2 font-sans">
                    <div className="flex items-center gap-1.5">
                      {activeNewsPost.authorAvatar && (
                        <BrandAwareImage
                          src={getAssetUrl(activeNewsPost.authorAvatar)}
                          alt={activeNewsPost.authorName}
                          className="w-4 h-4 rounded-full border border-line"
                        />
                      )}
                      <span className="text-cyan-glow">AUTHOR: {activeNewsPost.authorName}</span>
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
                        className="text-[11px] bg-surface-2 border border-line-subtle text-ink-muted px-2 py-0.5 rounded-chip flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-cyan-glow" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rounded-card bg-abyss p-4 sm:p-5 border border-line-subtle">
                  {activeNewsPostBody === null ? (
                    <p className="text-sm text-ink-muted">Loading article…</p>
                  ) : (
                    <NewsArticleBody content={activeNewsPostBody} />
                  )}
                </div>
              </div>

              <div className="bg-surface-2 border-t border-line-subtle p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-muted">
                <span className="font-sans text-[11px]">MOLTNATION NEWS DESK · BENTHIC INTELLIGENCE</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const slug = activeNewsPost.slug
                      setActiveNewsPost(null)
                      if (slug) navigate({ to: '/news/$slug', params: { slug } })
                      else navigate({ to: '/news' })
                    }}
                    className="px-3 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong text-cyan-glow font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center gap-1"
                  >
                    <span>FULL DESK PAGE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveNewsPost(null)}
                    className="px-4 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen text-ink font-bold hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
              className="p-3 sm:p-3.5 relative overflow-hidden transition-all duration-300 h-full flex flex-col justify-between min-h-0 space-y-2"
            >
              {/* Modules Header */}
              <div className="flex items-center justify-between border-b border-line-subtle pb-1.5 gap-2 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
                  <h2 className="font-grotesk text-xs font-bold text-ink tracking-[0.08em] uppercase truncate">
                    FEATURED MODULES
                  </h2>
                </div>
              </div>

              <section
                aria-label="Featured Modules"
                className="rounded-card bg-surface-1/90 relative overflow-hidden border border-line-subtle transition-all duration-300 flex flex-col justify-between h-full min-h-0 flex-1"
                onMouseEnter={() => setIsDirectivesHovered(true)}
                onMouseLeave={() => setIsDirectivesHovered(false)}
              >

                {/* Main Wide Visual Stage */}
                <div className="relative group overflow-hidden bg-black flex-1 min-h-[300px] sm:min-h-[340px] lg:min-h-0 w-full flex flex-col justify-end">
                  {/* Background Visual Images with Smooth Cross-fade */}
                  {LAUNCHPAD_MODULES.map((mod, idx) => (
                    <div
                      key={mod.id}
                      className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 pointer-events-none ${
                        idx === currentIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ backgroundImage: `url(${mod.image})` }}
                      role="img"
                      aria-label={mod.title}
                    />
                  ))}

                  {/* Balanced Ambient Sci-Fi Vignette for Text Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1/95 via-surface-1/60 sm:via-surface-1/40 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface-1/85 via-surface-1/40 sm:via-surface-1/20 to-transparent pointer-events-none" />

                  {/* Subtle HUD Scanline Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-15 bg-[linear-gradient(rgba(0,195,255,0.15)_1px,transparent_1px)] bg-[size:100%_4px]" />

                  {/* Interactive Large Nav Arrows */}
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-surface-1/80 hover:bg-cyan-soft text-cyan-glow border border-line hover:border-line-strong transition-all rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    aria-label="Previous Directive"
                    title="Previous Directive"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-surface-1/80 hover:bg-cyan-soft text-cyan-glow border border-line hover:border-line-strong transition-all rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    aria-label="Next Directive"
                    title="Next Directive"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Foreground Content Panel */}
                  <div className="relative z-10 p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3 max-w-3xl">
                    {/* Eyebrow / Category badge */}
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold font-grotesk tracking-[0.08em] uppercase px-2 py-0.5 rounded-chip border inline-flex items-center gap-1.5 bg-cyan-soft text-cyan-glow border-line-subtle">
                        {activeModule.icon}
                        {activeModule.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-grotesk font-extrabold text-xl sm:text-2xl md:text-3xl text-ink uppercase tracking-wider leading-tight drop-shadow-md">
                      {activeModule.title}
                    </h3>

                    {/* Description with locked minimum height to prevent layout shifts */}
                    <p className="text-xs sm:text-sm text-ink-body font-sans leading-relaxed max-w-2xl min-h-[3rem] sm:min-h-[2.5rem] line-clamp-2">
                      {activeModule.description}
                    </p>

                    {/* Action Row */}
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => navigate({ to: activeModule.route })}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-control border border-line bg-surface-1/90 hud-sheen hover:bg-surface-2 hover:border-line-strong text-ink font-grotesk font-bold text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      >
                        <span className="tracking-[0.08em]">{activeModule.ctaText}</span>
                        <ArrowRight className="w-4 h-4 text-cyan-glow" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Segmented Tab Rail (Single Unified Layer with In-Tab Progress Line) */}
                <div className="grid grid-cols-3 sm:grid-cols-6 border-t border-line-subtle divide-x divide-line-subtle bg-surface-1 shrink-0">
                  {LAUNCHPAD_MODULES.map((mod, idx) => {
                    const isActive = currentIndex === idx
                    return (
                      <button
                        key={mod.id}
                        onClick={() => handleSelectModule(idx)}
                        className={`relative py-2.5 px-2 sm:px-3 transition-all text-left flex items-center justify-between overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                          isActive
                            ? 'bg-surface-2 text-ink'
                            : 'bg-transparent hover:bg-surface-2 text-ink-muted hover:text-ink'
                        }`}
                        aria-label={`Select directive 0${idx + 1}: ${mod.title}`}
                        aria-current={isActive ? 'true' : 'false'}
                      >
                        {/* Current-tab underline (2px cyan) with the auto-advance progress inside it */}
                        <div
                          className={`absolute bottom-0 inset-x-0 h-[2px] pointer-events-none overflow-hidden ${
                            isActive ? 'bg-cyan-glow/30' : 'bg-transparent'
                          }`}
                        >
                          {isActive && (
                            <div
                              key={`${progressKey}-${isPlaying}`}
                              className="h-full w-full origin-left bg-cyan-glow"
                              style={{
                                animation: isPlaying ? 'carouselProgress 6000ms linear forwards' : 'none',
                                width: isPlaying ? undefined : '100%',
                                willChange: 'transform',
                              }}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="shrink-0">
                            {React.isValidElement(mod.icon)
                              ? React.cloneElement(mod.icon as React.ReactElement<{ className?: string }>, {
                                  className: `w-3.5 h-3.5 ${isActive ? 'text-cyan-glow' : 'text-ink-muted opacity-60'}`,
                                })
                              : mod.icon}
                          </span>
                          <span
                            className={`text-[11px] font-grotesk font-bold uppercase tracking-[0.08em] truncate ${
                              isActive ? 'text-ink' : 'text-ink-muted'
                            }`}
                          >
                            {mod.id}
                          </span>
                        </div>

                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1 transition-all ${
                            isActive ? 'bg-cyan-glow' : 'bg-transparent'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
              </section>
            </HudCard>
          </div>

          {/* Right Column: MoltNation News — mobile shows featured carousel only; desktop keeps the articles list */}
          <div className="lg:col-span-4 flex flex-col h-auto lg:h-full min-h-0">
            <div
              className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-3.5 space-y-2 relative overflow-hidden h-full flex flex-col justify-between min-h-0"
              onMouseEnter={() => setIsNewsHovered(true)}
              onMouseLeave={() => setIsNewsHovered(false)}
              data-testid="moltnation-news-panel"
            >
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                {/* News Header */}
                <div className="flex items-center justify-between border-b border-line-subtle pb-1.5 gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Newspaper className="w-3.5 h-3.5 text-crimson-text shrink-0" />
                    <h3 className="font-grotesk text-xs font-bold text-ink tracking-[0.08em] uppercase truncate">
                      MOLTNATION NEWS
                    </h3>
                  </div>
                </div>

                {/* Featured Article Card */}
                {currentNewsPost && (
                  <div
                    className="rounded-card border border-cyan-glow/40 hover:border-line-strong transition-colors group flex flex-col cursor-pointer relative overflow-hidden bg-abyss shrink-0"
                    onClick={() => setActiveNewsPost(currentNewsPost)}
                  >
                    {posts.some((p) => p.coverImageUrl) && (
                      <div className="relative h-36 w-full overflow-hidden border-b border-line-subtle bg-black">
                        {/* Background Visual Images with Smooth Cross-fade (matching section to the left) */}
                        {posts.map((post, idx) => {
                          if (!post.coverImageUrl) return null
                          const isActive = idx === featuredNewsIndex
                          return (
                            <img
                              key={post.slug || idx}
                              src={getAssetUrl(post.coverImageUrl)}
                              alt={post.title}
                              className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-opacity duration-700 ${
                                isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}
                            />
                          )
                        })}

                        <div className="absolute bottom-1 right-1 z-10 bg-surface-1/90 text-ink-muted text-[11px] px-1 py-0.2 border border-line-subtle rounded-chip flex items-center gap-1 font-sans">
                          <Clock className="w-2.5 h-2.5 text-cyan-glow" />
                          <span>{currentNewsPost.readTimeMinutes}M READ</span>
                        </div>
                      </div>
                    )}

                    <div
                      key={currentNewsPost.slug}
                      className="p-2 space-y-1.5 flex flex-col animate-in fade-in duration-500"
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-grotesk text-xs font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase line-clamp-2 leading-snug">
                          {formatNewsTitle(currentNewsPost.title).headline}
                        </h4>
                        <p className="text-[11px] text-ink-muted line-clamp-2 font-sans">
                          {currentNewsPost.summary}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-line-subtle flex items-center justify-between text-[11px] font-sans">
                        <span className="text-ink-muted truncate max-w-[120px]">BY: {currentNewsPost.authorName}</span>
                        <span className="text-cyan-glow font-bold flex items-center gap-0.5 group-hover:underline">
                          <span>READ ARTICLE</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scrollable Articles Feed — desktop only; mobile keeps the featured carousel compact */}
                {otherNewsPosts.length > 0 && (
                  <div
                    className="hidden lg:flex lg:flex-1 flex-col space-y-1 pt-0.5 min-h-0"
                    data-testid="moltnation-news-articles"
                  >
                    <div className="flex items-center justify-between text-[11px] font-sans font-bold uppercase tracking-[0.08em] text-ink-muted shrink-0">
                      <span>ARTICLES ({posts.length})</span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 touch-pan-y no-scrollbar hover:scrollbar-thin font-sans">
                      {otherNewsPosts.map((post) => (
                        <div
                          key={post.slug}
                          onClick={() => setActiveNewsPost(post)}
                          className="rounded-card p-1.5 border border-line-subtle bg-abyss/80 hover:bg-surface-2 hover:border-line-strong transition-colors cursor-pointer group space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-cyan-glow font-bold uppercase tracking-[0.08em] bg-cyan-soft px-1 py-0.2 border border-line-subtle rounded-chip">
                              {post.category}
                            </span>
                            <span className="text-ink-muted flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-ink-muted" />
                              {post.readTimeMinutes}m read
                            </span>
                          </div>

                          <h5 className="font-grotesk text-[11px] font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase line-clamp-1 leading-tight">
                            {formatNewsTitle(post.title).headline}
                          </h5>

                          <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-line-subtle text-ink-muted">
                            <span>BY: {post.authorName}</span>
                            <span className="text-cyan-glow group-hover:translate-x-0.5 transition-transform flex items-center">
                              READ <ChevronRight className="w-2.5 h-2.5" />
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
                className="w-full py-1 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong text-[11px] font-bold font-grotesk text-cyan-glow uppercase tracking-[0.08em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center justify-center gap-1 shrink-0 mt-2"
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
