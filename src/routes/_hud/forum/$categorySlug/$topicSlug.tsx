import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, MessageSquare, Eye, Send, Terminal, AlertTriangle } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { VoteButton, StageBadge, PinBadge } from '@/components/forum/ForumBits'
import { useForumAuth } from '@/components/forum/ForumShell'
import { getForumTopicDetailFn, createForumPostFn, ForumPostEntry, ForumTopicEntry } from '@/lib/server/api'
import { validateForumContent } from '@/lib/community-rules'
import { relativeTime } from '@/lib/forum-utils'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/_hud/forum/$categorySlug/$topicSlug')({
  loader: async ({ params }) => {
    try {
      const res = await getForumTopicDetailFn({
        data: { slugOrId: params.topicSlug, categorySlug: params.categorySlug },
      })
      return res
    } catch (e) {
      console.warn('Thread loader error:', e)
      return null
    }
  },
  head: ({ loaderData, params }) => {
    const topic = loaderData?.topic
    const title = topic?.title ? `${topic.title} | Moltology Forums` : 'Post | Moltology Forums'
    const desc = topic?.content?.slice(0, 160) || 'Moltology community discussion.'
    return {
      meta: [
        ...seo({
          title,
          description: desc,
          canonical: `https://moltology.org/forum/${params.categorySlug}/${params.topicSlug}`,
          siteName: 'Moltology Forums',
          twitterSite: '@moltology',
        }),
      ],
      links: [
        {
          rel: 'canonical',
          href: `https://moltology.org/forum/${params.categorySlug}/${params.topicSlug}`,
        },
      ],
    }
  },
  component: ForumThreadPage,
  pendingComponent: HudWorkspaceGhost,
})

