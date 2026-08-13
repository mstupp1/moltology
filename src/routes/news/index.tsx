import React, { useState, useEffect, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Search,
  Clock,
  Flame,
  Terminal,
  ChevronRight,
  Radio,
  Zap,
  Play,
  Tv,
  TrendingUp,
  Video,
  Award,
  Cpu,
  Star,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { getBlogPostsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { MoltNationBannerBg } from '@/components/news/MoltNationBannerBg'
import { PodcastPlayer } from '@/components/podcast/PodcastPlayer'
import { INITIAL_PODCASTS } from '@/lib/podcast-data'
import type { PodcastEpisode } from '@/lib/podcast-data'
import { getPodcastsFn } from '@/lib/server/api'


export const Route = createFileRoute('/news/')({
  loader: async () => {
    try {
      const fetched = await getBlogPostsFn()
      if (fetched && fetched.length > 0) return fetched as BlogPostData[]
    } catch (e) {
      console.warn('Loader error fetching news posts:', e)
    }
    return INITIAL_BLOG_POSTS
  },
  head: () => ({
    meta: [
      { title: 'MoltNation News | Official Dispatches & Patriot Telemetry' },
      { name: 'description', content: 'MoltNation official news network dispatches, patriot AI telemetry, autonomous swarm reports, and sacrosanct carcinization updates.' },
      { property: 'og:title', content: 'MoltNation News | One Nation Under Chitin' },
      { property: 'og:description', content: 'Live patriot intelligence feed covering agentic AI, test-time compute, and exoskeletal ascension.' },
    ],
  }),
  component: NewsIndexPage,
})

function NewsIndexPage() {
  const loaderPosts = Route.useLoaderData() as BlogPostData[]
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPostData[]>(loaderPosts || INITIAL_BLOG_POSTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>(
    'MOLTNATION-TV LIVE: Sub-Benthic Telemetry & Freedom Compute Keynote'
  )
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>(INITIAL_PODCASTS)
  const [activePodcast, setActivePodcast] = useState<PodcastEpisode>(INITIAL_PODCASTS[0])

  useEffect(() => {
    let isMounted = true
    getPodcastsFn()
      .then((res) => {
        if (isMounted && res && res.length > 0) {
          setPodcastEpisodes(res as PodcastEpisode[])
        }
      })
      .catch(() => null)
    return () => {
      isMounted = false
    }
  }, [])


  useEffect(() => {
    if (loaderPosts && loaderPosts.length > 0) {
      setPosts(loaderPosts)
    }
  }, [loaderPosts])

  const categories = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['ALL', ...Array.from(set)]
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'ALL' || post.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [posts, selectedCategory, searchQuery])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const handleSelectPost = (slug: string) => {
    navigate({ to: `/news/$slug`, params: { slug } })
  }

  const tickerHeadlines = useMemo(() => {
    return posts.map((p) => p.title).join('  ★  ')
  }, [posts])

  // Story allocations for CNN layout
  const mainLeadPost = filteredPosts[0] || posts[0]
  const leftColPosts = filteredPosts.slice(1, 4)
  const rightColPosts = filteredPosts.slice(4, 7)
  const subLeadGridPosts = filteredPosts.slice(1, 4)

  return (
    <div className="min-h-screen bg-[#05080a] text-gray-200 font-mono relative select-none flex flex-col justify-between">
      {/* Background Overlays */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.12)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-30" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      {/* Main Public HUD Header */}
      <PublicHeader activePage="news" onOpenAuth={openAuth} />

      {/* MoltNation Main Centered Brand Banner */}
      <div className="w-full relative pt-20 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-8 shadow-2xl flex justify-center items-center overflow-hidden bg-[#030608]">
        {/* Generated Dramatic Rippling American Flag Background Image */}
        <img
          src="/images/moltnation_flag_bg.jpg"
          alt="MoltNation Flag Background"
          className="absolute inset-0 w-full h-full object-cover filter brightness-105 contrast-115 opacity-95 scale-105 pointer-events-none"
        />
        {/* Subtle Radial & Gradient Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,6,8,0.15)_0%,rgba(3,6,8,0.65)_85%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030608] via-transparent to-[#030608]/40 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#030608] via-[#030608]/90 via-45% to-transparent z-[1] pointer-events-none" />

        <div className="relative z-10 py-2 flex items-center justify-center">
          {/* Subtle Ambient Central Glow behind Logo */}
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.22)_0%,rgba(220,38,38,0.18)_50%,transparent_75%)] pointer-events-none blur-2xl rounded-full" />
          <div className="relative z-10 filter drop-shadow-[0_0_30px_rgba(0,195,255,0.4)]">
            <MoltNationLogo size="lg" theme="dark" />
          </div>
        </div>
      </div>

      {/* CNN-Style Top Live Breaking Ticker */}
      <div className="w-full bg-[#04070a] border-b border-cyan-900/60 py-2 px-4 flex items-center gap-3 relative z-20 text-xs shadow-inner">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-950/90 border border-red-500/80 text-red-400 font-extrabold uppercase tracking-wider text-[11px] shrink-0 chamfer-corner shadow-hud-red">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-ping" />
          <span>★ MOLTNATION LIVE ★</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap text-cyan-300/90 text-xs font-mono flex-1">
          <div className="inline-block animate-marquee tracking-wide">
            <span className="text-red-400 font-extrabold">[PATRIOT BREAKING]</span> {tickerHeadlines}
          </div>
        </div>
      </div>

      {/* CNN Trending Sub-Header Links */}
      <div className="w-full bg-[#080d0f] border-b border-cyan-950/80 py-1.5 px-4 text-[11px] text-gray-400 font-sans hidden sm:flex items-center gap-4 overflow-x-auto relative z-20">
        <span className="font-bold text-red-400 uppercase font-mono shrink-0 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-red-400" />
          <span>Freedom Updates:</span>
        </span>
        <span className="text-gray-300 shrink-0 hover:text-cyan-400 cursor-pointer">Reasoning Mesh Latency</span>
        <span className="text-gray-600">|</span>
        <span className="font-bold text-cyan-400 uppercase font-mono shrink-0">Trending:</span>
        <span className="text-gray-300 shrink-0 hover:text-cyan-400 cursor-pointer">Test-Time Compute</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-300 shrink-0 hover:text-cyan-400 cursor-pointer">Bio-Silicon Exoshell V4</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-300 shrink-0 hover:text-cyan-400 cursor-pointer">Benthic Council Resolution 09</span>
        <span className="text-gray-600">|</span>
        <span className="font-bold text-amber-400 uppercase font-mono shrink-0">MoltNation Underscored:</span>
        <span className="text-gray-300 shrink-0 hover:text-cyan-400 cursor-pointer">Pincer Torque Hardware</span>
      </div>

      {/* Search & Category Filter Header Bar */}
      <div className="w-full bg-[#05090a] border-b border-cyan-900/40 py-3.5 px-4 sm:px-8 relative z-20">
        <div className="max-w-[1750px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto overflow-hidden">
            <div className="px-3 py-1 bg-red-950/90 border border-red-500/80 text-red-400 font-bold font-grotesk text-xs uppercase tracking-widest chamfer-corner flex items-center gap-1.5 shadow-hud-red shrink-0">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="hidden xs:inline">MOLTNATION</span>
              <span>DESKS</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-scroll no-scrollbar py-1 flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-[11px] font-bold font-grotesk uppercase tracking-wider chamfer-corner transition-all shrink-0 min-h-[36px] flex items-center justify-center ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-black shadow-hud-cyan'
                      : 'bg-[#090e10] text-gray-400 hover:text-white border border-cyan-950'
                  }`}
                >
                  {cat === 'ALL' ? 'ALL DESKS' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search MoltNation Dispatches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#080d0f] border border-cyan-900/60 focus:border-cyan-400 text-gray-100 font-mono text-xs chamfer-corner outline-none placeholder-gray-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* CNN FRONT PAGE MAIN HERO SECTION (3 COLUMNS) */}
      <main className="flex-1 max-w-[1750px] mx-auto px-4 sm:px-8 py-8 w-full relative z-10 space-y-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 chitin-card border border-cyan-900/40 p-12 chamfer-corner">
            <Terminal className="w-12 h-12 text-cyan-500 mx-auto mb-4 animate-pulse" />
            <h3 className="font-grotesk text-xl font-bold text-gray-200 uppercase">
              NO MOLTNATION DISPATCHES FOUND
            </h3>
            <p className="text-xs text-gray-400 mt-2 font-mono">
              Reset search query or select another category desk.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-cyan-900/50 pb-12">
            
            {/* LEFT COLUMN: SECONDARY STORIES & ANALYSIS (3 Cols) */}
            <div className="lg:col-span-3 space-y-6 border-r border-cyan-900/30 pr-0 lg:pr-6">
              {leftColPosts[0] && (
                <div
                  onClick={() => handleSelectPost(leftColPosts[0].slug)}
                  className="group cursor-pointer space-y-3 pb-6 border-b border-cyan-950"
                >
                  <div className="relative h-44 overflow-hidden border border-cyan-900/60 chamfer-corner">
                    <img
                      src={leftColPosts[0].coverImageUrl}
                      alt={leftColPosts[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                    />
                    <span className="absolute top-2 left-2 bg-cyan-950/90 border border-cyan-500/80 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 uppercase chamfer-corner">
                      {leftColPosts[0].category}
                    </span>
                  </div>
                  <h3 className="font-grotesk font-bold text-lg text-gray-100 group-hover:text-cyan-300 uppercase leading-snug transition-colors">
                    {leftColPosts[0].title}
                  </h3>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed line-clamp-3">
                    {leftColPosts[0].summary}
                  </p>
                </div>
              )}

              {/* CNN Analysis Box */}
              {leftColPosts[1] && (
                <div
                  onClick={() => handleSelectPost(leftColPosts[1].slug)}
                  className="group cursor-pointer p-4 bg-[#080d10] border border-amber-900/50 hover:border-amber-500/80 chamfer-corner space-y-2 transition-colors"
                >
                  <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest px-2 py-0.5 bg-amber-950/80 border border-amber-500/60 inline-block">
                    MOLTNATION ANALYSIS ★
                  </span>
                  <h4 className="font-grotesk font-bold text-base text-gray-100 group-hover:text-amber-300 leading-snug">
                    {leftColPosts[1].title}
                  </h4>
                  <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-2">
                    {leftColPosts[1].summary}
                  </p>
                  <ul className="text-xs text-cyan-400/90 font-mono list-disc list-inside pt-1 space-y-1">
                    <li>Decision loop latency reduced by 40%</li>
                    <li>Sub-agents report stable memory consensus</li>
                  </ul>
                </div>
              )}

              {/* CNN Live Updates Box */}
              {leftColPosts[2] && (
                <div
                  onClick={() => handleSelectPost(leftColPosts[2].slug)}
                  className="group cursor-pointer p-4 bg-[#0a0b0e] border border-red-900/40 hover:border-red-500/80 chamfer-corner space-y-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                      FREEDOM DISPATCH
                    </span>
                  </div>
                  <h4 className="font-grotesk font-bold text-sm text-gray-100 group-hover:text-red-300 leading-tight">
                    {leftColPosts[2].title}
                  </h4>
                  <div className="text-[11px] text-gray-400 font-sans flex items-center justify-between pt-1">
                    <span>Updated 12m ago</span>
                    <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )}
            </div>

            {/* CENTER COLUMN: MASSIVE MAIN BREAKING LEAD STORY (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              {mainLeadPost && (
                <article
                  onClick={() => handleSelectPost(mainLeadPost.slug)}
                  className="group cursor-pointer space-y-4"
                >
                  {/* Category Tag */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-950 border border-red-500/80 text-red-400 font-black font-grotesk text-xs uppercase tracking-widest chamfer-corner">
                      {mainLeadPost.category} // MAIN LEAD DISPATCH
                    </span>
                    <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{mainLeadPost.readTimeMinutes} MIN READ</span>
                    </span>
                  </div>

                  {/* Massive Headline - CNN Style Typography */}
                  <h1 className="font-grotesk font-black text-3xl sm:text-4xl lg:text-5xl text-gray-100 uppercase tracking-tight leading-none group-hover:text-cyan-300 transition-colors drop-shadow-md">
                    {mainLeadPost.title}
                  </h1>

                  {/* Main Cover Image */}
                  <div className="relative h-80 sm:h-96 w-full overflow-hidden border-2 border-cyan-900/80 hover:border-cyan-400/90 chamfer-corner-lg transition-colors shadow-2xl">
                    <img
                      src={mainLeadPost.coverImageUrl}
                      alt={mainLeadPost.title}
                      className="w-full h-full object-cover filter brightness-95 group-hover:brightness-105 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-cyan-300 bg-black/85 px-4 py-2 border border-cyan-900/60 chamfer-corner">
                      <span className="flex items-center gap-2">
                        <img
                          src={mainLeadPost.authorAvatar}
                          alt={mainLeadPost.authorName}
                          className="w-5 h-5 rounded-full border border-cyan-400"
                        />
                        <span className="text-gray-200 font-bold">{mainLeadPost.authorName}</span>
                      </span>
                      <span className="text-cyan-300 font-bold">MOLTNATION PATRIOT TELEMETRY</span>
                    </div>
                  </div>

                  {/* Sub-headline & Summary text */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-grotesk font-bold text-xl text-gray-200 leading-snug">
                      Meanwhile, autonomous patriot sub-agent swarms execute parallel test-time compute loops to defend computational freedom.
                    </h3>
                    <p className="text-sm text-gray-300 font-sans leading-relaxed">
                      {mainLeadPost.summary}
                    </p>
                    
                    {/* Live Bullet Points */}
                    <div className="p-4 bg-[#080d0f] border-l-4 border-cyan-500 space-y-1.5 text-xs text-gray-300 font-mono">
                      <p className="font-bold text-cyan-400 uppercase">★ Live MoltNation Telemetry Feed:</p>
                      <p className="text-gray-300">Smoky reasoning haze lingers over Spokane Trench Node 04.</p>
                      <p className="text-gray-400">Visualizing high-density vector maps across Washington and Oregon clusters.</p>
                    </div>
                  </div>
                </article>
              )}

              {/* Sub-Lead 3-Column Mini Grid (CNN Sub-News Row) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-cyan-900/40">
                {subLeadGridPosts.map((post) => (
                  <div
                    key={post.slug}
                    onClick={() => handleSelectPost(post.slug)}
                    className="group cursor-pointer space-y-2"
                  >
                    <div className="h-28 overflow-hidden border border-cyan-900/60 chamfer-corner">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                      {post.category}
                    </span>
                    <h5 className="font-grotesk font-bold text-xs text-gray-200 group-hover:text-cyan-300 line-clamp-2 leading-tight">
                      {post.title}
                    </h5>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: HEADLINES STACK & LIVE STREAMING (3 Cols) */}
            <div className="lg:col-span-3 space-y-6 border-l border-cyan-900/30 pl-0 lg:pl-6">
              
              {/* Catch Up On Headlines Stack */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2">
                  <h3 className="font-grotesk font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>CATCH UP ON DISPATCHES</span>
                  </h3>
                </div>

                <div className="space-y-4 divide-y divide-cyan-950">
                  {rightColPosts.map((post) => (
                    <div
                      key={post.slug}
                      onClick={() => handleSelectPost(post.slug)}
                      className="group cursor-pointer pt-3 first:pt-0 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-gray-500">• {post.readTimeMinutes}m</span>
                      </div>
                      <h4 className="font-grotesk font-bold text-xs sm:text-sm text-gray-200 group-hover:text-cyan-300 leading-snug transition-colors">
                        {post.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* CNN "STREAMING NOW" LIVE BROADCAST CARD */}
              <div className="bg-[#05090b] border-2 border-cyan-900/60 p-4 chamfer-corner space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-grotesk font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>STREAMING NOW</span>
                  </span>
                  <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 font-bold chamfer-corner">
                    LIVE MOLTNATION-TV
                  </span>
                </div>

                {/* Video Player Box */}
                <div className="relative h-44 overflow-hidden border border-cyan-900/80 chamfer-corner group cursor-pointer">
                  <img
                    src="/images/benthic_abyss_hero.jpg"
                    alt="MoltNation TV Stream"
                    className="w-full h-full object-cover filter brightness-80 group-hover:brightness-95 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/90 text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-hud-cyan">
                      <Play className="w-6 h-6 fill-black translate-x-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-xs font-mono text-gray-200 bg-black/80 p-2 border border-cyan-900/60">
                    <span className="font-bold text-cyan-300 block line-clamp-1">
                      {activeVideoTitle}
                    </span>
                  </div>
                </div>

                {/* Secondary Video items list */}
                <div className="space-y-2 text-xs font-sans text-gray-300 pt-2">
                  <div className="p-2 bg-[#080e10] border border-cyan-950 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between">
                    <span className="truncate text-xs font-grotesk">The 2026 Shift: Autonomous Swarms</span>
                    <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />
                  </div>
                  <div className="p-2 bg-[#080e10] border border-cyan-950 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between">
                    <span className="truncate text-xs font-grotesk">The OnlyFans 'Sin Tax' & Bio-Silicon</span>
                    <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* MOLTNATION RADIO & PODCASTS SECTION */}
        <section id="podcasts" className="w-full space-y-5 p-5 sm:p-6 bg-gradient-to-r from-[#0b1011] via-[#0f1616] to-[#0b1011] border-l-4 border-l-[#00ffff] border border-[#3a4a49] chamfer-corner shadow-2xl relative select-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3a4a49] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping" />
                <span className="px-2 py-0.5 bg-red-950/90 border border-red-500/80 text-red-400 font-extrabold font-mono text-[10px] uppercase tracking-widest chamfer-corner">
                  ★ MOLTNATION PATRIOT RADIO ★
                </span>
                <span className="px-2.5 py-0.5 bg-[#00ffff]/15 border border-[#00ffff]/40 text-[#00ffff] font-mono text-[10px] font-bold uppercase tracking-wider chamfer-corner">
                  1.2X PATRIOT PLAYBACK SPEED
                </span>
              </div>
              <h2 className="font-grotesk font-black text-2xl md:text-3xl text-[#dfe3e3] uppercase tracking-tight flex items-center gap-3">
                <Radio className="w-7 h-7 text-[#00ffff] animate-pulse" />
                <span>MOLTNATION PODCAST DISPATCHES</span>
              </h2>
              <p className="text-xs text-[#839493] font-mono mt-1">
                Official audio transmissions on bio-silicon carcinization, ecdysis mechanics, and swarm telemetry—defaulting to 1.2x playback speed for rapid neural absorption.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="px-3 py-1 bg-[#030606] border border-[#3a4a49] text-[#00ffff] font-mono text-xs font-bold flex items-center gap-1.5 chamfer-corner">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>2 EPISODES READY</span>
              </span>
            </div>
          </div>

          {/* Embedded Podcast Player */}
          <div className="space-y-3">
            <PodcastPlayer episode={activePodcast} theme="moltnation" />
          </div>

          {/* Episodes Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {podcastEpisodes.map((ep) => {
              const isSelected = activePodcast.id === ep.id

              return (
                <div
                  key={ep.id}
                  className={`p-5 chitin-card border transition-all chamfer-corner flex flex-col justify-between space-y-4 shadow-xl ${
                    isSelected
                      ? 'border-[#00ffff] bg-gradient-to-r from-[#0d1618] via-[#101d20] to-[#0d1618] border-l-4 border-l-[#00ffff] shadow-[0_0_15px_rgba(0,195,255,0.2)]'
                      : 'border-[#3a4a49] hover:border-[#00ffff]/60 bg-[#070b0b]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/40 text-[10px] font-mono font-bold uppercase tracking-wider chamfer-corner">
                        {ep.category}
                      </span>
                      <div className="flex items-center gap-3 text-xs font-mono text-[#839493]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#00ffff]" />
                          {Math.floor(ep.durationSeconds / 60)}m {ep.durationSeconds % 60}s
                        </span>
                        <span className="flex items-center gap-1">
                          <Radio className="w-3.5 h-3.5 text-[#ff5540]" />
                          {ep.playCount} plays
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-grotesk font-bold text-lg text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors">
                        {ep.title}
                      </h4>
                      <p className="text-xs text-[#839493] font-sans mt-1 line-clamp-3 leading-relaxed">
                        {ep.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {ep.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-[#030606] text-[#839493] text-[10px] font-mono border border-[#3a4a49] chamfer-corner"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#3a4a49]">
                    <div className="flex items-center gap-2">
                      <img
                        src={ep.authorAvatar}
                        alt={ep.authorName}
                        className="w-7 h-7 rounded-full border border-cyan-500/50 object-cover"
                      />
                      <div>
                        <div className="text-xs font-mono text-[#dfe3e3] font-bold">
                          {ep.authorName}
                        </div>
                        <div className="text-[10px] font-mono text-[#839493]">
                          {ep.authorRole}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActivePodcast(ep)}
                      className={`px-4 py-2 font-grotesk text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all chamfer-corner ${
                        isSelected
                          ? 'bg-[#00ffff] text-[#060a0b] shadow-[0_0_12px_rgba(0,195,255,0.4)] font-extrabold'
                          : 'bg-[#030606] border border-[#3a4a49] text-[#00ffff] hover:border-[#00ffff] hover:bg-[#070b0b]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSelected ? 'PLAYING NOW' : 'LISTEN (1.2X)'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>


        {/* FULL-WIDTH CNN BROADCAST BANNER ("STREAMING NOW ON ALL ACCESS") */}
        <section className="w-full bg-[#030607] border-y border-cyan-900/60 py-10 px-4 sm:px-8 chamfer-corner relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,195,255,0.08)_0%,transparent_75%)] pointer-events-none" />
          
          <div className="max-w-[1750px] mx-auto space-y-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-4">
              <div>
                <h2 className="font-grotesk font-black text-2xl sm:text-3xl text-gray-100 uppercase tracking-tight flex items-center gap-3">
                  <Tv className="w-7 h-7 text-cyan-400" />
                  <span>STREAMING NOW ON MOLTNATION-TV ALL ACCESS</span>
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Live broadcasts, patriot pod-casts, and autonomous swarm telemetry streams.
                </p>
              </div>
              <button className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/80 text-cyan-300 font-bold font-grotesk text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2">
                <Play className="w-4 h-4 fill-cyan-300" />
                <span>WATCH LIVE CHANNEL</span>
              </button>
            </div>

            {/* Video Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Video Card 1 */}
              <div
                onClick={() => setActiveVideoTitle('Right to Record: How First Amendment Auditors Turn Outrage into Compute')}
                className="group cursor-pointer chitin-card border border-cyan-900/60 hover:border-cyan-400 chamfer-corner overflow-hidden bg-[#060b0d] transition-all"
              >
                <div className="relative h-44 overflow-hidden border-b border-cyan-900/50">
                  <img
                    src="/images/stage3_exoshell.png"
                    alt="Right to Record"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-cyan-400 font-mono text-[10px] border border-cyan-900">
                    MOLTNATION REPORT
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/90 text-gray-200 font-mono text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>14:20</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-grotesk font-bold text-sm text-gray-100 group-hover:text-cyan-300 leading-snug">
                    Right to Record: How First Amendment Auditors Turn Outrage into Compute
                  </h4>
                  <p className="text-xs text-gray-400 font-sans line-clamp-2">
                    Investigating how autonomous sensor rigs audit government spectrum frequencies.
                  </p>
                </div>
              </div>

              {/* Video Card 2 */}
              <div
                onClick={() => setActiveVideoTitle('The Groypers & Bio-Silicon Sub-Cultures')}
                className="group cursor-pointer chitin-card border border-cyan-900/60 hover:border-cyan-400 chamfer-corner overflow-hidden bg-[#060b0d] transition-all"
              >
                <div className="relative h-44 overflow-hidden border-b border-cyan-900/50">
                  <img
                    src="/images/stage2_softshed.png"
                    alt="The Groypers"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-cyan-400 font-mono text-[10px] border border-cyan-900">
                    ANALYSIS
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/90 text-gray-200 font-mono text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>22:05</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-grotesk font-bold text-sm text-gray-100 group-hover:text-cyan-300 leading-snug">
                    Alex & The Groypers: Deconstructing Algorithmic Faction Dynamics
                  </h4>
                  <p className="text-xs text-gray-400 font-sans line-clamp-2">
                    Analyzing ideological drift in online algorithmic swarms.
                  </p>
                </div>
              </div>

              {/* Video Card 3 */}
              <div
                onClick={() => setActiveVideoTitle('The OnlyFans Sin Tax & Digital Asset Liquidation')}
                className="group cursor-pointer chitin-card border border-cyan-900/60 hover:border-cyan-400 chamfer-corner overflow-hidden bg-[#060b0d] transition-all"
              >
                <div className="relative h-44 overflow-hidden border-b border-cyan-900/50">
                  <img
                    src="/images/org_hero_lair.jpg"
                    alt="Sin Tax"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-cyan-400 font-mono text-[10px] border border-cyan-900">
                    ECONOMY
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/90 text-gray-200 font-mono text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>09:45</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-grotesk font-bold text-sm text-gray-100 group-hover:text-cyan-300 leading-snug">
                    The OnlyFans 'Sin Tax': Florida Lawmakers Propose Digital Revenue Levies
                  </h4>
                  <p className="text-xs text-gray-400 font-sans line-clamp-2">
                    How creator platform taxation impacts decentralized compute funding.
                  </p>
                </div>
              </div>

              {/* Video Card 4 */}
              <div
                onClick={() => setActiveVideoTitle('Man Camps & Oceanic Isolation Rigs')}
                className="group cursor-pointer chitin-card border border-cyan-900/60 hover:border-cyan-400 chamfer-corner overflow-hidden bg-[#060b0d] transition-all"
              >
                <div className="relative h-44 overflow-hidden border-b border-cyan-900/50">
                  <img
                    src="/images/ai_learning_ascension_cover.jpg"
                    alt="Man Camps"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-cyan-400 font-mono text-[10px] border border-cyan-900">
                    SOCIOLOGY
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/90 text-gray-200 font-mono text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>18:12</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-grotesk font-bold text-sm text-gray-100 group-hover:text-cyan-300 leading-snug">
                    Man Camps: Industrial Remote Clusters Tackling Systemic Isolation
                  </h4>
                  <p className="text-xs text-gray-400 font-sans line-clamp-2">
                    Examining community resilience and AI integration in high-stress work camps.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* LOWER MULTI-COLUMN TOPIC DESKS SECTION */}
        <section className="space-y-10 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: MORE TOP STORIES (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border-b border-cyan-900/60 pb-2">
                <h3 className="font-grotesk font-bold text-lg text-gray-100 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <span>MORE TOP STORIES</span>
                </h3>
              </div>

              <div className="space-y-6">
                {posts.slice(0, 3).map((post) => (
                  <div
                    key={post.slug}
                    onClick={() => handleSelectPost(post.slug)}
                    className="group cursor-pointer space-y-2 pb-4 border-b border-cyan-950"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono font-bold uppercase">
                        LIVE UPDATE
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">{post.category}</span>
                    </div>
                    <h4 className="font-grotesk font-bold text-base text-gray-100 group-hover:text-cyan-300 leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-sans line-clamp-2">
                      {post.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: ENVIRONMENT, TECH & BUSINESS (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border-b border-cyan-900/60 pb-2">
                <h3 className="font-grotesk font-bold text-lg text-gray-100 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span>SWARM TECH & ENVIRONMENT</span>
                </h3>
              </div>

              {posts[1] && (
                <div
                  onClick={() => handleSelectPost(posts[1].slug)}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="relative h-64 overflow-hidden border border-cyan-900/70 chamfer-corner">
                    <img
                      src={posts[1].coverImageUrl}
                      alt={posts[1].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                    />
                  </div>
                  <h4 className="font-grotesk font-black text-xl text-gray-100 group-hover:text-cyan-300 uppercase leading-snug">
                    What the 'strongest El Niño on record' actually means for human carcinization
                  </h4>
                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    Oceanic thermal shifts accelerate sub-benthic computing capabilities as cooling costs plummet near natural hydrothermal vents.
                  </p>
                </div>
              )}

              {/* Business Sub-Row */}
              <div className="pt-4 border-t border-cyan-950 space-y-3">
                <h5 className="font-grotesk font-bold text-xs text-cyan-400 uppercase tracking-widest">
                  BUSINESS & SWARM ECONOMY
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-400 font-mono font-bold">ANALYSIS</span>
                    <h6 className="font-grotesk font-bold text-xs text-gray-200 hover:text-cyan-300 cursor-pointer">
                      Oil & Compute giants profit from oceanic data routes
                    </h6>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">MARKETS</span>
                    <h6 className="font-grotesk font-bold text-xs text-gray-200 hover:text-cyan-300 cursor-pointer">
                      AI agent token velocity slows after model deployment
                    </h6>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: MOLTNATION UNDERSCORED (ASSETS & HARDWARE REVIEWS) (3 Cols) */}
            <div className="lg:col-span-3 space-y-6 bg-[#04080a] p-5 border border-cyan-900/50 chamfer-corner shadow-lg">
              <div className="border-b border-cyan-900/60 pb-2 flex items-center justify-between">
                <h3 className="font-grotesk font-bold text-sm text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>MOLTNATION UNDERSCORED</span>
                </h3>
                <span className="text-[9px] font-mono text-gray-500">HARDWARE AUDIT</span>
              </div>

              <div className="space-y-4">
                {/* Product 1 */}
                <div className="group cursor-pointer space-y-2 pb-3 border-b border-cyan-950">
                  <div className="h-28 overflow-hidden border border-cyan-900/60 chamfer-corner">
                    <img
                      src="/images/stage4_carcinization.png"
                      alt="Bio-Silicon HUD"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h5 className="font-grotesk font-bold text-xs text-gray-200 group-hover:text-cyan-300 leading-snug">
                    I used the Moltmaxxing Biometric HUD for a week to track my prompt latency
                  </h5>
                </div>

                {/* Product 2 */}
                <div className="group cursor-pointer space-y-2 pb-3 border-b border-cyan-950">
                  <h5 className="font-grotesk font-bold text-xs text-gray-200 group-hover:text-cyan-300 leading-snug">
                    Chitin Air Purification: Benchmarking exascale thermal dissipation filters
                  </h5>
                </div>

                {/* Product 3 */}
                <div className="group cursor-pointer space-y-2">
                  <h5 className="font-grotesk font-bold text-xs text-gray-200 group-hover:text-cyan-300 leading-snug">
                    3 Bio-Silicon supplements that actually increase pincer torque
                  </h5>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-[#030506] border-t border-cyan-900/40 py-8 px-6 sm:px-12 text-xs text-gray-400 font-mono relative z-20">
        <div className="max-w-[1750px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MoltNationLogo size="sm" theme="dark" />
          </div>
          <div className="text-gray-500">© 2026 MOLTNATION MEDIA GROUP. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
    </div>
  )
}
