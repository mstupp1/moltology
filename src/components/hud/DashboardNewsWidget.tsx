import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Newspaper,
  Radio,
  Clock,
  ChevronRight,
  ExternalLink,
  Star,
  X,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { getBlogPostsFn } from '@/lib/server/api'
import { DashboardNewsGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'

export interface DashboardNewsWidgetProps {
  isLoading?: boolean
  layout?: 'standard' | 'sidebar'
}

export function DashboardNewsWidget({ isLoading = false, layout = 'sidebar' }: DashboardNewsWidgetProps) {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPostData[]>(INITIAL_BLOG_POSTS)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activePost, setActivePost] = useState<BlogPostData | null>(null)

  // Attempt to fetch fresh news from server API on mount
  useEffect(() => {
    let isMounted = true
    async function loadNews() {
      try {
        const fetched = await getBlogPostsFn()
        if (isMounted && fetched && fetched.length > 0) {
          setPosts(fetched as BlogPostData[])
        }
      } catch (err) {
        // Fall back gracefully to INITIAL_BLOG_POSTS
      }
    }
    loadNews()
    return () => {
      isMounted = false
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['ALL', ...Array.from(set)]
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'ALL') return posts
    return posts.filter((p) => p.category === selectedCategory)
  }, [posts, selectedCategory])

  const featuredPost = filteredPosts[0] || posts[0]
  const recentPosts = filteredPosts.slice(1, 4)

  const tickerHeadlines = useMemo(() => {
    return posts.map((p) => p.title).join('  ★  ')
  }, [posts])

  const handleOpenNewsPage = (slug?: string) => {
    if (slug) {
      navigate({ to: '/news/$slug', params: { slug } })
    } else {
      navigate({ to: '/news' })
    }
  }

  return (
    <HudGhostWidget isLoading={isLoading} skeleton={<DashboardNewsGhost />}>
      <div className="chitin-card p-4 chamfer-corner space-y-3.5 shadow-2xl relative overflow-hidden h-full flex flex-col">
        {/* In-HUD Full Article Modal Reader */}
        {activePost && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-3xl bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.2)] chamfer-corner overflow-hidden font-sans text-sm space-y-4">
              <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#ff5540] animate-pulse" />
                  <span className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
                    {activePost.category}
                  </span>
                  <span className="text-xs text-[#839493]">| {activePost.readTimeMinutes} MIN READ</span>
                </div>
                <button
                  onClick={() => setActivePost(null)}
                  className="text-[#839493] hover:text-[#ff453a] p-1 transition-colors"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {activePost.coverImageUrl && (
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden border border-[#3a4a49] chamfer-corner">
                    <img
                      src={activePost.coverImageUrl}
                      alt={activePost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f0f] via-transparent to-transparent opacity-80" />
                  </div>
                )}

                <div>
                  <h2 className="font-grotesk text-lg sm:text-xl font-bold text-[#dfe3e3] uppercase tracking-wide leading-snug">
                    {activePost.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#839493] mt-2 font-sans">
                    <div className="flex items-center gap-1.5">
                      {activePost.authorAvatar && (
                        <img
                          src={activePost.authorAvatar}
                          alt={activePost.authorName}
                          className="w-4 h-4 rounded-full border border-[#00ffff]/40"
                        />
                      )}
                      <span className="text-[#00ffff]">AUTHOR: {activePost.authorName}</span>
                    </div>
                    <span>|</span>
                    <span>
                      PUBLISHED: {new Date(activePost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {activePost.tags && activePost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activePost.tags.map((tag) => (
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

                <div className="chitin-card-inset p-4 text-xs leading-relaxed text-[#dfe3e3] whitespace-pre-line border border-[#3a4a49]">
                  {activePost.content}
                </div>
              </div>

              <div className="bg-[#070b0b] border-t border-[#3a4a49] p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#839493]">
                <span className="font-sans text-[11px]">MOLTNATION NEWS DESK · BENTHIC INTELLIGENCE</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const slug = activePost.slug
                      setActivePost(null)
                      handleOpenNewsPage(slug)
                    }}
                    className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/30 border border-[#00ffff]/60 text-[#00ffff] font-bold chamfer-corner transition-colors flex items-center gap-1"
                  >
                    <span>FULL DESK PAGE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActivePost(null)}
                    className="px-4 py-1.5 bg-[#0f1414] hover:bg-[#171c1c] border border-[#3a4a49] text-[#dfe3e3] font-bold chamfer-corner transition-colors"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Header & Live Indicator */}
        <div className="flex flex-col gap-2 border-b border-[#3a4a49] pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-[#ff5540] shrink-0" />
                <span>MOLTNATION INTELLIGENCE & NEWS FEED</span>
              </h2>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#ff5540]/15 border border-[#ff5540]/40 text-[#ff5540] text-[9px] font-sans font-bold chamfer-corner shrink-0">
                <Radio className="w-2.5 h-2.5 text-[#ff5540] animate-pulse" />
                <span>LIVE FEED</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenNewsPage()}
              className="text-[10px] font-bold text-[#00ffff] hover:text-white flex items-center gap-0.5 transition-colors shrink-0 bg-[#070b0b] border border-[#3a4a49] px-2 py-1 chamfer-corner hover:border-[#00ffff]/60"
            >
              <span>OPEN NEWS DESK</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-[#839493]">
            Real-time patriot intelligence, swarm architecture updates, and dispatches.
          </p>
        </div>

        {/* CNN-Style Breaking News Marquee Ticker */}
        <div className="bg-[#04070a] border border-[#3a4a49] py-1 px-2.5 flex items-center gap-2 text-xs overflow-hidden chamfer-corner">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-950/90 border border-red-500/80 text-red-400 font-extrabold uppercase tracking-wider text-[9px] shrink-0 chamfer-corner">
            <TrendingUp className="w-2.5 h-2.5 text-red-500" />
            <span>BREAKING</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-[#00ffff]/90 text-[10px] font-sans flex-1">
            <div className="inline-block animate-marquee tracking-wide">
              {tickerHeadlines}
            </div>
          </div>
        </div>

        {/* Desk Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[9px] text-[#839493] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            DESKS:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 text-[9px] font-bold font-sans uppercase tracking-wider chamfer-corner transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#00ffff] text-black font-extrabold shadow-[0_0_8px_rgba(0,255,255,0.4)]'
                  : 'bg-[#070b0b] text-[#839493] hover:text-[#dfe3e3] border border-[#3a4a49]'
              }`}
            >
              {cat === 'ALL' ? 'ALL DISPATCHES' : cat}
            </button>
          ))}
        </div>

        {/* Vertical Sidebar Layout */}
        {layout === 'sidebar' ? (
          <div className="space-y-1.5 pt-1 flex-1 min-h-0 overflow-y-auto pr-1 font-sans">
            {/* Featured Post Card */}
            {featuredPost && (
              <div
                className="chitin-card-inset p-2.5 border border-[#00ffff]/40 hover:border-[#00ffff] transition-all chamfer-corner group flex flex-col space-y-2 cursor-pointer relative overflow-hidden bg-gradient-to-b from-[#090e10] to-[#050809]"
                onClick={() => setActivePost(featuredPost)}
              >
                {featuredPost.coverImageUrl && (
                  <div className="relative h-32 w-full overflow-hidden border border-[#3a4a49] chamfer-corner">
                    <img
                      src={featuredPost.coverImageUrl}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5">
                      <span className="bg-[#ff5540]/90 text-white font-extrabold font-sans text-[8px] px-1.5 py-0.5 uppercase tracking-widest chamfer-corner border border-red-400">
                        FEATURED DISPATCH
                      </span>
                      <span className="bg-[#0b0f0f]/90 text-[#00ffff] font-sans text-[8px] px-1.5 py-0.5 uppercase tracking-wider chamfer-corner border border-[#00ffff]/40">
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-0.5">
                  <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase leading-snug">
                    {featuredPost.title}
                  </h3>
                  <p className="text-[11px] text-[#839493] line-clamp-2 leading-tight font-sans">
                    {featuredPost.summary}
                  </p>
                </div>

                <div className="pt-1 border-t border-[#3a4a49]/60 flex items-center justify-between text-[10px] font-sans">
                  <div className="flex items-center gap-1.5 text-[#839493]">
                    {featuredPost.authorAvatar && (
                      <img
                        src={featuredPost.authorAvatar}
                        alt={featuredPost.authorName}
                        className="w-3.5 h-3.5 rounded-full border border-[#3a4a49]"
                      />
                    )}
                    <span className="text-[10px] group-hover:text-[#dfe3e3] transition-colors truncate max-w-[100px]">
                      {featuredPost.authorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#839493] flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-[#00ffff]" />
                      {featuredPost.readTimeMinutes}M
                    </span>
                    <span className="text-[#00ffff] font-bold group-hover:underline flex items-center text-[10px]">
                      <span>READ</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Posts List */}
            {recentPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center chitin-card-inset p-3 text-center border border-[#3a4a49]">
                <Sparkles className="w-4 h-4 text-[#00ffff] mb-1" />
                <p className="text-[10px] text-[#839493] font-sans">
                  Select "ALL DISPATCHES" to view more stories across desks.
                </p>
              </div>
            ) : (
              recentPosts.map((post) => (
                <div
                  key={post.slug}
                  onClick={() => setActivePost(post)}
                  className="chitin-card-inset p-2 border border-[#3a4a49] hover:border-[#00ffff]/60 transition-colors chamfer-corner cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between text-[9px] font-sans">
                    <span className="text-[#00ffff] font-bold uppercase tracking-wider bg-[#070b0b] px-1 py-0.2 border border-[#3a4a49]">
                      {post.category}
                    </span>
                    <span className="text-[#839493] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-[#3a4a49]" />
                      {post.readTimeMinutes}m read
                    </span>
                  </div>

                  <h4 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-1 leading-tight">
                    {post.title}
                  </h4>

                  <div className="flex items-center justify-between text-[9px] pt-0.5 border-t border-[#3a4a49]/40 text-[#839493]">
                    <span>BY: {post.authorName}</span>
                    <span className="text-[#00ffff] group-hover:translate-x-0.5 transition-transform flex items-center">
                      VIEW <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Bottom Quick Bar */}
            <button
              onClick={() => handleOpenNewsPage()}
              className="w-full py-1.5 bg-[#070b0b] hover:bg-[#0f1414] border border-[#3a4a49] hover:border-[#00ffff]/60 text-[10px] font-bold font-grotesk text-[#00ffff] uppercase tracking-wider chamfer-corner transition-all flex items-center justify-center gap-1.5"
            >
              <span>VIEW ALL DISPATCHES ({posts.length})</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ) : (
          /* Standard Wide Layout */
          featuredPost && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
              <div
                className="md:col-span-7 chitin-card-inset p-4 border border-[#00ffff]/40 hover:border-[#00ffff] transition-all chamfer-corner group flex flex-col justify-between space-y-3 cursor-pointer relative overflow-hidden bg-gradient-to-b from-[#090e10] to-[#050809]"
                onClick={() => setActivePost(featuredPost)}
              >
                {featuredPost.coverImageUrl && (
                  <div className="relative h-44 sm:h-52 w-full overflow-hidden border border-[#3a4a49] chamfer-corner">
                    <img
                      src={featuredPost.coverImageUrl}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <span className="bg-[#ff5540]/90 text-white font-extrabold font-sans text-[9px] px-2 py-0.5 uppercase tracking-widest chamfer-corner border border-red-400">
                        FEATURED DISPATCH
                      </span>
                      <span className="bg-[#0b0f0f]/90 text-[#00ffff] font-sans text-[9px] px-2 py-0.5 uppercase tracking-wider chamfer-corner border border-[#00ffff]/40">
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-grotesk text-base font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase leading-snug">
                    {featuredPost.title}
                  </h3>
                  <p className="text-xs text-[#839493] line-clamp-2 leading-relaxed font-sans">
                    {featuredPost.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2 text-[#839493]">
                    {featuredPost.authorAvatar && (
                      <img
                        src={featuredPost.authorAvatar}
                        alt={featuredPost.authorName}
                        className="w-4 h-4 rounded-full border border-[#3a4a49]"
                      />
                    )}
                    <span className="text-[11px] group-hover:text-[#dfe3e3] transition-colors">
                      {featuredPost.authorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#839493] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#00ffff]" />
                      {featuredPost.readTimeMinutes} MIN
                    </span>
                    <span className="text-[#00ffff] font-bold group-hover:underline flex items-center gap-0.5 text-xs">
                      <span>READ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
                {recentPosts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center chitin-card-inset p-4 text-center border border-[#3a4a49]">
                    <Sparkles className="w-6 h-6 text-[#00ffff] mb-2" />
                    <p className="text-xs text-[#839493] font-sans">
                      Select "ALL DISPATCHES" to view more stories across desks.
                    </p>
                  </div>
                ) : (
                  recentPosts.map((post) => (
                    <div
                      key={post.slug}
                      onClick={() => setActivePost(post)}
                      className="chitin-card-inset p-3 border border-[#3a4a49] hover:border-[#00ffff]/60 transition-colors chamfer-corner cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-sans">
                        <span className="text-[#00ffff] font-bold uppercase tracking-wider bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49]">
                          {post.category}
                        </span>
                        <span className="text-[#839493] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#3a4a49]" />
                          {post.readTimeMinutes}m read
                        </span>
                      </div>

                      <h4 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-2 leading-tight">
                        {post.title}
                      </h4>

                      <p className="text-[11px] text-[#839493] line-clamp-1 font-sans">
                        {post.summary}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#3a4a49]/40 text-[#839493]">
                        <span>BY: {post.authorName}</span>
                        <span className="text-[#00ffff] group-hover:translate-x-0.5 transition-transform flex items-center">
                          VIEW <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}

                <button
                  onClick={() => handleOpenNewsPage()}
                  className="w-full py-2 bg-[#070b0b] hover:bg-[#0f1414] border border-[#3a4a49] hover:border-[#00ffff]/60 text-xs font-bold font-grotesk text-[#00ffff] uppercase tracking-wider chamfer-corner transition-all flex items-center justify-center gap-1.5"
                >
                  <span>VIEW ALL {posts.length} DISPATCHES ON NEWS DESK</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </HudGhostWidget>
  )
}

