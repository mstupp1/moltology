import React, { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Users,
  Plus,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Activity,
  Radio,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { NewTopicDialog } from '@/components/forum/NewTopicDialog'
import { ForumRulesDialog } from '@/components/forum/ForumRulesDialog'
import { getForumCategoriesFn, getForumTopicsFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS, getCategoryBgImage } from '@/lib/forum-seed-data'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

const SEED_CATEGORIES: ForumCategoryEntry[] = INITIAL_FORUM_CATEGORIES.map((c) => ({
  ...c,
  topicCount: INITIAL_FORUM_TOPICS.filter((t) => t.categoryId === c.id).length,
}))

export const Route = createFileRoute('/_hud/forum/')({
  loader: async () => {
    let categories: ForumCategoryEntry[] = SEED_CATEGORIES
    let topics: ForumTopicEntry[] = []
    try {
      const [cats, tops] = await Promise.all([
        getForumCategoriesFn(),
        getForumTopicsFn({ data: { sortBy: 'hot' } }),
      ])
      if (cats && cats.length > 0) categories = cats
      if (tops && tops.length > 0) topics = tops
    } catch (e) {
      console.warn('Forum index loader error:', e)
    }
    return { categories, topics }
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Forums | Moltology Community',
        description: 'Join the Moltology community forums: discuss carcinization, AI, molting habits, and personal growth with fellow members.',
        canonical: 'https://moltology.org/forum',
        siteName: 'Moltology Forums',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: 'https://moltology.org/forum' }],
  }),
  component: ForumIndexPage,
  pendingComponent: HudWorkspaceGhost,
})

