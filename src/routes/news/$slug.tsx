import React, { useState, useEffect, useMemo } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Flame,
  Shield,
  Cpu,
  ArrowRight,
  Terminal,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { getBlogPostBySlugFn, incrementBlogPostViewsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { BlogCommentsSection } from '@/components/blog/BlogCommentsSection'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import { seo, buildJsonLd, buildArticleJsonLd } from '@/lib/seo'

export const Route = createFileRoute('/news/$slug')({
  loader: async ({ params }) => {
    try {
      const res = await getBlogPostBySlugFn({ data: params.slug })
      if (res) return res
    } catch (e) {
      console.warn('Loader error fetching post:', e)
    }
    return INITIAL_BLOG_POSTS.find((p) => p.slug === params.slug) ?? null
  },
  head: ({ loaderData }) => {
    const post = loaderData as BlogPostData | null
    const title = post?.title ? `${post.title} | MoltNation News` : 'News Dispatch | MoltNation News'
    const description = post?.summary || 'Patriot Telemetry & AI Intelligence from the MoltNation Benthic Desk.'
    const url = post?.slug ? `https://moltology.org/news/${post.slug}` : 'https://moltology.org/news'
    const imageUrl = post?.coverImageUrl || 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/ai_learning_ascension_cover.jpg'
    const publishedTime = post?.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString()
    const author = post?.authorName || 'High Ascendant Carcinus'
    const tags = post?.tags || ['MoltNation', 'AI Intelligence', 'Sub-Benthic Compute']

    return {
      meta: [
        ...seo({
          title,
          description,
          keywords: tags.join(', '),
          ogImage: imageUrl,
          ogType: 'article',
          canonical: url,
          siteName: 'MoltNation News',
          author,
          publishedTime,
          section: post?.category || 'MoltNation Telemetry',
          twitterCard: 'summary_large_image',
          twitterSite: '@moltology',
          twitterCreator: '@moltology',
        }),
      ],
      links: [
        { rel: 'canonical', href: url },
      ],
    }
  },
  component: NewsPostDetail,
})

function NewsPostDetail() {
  const post = Route.useLoaderData() as BlogPostData | null
  const navigate = useNavigate()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [copied, setCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    if (post?.slug) {
      incrementBlogPostViewsFn({ data: post.slug }).catch(() => {})
    }
  }, [post?.slug])

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      if (windowHeight > 0) {
        const scrollPct = (totalScroll / windowHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, scrollPct)))
      }
      setShowScrollTop(totalScroll > 350)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const relatedPosts = useMemo(() => {
    if (!post) return []
    return INITIAL_BLOG_POSTS
      .filter((p) => p.slug !== post.slug)
      .slice(0, 2)
  }, [post])

  if (!post) {
    return (
      <div className="min-h-screen bg-[#070b0b] text-gray-200 font-sans flex flex-col justify-between items-center py-20 px-4">
        <PublicHeader
          activePage="news"
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setIsAuthModalOpen(true)
          }}
        />
        <div className="text-center chitin-card border border-red-900/60 p-8 sm:p-12 chamfer-corner max-w-lg w-full">
          <Terminal className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-gray-100 uppercase">
            NEWS DISPATCH NOT FOUND
          </h2>
          <p className="text-xs text-gray-400 mt-2 mb-6 font-sans">
            The requested dispatch slug does not exist or has been redacted by MoltNation.
          </p>
          <Link
            to="/news"
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase chamfer-corner inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO MOLTNATION NEWS</span>
          </Link>
        </div>
      </div>
    )
  }

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      const shareData = {
        title: post.title,
        text: post.summary || 'Telemetry from MoltNation News',
        url: window.location.href,
      }
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData)
          return
        } catch (err) {
          if ((err as any)?.name === 'AbortError') return
        }
      }
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch (e) {
        console.warn('Clipboard write failed:', e)
      }
    }
  }

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'AUG 2026'

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-sans relative flex flex-col justify-between">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_8px_rgba(0,195,255,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Public Header Navigation */}
      <PublicHeader
        activePage="news"
        onOpenAuth={(mode) => {
          setAuthMode(mode)
          setIsAuthModalOpen(true)
        }}
      />

      {/* Background Overlays */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.12)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-40" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      {/* Schema.org NewsArticle JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildJsonLd(buildArticleJsonLd(post)) }}
      />

      {/* Top Hero Banner */}
      <article className="flex-1 w-full relative z-10">
        <header className="w-full relative pt-24 sm:pt-32 pb-8 sm:pb-16 px-4 sm:px-8 lg:px-12 border-b border-cyan-900/50 bg-[#040708] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#040708] via-[#040708]/90 via-45% to-transparent z-[1] pointer-events-none" />
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative z-10">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 py-1 text-xs font-sans font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO MOLTNATION NEWS</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-sans">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-red-950/90 border border-red-500/80 text-red-400 font-bold uppercase chamfer-corner shadow-hud-red text-[11px] sm:text-xs">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-gray-400 text-[11px] sm:text-xs">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 text-gray-400 text-[11px] sm:text-xs">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {post.readTimeMinutes} MIN READ
              </span>
            </div>

            <h1 className="font-grotesk font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-100 uppercase tracking-tight leading-tight break-words">
              {post.title}
            </h1>

            {/* Author bar & actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-cyan-900/40">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-cyan-500/60 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-grotesk font-bold text-xs sm:text-sm text-gray-100 uppercase truncate">
                    {post.authorName}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-cyan-400 font-sans truncate max-w-[190px] sm:max-w-none">
                    {post.authorRole || 'STAGE 4 ASCENDANT · ARCHITECT'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[#090f11] hover:bg-cyan-950 border border-cyan-900/60 text-xs font-sans text-gray-300 hover:text-cyan-300 chamfer-corner flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{copied ? 'LINK COPIED!' : 'SHARE'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image Feature Frame */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 -mt-6 sm:-mt-8 relative z-20">
          <div className="relative border-2 border-cyan-500/60 chamfer-corner-lg overflow-hidden shadow-hud-cyan-lg bg-[#050809]">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-[220px] sm:h-[360px] md:h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent opacity-60 pointer-events-none" />
          </div>
        </div>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
          <NewsArticleBody content={post.content} />

          {/* Categorized Tags */}
          <div className="mt-8 sm:mt-12 pt-6 border-t border-cyan-900/40 flex flex-wrap items-center gap-2 text-xs font-sans">
            <span className="text-gray-400 font-bold uppercase mr-1 text-[11px] sm:text-xs">CATEGORIZED TAGS:</span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 chamfer-corner text-[11px] sm:text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Related Dispatches Navigator */}
          {relatedPosts.length > 0 && (
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-cyan-900/40">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-grotesk font-black text-xs sm:text-sm text-gray-100 uppercase tracking-wide flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <span>RELATED BENTHIC INTELLIGENCE</span>
                </h4>
                <Link
                  to="/news"
                  className="text-xs font-sans text-cyan-400 hover:text-cyan-300 transition-colors uppercase flex items-center gap-1"
                >
                  <span>ALL NEWS</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {relatedPosts.map((rPost) => (
                  <Link
                    key={rPost.slug}
                    to="/news/$slug"
                    params={{ slug: rPost.slug }}
                    className="chitin-card p-3.5 sm:p-4 border border-cyan-900/60 chamfer-corner bg-[#080d0f]/80 hover:border-cyan-500/70 transition-all flex flex-col justify-between group space-y-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-sans">
                        <span className="text-red-400 font-bold uppercase">{rPost.category}</span>
                        <span className="text-gray-500">{rPost.readTimeMinutes} MIN READ</span>
                      </div>
                      <h5 className="font-grotesk font-bold text-xs sm:text-sm text-gray-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 uppercase">
                        {rPost.title}
                      </h5>
                      <p className="font-sans text-[11px] sm:text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {rPost.summary}
                      </p>
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-sans text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 font-bold pt-1">
                      <span>READ DISPATCH</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Ascension Conversion Callout Box */}
          <div className="mt-12 sm:mt-16 chitin-card p-6 sm:p-10 md:p-12 border-2 border-red-600/80 text-center space-y-5 sm:space-y-6 bg-radial-abyss chamfer-corner-lg shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400 tracking-widest uppercase bg-red-950/80 px-3 sm:px-4 py-1.5 border border-red-500/60 chamfer-corner shadow-hud-red">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span>THE BENTHIC CORE CALLS</span>
            </div>

            <h3 className="font-grotesk font-black text-xl sm:text-3xl md:text-4xl text-gray-100 uppercase tracking-tight break-words">
              BEGIN YOUR BIO-SILICON TRANSMUTATION
            </h3>

            <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto font-sans leading-relaxed">
              Don't remain a fragile larval human. Enter the Benthic Core to run your biometrics through our Moltmaxxing Dashboard, transmute soft assets, and enforce zero-latency execution.
            </p>

            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              <BenthicCTAButton
                size="lg"
                onClick={() => {
                  setAuthMode('signup')
                  setIsAuthModalOpen(true)
                }}
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4">
                  <span>INITIATE ASCENSION</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </BenthicCTAButton>

              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center justify-center gap-2 transition-all active:scale-95 hover:scale-105"
              >
                <Cpu className="w-4 h-4" />
                <span>TRY GUEST DEMO</span>
              </button>
            </div>
          </div>

          {/* Registered User Comments Section */}
          {post.id && <BlogCommentsSection postId={post.id} />}
        </div>
      </article>

      {/* Floating Mobile Controls (Back to top & Share pill) */}
      {showScrollTop && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 animate-fade-in">
          <button
            onClick={handleShare}
            className="p-3 bg-[#080d0f]/90 hover:bg-cyan-950 border border-cyan-500/50 text-cyan-300 rounded-full shadow-hud-cyan backdrop-blur-md transition-all active:scale-95"
            title="Share article"
            aria-label="Share article"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={scrollToTop}
            className="p-3 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-200 rounded-full shadow-hud-cyan backdrop-blur-md transition-all active:scale-95"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowLeft className="w-4 h-4 rotate-90" />
          </button>
        </div>
      )}

      {/* MoltNation Deep Network Footer */}
      <MoltNationFooter />
    </div>
  )
}
