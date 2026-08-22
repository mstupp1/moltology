import React, { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Users, Plus, MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { NewTopicDialog } from '@/components/forum/NewTopicDialog'
import { ForumRulesDialog } from '@/components/forum/ForumRulesDialog'
import { CategoryIcon } from '@/components/forum/ForumBits'
import { getForumCategoriesFn, getForumTopicsFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS } from '@/lib/forum-seed-data'
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

  return (
    <ForumShell>
      <div className="max-w-6xl mx-auto w-full space-y-6 pb-12 font-sans">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a3a39] pb-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#00ffff]">
              <Users className="w-4 h-4" />
              Moltology Community
            </div>
            <h1 className="font-grotesk font-bold text-2xl sm:text-3xl text-[#dfe3e3] uppercase tracking-tight mt-1">
              Forums
            </h1>
            <p className="text-sm text-[#839493] mt-1 max-w-2xl">
              Discuss, share, and learn with fellow initiates. Choose a board below or browse the latest dispatches.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowRules(true)}
              className="px-4 py-2 bg-[#0d1414] hover:bg-[#1a2626] border border-[#2a3a39] text-[#dfe3e3] text-xs font-bold uppercase tracking-wider rounded transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff5540]" />
              Rules
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="px-5 py-2 bg-[#ff5540] hover:bg-[#ff3b20] text-black text-xs font-bold uppercase tracking-wider rounded shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        </header>

        {/* Board Directory */}
        <section>
          <h2 className="text-xs font-grotesk font-bold uppercase tracking-widest text-[#839493] mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#00ffff]" />
            Discussion Boards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/forum/$categorySlug"
                params={{ categorySlug: cat.slug }}
                className="group p-4 bg-[#0a0f0f] border border-[#1f2b2a] hover:border-[#00ffff]/60 rounded-md transition-colors flex items-start gap-3"
              >
                <div className="mt-0.5" style={{ color: cat.color }}>
                  <CategoryIcon icon={cat.icon} color={cat.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-grotesk font-bold text-sm text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors" style={{ color: cat.color }}>
                    {cat.name}
                  </div>
                  <p className="text-xs text-[#839493] line-clamp-2 leading-relaxed mt-0.5">{cat.description}</p>
                  <div className="text-[11px] text-[#00ffff] font-bold mt-1.5 flex items-center gap-1">
                    <span>{cat.topicCount} topics</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Topics */}
        <section>
          <h2 className="text-xs font-grotesk font-bold uppercase tracking-widest text-[#839493] mb-3">
            Latest Posts
          </h2>
          {topicsState.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#839493] border border-[#1f2b2a] rounded-md bg-[#0a0f0f]">
              No posts yet. Be the first to start a discussion.
            </div>
          ) : (
            <div className="divide-y divide-[#1f2b2a] border border-[#1f2b2a] rounded-md overflow-hidden">
              {topicsState.map((topic) => (
                <ForumTopicRow key={topic.id} topic={topic} />
              ))}
            </div>
          )}
        </section>
      </div>

      {showNew && (
        <NewTopicDialog
          categories={categories}
          onClose={() => setShowNew(false)}
          onCreated={(topic) => {
            setTopicsState((prev) => [topic, ...prev])
            navigate({ to: '/forum/$categorySlug/$topicSlug', params: { categorySlug: topic.categorySlug || 'general-discussion', topicSlug: topic.slug } })
          }}
        />
      )}
      {showRules && <ForumRulesDialog onClose={() => setShowRules(false)} />}
    </ForumShell>
  )
}