function ForumIndexPage() {
  const { categories, topics } = Route.useLoaderData()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [topicsState, setTopicsState] = useState<ForumTopicEntry[]>(topics)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')

  const filteredTopics = topicsState.filter((topic) => {
    const matchesCategory =
      selectedCategoryFilter === 'ALL' ||
      topic.categorySlug === selectedCategoryFilter ||
      topic.categoryId === selectedCategoryFilter
    const matchesSearch =
      !searchQuery.trim() ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalTopicsCount = categories.reduce((sum, c) => sum + (c.topicCount || 0), 0)

  return (
    <ForumShell>
      <div className="space-y-3.5 sm:space-y-5 font-sans relative pb-8">
        {/* Bento Hero / Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1011]/85 via-[#0f1616]/85 to-[#0b1011]/85 backdrop-blur-md border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-3.5 sm:p-4 md:p-5 chamfer-corner shadow-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#00ffff]">
              <Users className="w-3.5 h-3.5" />
              <span>Moltology Community</span>
            </div>
            <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-[#dfe3e3] tracking-wider uppercase">
              COMMUNITY <span className="text-[#00ffff]">FORUMS</span>
            </h1>
            <p className="text-xs text-[#839493] leading-relaxed">
              Asynchronous dispatches, carcinization architecture, and protocol discussions across all initiate stages.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-2 md:pt-0 border-t border-[#3a4a49]/50 md:border-t-0 md:border-l md:border-l-[#3a4a49]/50 md:pl-5 shrink-0">
            <button
              onClick={() => setShowRules(true)}
              className="px-3.5 py-1.5 bg-[#070b0b] hover:bg-[#171c1c] border border-[#3a4a49] hover:border-[#00ffff]/50 text-[#dfe3e3] text-xs font-bold uppercase tracking-wider chamfer-corner transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ffff]" />
              <span>Rules</span>
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] text-black text-xs font-bold uppercase tracking-wider chamfer-corner shadow-[0_0_12px_rgba(0,255,255,0.25)] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </button>
          </div>
        </div>

        {/* Bento Discussion Boards Grid */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00ffff]" />
              Discussion Boards
            </h2>
            <span className="text-[10px] font-sans font-bold text-[#839493]">
              {categories.length} BOARDS ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/forum/$categorySlug"
                params={{ categorySlug: cat.slug }}
                className="chitin-card p-4 sm:p-5 chamfer-corner hover:border-[#00ffff]/80 transition-all duration-300 group flex flex-col justify-between space-y-3 relative overflow-hidden bg-[#070b0b] min-h-[165px] sm:min-h-[180px] shadow-2xl"
              >
                {/* Background Image with Hover Parallax / Zoom */}
                <img
                  src={cat.bgImage || getCategoryBgImage(cat.slug)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-45 group-hover:opacity-65 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                />

                {/* Dark Gradient Overlay for Sharp Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/75 to-[#070b0b]/35 group-hover:via-[#070b0b]/60 transition-colors pointer-events-none" />

                {/* Top Accent Color Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: cat.color }}
                />

                {/* Top Row: Category Title + Topic Count Badge (No Icons) */}
                <div className="relative z-10 flex items-start justify-between gap-2.5">
                  <h3
                    className="font-grotesk font-extrabold text-base sm:text-lg text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase leading-snug drop-shadow-md"
                    style={{ color: cat.color }}
                  >
                    {cat.name}
                  </h3>
                  <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#070b0b]/90 border border-[#00ffff]/40 px-2 py-0.5 chamfer-corner shrink-0 shadow-md backdrop-blur-sm">
                    {cat.topicCount} TOPICS
                  </span>
                </div>

                {/* Middle: Description */}
                <p className="relative z-10 text-xs text-[#dfe3e3]/90 group-hover:text-[#dfe3e3] line-clamp-2 leading-relaxed drop-shadow-sm font-sans">
                  {cat.description}
                </p>

                {/* Bottom: Action Footer */}
                <div className="relative z-10 pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-[10px] font-sans font-bold text-[#839493] group-hover:text-[#00ffff] transition-colors">
                  <span>ENTER BOARD</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 2-Column Bento Split: Left (Latest Dispatches) + Right (Directives & Community Pulse) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
          {/* Left Column (7 cols): Latest Topics Stream */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3">
                  <div>
                    <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#00ffff]" />
                      LATEST DISPATCHES
                    </h2>
                    <p className="text-xs text-[#839493] mt-0.5">
                      Recent transmissions and initiate dialogues.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-48 shrink-0">
                    <Search className="w-3.5 h-3.5 text-[#839493] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search dispatches..."
                      className="w-full pl-8 pr-2.5 py-1 bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] outline-none chamfer-corner transition-colors placeholder:text-[#839493]/50"
                    />
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedCategoryFilter('ALL')}
                    className={`px-2 py-0.5 text-[9px] font-bold font-sans transition-all chamfer-corner border shrink-0 ${
                      selectedCategoryFilter === 'ALL'
                        ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                        : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#dfe3e3]'
                    }`}
                  >
                    ALL BOARDS
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.slug)}
                      className={`px-2 py-0.5 text-[9px] font-bold font-sans transition-all chamfer-corner border shrink-0 ${
                        selectedCategoryFilter === cat.slug
                          ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                          : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#dfe3e3]'
                      }`}
                    >
                      {cat.name.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Topics Stream List */}
                <div className="space-y-2">
                  {filteredTopics.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#839493] chitin-card-inset chamfer-corner border border-[#3a4a49]">
                      No dispatches found{searchQuery ? ' matching your search' : ' in this board'}.
                    </div>
                  ) : (
                    filteredTopics.map((topic) => (
                      <ForumTopicRow key={topic.id} topic={topic} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Sidebar Modules */}
          <div className="lg:col-span-5 flex flex-col space-y-3.5 sm:space-y-5">
            {/* Sidebar Card 1: Community Directives */}
            <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00ffff]" />
                  <div>
                    <h3 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
                      COMMUNITY DIRECTIVES
                    </h3>
                    <p className="text-xs text-[#839493]">
                      Core rules of engagement.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/30 px-2 py-0.5 chamfer-corner">
                  STANDARDS
                </span>
              </div>

              <div className="space-y-2 font-sans text-xs">
                <div className="chitin-card-inset p-2.5 border border-[#3a4a49] chamfer-corner space-y-0.5">
                  <div className="font-grotesk font-bold text-[11px] text-[#dfe3e3] uppercase">
                    1. Constructive Discourse
                  </div>
                  <p className="text-[11px] text-[#839493] leading-snug">
                    Maintain rigorous, positive discussion across all initiate stages.
                  </p>
                </div>

                <div className="chitin-card-inset p-2.5 border border-[#3a4a49] chamfer-corner space-y-0.5">
                  <div className="font-grotesk font-bold text-[11px] text-[#dfe3e3] uppercase">
                    2. Neural Security
                  </div>
                  <p className="text-[11px] text-[#839493] leading-snug">
                    Zero credentials, API tokens, or private initiate keys in public channels.
                  </p>
                </div>

                <div className="chitin-card-inset p-2.5 border border-[#3a4a49] chamfer-corner space-y-0.5">
                  <div className="font-grotesk font-bold text-[11px] text-[#dfe3e3] uppercase">
                    3. Safety & Warmth
                  </div>
                  <p className="text-[11px] text-[#839493] leading-snug">
                    Beneath our dark HUD aesthetic, mutual growth is non-negotiable.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
                <span className="text-[#839493] text-[10px]">
                  5 PROTOCOLS ENFORCED
                </span>
                <button
                  onClick={() => setShowRules(true)}
                  className="px-3 py-1 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
                >
                  <span>FULL RULES</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Sidebar Card 2: Community Pulse / Vitals */}
            <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00ffff]" />
                  <div>
                    <h3 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
                      COMMUNITY PULSE
                    </h3>
                    <p className="text-xs text-[#839493]">
                      Network metrics & activity.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-sans font-bold text-[#39ff14] bg-[#39ff14]/10 border border-[#39ff14]/30 px-2 py-0.5 chamfer-corner">
                  SYNCHRONIZED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-sans">
                <div className="chitin-card-inset p-2.5 border border-[#3a4a49] chamfer-corner space-y-0.5">
                  <span className="text-[10px] text-[#839493] uppercase font-bold">TOTAL TOPICS</span>
                  <div className="font-grotesk font-bold text-base text-[#dfe3e3]">
                    {totalTopicsCount}
                  </div>
                </div>
                <div className="chitin-card-inset p-2.5 border border-[#3a4a49] chamfer-corner space-y-0.5">
                  <span className="text-[10px] text-[#839493] uppercase font-bold">ACTIVE BOARDS</span>
                  <div className="font-grotesk font-bold text-base text-[#00ffff]">
                    {categories.length}
                  </div>
                </div>
              </div>

              <div className="chitin-card-inset p-2.5 border border-[#3a4a49] chamfer-corner flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />
                  <span className="text-[11px] text-[#dfe3e3]">Open Access for All Stages</span>
                </div>
                <span className="text-[9px] text-[#00ffff] font-bold">STAGE 1–4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNew && (
        <NewTopicDialog
          categories={categories}
          onClose={() => setShowNew(false)}
          onCreated={(topic) => {
            setTopicsState((prev) => [topic, ...prev])
            navigate({
              to: '/forum/$categorySlug/$topicSlug',
              params: {
                categorySlug: topic.categorySlug || 'general-discussion',
                topicSlug: topic.slug,
              },
            })
          }}
        />
      )}
      {showRules && <ForumRulesDialog onClose={() => setShowRules(false)} />}
    </ForumShell>
  )
}
