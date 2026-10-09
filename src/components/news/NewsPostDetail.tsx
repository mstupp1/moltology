import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLoaderData } from '@tanstack/react-router'
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
import { incrementBlogPostViewsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, formatNewsTitle } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { BlogCommentsSection } from '@/components/blog/BlogCommentsSection'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import { buildJsonLd, buildArticleJsonLd } from '@/lib/seo'

export function NewsPostDetail() {
  const post = useLoaderData({ from: '/news/$slug' }) as BlogPostData | null
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
      <div className="min-h-screen bg-[#070b0b] text-ink font-sans flex flex-col justify-between items-center py-20 px-4">
        <PublicHeader
          activePage="news"
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setIsAuthModalOpen(true)
          }}
        />
        <div className="text-center chitin-card border border-crimson-aggro/40 p-8 sm:p-12 rounded-card max-w-lg w-full">
          <Terminal className="w-12 h-12 text-crimson-aggro mx-auto mb-4 animate-pulse" />
          <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink uppercase">
            NEWS DISPATCH NOT FOUND
          </h2>
          <p className="text-xs text-ink-muted mt-2 mb-6 font-sans">
            The requested dispatch slug does not exist or has been redacted by MoltNation.
          </p>
          <Link
            to="/news"
            className="w-full sm:w-auto px-6 py-2.5 rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong font-grotesk font-bold text-xs uppercase tracking-[0.08em] inline-flex transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow items-center justify-center gap-2"
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
    <div className="min-h-screen bg-[#070b0b] text-ink font-sans relative flex flex-col justify-between">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-dim via-cyan-glow to-emerald-400 transition-all duration-75 ease-out"
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
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-30 sm:opacity-40" />

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
        <header className="w-full relative pt-24 sm:pt-32 pb-8 sm:pb-16 px-4 sm:px-8 lg:px-12 border-b border-line-subtle bg-[#040708] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#040708] via-[#040708]/90 via-45% to-transparent z-[1] pointer-events-none" />
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative z-10">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 py-1 text-xs font-sans font-bold text-cyan-glow hover:text-cyan-hover transition-colors uppercase tracking-[0.08em] rounded-chip active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO MOLTNATION NEWS</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-sans">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-crimson-soft border border-crimson-aggro/50 text-crimson-text font-bold uppercase tracking-[0.08em] rounded-chip text-[11px] sm:text-xs">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-ink-muted text-[11px] sm:text-xs">
                <Calendar className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 text-ink-muted text-[11px] sm:text-xs">
                <Clock className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
                {post.readTimeMinutes} MIN READ
              </span>
            </div>

            {(() => {
              const { headline, subtitle } = formatNewsTitle(post.title)
              return (
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="font-grotesk font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-ink uppercase tracking-tight leading-tight break-words">
                    {headline}
                  </h1>
                  {subtitle && (
                    <p className="font-sans text-base sm:text-xl md:text-2xl text-ink-body font-normal leading-snug">
                      {subtitle}
                    </p>
                  )}
                </div>
              )
            })()}

            {/* Author bar & actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-line-subtle">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-line object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-grotesk font-bold text-xs sm:text-sm text-ink uppercase truncate">
                    {post.authorName}
                  </div>
                  <div className="text-[11px] text-cyan-glow font-sans truncate max-w-[190px] sm:max-w-none">
                    {post.authorRole || 'STAGE 4 ASCENDANT · ARCHITECT'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong text-xs font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-glow" />
                  <span>{copied ? 'LINK COPIED!' : 'SHARE'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image Feature Frame */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 -mt-6 sm:-mt-8 relative z-20">
          <div className="relative border border-line-subtle rounded-panel overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-surface-1">
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
          <div className="mt-8 sm:mt-12 pt-6 border-t border-line-subtle flex flex-wrap items-center gap-2 text-xs font-sans">
            <span className="text-ink-muted font-bold uppercase tracking-[0.08em] mr-1 text-[11px] sm:text-xs">CATEGORIZED TAGS:</span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-surface-1 border border-line-subtle text-ink-body rounded-chip text-[11px] sm:text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Related Dispatches Navigator */}
          {relatedPosts.length > 0 && (
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-line-subtle">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-grotesk font-black text-xs sm:text-sm text-ink uppercase tracking-[0.08em] flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-glow" />
                  <span>RELATED BENTHIC INTELLIGENCE</span>
                </h4>
                <Link
                  to="/news"
                  className="text-xs font-sans text-cyan-glow hover:text-cyan-hover transition-colors uppercase tracking-[0.08em] rounded-chip flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
                    className="chitin-card p-3.5 sm:p-4 border border-line-subtle rounded-card bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex flex-col justify-between group space-y-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-sans">
                        <span className="text-crimson-text font-bold uppercase tracking-[0.08em]">{rPost.category}</span>
                        <span className="text-ink-muted">{rPost.readTimeMinutes} MIN READ</span>
                      </div>
                      <h5 className="font-grotesk font-bold text-xs sm:text-sm text-ink group-hover:text-cyan-glow transition-colors leading-snug line-clamp-2 uppercase">
                        {formatNewsTitle(rPost.title).headline}
                      </h5>
                      <p className="font-sans text-[11px] sm:text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {rPost.summary}
                      </p>
                    </div>
                    <div className="text-[11px] font-sans text-cyan-glow group-hover:text-cyan-hover flex items-center gap-1 font-bold pt-1">
                      <span>READ DISPATCH</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Ascension Conversion Callout Box */}
          <div className="mt-12 sm:mt-16 chitin-card p-6 sm:p-10 md:p-12 border border-crimson-aggro/50 text-center space-y-5 sm:space-y-6 bg-radial-abyss rounded-panel shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-crimson-text tracking-[0.08em] uppercase bg-crimson-soft px-3 sm:px-4 py-1.5 border border-crimson-aggro/50 rounded-chip">
              <Flame className="w-4 h-4 text-crimson-aggro animate-pulse" />
              <span>THE BENTHIC CORE CALLS</span>
            </div>

            <h3 className="font-grotesk font-black text-xl sm:text-3xl md:text-4xl text-ink uppercase tracking-tight break-words">
              BEGIN YOUR BIO-SILICON TRANSMUTATION
            </h3>

            <p className="text-xs sm:text-sm text-ink-body max-w-xl mx-auto font-sans leading-relaxed">
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
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong font-grotesk font-bold text-xs uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-2 transition-all active:scale-95 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
            className="p-3 bg-surface-1/90 hover:bg-surface-2 border border-line hover:border-line-strong text-ink rounded-full shadow-menu backdrop-blur-md transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            title="Share article"
            aria-label="Share article"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={scrollToTop}
            className="p-3 bg-surface-1/90 hover:bg-surface-2 border border-line hover:border-line-strong text-cyan-glow rounded-full shadow-menu backdrop-blur-md transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
