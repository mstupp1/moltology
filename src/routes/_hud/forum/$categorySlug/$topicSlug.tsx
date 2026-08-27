import React, { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Send,
  Terminal,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Activity,
  User,
} from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { VoteButton, StageBadge, PinBadge } from '@/components/forum/ForumBits'
import { useForumAuth } from '@/components/forum/ForumShell'
import { getForumTopicDetailFn, createForumPostFn, ForumPostEntry, ForumTopicEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { syncForumVotesFromServer } from '@/lib/forum-vote-cache'
import { validateForumContent } from '@/lib/community-rules'
import { relativeTime } from '@/lib/forum-utils'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useAuthSession } from '@/hooks/useAuthSession'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
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

function ReplyComposer({
  topicId,
  onPosted,
}: {
  topicId: string
  onPosted: (post: ForumPostEntry) => void
}) {
  const { isAuthenticated, isPending, userId, openAuth } = useForumAuth()
  const persist = useHudPersist()
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
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
    persist.begin('forum-reply')
    try {
      const token = await getAuthJWTToken()
      const post = await createForumPostFn({
        data: { topicId, content, userId: userId ?? undefined, token: token ?? undefined },
      })
      onPosted(post)
      setContent('')
    } catch (err: any) {
      setError(err?.message || 'Failed to post reply. Please try again.')
    } finally {
      persist.end('forum-reply')
      setPosting(false)
    }
  }

  if (isPending) {
    return (
      <div className="chitin-card p-4 sm:p-5 chamfer-corner shadow-2xl space-y-2.5" data-testid="forum-reply-auth-skeleton">
        <HudGhostSkeleton variant="neutral" preset="text" width="60%" height={14} />
        <HudGhostSkeleton variant="cyan" preset="button" width={140} height={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="chitin-card p-4 sm:p-5 chamfer-corner shadow-2xl text-center space-y-2.5">
        <p className="text-xs text-[#839493]">Sign in to join the discussion.</p>
        <button
          onClick={() => openAuth('signup')}
          className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all shadow-[0_0_12px_rgba(0,255,255,0.25)]"
        >
          Sign In / Join
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="chitin-card p-4 sm:p-5 chamfer-corner shadow-2xl space-y-3"
    >
      <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2.5">
        <h3 className="text-xs font-grotesk font-bold uppercase tracking-wider text-[#00ffff] flex items-center gap-2">
          <Send className="w-3.5 h-3.5" />
          <span>Post Reply</span>
        </h3>
        <span className="text-[10px] text-[#839493]">{content.trim().length} / 10,000</span>
      </div>

      {error && (
        <div className="p-2.5 bg-[#2d0f0f] border border-[#ff5540] text-[#ff5540] text-xs flex items-center gap-2 chamfer-corner">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <textarea
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your constructive reply... (min 10 characters)"
        className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] p-3 text-xs text-[#dfe3e3] outline-none resize-y chamfer-corner transition-colors placeholder:text-[#839493]/50"
      />

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={posting || content.trim().length < 10}
          className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all shadow-[0_0_10px_rgba(0,255,255,0.2)]"
        >
          {posting ? 'Posting...' : 'Reply'}
        </button>
      </div>
    </form>
  )
}

function ForumThreadPage() {
  const { categorySlug, topicSlug } = Route.useParams()
  const loader = Route.useLoaderData()
  const session = useAuthSession()
  const userId = session.userId
  const [detail, setDetail] = useState(loader)

  useEffect(() => {
    setDetail(loader)
  }, [loader])

  // Hydrate vote flags without bumping the view counter again.
  useEffect(() => {
    if (!userId || !loader) return
    let active = true
    ;(async () => {
      try {
        const token = await getAuthJWTToken()
        const res = await getForumTopicDetailFn({
          data: {
            slugOrId: topicSlug,
            categorySlug,
            userId,
            token: token ?? undefined,
            trackView: false,
          },
        })
        if (active && res) {
          syncForumVotesFromServer(userId, [res.topic, ...res.posts])
          setDetail(res)
        }
      } catch {
        // Keep loader detail if vote hydration fails
      }
    })()
    return () => {
      active = false
    }
  }, [userId, topicSlug, categorySlug, loader])

  if (!detail) {
    return (
      <ForumShell>
        <div className="max-w-2xl mx-auto w-full py-16 text-center font-sans space-y-4">
          <Terminal className="w-10 h-10 text-[#ff5540] mx-auto" />
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] uppercase">Post Not Found</h1>
          <p className="text-xs text-[#839493]">This post does not exist or was removed.</p>
          <Link
            to="/forum"
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#070b0b] hover:bg-[#171c1c] border border-[#00ffff]/60 text-[#00ffff] text-xs font-bold uppercase chamfer-corner transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
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
      <div className="space-y-3.5 sm:space-y-5 font-sans relative pb-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2">
          <Link
            to="/forum/$categorySlug"
            params={{ categorySlug }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00ffff] hover:underline uppercase transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{topic.categoryName || 'Back to board'}</span>
          </Link>
        </div>

        {/* 2-Column Bento Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
          {/* Left Column (8 cols): Original Topic Post, Reply Composer, Comments Stream */}
          <div className="lg:col-span-8 flex flex-col space-y-3.5 sm:space-y-5">
            {/* Topic Main Card */}
            <article className="chitin-card p-4 sm:p-5 chamfer-corner shadow-2xl space-y-3.5 relative overflow-hidden bg-[#0a1012]/70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {topic.categoryName && (
                    <span
                      className="px-1.5 py-0.2 font-sans font-bold uppercase tracking-wider chamfer-corner border"
                      style={{
                        borderColor: `${topic.categoryColor || '#00ffff'}80`,
                        color: topic.categoryColor || '#00ffff',
                        backgroundColor: `${topic.categoryColor || '#00ffff'}10`,
                      }}
                    >
                      {topic.categoryName}
                    </span>
                  )}
                  {topic.isPinned && <PinBadge />}
                </div>

                <div className="text-[10px] text-[#839493] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#3a4a49]" />
                  <span>{relativeTime(topic.createdAt)}</span>
                </div>
              </div>

              <h1 className="font-grotesk font-extrabold text-lg sm:text-xl md:text-2xl text-[#dfe3e3] leading-snug uppercase">
                {topic.title}
              </h1>

              {/* Author & Stats Strip */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#839493] border-b border-[#3a4a49]/60 pb-3">
                <span className="flex items-center gap-1.5 min-w-0">
                  <img
                    src={topic.authorAvatar}
                    alt=""
                    className="w-4 h-4 rounded-full border border-[#3a4a49] object-cover shrink-0"
                  />
                  <span className="text-[#dfe3e3] font-bold">{topic.authorName}</span>
                  <StageBadge stage={topic.authorStage} />
                </span>
                <span className="text-[#3a4a49]">·</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{topic.views} views</span>
                </span>
              </div>

              {/* Topic Body */}
              <div className="chitin-card-inset p-3.5 sm:p-4 chamfer-corner text-xs sm:text-sm text-[#dfe3e3] leading-relaxed whitespace-pre-wrap border border-[#3a4a49]">
                {topic.content}
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between">
                <VoteButton
                  count={topic.upvotes}
                  voted={topic.voted}
                  targetId={topic.id}
                  targetType="topic"
                  onResult={handleTopicVote}
                  size="inline"
                />

                <div className="text-[11px] text-[#839493] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00ffff]" />
                  <span>{topic.repliesCount} comments</span>
                </div>
              </div>
            </article>

            {/* Reply Composer */}
            <ReplyComposer topicId={topic.id} onPosted={handlePosted} />

            {/* Comments Stream */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-grotesk font-bold uppercase tracking-widest text-[#dfe3e3] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#00ffff]" />
                  <span>{posts.length} Comments</span>
                </h2>
              </div>

              {posts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#839493] chitin-card-inset chamfer-corner border border-[#3a4a49]">
                  No replies yet. Be the first to respond.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="chitin-card-inset p-3 sm:p-4 border border-[#3a4a49] chamfer-corner space-y-2.5 bg-[#070b0b]/60"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#839493]">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <img
                            src={post.authorAvatar}
                            alt=""
                            className="w-4 h-4 rounded-full border border-[#3a4a49] object-cover shrink-0"
                          />
                          <span className="text-[#dfe3e3] font-bold truncate">
                            {post.authorName}
                          </span>
                          <StageBadge stage={post.authorStage} />
                        </span>
                        <span className="text-[10px] text-[#839493] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#3a4a49]" />
                          <span>{relativeTime(post.createdAt)}</span>
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[#dfe3e3] leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      <div className="pt-1.5 border-t border-[#3a4a49]/40 flex items-center justify-between">
                        <VoteButton
                          count={post.upvotes}
                          voted={post.voted}
                          targetId={post.id}
                          targetType="post"
                          onResult={handlePostVote(post.id)}
                          size="inline"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (4 cols): Transmission Intel & Guidelines */}
          <div className="lg:col-span-4 flex flex-col space-y-3.5 sm:space-y-5">
            {/* Transmission Intel Card */}
            <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00ffff]" />
                  <h3 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
                    THREAD INFO
                  </h3>
                </div>
                <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/30 px-2 py-0.5 chamfer-corner">
                  LIVE
                </span>
              </div>

              <div className="space-y-1.5 font-sans text-xs">
                <div className="chitin-card-inset p-2 border border-[#3a4a49] chamfer-corner flex items-center justify-between">
                  <span className="text-[#839493] text-[10px] uppercase font-bold">BOARD</span>
                  <span className="text-[#dfe3e3] font-bold uppercase">{topic.categoryName || 'General'}</span>
                </div>
                <div className="chitin-card-inset p-2 border border-[#3a4a49] chamfer-corner flex items-center justify-between">
                  <span className="text-[#839493] text-[10px] uppercase font-bold">AUTHOR STAGE</span>
                  <StageBadge stage={topic.authorStage} />
                </div>
                <div className="chitin-card-inset p-2 border border-[#3a4a49] chamfer-corner flex items-center justify-between">
                  <span className="text-[#839493] text-[10px] uppercase font-bold">TOTAL VIEWS</span>
                  <span className="text-[#00ffff] font-bold">{topic.views}</span>
                </div>
                <div className="chitin-card-inset p-2 border border-[#3a4a49] chamfer-corner flex items-center justify-between">
                  <span className="text-[#839493] text-[10px] uppercase font-bold">TOTAL REPLIES</span>
                  <span className="text-[#dfe3e3] font-bold">{topic.repliesCount}</span>
                </div>
              </div>
            </div>

            {/* Directives Reminder */}
            <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-2.5">
              <div className="flex items-center gap-2 border-b border-[#3a4a49] pb-2.5">
                <ShieldCheck className="w-4 h-4 text-[#00ffff]" />
                <h3 className="font-grotesk text-xs sm:text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
                  COMMUNITY RULES
                </h3>
              </div>
              <p className="text-xs text-[#839493] leading-relaxed">
                Be constructive and civil. Keep credentials private, and encourage growth across every stage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ForumShell>
  )
}
