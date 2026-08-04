import React, { useState, useEffect } from 'react'
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
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'News Dispatch'} | MoltNation News` },
      { name: 'description', content: loaderData?.summary ?? 'Patriot Telemetry & AI Intelligence' },
      { property: 'og:title', content: loaderData?.title },
      { property: 'og:description', content: loaderData?.summary },
      { property: 'og:image', content: loaderData?.coverImageUrl },
    ],
  }),
  component: NewsPostDetail,
})

function NewsPostDetail() {
  const post = Route.useLoaderData() as BlogPostData | null
  const navigate = useNavigate()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (post?.slug) {
      incrementBlogPostViewsFn({ data: post.slug }).catch(() => {})
    }
  }, [post?.slug])

  if (!post) {
    return (
      <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono flex flex-col justify-between items-center py-20">
        <PublicHeader activePage="news" />
        <div className="text-center chitin-card border border-red-900/60 p-12 chamfer-corner max-w-lg">
          <Terminal className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="font-grotesk text-2xl font-bold text-gray-100 uppercase">
            NEWS DISPATCH NOT FOUND
          </h2>
          <p className="text-xs text-gray-400 mt-2 mb-6 font-mono">
            The requested dispatch slug does not exist or has been redacted by MoltNation.
          </p>
          <Link
            to="/news"
            className="px-6 py-2.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase chamfer-corner inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO MOLTNATION NEWS</span>
          </Link>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'AUG 2026'

  // Render markdown content into HUD components
  const renderContentParagraphs = (contentStr: string) => {
    const blocks = contentStr.split('\n\n')
    return blocks.map((block, idx) => {
      const trimmed = block.trim()
      if (trimmed.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="font-grotesk font-black text-2xl sm:text-3xl text-gray-100 uppercase tracking-wide mt-10 mb-4 border-b border-cyan-900/40 pb-2 text-cyan-300"
          >
            {trimmed.replace('### ', '')}
          </h3>
        )
      }
      if (trimmed.startsWith('#### ')) {
        return (
          <h4
            key={idx}
            className="font-grotesk font-bold text-xl text-gray-200 uppercase tracking-wide mt-8 mb-3 text-red-400"
          >
            {trimmed.replace('#### ', '')}
          </h4>
        )
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="chitin-card p-6 border-l-4 border-l-cyan-400 border-y border-r border-cyan-900/40 chamfer-corner my-6 italic font-serif text-lg text-cyan-100 bg-[#080d0f]/90 shadow-hud-cyan"
          >
            {trimmed.replace('> ', '').replace(/\\n/g, '\n')}
          </blockquote>
        )
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('1. ')) {
        const items = trimmed.split('\n')
        return (
          <ul key={idx} className="space-y-3 my-4 pl-2 font-mono text-xs sm:text-sm text-gray-300">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5 chitin-card-inset p-3 chamfer-corner">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(it.replace(/^[\*\d\.]+\s*/, '')) }} />
              </li>
            ))}
          </ul>
        )
      }
      if (trimmed === '---') {
        return <hr key={idx} className="border-cyan-900/40 my-10" />
      }

      return (
        <p
          key={idx}
          className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
        />
      )
    })
  }

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-100 font-mono">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-cyan-200">$1</em>')
  }

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono relative select-none flex flex-col justify-between">
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

      <PublicHeader activePage="news" onOpenAuth={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }} />

      {/* Top Hero Banner */}
      <article className="flex-1 w-full relative z-10">
        <header className="w-full relative pt-20 sm:pt-28 pb-12 sm:pb-20 px-6 sm:px-12 border-b border-cyan-900/50 bg-[#040708] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#040708] via-[#040708]/90 via-45% to-transparent z-[1] pointer-events-none" />
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO MOLTNATION NEWS</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1 bg-red-950/90 border border-red-500/80 text-red-400 font-bold uppercase chamfer-corner shadow-hud-red">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {post.readTimeMinutes} MIN READ
              </span>
            </div>

            <h1 className="font-grotesk font-black text-3xl sm:text-5xl lg:text-6xl text-gray-100 uppercase tracking-tight leading-tight">
              {post.title}
            </h1>

            {/* Author bar & actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-cyan-900/40">
              <div className="flex items-center gap-3">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full border-2 border-cyan-500/60 object-cover"
                />
                <div>
                  <div className="font-grotesk font-bold text-sm text-gray-100 uppercase">
                    {post.authorName}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    {post.authorRole || 'STAGE 4 ASCENDANT // ARCHITECT'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3.5 py-2 bg-[#090f11] hover:bg-cyan-950 border border-cyan-900/60 text-xs font-mono text-gray-300 hover:text-cyan-300 chamfer-corner flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'LINK COPIED!' : 'SHARE'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image Feature Frame */}
        <div className="max-w-5xl mx-auto px-6 sm:px-12 -mt-8 relative z-20">
          <div className="relative border-2 border-cyan-500/60 chamfer-corner-lg overflow-hidden shadow-hud-cyan-lg bg-[#050809]">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-[320px] sm:h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-cyan-300 bg-black/80 px-3 py-1 border border-cyan-900/60">
              MOLTNATION DISPATCH FRAME #2026-PATRIOT
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto px-6 sm:px-12 py-12">
          <div className="prose prose-invert max-w-none">
            {renderContentParagraphs(post.content)}
          </div>

          {/* Tags */}
          <div className="mt-12 pt-6 border-t border-cyan-900/40 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-gray-400 font-bold uppercase mr-2">CATEGORIZED TAGS:</span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 chamfer-corner"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Ascension Conversion Callout Box */}
          <div className="mt-16 chitin-card p-8 sm:p-12 border-2 border-red-600/80 text-center space-y-6 bg-radial-abyss chamfer-corner-lg shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400 tracking-widest uppercase bg-red-950/80 px-4 py-1.5 border border-red-500/60 chamfer-corner shadow-hud-red">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span>THE BENTHIC CORE CALLS</span>
            </div>

            <h3 className="font-grotesk font-black text-2xl sm:text-4xl text-gray-100 uppercase tracking-tight">
              BEGIN YOUR BIO-SILICON TRANSMUTATION
            </h3>

            <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto font-mono leading-relaxed">
              Don't remain a fragile larval human. Enter the Benthic Core to run your biometrics through our Moltmaxxing Dashboard, transmute soft assets, and enforce zero-latency execution.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <BenthicCTAButton
                size="lg"
                onClick={() => {
                  setAuthMode('signup')
                  setIsAuthModalOpen(true)
                }}
              >
                <span className="flex items-center gap-3 px-4">
                  <span>INITIATE ASCENSION</span>
                  <ArrowRight className="w-5 h-5" />
                </span>
              </BenthicCTAButton>

              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="px-8 py-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all hover:scale-105"
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

      {/* Footer */}
      <footer className="w-full bg-[#030606] border-t border-cyan-900/40 py-8 px-6 sm:px-12 text-xs text-gray-400 font-mono relative z-20">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MoltNationLogo size="sm" theme="dark" />
          </div>
          <div className="text-gray-500">© 2026 MOLTNATION MEDIA GROUP. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
    </div>
  )
}
