import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Search, MessageSquare, Terminal, ChevronRight, Compass } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { InlineTopicComposer, InlineTopicComposerHandle } from '@/components/forum/InlineTopicComposer'
import { getForumCategoryBySlugFn, getForumTopicsFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { formatForumUnreadCount } from '@/lib/forum-visits'
import { ForumUnreadMark } from '@/components/forum/ForumBits'
import { INITIAL_FORUM_CATEGORIES, getCategoryBgImage } from '@/lib/forum-seed-data'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { syncForumVotesFromServer } from '@/lib/forum-vote-cache'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/_hud/forum/$categorySlug/')({
  loader: async ({ params }) => {
    let category: ForumCategoryEntry | null = null
    let topics: ForumTopicEntry[] = []
    try {
      category = await getForumCategoryBySlugFn({ data: { slug: params.categorySlug } })
    } catch (e) {
      console.warn('Board loader category error:', e)
    }
    try {
      topics = (await getForumTopicsFn({ data: { categorySlug: params.categorySlug, sortBy: 'hot' } })) || []
    } catch (e) {
      console.warn('Board loader topics error:', e)
    }
    return { category, topics }
  },
  head: ({ loaderData, params }) => {
    const category = loaderData?.category
    const name = category?.name || 'Board'
    const desc = category?.description || 'Moltology community discussion board.'
    return {
      meta: [
        ...seo({
          title: `${name} | Moltology Forums`,
          description: desc,
          canonical: `https://moltology.org/forum/${params.categorySlug}`,
          siteName: 'Moltology Forums',
          twitterSite: '@moltology',
        }),
      ],
      links: [{ rel: 'canonical', href: `https://moltology.org/forum/${params.categorySlug}` }],
    }
  },
  component: ForumBoardPage,
  pendingComponent: HudWorkspaceGhost,
})

type SortKey = 'hot' | 'top' | 'latest' | 'active'