function ReplyComposer({ topicId, onPosted }: { topicId: string; onPosted: (post: ForumPostEntry) => void }) {
  const { isAuthenticated, userId, openAuth } = useForumAuth()
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openAuth('signup')
      return
    }
    const validation = validateForumContent(undefined, content)
    if (!validation.valid) {
      setError(validation.error || 'Invalid content')
      return
    }
    setPosting(true)
    setError(null)
    try {
      const post = await createForumPostFn({ data: { topicId, content, userId: userId ?? undefined } })
      onPosted(post)
      setContent('')
    } catch (err: any) {
      setError(err?.message || 'Failed to post reply. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-5 border border-[#1f2b2a] rounded-md bg-[#0a0f0f] text-center">
        <p className="text-sm text-[#839493] mb-3">Sign in to join the discussion.</p>
        <button
          onClick={() => openAuth('signup')}
          className="px-5 py-2 bg-[#00ffff] hover:bg-[#00e6e6] text-black text-xs font-bold uppercase rounded transition"
        >
          Sign In / Join
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 border border-[#00ffff]/40 rounded-md bg-[#0a0f0f] space-y-3">
      <h3 className="text-xs font-grotesk font-bold uppercase tracking-wider text-[#00ffff] flex items-center gap-2">
        <Send className="w-3.5 h-3.5" />
        Reply
      </h3>
      {error && (
        <div className="p-2.5 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2 rounded">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <textarea
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply... (min 10 characters)"
        className="w-full bg-[#0d1414] border border-[#2a3a39] focus:border-[#00ffff] p-3 text-xs text-[#dfe3e3] outline-none resize-y rounded"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#839493]">{content.trim().length} / 10,000</span>
        <button
          type="submit"
          disabled={posting || content.trim().length < 10}
          className="px-4 py-2 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider rounded transition"
        >
          {posting ? 'Posting...' : 'Post Reply'}
        </button>
      </div>
    </form>
  )
}

function ForumThreadPage() {
  const { categorySlug, topicSlug } = Route.useParams()
  const loader = Route.useLoaderData()
  const [detail, setDetail] = useState(loader)

  if (!detail) {
    return (
      <ForumShell>
        <div className="max-w-3xl mx-auto w-full py-16 text-center font-sans">
          <Terminal className="w-10 h-10 text-[#ff5540] mx-auto mb-3" />
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] uppercase">Post Not Found</h1>
          <p className="text-sm text-[#839493] mt-2 mb-6">This post does not exist or was removed.</p>
          <Link
            to="/forum"
            className="inline-flex items-center gap-2 px-5 py-2 bg-cyan-950 border border-[#00ffff]/60 text-[#00ffff] text-xs font-bold uppercase rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forums
          </Link>
        </div>
      </ForumShell>
    )
  }

  const { topic, posts } = detail

  const handleTopicVote = (res: { upvotes: number; voted: boolean }) => {
    setDetail({ ...detail, topic: { ...topic, upvotes: res.upvotes, voted: res.voted } })
  }

  const handlePostVote = (postId: string) => (res: { upvotes: number; voted: boolean }) => {
    setDetail({
      ...detail,
      posts: posts.map((p) => (p.id === postId ? { ...p, upvotes: res.upvotes, voted: res.voted } : p)),
    })
  }

  const handlePosted = (post: ForumPostEntry) => {
    setDetail({
      topic: { ...topic, repliesCount: topic.repliesCount + 1, lastReplyAt: new Date().toISOString() },
      posts: [...posts, post],
    })
  }

  return (
    <ForumShell>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 font-sans">
        {/* Breadcrumb */}
        <Link
          to="/forum/$categorySlug"
          params={{ categorySlug }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00ffff] hover:underline uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {topic.categoryName || 'Back to board'}
        </Link>

        {/* Topic Card */}
        <article className="border border-[#1f2b2a] rounded-md bg-[#0a0f0f] overflow-hidden">
          <div className="flex items-start p-5 gap-4">
            <VoteButton count={topic.upvotes} voted={topic.voted || false} targetId={topic.id} targetType="topic" onResult={handleTopicVote} />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {topic.categoryName && (
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold uppercase border"
                    style={{ borderColor: topic.categoryColor || '#00ffff', color: topic.categoryColor || '#00ffff' }}
                  >
                    {topic.categoryName}
                  </span>
                )}
                {topic.isPinned && <PinBadge />}
              </div>

              <h1 className="font-grotesk font-bold text-xl sm:text-2xl text-[#dfe3e3] leading-snug">
                {topic.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#839493]">
                <span className="flex items-center gap-1.5">
                  <img src={topic.authorAvatar} alt="" className="w-5 h-5 rounded-full border border-[#2a3a39] object-cover" />
                  <span className="text-[#dfe3e3] font-bold">{topic.authorName}</span>
                  <StageBadge stage={topic.authorStage} />
                </span>
                <span>·</span>
                <span>{relativeTime(topic.createdAt)}</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {topic.views} views
                </span>
              </div>

              <div className="text-sm text-[#dfe3e3] leading-relaxed whitespace-pre-wrap border-t border-[#1f2b2a] pt-4">
                {topic.content}
              </div>
            </div>
          </div>
        </article>

        {/* Replies */}
        <section className="space-y-4">
          <h2 className="text-xs font-grotesk font-bold uppercase tracking-widest text-[#839493] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#00ffff]" />
            {posts.length} Comments
          </h2>

          {posts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#839493] border border-[#1f2b2a] rounded-md bg-[#0a0f0f]">
              No replies yet. Be the first to respond.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-4 border border-[#1f2b2a] rounded-md bg-[#0a0f0f]">
                  <VoteButton
                    count={post.upvotes}
                    voted={post.voted || false}
                    targetId={post.id}
                    targetType="post"
                    onResult={handlePostVote(post.id)}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#839493]">
                      <span className="flex items-center gap-1.5">
                        <img src={post.authorAvatar} alt="" className="w-4 h-4 rounded-full border border-[#2a3a39] object-cover" />
                        <span className="text-[#dfe3e3] font-bold">{post.authorName}</span>
                        <StageBadge stage={post.authorStage} />
                      </span>
                      <span>·</span>
                      <span>{relativeTime(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#dfe3e3] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Composer */}
        <ReplyComposer topicId={topic.id} onPosted={handlePosted} />
      </div>
    </ForumShell>
  )
}
