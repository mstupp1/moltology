import React, { useState, useEffect, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Tag,
  Flame,
  Shield,
  Terminal,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { getBlogPostsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export const Route = createFileRoute('/blog/')({
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPostData[]>(INITIAL_BLOG_POSTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    async function loadPosts() {
      try {
        const fetched = await getBlogPostsFn()
        if (fetched && fetched.length > 0) {
          setPosts(fetched as BlogPostData[])
        }
      } catch (err) {
        console.warn('Using initial fallback blog posts:', err)
      }
    }
    loadPosts()
  }, [])

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

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono relative select-none flex flex-col justify-between">
      {/* Background Overlays */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.14)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-40" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      <PublicHeader activePage="home" onOpenAuth={openAuth} />

      {/* Header Banner */}
      <section className="w-full relative py-16 sm:py-24 px-6 sm:px-12 border-b border-cyan-900/40 bg-[#040708] overflow-hidden">
        <div className="absolute inset-0 bg-radial-abyss opacity-80 z-0" />
        <div className="relative z-10 max-w-[1500px] mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-red-950/90 border border-red-500/80 text-red-400 font-bold text-xs tracking-[0.25em] uppercase chamfer-corner shadow-hud-red">
            <BookOpen className="w-4 h-4 text-red-500 animate-pulse" />
            <span>THE SYNAPTIC CHRONICLES // OFFICIAL BLOG</span>
          </div>

          <h1 className="font-grotesk font-black text-4xl sm:text-6xl lg:text-7xl text-gray-100 uppercase tracking-tight leading-none drop-shadow-2xl">
            DOCTRINE & <span className="text-cyan-400">AI TELEMETRY</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto font-sans leading-relaxed">
            Explorations into agentic AI, test-time compute, autonomous swarms, and the step-by-step conversion vector from larval human vulnerability to total carcinization.
          </p>

          {/* Search & Filter Controls */}
          <div className="pt-6 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transmissions, tags, or AI concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#080d0e] border border-cyan-900/60 focus:border-cyan-400 text-gray-100 font-mono text-xs chamfer-corner outline-none shadow-inner placeholder-gray-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 text-xs font-bold font-grotesk uppercase tracking-wider chamfer-corner transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-black shadow-hud-cyan'
                      : 'bg-[#0a1012] text-gray-400 hover:text-white border border-cyan-900/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="flex-1 max-w-[1700px] mx-auto px-6 sm:px-12 py-16 w-full relative z-10 space-y-16">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 chitin-card border border-cyan-900/40 p-12 chamfer-corner">
            <Terminal className="w-12 h-12 text-cyan-500 mx-auto mb-4 animate-pulse" />
            <h3 className="font-grotesk text-xl font-bold text-gray-200 uppercase">
              NO TRANSMISSIONS FOUND
            </h3>
            <p className="text-xs text-gray-400 mt-2 font-mono">
              Adjust your search term or category query to locate matching entries.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, idx) => (
              <ScrollReveal key={post.slug} animation="fade-up" delayMs={idx * 100}>
                <article
                  onClick={() => navigate({ to: `/blog/$slug`, params: { slug: post.slug } })}
                  className="chitin-card border-2 border-cyan-900/60 hover:border-cyan-400/80 chamfer-corner-lg overflow-hidden bg-[#05090a] group cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-full shadow-lg"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="relative h-52 overflow-hidden border-b border-cyan-900/50">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05090a] via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase chamfer-corner bg-red-950/90 border border-red-500/80 text-red-400 shadow-hud-red">
                          {post.category}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-cyan-300 bg-black/80 px-2 py-1 border border-cyan-900/60 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{post.readTimeMinutes} MIN READ</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-4">
                      <h2 className="font-grotesk font-black text-xl text-gray-100 group-hover:text-cyan-300 uppercase leading-snug transition-colors">
                        {post.title}
                      </h2>

                      <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-[#090f11] border border-cyan-950 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 border-t border-cyan-900/40 bg-[#030607] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-5 h-5 rounded-full border border-cyan-500/40 object-cover"
                      />
                      <span className="text-gray-400 text-[11px]">{post.authorName}</span>
                    </div>

                    <span className="text-cyan-400 font-bold font-grotesk text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>READ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#030606] border-t border-cyan-900/40 py-8 px-6 sm:px-12 text-xs text-gray-400 font-mono relative z-20">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>MOLTOLOGY FOUNDATION // SYNAPTIC CHRONICLES</div>
          <div className="text-gray-500">© 2026 BENTHIC MATRIX. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
    </div>
  )
}
