import React, { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Search, MessageSquare, Terminal } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { NewTopicDialog } from '@/components/forum/NewTopicDialog'
import { CategoryIcon } from '@/components/forum/ForumBits'
import { getForumCategoryBySlugFn, getForumTopicsFn, ForumCategoryEntry, ForumTopicEntry } from '@/lib/server/api'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/forum/$categorySlug/')({
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
})

type SortKey = 'hot' | 'top' | 'latest' | 'active'

function ForumBoardPage() {
  const { categorySlug } = Route.useParams()
  const loader = Route.useLoaderData()
  const navigate = useNavigate()
  const [category, setCategory] = useState<ForumCategoryEntry | null>(loader.category)
  const [topics, setTopics] = useState<ForumTopicEntry[]>(loader.topics || [])
  const [sortBy, setSortBy] = useState<SortKey>('hot')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    setCategory(loader.category)
    setTopics(loader.topics || [])
  }, [loader])

  useEffect(() => {
    let active = true
    setLoading(true)
    getForumTopicsFn({ data: { categorySlug, query: searchQuery, sortBy } })
      .then((res) => {
        if (active) setTopics(res || [])
      })
      .catch(() => null)
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [categorySlug, sortBy, searchQuery])

  const sortTabs: { key: SortKey; label: string }[] = [
    { key: 'hot', label: 'Hot' },
    { key: 'top', label: 'Top' },
    { key: 'latest', label: 'New' },
    { key: 'active', label: 'Active' },
  ]

  return (
    <ForumShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-24 sm:py-28 space-y-6">
        {/* Breadcrumb */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00ffff] hover:underline uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Forums
        </Link>

        {/* Board Header */}
        {category ? (
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#1f2b2a] rounded-md bg-[#0a0f0f] p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded border border-[#2a3a39] bg-[#0d1414]" style={{ color: category.color }}>
                <CategoryIcon icon={category.icon} color={category.color} />
              </div>
              <div>
                <h1 className="font-grotesk font-bold text-xl sm:text-2xl uppercase tracking-tight" style={{ color: category.color }}>
                  {category.name}
                </h1>
                <p className="text-sm text-[#839493] mt-1">{category.description}</p>
                <span className="text-[11px] text-[#00ffff] font-bold mt-2 inline-block">
                  {category.topicCount} topics
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="px-5 py-2 bg-[#ff5540] hover:bg-[#ff3b20] text-black text-xs font-bold uppercase tracking-wider rounded shadow-md transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </header>
        ) : (
          <header className="p-10 text-center border border-[#ff5540]/50 rounded-md bg-[#0a0f0f]">
            <Terminal className="w-10 h-10 text-[#ff5540] mx-auto mb-3" />
            <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] uppercase">Board Not Found</h1>
            <p className="text-sm text-[#839493] mt-2">This board does not exist.</p>
          </header>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#0a0f0f] p-1 border border-[#1f2b2a] rounded-md w-full sm:w-auto">
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSortBy(tab.key)}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase transition rounded ${
                  sortBy === tab.key
                    ? 'bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/40'
                    : 'text-[#839493] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#839493] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search this board..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a0f0f] border border-[#1f2b2a] focus:border-[#00ffff] text-xs text-[#dfe3e3] outline-none rounded"
            />
          </div>
        </div>

        {/* Topics List */}
        {loading ? (
          <div className="space-y-2">
            <div className="h-20 bg-[#0a0f0f] border border-[#1f2b2a] rounded animate-pulse" />
            <div className="h-20 bg-[#0a0f0f] border border-[#1f2b2a] rounded animate-pulse" />
          </div>
        ) : topics.length === 0 ? (
          <div className="p-12 text-center border border-[#1f2b2a] rounded-md bg-[#0a0f0f] space-y-3">
            <MessageSquare className="w-8 h-8 text-[#839493] mx-auto opacity-50" />
            <p className="text-sm text-[#839493]">
              No posts found{searchQuery ? ' matching your search' : ' in this board yet'}.
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNew(true)}
                className="px-4 py-2 bg-[#ff5540] text-black text-xs font-bold uppercase rounded"
              >
                Start a Discussion
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#1f2b2a] border border-[#1f2b2a] rounded-md overflow-hidden">
            {topics.map((topic) => (
              <ForumTopicRow key={topic.id} topic={topic} showCategory={false} />
            ))}
          </div>
        )}
      </div>

      {showNew && category && (
        <NewTopicDialog
          categories={[category]}
          initialCategoryId={category.id}
          onClose={() => setShowNew(false)}
          onCreated={(topic) => {
            navigate({ to: '/forum/$categorySlug/$topicSlug', params: { categorySlug, topicSlug: topic.slug } })
          }}
        />
      )}
    </ForumShell>
  )
}