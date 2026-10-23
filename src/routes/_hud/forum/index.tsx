import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Users, Plus, MessageSquare, ShieldCheck, Search, LayoutGrid, SearchX } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { ForumBoardNav, ForumSortTabs, type ForumSortKey } from '@/components/forum/ForumBoardNav'
import { InlineTopicComposer, InlineTopicComposerHandle } from '@/components/forum/InlineTopicComposer'
import { ForumRulesDialog } from '@/components/forum/ForumRulesDialog'
import { DashboardPanel } from '@/components/hud/dashboard/DashboardPanel'
import { getForumCategoriesFn, getForumTopicsFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { COMMUNITY_RULES } from '@/lib/community-rules'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { syncForumVotesFromServer } from '@/lib/forum-vote-cache'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/_hud/forum/')({
  loader: async () => {
    let categories: ForumCategoryEntry[] = []
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

const FIELD =
  'w-full min-h-8 bg-surface-2 border border-line hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus text-xs text-ink outline-hidden rounded-control transition-colors'

function sentenceCase(text: string) {
  const lower = text.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function ForumIndexPage() {
  const { categories, topics } = Route.useLoaderData()
  const navigate = useNavigate()
  const session = useAuthSession()
  const userId = session.userId
  const composerRef = useRef<InlineTopicComposerHandle>(null)
  const [showRules, setShowRules] = useState(false)
  const [topicsState, setTopicsState] = useState<ForumTopicEntry[]>(topics)
  const [categoriesState, setCategoriesState] = useState<ForumCategoryEntry[]>(categories)
  const [sortBy, setSortBy] = useState<ForumSortKey>('hot')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [boardFilter, setBoardFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTopicsState(topics)
  }, [topics])

  useEffect(() => {
    setCategoriesState(categories)
  }, [categories])

  // Unread counts need the member's JWT, which SSR loaders cannot send.
  useEffect(() => {
    if (!userId) return
    let active = true
    ;(async () => {
      try {
        const token = await getAuthJWTToken()
        const cats = await getForumCategoriesFn({ data: { userId, token: token ?? undefined } })
        if (active && cats && cats.length > 0) setCategoriesState(cats)
      } catch {
        // Keep loader boards if hydration fails
      }
    })()
    return () => {
      active = false
    }
  }, [userId])

  // Lists carry previews, not whole bodies, so a search asks the server once typing pauses.
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setDebouncedQuery('')
      return
    }
    const timer = setTimeout(() => setDebouncedQuery(trimmed), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Guests on the default view already have the loader's list; everything else asks the server.
  useEffect(() => {
    if (!userId && sortBy === 'hot' && !debouncedQuery) {
      setTopicsState(topics)
      return
    }
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const token = userId ? await getAuthJWTToken() : null
        const auth = userId ? { userId, token: token ?? undefined } : {}
        const found = await getForumTopicsFn({
          data: { sortBy, ...(debouncedQuery ? { query: debouncedQuery } : {}), ...auth },
        })
        if (!active) return
        // An empty signed-in default view keeps the loader list rather than blanking the page.
        if (found && (found.length > 0 || debouncedQuery || sortBy !== 'hot')) {
          if (userId) syncForumVotesFromServer(userId, found)
          setTopicsState(found)
        }
      } catch {
        if (active && debouncedQuery) setTopicsState([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [sortBy, debouncedQuery, userId, topics])

  const trimmedQuery = searchQuery.trim()
  const query = trimmedQuery.toLowerCase()
  // Narrow what is on screen right away while the server search is still in flight.
  const waitingOnSearch = trimmedQuery !== debouncedQuery
  const visibleTopics = topicsState.filter((topic) => {
    const matchesBoard = boardFilter === 'ALL' || topic.categorySlug === boardFilter || topic.categoryId === boardFilter
    const matchesSearch =
      !waitingOnSearch ||
      !query ||
      topic.title.toLowerCase().includes(query) ||
      topic.content.toLowerCase().includes(query)
    return matchesBoard && matchesSearch
  })

  const filtering = !!trimmedQuery || boardFilter !== 'ALL'
  const clearFilters = () => {
    setSearchQuery('')
    setBoardFilter('ALL')
  }

  const startPost = () => composerRef.current?.expandAndFocus()

  return (
    <ForumShell>
      <div className="space-y-4 sm:space-y-5 font-sans relative pb-8">
        <HudTitlePanel
          eyebrow={
            <>
              <Users className="w-3.5 h-3.5" />
              <span>Moltology community</span>
            </>
          }
          title="Forum"
          description="Ask questions, share progress and talk with other members."
          actions={
            <>
              <HudButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowRules(true)}
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
              >
                <span>Rules</span>
              </HudButton>
              <HudButton type="button" variant="primary" size="sm" onClick={startPost} icon={<Plus className="w-4 h-4" />}>
                <span>New post</span>
              </HudButton>
            </>
          }
        />

        {/* Phones get the boards as one swipeable row above the feed; desktop keeps them in the rail. */}
        <ForumBoardNav boards={categoriesState} variant="strip" className="lg:hidden" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          <div className="lg:col-span-8 space-y-4 min-w-0">
            <InlineTopicComposer
              ref={composerRef}
              categories={categoriesState}
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

            <section aria-labelledby="forum-posts-heading" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 id="forum-posts-heading" className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-glow" aria-hidden="true" />
                  Posts
                </h2>
                <ForumSortTabs value={sortBy} onChange={setSortBy} />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts"
                    aria-label="Search posts"
                    className={`${FIELD} pl-8 pr-2.5 py-1.5 placeholder:text-ink-muted`}
                  />
                </div>
                <label className="relative sm:w-56 shrink-0">
                  <span className="sr-only">Filter by board</span>
                  <LayoutGrid className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <select
                    value={boardFilter}
                    onChange={(e) => setBoardFilter(e.target.value)}
                    className={`${FIELD} pl-8 pr-2.5 py-1.5`}
                  >
                    <option value="ALL" className="bg-surface-2 text-ink">
                      All boards
                    </option>
                    {categoriesState.map((cat) => (
                      <option key={cat.id} value={cat.slug} className="bg-surface-2 text-ink">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {loading && visibleTopics.length === 0 ? (
                <div className="space-y-2" aria-busy="true">
                  <div className="h-24 bg-surface-1 border border-line-subtle rounded-card animate-pulse" />
                  <div className="h-24 bg-surface-1 border border-line-subtle rounded-card animate-pulse" />
                </div>
              ) : visibleTopics.length === 0 ? (
                <div className="p-8 text-center rounded-card border border-line-subtle bg-surface-1 space-y-3" data-testid="forum-empty">
                  {filtering ? (
                    <>
                      <SearchX className="w-6 h-6 text-ink-muted mx-auto" aria-hidden="true" />
                      <p className="text-sm font-bold text-ink">No posts match</p>
                      <p className="text-xs text-ink-muted">Try other words or look across every board.</p>
                      <HudButton type="button" variant="secondary" size="sm" onClick={clearFilters}>
                        Clear filters
                      </HudButton>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-6 h-6 text-ink-muted mx-auto" aria-hidden="true" />
                      <p className="text-sm font-bold text-ink">No posts yet</p>
                      <p className="text-xs text-ink-muted">Start the first conversation.</p>
                      <HudButton type="button" variant="secondary" size="sm" onClick={startPost}>
                        Start a post
                      </HudButton>
                    </>
                  )}
                </div>
              ) : (
                <div className={`space-y-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
                  {visibleTopics.map((topic) => (
                    <ForumTopicRow key={topic.id} topic={topic} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
            <DashboardPanel
              icon={<LayoutGrid />}
              title="Boards"
              subtitle="Pick a board to see everything posted there."
              className="hidden lg:flex"
            >
              <ForumBoardNav boards={categoriesState} variant="list" />
            </DashboardPanel>

            <DashboardPanel
              icon={<ShieldCheck />}
              title="Rules"
              subtitle="How we keep the boards useful."
              action={{ label: 'Read all', onClick: () => setShowRules(true) }}
            >
              <ol className="space-y-1.5 text-xs text-ink-body">
                {COMMUNITY_RULES.map((rule) => (
                  <li key={rule.id} className="flex gap-2">
                    <span className="text-ink-muted tabular-nums">{rule.id}.</span>
                    <span>{sentenceCase(rule.title)}</span>
                  </li>
                ))}
              </ol>
            </DashboardPanel>
          </aside>
        </div>
      </div>

      {showRules && <ForumRulesDialog onClose={() => setShowRules(false)} />}
    </ForumShell>
  )
}