function ForumBoardPage() {
  const { categorySlug } = Route.useParams()
  const loader = Route.useLoaderData()
  const navigate = useNavigate()
  const session = useAuthSession()
  const userId = session.userId
  const [category, setCategory] = useState<ForumCategoryEntry | null>(loader.category)
  const [topics, setTopics] = useState<ForumTopicEntry[]>(loader.topics || [])
  const [sortBy, setSortBy] = useState<SortKey>('hot')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const composerRef = useRef<InlineTopicComposerHandle>(null)

  useEffect(() => {
    setCategory(loader.category)
    setTopics(loader.topics || [])
  }, [loader])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const token = userId ? await getAuthJWTToken() : null
        const auth = userId ? { userId, token: token ?? undefined } : {}
        const [res, nextCategory] = await Promise.all([
          getForumTopicsFn({
            data: {
              categorySlug,
              query: searchQuery,
              sortBy,
              ...auth,
            },
          }),
          userId
            ? getForumCategoryBySlugFn({ data: { slug: categorySlug, ...auth } })
            : Promise.resolve(null),
        ])
        if (active) {
          const next = res || []
          if (userId) syncForumVotesFromServer(userId, next)
          setTopics(next)
          if (nextCategory) setCategory(nextCategory)
        }
      } catch {
        if (active) setTopics([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [categorySlug, sortBy, searchQuery, userId])

  const sortTabs: { key: SortKey; label: string }[] = [
    { key: 'hot', label: 'HOT' },
    { key: 'top', label: 'TOP' },
    { key: 'latest', label: 'NEW' },
    { key: 'active', label: 'ACTIVE' },
  ]

  const otherCategories = INITIAL_FORUM_CATEGORIES.filter((c) => c.slug !== categorySlug)

  return (
    <ForumShell>
      <div className="space-y-3.5 sm:space-y-5 font-sans relative pb-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2">
          <Link
            to="/forum"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00ffff] hover:underline uppercase transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ALL FORUMS</span>
          </Link>
          {category && (
            <>
              <span className="text-[#3a4a49]">/</span>
              <span className="text-xs text-[#839493] font-bold uppercase truncate">
                {category.name}
              </span>
            </>
          )}
        </div>

        {/* Board Header Bento Banner */}
        {category ? (
          <div
            className="relative overflow-hidden bg-[#070b0b] border border-[#3a4a49] p-4 sm:p-5 chamfer-corner shadow-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ borderLeftWidth: '4px', borderLeftColor: category.color || '#00ffff' }}
          >
            {/* Background Image with Dark Gradient Overlay */}
            <img
              src={category.bgImage || getCategoryBgImage(category.slug)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b0b] via-[#070b0b]/80 to-[#070b0b]/40 pointer-events-none" />

            <div className="relative z-10 space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1
                  className="font-grotesk font-extrabold text-xl sm:text-2xl uppercase tracking-tight drop-shadow-md"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h1>
                <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#070b0b]/90 border border-[#00ffff]/40 px-2 py-0.5 chamfer-corner backdrop-blur-sm shadow-md">
                  {category.topicCount} TOPICS
                </span>
                {typeof category.unreadCount === 'number' && category.unreadCount > 0 && (
                  <ForumUnreadMark label={formatForumUnreadCount(category.unreadCount)} />
                )}
              </div>
              <p className="text-xs text-[#dfe3e3]/90 leading-relaxed drop-shadow-sm font-sans">
                {category.description}
              </p>
            </div>

            <button
              onClick={() => composerRef.current?.expandAndFocus()}
              className="relative z-10 px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] text-black text-xs font-bold uppercase tracking-wider chamfer-corner shadow-[0_0_12px_rgba(0,255,255,0.25)] transition-all flex items-center gap-1.5 self-start sm:self-center shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </button>
          </div>
        ) : (
          <div className="p-10 text-center chitin-card chamfer-corner border border-[#ff5540]/50 space-y-2">
            <Terminal className="w-8 h-8 text-[#ff5540] mx-auto" />
            <h1 className="font-grotesk font-bold text-lg text-[#dfe3e3] uppercase">
              Board Not Found
            </h1>
            <p className="text-xs text-[#839493]">This discussion board does not exist.</p>
          </div>
        )}

        {/* 2-Column Bento Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
          {/* Left Column (8 cols): Sort Tabs, Search, Topics Stream */}
          <div className="lg:col-span-8 flex flex-col space-y-3.5 sm:space-y-4">
            {category && (
              <InlineTopicComposer
                ref={composerRef}
                categories={[category]}
                initialCategoryId={category.id}
                fixedCategory={true}
                onCreated={(topic) => {
                  setTopics((prev) => [topic, ...prev])
                  navigate({
                    to: '/forum/$categorySlug/$topicSlug',
                    params: {
                      categorySlug: topic.categorySlug || category.slug,
                      topicSlug: topic.slug,
                    },
                  })
                }}
              />
            )}

            <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 h-full flex flex-col justify-between">
              <div className="space-y-3">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-[#3a4a49] pb-3">
                  <div className="flex items-center gap-1">
                    {sortTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSortBy(tab.key)}
                        className={`px-2.5 py-1 text-[10px] font-sans font-bold uppercase transition-all chamfer-corner border ${
                          sortBy === tab.key
                            ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                            : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#dfe3e3]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-[#839493] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search this board..."
                      className="w-full pl-8 pr-2.5 py-1 bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] outline-none chamfer-corner transition-colors placeholder:text-[#839493]/50"
                    />
                  </div>
                </div>

                {/* Topics Stream */}
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-16 bg-[#070b0b] border border-[#3a4a49] chamfer-corner animate-pulse" />
                    <div className="h-16 bg-[#070b0b] border border-[#3a4a49] chamfer-corner animate-pulse" />
                  </div>
                ) : topics.length === 0 ? (
                  <div className="p-10 text-center chitin-card-inset chamfer-corner border border-[#3a4a49] space-y-3">
                    <MessageSquare className="w-6 h-6 text-[#839493] mx-auto opacity-60" />
                    <p className="text-xs text-[#839493]">
                      No posts found{searchQuery ? ' matching your search' : ' in this board yet'}.
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => composerRef.current?.expandAndFocus()}
                        className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all"
                      >
                        Start a Discussion
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topics.map((topic) => (
                      <ForumTopicRow key={topic.id} topic={topic} showCategory={false} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Board Context & Quick Navigation */}
          <div className="lg:col-span-4 flex flex-col space-y-3.5 sm:space-y-5">
            {/* Board Directive Card */}
            <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-2.5">
              <div className="flex items-center gap-2 border-b border-[#3a4a49] pb-2.5">
                <Compass className="w-4 h-4 text-[#00ffff]" />
                <h3 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
                  BOARD GUIDE
                </h3>
              </div>
              <p className="text-xs text-[#839493] leading-relaxed">
                Keep posts focused on {category?.name || 'this board\'s subject'}. Clear, constructive dialogue helps everyone.
              </p>
              <div className="chitin-card-inset p-2.5 border border-[#3a4a49] chamfer-corner text-[11px] text-[#dfe3e3] space-y-1">
                <div className="text-[#00ffff] font-bold">Posting Guidelines:</div>
                <div className="text-[#839493]">· Check existing threads before posting.</div>
                <div className="text-[#839493]">· Use descriptive, informative titles.</div>
                <div className="text-[#839493]">· Respect members of all stages.</div>
              </div>
            </div>

            {/* Other Discussion Boards Switcher */}
            <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2.5">
                <h3 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
                  OTHER BOARDS
                </h3>
                <span className="text-[10px] text-[#839493] font-bold">JUMP TO</span>
              </div>
              <div className="space-y-1.5 font-sans">
                {otherCategories.map((c) => (
                  <Link
                    key={c.id}
                    to="/forum/$categorySlug"
                    params={{ categorySlug: c.slug }}
                    className="chitin-card-inset p-2 border border-[#3a4a49] hover:border-[#00ffff]/60 chamfer-corner flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs text-[#dfe3e3] group-hover:text-[#00ffff] font-bold uppercase truncate transition-colors">
                        {c.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-[#839493] group-hover:text-[#00ffff] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </ForumShell>
  )
}
