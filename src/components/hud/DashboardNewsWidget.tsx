import React, { useState, useEffect, useMemo } from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
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
import { INITIAL_BLOG_POSTS, formatNewsTitle } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { getBlogPostsFn } from '@/lib/server/api'
import { DashboardNewsGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { getAssetUrl } from '@/lib/assets'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'

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
      <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-4 space-y-3.5 relative overflow-hidden h-full flex flex-col">
        {/* In-HUD Full Article Modal Reader with High-Precision Markdown Parser */}
        {activePost && (
          <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-3xl rounded-card border border-line bg-surface-1 shadow-menu overflow-hidden font-sans text-sm space-y-4">
              <div className="bg-surface-2 border-b border-line-subtle p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-crimson-text animate-pulse" />
                  <span className="text-xs text-cyan-glow font-bold tracking-[0.08em] uppercase">
                    {activePost.category}
                  </span>
                  <span className="text-xs text-ink-muted">| {activePost.readTimeMinutes} MIN READ</span>
                </div>
                <button
                  onClick={() => setActivePost(null)}
                  className="rounded-control text-ink-muted hover:text-crimson-text hover:bg-surface-3 p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {activePost.coverImageUrl && (
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden border border-line-subtle rounded-card">
                    <img
                      src={getAssetUrl(activePost.coverImageUrl)}
                      alt={activePost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent opacity-80" />
                  </div>
                )}

                <div>
                  <h2 className="font-grotesk text-lg sm:text-xl font-bold text-ink uppercase tracking-wide leading-snug">
                    {formatNewsTitle(activePost.title).headline}
                  </h2>
                  {formatNewsTitle(activePost.title).subtitle && (
                    <p className="text-xs sm:text-sm text-cyan-glow font-medium font-sans mt-1">
                      {formatNewsTitle(activePost.title).subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted mt-2 font-sans">
                    <div className="flex items-center gap-1.5">
                      {activePost.authorAvatar && (
                        <BrandAwareImage
                          src={getAssetUrl(activePost.authorAvatar)}
                          alt={activePost.authorName}
                          className="w-4 h-4 rounded-full border border-line"
                        />
                      )}
                      <span className="text-cyan-glow">AUTHOR: {activePost.authorName}</span>
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
                        className="text-[11px] bg-surface-2 border border-line-subtle text-ink-muted px-2 py-0.5 rounded-chip flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-cyan-glow" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rounded-card bg-abyss p-4 sm:p-5 border border-line-subtle">
                  <NewsArticleBody content={activePost.content} />
                </div>
              </div>

              <div className="bg-surface-2 border-t border-line-subtle p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-muted">
                <span className="font-sans text-[11px]">MOLTNATION NEWS DESK · BENTHIC INTELLIGENCE</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const slug = activePost.slug
                      setActivePost(null)
                      handleOpenNewsPage(slug)
                    }}
                    className="px-3 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow text-cyan-glow font-bold transition-colors flex items-center gap-1"
                  >
                    <span>FULL DESK PAGE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActivePost(null)}
                    className="px-4 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow text-ink font-bold transition-colors"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Header & Live Indicator */}
        <div className="flex flex-col gap-2 border-b border-line-subtle pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-grotesk text-xs sm:text-sm font-bold text-ink tracking-[0.08em] uppercase flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-crimson-text shrink-0" />
                <span>MOLTNATION INTELLIGENCE & NEWS FEED</span>
              </h2>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-crimson-soft border border-crimson-aggro/40 text-crimson-text text-[11px] font-sans font-bold rounded-chip shrink-0">
                <Radio className="w-2.5 h-2.5 text-crimson-text animate-pulse" />
                <span>LIVE FEED</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenNewsPage()}
              className="text-[11px] font-bold text-cyan-glow hover:text-ink flex items-center gap-0.5 transition-colors shrink-0 px-2 py-1 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <span>OPEN NEWS DESK</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-ink-muted">
            Real-time patriot intelligence, swarm architecture updates, and dispatches.
          </p>
        </div>

        {/* CNN-Style Breaking News Marquee Ticker */}
        <div className="bg-abyss border border-line-subtle py-1 px-2.5 flex items-center gap-2 text-xs overflow-hidden rounded-control">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text font-extrabold uppercase tracking-[0.08em] text-[11px] shrink-0 rounded-chip">
            <TrendingUp className="w-2.5 h-2.5 text-crimson-text" />
            <span>BREAKING</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-cyan-glow text-[11px] font-sans flex-1">
            <div className="inline-block animate-marquee tracking-wide">
              {tickerHeadlines}
            </div>
          </div>
        </div>

        {/* Desk Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] text-ink-muted font-bold uppercase tracking-[0.08em] shrink-0 flex items-center gap-1 mr-1">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            DESKS:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 text-[11px] font-bold font-sans uppercase tracking-[0.08em] rounded-control border border-line-subtle border-b-2 transition-all shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                selectedCategory === cat
                  ? 'bg-surface-2 text-ink border-b-cyan-glow'
                  : 'bg-surface-1 text-ink-muted hover:text-ink hover:bg-surface-2'
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
                className="rounded-card bg-abyss p-2.5 border border-cyan-glow/40 hover:border-line-strong transition-all group flex flex-col space-y-2 cursor-pointer relative overflow-hidden"
                onClick={() => setActivePost(featuredPost)}
              >
                {featuredPost.coverImageUrl && (
                  <div className="relative h-32 w-full overflow-hidden border border-line-subtle rounded-control">
                    <img
                      src={getAssetUrl(featuredPost.coverImageUrl)}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5">
                      <span className="bg-crimson-aggro text-abyss font-extrabold font-sans text-[11px] px-1.5 py-0.5 uppercase tracking-[0.08em] rounded-chip">
                        FEATURED DISPATCH
                      </span>
                      <span className="bg-surface-1/90 text-cyan-glow font-sans text-[11px] px-1.5 py-0.5 uppercase tracking-[0.08em] rounded-chip border border-line">
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-0.5">
                  <h3 className="font-grotesk text-xs font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase leading-snug">
                    {formatNewsTitle(featuredPost.title).headline}
                  </h3>
                  {formatNewsTitle(featuredPost.title).subtitle && (
                    <p className="text-[11px] text-cyan-glow font-medium font-sans line-clamp-1">
                      {formatNewsTitle(featuredPost.title).subtitle}
                    </p>
                  )}
                  <p className="text-[11px] text-ink-muted line-clamp-2 leading-tight font-sans">
                    {featuredPost.summary}
                  </p>
                </div>

                <div className="pt-1 border-t border-line-subtle flex items-center justify-between text-[11px] font-sans">
                  <div className="flex items-center gap-1.5 text-ink-muted">
                    {featuredPost.authorAvatar && (
                      <BrandAwareImage
                        src={getAssetUrl(featuredPost.authorAvatar)}
                        alt={featuredPost.authorName}
                        className="w-3.5 h-3.5 rounded-full border border-line"
                      />
                    )}
                    <span className="text-[11px] group-hover:text-ink transition-colors truncate max-w-[100px]">
                      {featuredPost.authorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-ink-muted flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-cyan-glow" />
                      {featuredPost.readTimeMinutes}M
                    </span>
                    <span className="text-cyan-glow font-bold group-hover:underline flex items-center text-[11px]">
                      <span>READ</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Posts List */}
            {recentPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-card bg-abyss/60 p-3 text-center border border-line-subtle">
                <Sparkles className="w-4 h-4 text-cyan-glow mb-1" />
                <p className="text-[11px] text-ink-muted font-sans">
                  Select "ALL DISPATCHES" to view more stories across desks.
                </p>
              </div>
            ) : (
              recentPosts.map((post) => (
                <div
                  key={post.slug}
                  onClick={() => setActivePost(post)}
                  className="rounded-card bg-abyss/60 p-2 border border-line-subtle hover:bg-surface-2 hover:border-line-strong transition-colors cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-sans">
                    <span className="text-cyan-glow font-bold uppercase tracking-[0.08em] bg-cyan-soft px-1 py-0.2 border border-line-subtle rounded-chip">
                      {post.category}
                    </span>
                    <span className="text-ink-muted flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-ink-muted" />
                      {post.readTimeMinutes}m read
                    </span>
                  </div>

                  <h4 className="font-grotesk text-xs font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase line-clamp-1 leading-tight">
                    {formatNewsTitle(post.title).headline}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-line-subtle text-ink-muted">
                    <span>BY: {post.authorName}</span>
                    <span className="text-cyan-glow group-hover:translate-x-0.5 transition-transform flex items-center">
                      VIEW <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Bottom Quick Bar */}
            <button
              onClick={() => handleOpenNewsPage()}
              className="w-full py-1.5 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow text-[11px] font-bold font-grotesk text-cyan-glow uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-1.5"
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
                className="md:col-span-7 rounded-card bg-abyss p-4 border border-cyan-glow/40 hover:border-line-strong transition-all group flex flex-col justify-between space-y-3 cursor-pointer relative overflow-hidden"
                onClick={() => setActivePost(featuredPost)}
              >
                {featuredPost.coverImageUrl && (
                  <div className="relative h-44 sm:h-52 w-full overflow-hidden border border-line-subtle rounded-control">
                    <img
                      src={getAssetUrl(featuredPost.coverImageUrl)}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <span className="bg-crimson-aggro text-abyss font-extrabold font-sans text-[11px] px-2 py-0.5 uppercase tracking-[0.08em] rounded-chip">
                        FEATURED DISPATCH
                      </span>
                      <span className="bg-surface-1/90 text-cyan-glow font-sans text-[11px] px-2 py-0.5 uppercase tracking-[0.08em] rounded-chip border border-line">
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-grotesk text-base font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase leading-snug">
                    {formatNewsTitle(featuredPost.title).headline}
                  </h3>
                  {formatNewsTitle(featuredPost.title).subtitle && (
                    <p className="text-xs text-cyan-glow font-medium font-sans line-clamp-1">
                      {formatNewsTitle(featuredPost.title).subtitle}
                    </p>
                  )}
                  <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed font-sans">
                    {featuredPost.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-line-subtle flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2 text-ink-muted">
                    {featuredPost.authorAvatar && (
                      <BrandAwareImage
                        src={getAssetUrl(featuredPost.authorAvatar)}
                        alt={featuredPost.authorName}
                        className="w-4 h-4 rounded-full border border-line"
                      />
                    )}
                    <span className="text-[11px] group-hover:text-ink transition-colors">
                      {featuredPost.authorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-ink-muted flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-glow" />
                      {featuredPost.readTimeMinutes} MIN
                    </span>
                    <span className="text-cyan-glow font-bold group-hover:underline flex items-center gap-0.5 text-xs">
                      <span>READ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
                {recentPosts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center rounded-card bg-abyss/60 p-4 text-center border border-line-subtle">
                    <Sparkles className="w-6 h-6 text-cyan-glow mb-2" />
                    <p className="text-xs text-ink-muted font-sans">
                      Select "ALL DISPATCHES" to view more stories across desks.
                    </p>
                  </div>
                ) : (
                  recentPosts.map((post) => (
                    <div
                      key={post.slug}
                      onClick={() => setActivePost(post)}
                      className="rounded-card bg-abyss/60 p-3 border border-line-subtle hover:bg-surface-2 hover:border-line-strong transition-colors cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-sans">
                        <span className="text-cyan-glow font-bold uppercase tracking-[0.08em] bg-cyan-soft px-1.5 py-0.2 border border-line-subtle rounded-chip">
                          {post.category}
                        </span>
                        <span className="text-ink-muted flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ink-muted" />
                          {post.readTimeMinutes}m read
                        </span>
                      </div>

                      <h4 className="font-grotesk text-xs font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase line-clamp-2 leading-tight">
                        {formatNewsTitle(post.title).headline}
                      </h4>

                      <p className="text-[11px] text-ink-muted line-clamp-1 font-sans">
                        {post.summary}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-line-subtle text-ink-muted">
                        <span>BY: {post.authorName}</span>
                        <span className="text-cyan-glow group-hover:translate-x-0.5 transition-transform flex items-center">
                          VIEW <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}

                <button
                  onClick={() => handleOpenNewsPage()}
                  className="w-full py-2 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow text-xs font-bold font-grotesk text-cyan-glow uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-1.5"
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

