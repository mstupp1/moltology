import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Search, MessageSquare, Terminal, ChevronRight, Compass } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { HudButton } from '@/components/ui/HudButton'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { InlineTopicComposer, InlineTopicComposerHandle } from '@/components/forum/InlineTopicComposer'
import { getForumCategoryBySlugFn, getForumTopicsFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { formatForumUnreadCount } from '@/lib/forum-visits'
import { formatForumTopicCount, isForumStaffBoard } from '@/lib/forum-utils'
import { ForumUnreadMark } from '@/components/forum/ForumBits'
import { INITIAL_FORUM_CATEGORIES, getCategoryBgImage } from '@/lib/forum-seed-data'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
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
    if (category && category.slug !== params.categorySlug) {
      throw redirect({
        to: '/forum/$categorySlug',
        params: { categorySlug: category.slug },
        replace: true,
      })
    }
    try {
      topics = (await getForumTopicsFn({ data: { categorySlug: category?.slug || params.categorySlug, sortBy: 'hot' } })) || []
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
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const composerRef = useRef<InlineTopicComposerHandle>(null)
  const staffAccess = useHiddenPageAccess()
  const canStartTopic = !isForumStaffBoard(category?.slug ?? categorySlug) || staffAccess.canView

  useEffect(() => {
    setCategory(loader.category)
    setTopics(loader.topics || [])
  }, [loader])

  // Wait for typing to pause so each keystroke does not run a board-wide search.
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setDebouncedQuery('')
      return
    }
    const timer = setTimeout(() => setDebouncedQuery(trimmed), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const initialFetchHandled = useRef(false)

  useEffect(() => {
    // A guest's first render already has the loader's topics for the default view.
    if (!initialFetchHandled.current) {
      initialFetchHandled.current = true
      if (!userId && sortBy === 'hot' && !debouncedQuery) return
    }
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
              query: debouncedQuery || undefined,
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
  }, [categorySlug, sortBy, debouncedQuery, userId])

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
            className="inline-flex items-center gap-1.5 rounded-control text-xs font-bold tracking-[0.08em] text-cyan-glow hover:underline uppercase transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMUNITY</span>
          </Link>
          {category && (
            <>
              <span className="text-ink-muted/50">/</span>
              <span className="text-xs text-ink-muted font-bold tracking-[0.08em] uppercase truncate">
                {category.name}
              </span>
            </>
          )}
        </div>

        {/* Board Header Bento Banner */}
        {category ? (
          <div
            className="relative overflow-hidden rounded-card border border-line-subtle bg-surface-1 p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ borderLeftWidth: '2px', borderLeftColor: category.color || '#00c3ff' }}
          >
            {/* Background Image with Dark Gradient Overlay */}
            <img
              src={category.bgImage || getCategoryBgImage(category.slug)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-1 via-surface-1/80 to-surface-1/40 pointer-events-none" />

            <div className="relative z-10 space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1
                  className="font-grotesk font-extrabold text-xl sm:text-2xl uppercase tracking-tight drop-shadow-md"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h1>
                <span className="text-[11px] font-sans font-bold text-cyan-glow bg-surface-1/90 border border-line-subtle px-2 py-0.5 rounded-chip backdrop-blur-sm">
                  {formatForumTopicCount(category.topicCount)}
                </span>
                {typeof category.unreadCount === 'number' && category.unreadCount > 0 && (
                  <ForumUnreadMark label={formatForumUnreadCount(category.unreadCount)} />
                )}
              </div>
              <p className="text-xs text-ink-body leading-relaxed drop-shadow-sm font-sans">
                {category.description}
              </p>
            </div>

            {canStartTopic && (
            <HudButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => composerRef.current?.expandAndFocus()}
              icon={<Plus className="w-4 h-4" />}
              className="z-10 self-start sm:self-center shrink-0"
            >
              <span>New Post</span>
            </HudButton>
            )}
          </div>
        ) : (
          <div className="p-10 text-center rounded-card border border-line-subtle bg-surface-1 hud-sheen space-y-2">
            <Terminal className="w-8 h-8 text-crimson-text mx-auto" />
            <h1 className="font-grotesk font-bold text-lg text-ink uppercase">
              Board Not Found
            </h1>
            <p className="text-xs text-ink-muted">This discussion board does not exist.</p>
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

            <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 md:p-5 space-y-3.5 h-full flex flex-col justify-between">
              <div className="space-y-3">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-line-subtle pb-3">
                  <div className="flex items-center gap-1">
                    {sortTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSortBy(tab.key)}
                        className={`px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.08em] transition-all rounded-control border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                          sortBy === tab.key
                            ? 'bg-surface-2 text-ink border-cyan-glow'
                            : 'border-transparent text-ink-muted hover:text-ink hover:bg-surface-2'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search this board..."
                      className="w-full pl-8 pr-2.5 py-1 bg-surface-2 border border-line hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus text-xs text-ink outline-none rounded-control transition-colors placeholder:text-ink-muted"
                    />
                  </div>
                </div>

                {/* Topics Stream */}
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-16 bg-surface-1 border border-line-subtle rounded-card animate-pulse" />
                    <div className="h-16 bg-surface-1 border border-line-subtle rounded-card animate-pulse" />
                  </div>
                ) : topics.length === 0 ? (
                  <div className="p-10 text-center border border-line-subtle bg-surface-2 rounded-card space-y-3">
                    <MessageSquare className="w-6 h-6 text-ink-muted mx-auto opacity-60" />
                    <p className="text-xs text-ink-muted">
                      No posts found{searchQuery ? ' matching your search' : ' in this board yet'}.
                    </p>
                    {!searchQuery && canStartTopic && (
                      <HudButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => composerRef.current?.expandAndFocus()}
                      >
                        Start a Discussion
                      </HudButton>
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
            <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-line-subtle pb-2.5">
                <Compass className="w-4 h-4 text-cyan-glow" />
                <h3 className="font-grotesk text-xs sm:text-sm font-bold text-ink uppercase tracking-[0.08em]">
                  BOARD GUIDE
                </h3>
              </div>
              <p className="text-xs text-ink-body leading-relaxed">
                Keep posts focused on {category?.name || 'this board\'s subject'}. Clear, constructive dialogue helps everyone.
              </p>
              <div className="p-2.5 border border-line-subtle bg-surface-2 rounded-card text-[11px] text-ink space-y-1">
                <div className="text-cyan-glow font-bold">Posting Guidelines:</div>
                <div className="text-ink-body">· Check existing threads before posting.</div>
                <div className="text-ink-body">· Use descriptive, informative titles.</div>
                <div className="text-ink-body">· Respect members of all stages.</div>
              </div>
            </div>

            {/* Other Discussion Boards Switcher */}
            <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-line-subtle pb-2.5">
                <h3 className="font-grotesk text-xs sm:text-sm font-bold text-ink uppercase tracking-[0.08em]">
                  OTHER BOARDS
                </h3>
                <span className="text-[11px] text-ink-muted font-bold tracking-[0.08em]">JUMP TO</span>
              </div>
              <div className="space-y-1.5 font-sans">
                {otherCategories.map((c) => (
                  <Link
                    key={c.id}
                    to="/forum/$categorySlug"
                    params={{ categorySlug: c.slug }}
                    className="p-2 border border-line-subtle bg-surface-2 hover:bg-surface-3 hover:border-line-strong rounded-control flex items-center justify-between group transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs text-ink group-hover:text-cyan-glow font-bold uppercase truncate transition-colors">
                        {c.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-ink-muted group-hover:text-cyan-glow group-hover:translate-x-0.5 transition-all shrink-0" />
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
