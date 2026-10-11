import React, { useState, useEffect, useMemo } from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
import { useNavigate, useLoaderData } from '@tanstack/react-router'
import { Search, Rss, ArrowRight } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { INITIAL_BLOG_POSTS, formatNewsTitle } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { getAssetUrl } from '@/lib/assets'
import { eagerImageProps, lazyImageProps, lcpImageProps } from '@/lib/media-priority'
import '@/styles/hud-chrome.css'
import '@/styles/editorial-fonts.css'

const ALL = 'ALL'
const LATEST_COUNT = 4
const MORE_COUNT = 6

/** "SWARM ARCHITECTURE" -> "Swarm Architecture"; keeps "&" and short words readable. */
export function formatSectionName(category: string): string {
  return category
    .toLowerCase()
    .split(' ')
    .map((word) => (word === '&' ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

/** Deterministic (UTC, en-US) so server and client render the same string. */
export function formatPostDate(value: string | Date | undefined, style: 'long' | 'short' = 'long'): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StoryLink({
  slug,
  className,
  children,
}: {
  slug: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a href={`/news/${slug}`} className={className}>
      {children}
    </a>
  )
}

function Kicker({ category }: { category: string }) {
  return (
    <span className="text-[11px] font-sans font-bold uppercase tracking-[0.08em] text-cyan-glow">
      {formatSectionName(category)}
    </span>
  )
}

function Byline({ post, withAvatar = false }: { post: BlogPostData; withAvatar?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-sans text-ink-muted">
      {withAvatar && post.authorAvatar && (
        <BrandAwareImage
          src={post.authorAvatar}
          alt=""
          {...lazyImageProps}
          className="w-6 h-6 rounded-full border border-line object-cover"
        />
      )}
      <span className="text-ink font-semibold">{post.authorName}</span>
      <span aria-hidden="true" className="text-ink-muted/60">·</span>
      <time dateTime={String(post.publishedAt)}>{formatPostDate(post.publishedAt)}</time>
      <span aria-hidden="true" className="text-ink-muted/60">·</span>
      <span>{post.readTimeMinutes} min read</span>
    </div>
  )
}

function StoryCard({ post }: { post: BlogPostData }) {
  const { headline, subtitle } = formatNewsTitle(post.title)
  return (
    <StoryLink slug={post.slug} className="group flex flex-col gap-3 text-inherit no-underline rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
      <div className="aspect-[16/10] overflow-hidden rounded-card bg-surface-1">
        <img
          src={getAssetUrl(post.coverImageUrl)}
          alt={post.title}
          {...lazyImageProps}
          className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-[1.03] transition duration-500"
        />
      </div>
      <Kicker category={post.category} />
      <h3 className="font-garamond text-2xl leading-tight text-ink group-hover:text-cyan-glow transition-colors">
        {headline}
        {subtitle && <span className="block italic text-ink-muted text-lg mt-1">{subtitle}</span>}
      </h3>
      <p className="text-sm text-ink-muted font-sans leading-relaxed line-clamp-3">{post.summary}</p>
      <Byline post={post} />
    </StoryLink>
  )
}

export function NewsIndexPage() {
  const loaderPosts = useLoaderData({ from: '/news/' }) as BlogPostData[]
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPostData[]>(loaderPosts || INITIAL_BLOG_POSTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    if (loaderPosts && loaderPosts.length > 0) {
      setPosts(loaderPosts)
    }
  }, [loaderPosts])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    posts.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
    })
    // Busiest sections first so the nav reads like a paper's section bar.
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
  }, [posts])

  const isFiltering = selectedCategory !== ALL || searchQuery.trim() !== ''

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === ALL || post.category === selectedCategory
      const matchesSearch =
        q === '' ||
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [posts, selectedCategory, searchQuery])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const leadPost = posts[0]
  const latestPosts = posts.slice(1, 1 + LATEST_COUNT)
  const morePosts = posts.slice(1 + LATEST_COUNT, 1 + LATEST_COUNT + MORE_COUNT)
  const archivePosts = posts.slice(1 + LATEST_COUNT + MORE_COUNT)
  const lastUpdated = formatPostDate(leadPost?.publishedAt)

  return (
    <div className="min-h-screen bg-[#05080a] text-ink font-sans relative flex flex-col justify-between">
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-60" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      <PublicHeader activePage="news" onOpenAuth={openAuth} />

      {/* Masthead */}
      <header className="w-full relative pt-24 pb-8 sm:pt-28 sm:pb-10 px-4 sm:px-8 flex justify-center items-center overflow-hidden bg-[#030608]">
        <img
          src={getAssetUrl('/images/moltnation_flag_bg.jpg')}
          alt="MoltNation Flag Background"
          {...lcpImageProps}
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,6,8,0.3)_0%,rgba(3,6,8,0.85)_85%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-transparent to-[#030608] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <MoltNationLogo size="lg" theme="dark" align="center" />
          <p className="font-garamond italic text-lg sm:text-xl text-ink-body max-w-xl leading-snug">
            News from the bottom of the ocean, for people still living on the surface.
          </p>
        </div>
      </header>

      {/* Section bar */}
      <div className="w-full border-y border-line-subtle bg-[#05080a]/95 backdrop-blur relative z-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 py-2">
          <nav
            aria-label="News sections"
            className="flex items-center gap-5 overflow-x-auto touch-pan-scroll no-scrollbar flex-1 min-w-0 -mb-px pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]"
          >
            {[ALL, ...categories].map((cat) => {
              const active = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={active}
                  className={`shrink-0 min-h-[40px] text-sm font-sans border-b-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    active
                      ? 'border-cyan-glow text-ink font-semibold'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {cat === ALL ? 'Front page' : formatSectionName(cat)}
                </button>
              )
            })}
          </nav>
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <label htmlFor="news-search" className="sr-only">
              Search stories
            </label>
            <input
              id="news-search"
              type="search"
              placeholder="Search stories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-line hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus rounded-control text-ink text-sm outline-none placeholder:text-ink-muted transition-colors"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto px-4 sm:px-8 py-6 sm:py-8 w-full relative z-10">
        {/* Edition line */}
        <div className="flex items-center justify-between gap-4 text-xs font-sans text-ink-muted pb-6">
          <span>{lastUpdated && `Updated ${lastUpdated}`}</span>
          <span className="flex items-center gap-4">
            <span>{posts.length} stories</span>
            <a href="/rss.xml" className="flex items-center gap-1 rounded-chip hover:text-cyan-glow transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
              <Rss className="w-3.5 h-3.5" />
              RSS
            </a>
          </span>
        </div>

        {isFiltering ? (
          <section aria-labelledby="results-heading" className="space-y-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-subtle pb-3">
              <h1 id="results-heading" className="font-garamond text-3xl sm:text-4xl text-ink">
                {selectedCategory !== ALL ? formatSectionName(selectedCategory) : 'Search results'}
              </h1>
              <span className="text-sm text-ink-muted">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'}
              </span>
            </div>
            {filteredPosts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="font-garamond text-2xl text-ink">No stories match that search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(ALL)
                  }}
                  className="text-sm text-cyan-glow hover:text-cyan-hover underline underline-offset-4 rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  Back to the front page
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredPosts.map((post) => (
                  <StoryCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="space-y-14 sm:space-y-16">
            {/* Lead + latest */}
            {leadPost && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
                <article className="lg:col-span-8">
                  <StoryLink slug={leadPost.slug} className="group flex flex-col gap-5 text-inherit no-underline rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
                    {/* Image leads on phones; headline leads on desktop so it sits above the fold. */}
                    <div className="aspect-[16/9] overflow-hidden rounded-card bg-surface-1 lg:order-last">
                      <img
                        src={getAssetUrl(leadPost.coverImageUrl)}
                        alt={leadPost.title}
                        {...eagerImageProps}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                      />
                    </div>
                    <div className="space-y-3">
                      <Kicker category={leadPost.category} />
                      <h1 className="font-garamond text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] text-ink group-hover:text-cyan-glow transition-colors">
                        {formatNewsTitle(leadPost.title).headline}
                      </h1>
                      {formatNewsTitle(leadPost.title).subtitle && (
                        <p className="font-garamond italic text-xl sm:text-2xl text-ink-body leading-snug">
                          {formatNewsTitle(leadPost.title).subtitle}
                        </p>
                      )}
                    </div>
                    <p className="text-base sm:text-lg text-ink-body leading-relaxed max-w-2xl">
                      {leadPost.summary}
                    </p>
                    <Byline post={leadPost} withAvatar />
                  </StoryLink>
                </article>

                {latestPosts.length > 0 && (
                  <aside aria-labelledby="latest-heading" className="lg:col-span-4 lg:border-l lg:border-line-subtle lg:pl-10">
                    <h2
                      id="latest-heading"
                      className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-ink-muted border-b border-line-subtle pb-3"
                    >
                      Latest
                    </h2>
                    <ol className="divide-y divide-line-subtle">
                      {latestPosts.map((post) => {
                        const { headline, subtitle } = formatNewsTitle(post.title)
                        return (
                          <li key={post.slug}>
                            <StoryLink slug={post.slug} className="group flex gap-4 py-5 text-inherit no-underline rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <Kicker category={post.category} />
                                <h3 className="font-garamond text-xl leading-snug text-ink group-hover:text-cyan-glow transition-colors">
                                  {headline}
                                </h3>
                                {subtitle && (
                                  <p className="text-sm text-ink-muted leading-snug line-clamp-2">{subtitle}</p>
                                )}
                                <time dateTime={String(post.publishedAt)} className="block text-xs text-ink-muted pt-0.5">
                                  {formatPostDate(post.publishedAt, 'short')}
                                </time>
                              </div>
                              <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-control bg-surface-1">
                                <img
                                  src={getAssetUrl(post.coverImageUrl)}
                                  alt={post.title}
                                  {...lazyImageProps}
                                  className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition"
                                />
                              </div>
                            </StoryLink>
                          </li>
                        )
                      })}
                    </ol>
                  </aside>
                )}
              </section>
            )}

            {/* More stories */}
            {morePosts.length > 0 && (
              <section aria-labelledby="more-heading" className="space-y-8">
                <h2
                  id="more-heading"
                  className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-ink-muted border-t-2 border-ink/80 pt-3"
                >
                  More stories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {morePosts.map((post) => (
                    <StoryCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Archive */}
            {archivePosts.length > 0 && (
              <nav aria-label="News archive" className="space-y-4">
                <h2 className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-ink-muted border-t-2 border-ink/80 pt-3">
                  From the archive
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  {archivePosts.map((post) => (
                    <li key={post.slug} className="border-b border-line-subtle">
                      <a
                        href={`/news/${post.slug}`}
                        className="group flex items-baseline gap-4 py-4 text-inherit no-underline rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      >
                        <time
                          dateTime={String(post.publishedAt)}
                          className="hidden sm:block w-24 shrink-0 text-xs text-ink-muted tabular-nums"
                        >
                          {formatPostDate(post.publishedAt, 'short')}
                        </time>
                        <span className="flex-1 min-w-0">
                          <span className="block font-garamond text-lg leading-snug text-ink group-hover:text-cyan-glow transition-colors">
                            {formatNewsTitle(post.title).headline}
                          </span>
                          <span className="block text-xs text-ink-muted mt-1">
                            <span className="sm:hidden">{formatPostDate(post.publishedAt, 'short')} · </span>
                            {formatSectionName(post.category)} · {post.readTimeMinutes} min read
                          </span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-ink-muted/60 group-hover:text-cyan-glow shrink-0 self-center transition-colors" />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        )}
      </main>

      <MoltNationFooter />
    </div>
  )
}
