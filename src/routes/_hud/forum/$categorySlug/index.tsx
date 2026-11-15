import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Plus, Search, MessageSquare } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { HudButton } from '@/components/ui/HudButton'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { ForumBoardNav, ForumSortTabs, type ForumSortKey } from '@/components/forum/ForumBoardNav'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { ForumBandCrumbs } from '@/components/forum/ForumBandCrumbs'
import { ForumBoardGhost } from '@/components/forum/ForumGhosts'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { InlineTopicComposer, InlineTopicComposerHandle } from '@/components/forum/InlineTopicComposer'
import { getForumCategoriesFn, getForumCategoryBySlugFn, getForumTopicsFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { formatForumTopicCount, isForumStaffBoard } from '@/lib/forum-utils'
import { formatForumUnreadCount } from '@/lib/forum-visits'
import { ForumUnreadMark } from '@/components/forum/ForumBits'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { getAuthJWTToken } from '@/lib/jwt'
import { syncForumVotesFromServer } from '@/lib/forum-vote-cache'
import { seo } from '@/lib/seo'
import { PAGE_SIZES, mergeById, takePage } from '@/lib/pagination'
import { LoadMoreButton } from '@/components/ui/LoadMoreButton'
import { useAppQuery, useAppQueryClient } from '@/lib/query/account'
import { FRESH, forumKeys } from '@/lib/query/content'
import { useForgetForumReads } from '@/hooks/useForgetForumReads'

const TOPIC_PAGE = PAGE_SIZES.forumTopics

type BoardRead = { items: ForumTopicEntry[]; hasMore: boolean; category: ForumCategoryEntry | null }

/** The board list a member is looking at, as a cache key. */
function boardView(board: string, sortBy: string, query: string, userId: string | null | undefined) {
  return { board, sortBy, query, userId: userId ?? null, view: 'board' }
}

export const Route = createFileRoute('/_hud/forum/$categorySlug/')({
  loader: async ({ params }) => {
    let category: ForumCategoryEntry | null = null
    let topics: ForumTopicEntry[] = []
    let hasMore = false
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
      const found =
        (await getForumTopicsFn({
          data: { categorySlug: category?.slug || params.categorySlug, sortBy: 'hot', limit: TOPIC_PAGE + 1 },
        })) || []
      const page = takePage(found, TOPIC_PAGE)
      topics = page.items
      hasMore = page.hasMore
    } catch (e) {
      console.warn('Board loader topics error:', e)
    }
    return { category, topics, hasMore }
  },
  head: ({ loaderData, params }) => {
    const category = loaderData?.category
    const name = category?.name || 'Board'
    const desc = category?.description || 'Moltology community discussion board.'
    return {
      meta: [
        ...seo({
          title: `${name} | Forum | Moltology`,
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
  pendingComponent: ForumBoardGhost,
  staleTime: FRESH.forum,
  preloadStaleTime: FRESH.forum,
})

type SortKey = ForumSortKey

function ForumBoardPage() {
  const { categorySlug } = Route.useParams()
  const loader = Route.useLoaderData()
  const navigate = useNavigate()
  const session = useAuthSession()
  const userId = session.userId
  const queryClient = useAppQueryClient()
  const forgetForumReads = useForgetForumReads()
  // A revisit paints the member's saved board, not the guest version from the loader.
  const saved = userId
    ? queryClient.getQueryData<BoardRead>(forumKeys.topics(boardView(categorySlug, 'hot', '', userId)))
    : undefined
  const [category, setCategory] = useState<ForumCategoryEntry | null>(saved?.category ?? loader.category)
  const [topics, setTopics] = useState<ForumTopicEntry[]>(saved?.items ?? (loader.topics || []))
  const [sortBy, setSortBy] = useState<SortKey>('hot')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [hasMore, setHasMore] = useState(saved?.hasMore ?? Boolean(loader.hasMore))
  const [loadingMore, setLoadingMore] = useState(false)
  const [serverOffset, setServerOffset] = useState(saved?.items.length ?? (loader.topics || []).length)
  const composerRef = useRef<InlineTopicComposerHandle>(null)
  const staffAccess = useHiddenPageAccess()
  const canStartTopic = !isForumStaffBoard(category?.slug ?? categorySlug) || staffAccess.canView

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

  // Guests on the default view already have the loader's topics; everything else asks the
  // server once and keeps the first page for revisits.
  const usesServerList = Boolean(userId) || sortBy !== 'hot' || Boolean(debouncedQuery)
  const board = useAppQuery<BoardRead>({
    queryKey: forumKeys.topics(boardView(categorySlug, sortBy, debouncedQuery, userId)),
    queryFn: async () => {
      const token = userId ? await getAuthJWTToken() : null
      const auth = userId ? { userId, token: token ?? undefined } : {}
      const [res, nextCategory] = await Promise.all([
        getForumTopicsFn({
          data: {
            categorySlug,
            query: debouncedQuery || undefined,
            sortBy,
            limit: TOPIC_PAGE + 1,
            ...auth,
          },
        }),
        userId ? getForumCategoryBySlugFn({ data: { slug: categorySlug, ...auth } }) : Promise.resolve(null),
      ])
      const page = takePage(res || [], TOPIC_PAGE)
      if (userId) syncForumVotesFromServer(userId, page.items)
      return { ...page, category: nextCategory }
    },
    enabled: usesServerList && !session.isPending,
    staleTime: FRESH.forum,
  })
  const loading = usesServerList && board.isFetching && !board.data

  useEffect(() => {
    if (!usesServerList) {
      setCategory(loader.category)
      setTopics(loader.topics || [])
      setHasMore(Boolean(loader.hasMore))
      setServerOffset((loader.topics || []).length)
      return
    }
    if (board.isError && !board.data) {
      setTopics([])
      setHasMore(false)
      return
    }
    const page = board.data
    if (!page) return
    setTopics(page.items)
    setHasMore(page.hasMore)
    setServerOffset(page.items.length)
    setCategory(page.category ?? loader.category)
  }, [usesServerList, board.data, board.isError, loader])

  const loadMoreTopics = async () => {
    setLoadingMore(true)
    try {
      const token = userId ? await getAuthJWTToken() : null
      const auth = userId ? { userId, token: token ?? undefined } : {}
      const res = await getForumTopicsFn({
        data: {
          categorySlug,
          query: debouncedQuery || undefined,
          sortBy,
          limit: TOPIC_PAGE + 1,
          offset: serverOffset,
          ...auth,
        },
      })
      const page = takePage(res || [], TOPIC_PAGE)
      if (userId) syncForumVotesFromServer(userId, page.items)
      setTopics((prev) => mergeById(prev, page.items))
      setHasMore(page.hasMore)
      setServerOffset((n) => n + page.items.length)
    } catch {
      // Leave the button so the member can try again.
    } finally {
      setLoadingMore(false)
    }
  }

  const boardsQuery = useAppQuery<ForumCategoryEntry[]>({
    queryKey: forumKeys.categories(userId),
    queryFn: async () => {
      if (!userId) return (await getForumCategoriesFn()) ?? []
      const token = await getAuthJWTToken()
      return (await getForumCategoriesFn({ data: { userId, token: token ?? undefined } })) ?? []
    },
    enabled: !session.isPending,
    staleTime: FRESH.forum,
  })
  const boards = boardsQuery.data ?? []
  const startPost = () => composerRef.current?.expandAndFocus()

  if (!category) {
    return (
      <ForumShell>
        <div className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans pb-8">
          <div>
            <ForumBandCrumbs />
            <HudTitlePanel treatment="band" joined title="Board not found" description="This board does not exist or was renamed." />
          </div>
          <ForumBoardNav boards={boards} variant="list" className="max-w-xl" />
        </div>
      </ForumShell>
    )
  }

  return (
    <ForumShell>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans relative pb-8">
        <div>
          <ForumBandCrumbs board={category} current />
          <HudTitlePanel
            treatment="band"
            joined
            title={category.name}
            description={category.description}
            actions={
              canStartTopic ? (
                <HudButton type="button" variant="primary" size="sm" onClick={startPost} icon={<Plus className="w-4 h-4" />}>
                  <span>New post</span>
                </HudButton>
              ) : undefined
            }
          >
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted tabular-nums">
              <span>{formatForumTopicCount(category.topicCount)}</span>
              {typeof category.unreadCount === 'number' && category.unreadCount > 0 ? (
                <ForumUnreadMark label={formatForumUnreadCount(category.unreadCount)} />
              ) : null}
            </div>
          </HudTitlePanel>
        </div>

        <ForumBoardNav boards={boards} variant="strip" className="lg:hidden" current={category.slug} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">
          <div className="lg:col-span-8 space-y-3 sm:space-y-4 min-w-0">
            {canStartTopic && (
              <InlineTopicComposer
                ref={composerRef}
                showPrompt={false}
                categories={[category]}
                initialCategoryId={category.id}
                fixedCategory={true}
                onCreated={(topic) => {
                  setTopics((prev) => [topic, ...prev])
                  forgetForumReads()
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

            <section aria-label={`Posts in ${category.name}`} className="min-w-0 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <ForumSortTabs value={sortBy} onChange={setSortBy} options={['hot', 'latest', 'top', 'active']} />
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search this board"
                    aria-label="Search this board"
                    className="w-full min-h-9 pl-8 pr-2.5 bg-surface-2 border border-line hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus text-xs text-ink outline-hidden rounded-control transition-colors placeholder:text-ink-muted"
                  />
                </div>
              </div>

              {loading ? (
                <div className="space-y-2" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 space-y-2">
                      <HudGhostSkeleton variant="neutral" preset="heading" width="65%" height={16} />
                      <HudGhostSkeleton variant="neutral" preset="text" width="90%" height={12} />
                      <HudGhostSkeleton variant="neutral" preset="text" width={160} height={11} />
                    </div>
                  ))}
                </div>
              ) : topics.length === 0 ? (
                <div className="p-8 text-center rounded-card border border-line-subtle bg-surface-1 space-y-3" data-testid="forum-empty">
                  <MessageSquare className="w-6 h-6 text-ink-muted mx-auto" aria-hidden="true" />
                  <p className="text-sm font-bold text-ink">{searchQuery ? 'No posts match' : 'No posts yet'}</p>
                  <p className="text-xs text-ink-muted">
                    {searchQuery ? 'Try other words.' : 'Start the first conversation on this board.'}
                  </p>
                  {searchQuery ? (
                    <HudButton type="button" variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                      Clear search
                    </HudButton>
                  ) : canStartTopic ? (
                    <HudButton type="button" variant="secondary" size="sm" onClick={startPost}>
                      Start a post
                    </HudButton>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <ForumTopicRow key={topic.id} topic={topic} showCategory={false} />
                  ))}
                  {hasMore && (
                    <LoadMoreButton
                      label="Load more posts"
                      loading={loadingMore}
                      testId="forum-topics-load-more"
                      onClick={() => void loadMoreTopics()}
                    />
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="hidden min-w-0 lg:block lg:col-span-4 lg:sticky lg:top-20">
            {boards.length > 0 ? (
              <ForumBoardNav boards={boards} variant="list" current={category.slug} />
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <HudGhostSkeleton key={i} variant="neutral" preset="custom" width="100%" height={52} className="rounded-card" />
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </ForumShell>
  )
}
