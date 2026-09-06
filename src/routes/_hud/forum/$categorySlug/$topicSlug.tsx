import React, { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Terminal,
  Clock,
  ShieldCheck,
  Activity,
  Link2,
  Check,
} from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { VoteButton, StageBadge, PinBadge } from '@/components/forum/ForumBits'
import { ReplyComposer } from '@/components/forum/ReplyComposer'
import { ForumPostCard } from '@/components/forum/ForumPostCard'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { getForumTopicDetailFn, ForumPostEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { syncForumVotesFromServer } from '@/lib/forum-vote-cache'
import { relativeTime, buildForumPostTree, type ForumReplySort } from '@/lib/forum-utils'
import { useAuthSession } from '@/hooks/useAuthSession'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { ForumMentionBody } from '@/components/forum/ForumMentionBody'

function TopicShareButton() {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#00ffff] hover:bg-[#00ffff]/10 border border-[#3a4a49] hover:border-[#00ffff]/50 chamfer-corner transition-all shrink-0"
      title={copied ? 'Link copied!' : 'Share discussion'}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#00ffff]" />
          <span className="text-[#00ffff]">Copied</span>
        </>
      ) : (
        <>
          <Link2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </>
      )}
    </button>
  )
}

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

const SORT_OPTIONS: { id: ForumReplySort; label: string }[] = [
  { id: 'oldest', label: 'Oldest' },
  { id: 'newest', label: 'Newest' },
  { id: 'top', label: 'Top' },
]

function ForumThreadPage() {
  const { categorySlug, topicSlug } = Route.useParams()
  const loader = Route.useLoaderData()
  const session = useAuthSession()
  const userId = session.userId
  const [detail, setDetail] = useState(loader)
  const [replySort, setReplySort] = useState<ForumReplySort>('oldest')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)

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

  const posts = detail?.posts ?? []
  const topic = detail?.topic

  const postTree = useMemo(
    () => buildForumPostTree(posts as ForumPostEntry[], replySort),
    [posts, replySort],
  )

  if (!detail || !topic) {
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3a4a49]/60 pb-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {topic.userId ? (
                    <Link
                      to="/member/$profileId"
                      params={{
                        profileId: resolveMemberPublicParam({
                          id: topic.userId,
                          handle: topic.authorHandle,
                        }),
                      }}
                      className="shrink-0 group/topic-avatar focus:outline-none"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <ForumAvatar
                        src={topic.authorAvatar}
                        authorName={topic.authorName}
                        authorHandle={topic.authorHandle}
                        userId={topic.userId}
                        avatarConfig={topic.authorAvatarConfig}
                        alt=""
                        size="lg"
                        className="ring-2 ring-[#3a4a49] group-hover/topic-avatar:ring-[#00ffff] transition-all shadow-md"
                      />
                    </Link>
                  ) : (
                    <ForumAvatar
                      src={topic.authorAvatar}
                      authorName={topic.authorName}
                      authorHandle={topic.authorHandle}
                      userId={topic.userId}
                      avatarConfig={topic.authorAvatarConfig}
                      size="lg"
                      className="ring-2 ring-[#3a4a49] shadow-md"
                    />
                  )}

                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {topic.userId ? (
                        <Link
                          to="/member/$profileId"
                          params={{
                            profileId: resolveMemberPublicParam({
                              id: topic.userId,
                              handle: topic.authorHandle,
                            }),
                          }}
                          className="text-[#dfe3e3] font-grotesk font-bold text-sm sm:text-base hover:text-[#00c3ff] transition-colors truncate"
                        >
                          {topic.authorName}
                        </Link>
                      ) : (
                        <span className="text-[#dfe3e3] font-grotesk font-bold text-sm sm:text-base truncate">
                          {topic.authorName}
                        </span>
                      )}

                      {topic.authorHandle && (
                        <span className="text-xs text-[#839493]/80 hidden sm:inline truncate">
                          @{topic.authorHandle.replace(/^@/, '')}
                        </span>
                      )}

                      <span className="px-1.5 py-0.2 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 chamfer-corner">
                        AUTHOR
                      </span>

                      <StageBadge stage={topic.authorStage} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#839493] mt-0.5">
                      <span className="flex items-center gap-1" title={new Date(topic.createdAt).toLocaleString()}>
                        <Clock className="w-3 h-3 text-[#3a4a49]" />
                        <span>{relativeTime(topic.createdAt)}</span>
                      </span>
                      <span className="text-[#3a4a49]">·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#3a4a49]" />
                        <span>{topic.views} views</span>
                      </span>
                    </div>
                  </div>
                </div>

                <TopicShareButton />
              </div>

              {/* Topic Body */}
              <div className="chitin-card-inset p-3.5 sm:p-4 chamfer-corner text-xs sm:text-sm text-[#dfe3e3] leading-relaxed whitespace-pre-wrap border border-[#3a4a49]">
                <ForumMentionBody content={topic.content} />
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs sm:text-sm font-grotesk font-bold uppercase tracking-widest text-[#dfe3e3] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#00ffff]" />
                  <span>{posts.length} Comments</span>
                </h2>
                {posts.length > 0 && (
                  <div
                    className="flex items-center gap-1 text-[10px]"
                    role="group"
                    aria-label="Sort comments"
                    data-testid="forum-reply-sort"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReplySort(opt.id)}
                        className={`px-2 py-1 font-bold uppercase tracking-wider chamfer-corner transition-colors ${
                          replySort === opt.id
                            ? 'bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/50'
                            : 'text-[#839493] border border-transparent hover:text-[#dfe3e3]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {posts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#839493] chitin-card-inset chamfer-corner border border-[#3a4a49]">
                  No replies yet. Be the first to respond.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {postTree.map((node) => (
                    <ForumPostCard
                      key={node.post.id}
                      node={node}
                      topicId={topic.id}
                      topicAuthorId={topic.userId}
                      replyingToId={replyingToId}
                      onReplyClick={(id) => setReplyingToId((cur) => (cur === id ? null : id))}
                      onCancelReply={() => setReplyingToId(null)}
                      onPosted={handlePosted}
                      onPostVote={handlePostVote}
                    />
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
