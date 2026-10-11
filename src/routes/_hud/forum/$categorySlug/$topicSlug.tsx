import React, { useState, useEffect, useMemo, useRef } from 'react'
import { forumVisibleLength } from '@/lib/forum-markdown'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
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
  Quote,
  AlertTriangle,
} from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { VoteButton, StageBadge, PinBadge, LockBadge, WithdrawnBadge } from '@/components/forum/ForumBits'
import { ReplyComposer, type ReplyComposerHandle } from '@/components/forum/ReplyComposer'
import { ForumPostCard } from '@/components/forum/ForumPostCard'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { ForumAuthorTools, ForumRevisedMark, ForumWithdrawnBody } from '@/components/forum/ForumAuthorTools'
import { ForumFlagControl } from '@/components/forum/ForumFlagControl'
import { ForumEditor } from '@/components/forum/ForumEditor'
import {
  getForumTopicDetailFn,
  updateForumTopicFn,
  deleteForumTopicFn,
  ForumPostEntry,
  ForumTopicEntry,
} from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { syncForumVotesFromServer } from '@/lib/forum-vote-cache'
import { relativeTime, buildForumPostTree, type ForumReplySort } from '@/lib/forum-utils'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { ForumPostBody } from '@/components/forum/ForumPostBody'
import { buildForumQuoteMarkup, isForumQuoteSourceWithdrawn } from '@/lib/forum-quotes'
import { FORUM_LOCKED_ERROR, validateForumContent } from '@/lib/community-rules'

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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink rounded-control border border-line bg-surface-1 hover:bg-surface-2 hover:border-line-strong transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
      title={copied ? 'Link copied!' : 'Share discussion'}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-cyan-glow" />
          <span className="text-cyan-glow">Copied</span>
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
    let res = null
    try {
      res = await getForumTopicDetailFn({
        data: { slugOrId: params.topicSlug, categorySlug: params.categorySlug },
      })
    } catch (e) {
      console.warn('Thread loader error:', e)
      return null
    }
    if (res?.topic.categorySlug && res.topic.categorySlug !== params.categorySlug) {
      throw redirect({
        to: '/forum/$categorySlug/$topicSlug',
        params: {
          categorySlug: res.topic.categorySlug,
          topicSlug: params.topicSlug,
        },
        replace: true,
      })
    }
    return res
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
  const [replyQuote, setReplyQuote] = useState('')
  const [editingTopic, setEditingTopic] = useState(false)
  const [confirmingTopicWithdraw, setConfirmingTopicWithdraw] = useState(false)
  const [topicTitleDraft, setTopicTitleDraft] = useState('')
  const [topicBodyDraft, setTopicBodyDraft] = useState('')
  const [topicBusy, setTopicBusy] = useState(false)
  const [topicError, setTopicError] = useState<string | null>(null)
  const topicFormRef = useRef<HTMLFormElement>(null)
  const topComposerRef = useRef<ReplyComposerHandle>(null)
  const persist = useHudPersist()
  const toast = useOptionalToast()

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
          <Terminal className="w-10 h-10 text-crimson-text mx-auto" />
          <h1 className="font-grotesk font-bold text-xl text-ink uppercase">Post Not Found</h1>
          <p className="text-xs text-ink-muted">This post does not exist or was removed.</p>
          <Link
            to="/forum"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Community
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
    setReplyQuote('')
  }

  const handlePostUpdated = (post: ForumPostEntry) => {
    setDetail({
      ...detail,
      posts: posts.map((p) => (p.id === post.id ? { ...p, ...post } : p)),
    })
  }

  const handleTopicUpdated = (next: ForumTopicEntry) => {
    setDetail({
      ...detail,
      topic: { ...topic, ...next },
    })
  }

  const handleTopicSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateForumContent(topicTitleDraft, topicBodyDraft)
    if (!validation.valid) {
      setTopicError(validation.error || 'Invalid content')
      return
    }
    setTopicBusy(true)
    setTopicError(null)
    persist.begin('forum-revise-topic')
    try {
      const token = await getAuthJWTToken()
      const updated = await updateForumTopicFn({
        data: {
          topicId: topic.id,
          title: topicTitleDraft,
          content: topicBodyDraft,
          userId: userId ?? undefined,
          token: token ?? undefined,
        },
      })
      handleTopicUpdated(updated)
      setEditingTopic(false)
      toast?.toast.success('Topic updated.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update that topic.'
      setTopicError(message)
      toast?.toast.error(message)
    } finally {
      persist.end('forum-revise-topic')
      setTopicBusy(false)
    }
  }

  const handleTopicWithdraw = async () => {
    setTopicBusy(true)
    setTopicError(null)
    persist.begin('forum-withdraw-topic')
    try {
      const token = await getAuthJWTToken()
      const updated = await deleteForumTopicFn({
        data: {
          topicId: topic.id,
          userId: userId ?? undefined,
          token: token ?? undefined,
        },
      })
      handleTopicUpdated(updated)
      setConfirmingTopicWithdraw(false)
      setEditingTopic(false)
      toast?.toast.success('Topic withdrawn.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not withdraw that topic.'
      setTopicError(message)
      toast?.toast.error(message)
    } finally {
      persist.end('forum-withdraw-topic')
      setTopicBusy(false)
    }
  }

  const handleReplyClick = (postId: string) => {
    setReplyQuote('')
    setReplyingToId((cur) => (cur === postId ? null : postId))
  }

  const handleQuotePost = (postId: string) => {
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    const result = buildForumQuoteMarkup(post)
    if (!result.ok) return
    setReplyQuote(result.markup)
    setReplyingToId(postId)
  }

  const handleQuoteTopic = () => {
    const result = buildForumQuoteMarkup(topic)
    if (!result.ok) return
    topComposerRef.current?.insertQuote(result.markup)
  }

  const topicWithdrawn = isForumQuoteSourceWithdrawn(topic)
  const canAuthorTopic = Boolean(userId && topic.userId && userId === topic.userId && !topicWithdrawn)

  return (
    <ForumShell>
      <div className="space-y-3.5 sm:space-y-5 font-sans relative pb-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2">
          <Link
            to="/forum/$categorySlug"
            params={{ categorySlug }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-glow hover:underline uppercase transition-colors rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
            <article className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {topic.categoryName && (
                    <span
                      className="px-1.5 py-0.2 font-sans font-bold uppercase tracking-[0.08em] rounded-chip"
                      style={{
                        color: topic.categoryColor || '#00c3ff',
                        backgroundColor: `${topic.categoryColor || '#00c3ff'}26`,
                      }}
                    >
                      {topic.categoryName}
                    </span>
                  )}
                  {topic.isPinned && <PinBadge />}
                  {topic.isLocked && <LockBadge />}
                  {topicWithdrawn && <WithdrawnBadge />}
                </div>

                <div className="text-[11px] text-ink-muted flex items-center gap-1">
                  <Clock className="w-3 h-3 text-ink-muted/60" />
                  <span>{relativeTime(topic.createdAt)}</span>
                  <ForumRevisedMark
                    createdAt={topic.createdAt}
                    updatedAt={topic.updatedAt}
                    deletedAt={topic.deletedAt}
                  />
                </div>
              </div>

              <h1 className="font-grotesk font-extrabold text-lg sm:text-xl md:text-2xl text-ink leading-snug uppercase">
                {topic.title}
              </h1>

              {/* Author & Stats Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle pb-3.5">
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
                        className="ring-2 ring-line group-hover/topic-avatar:ring-line-strong transition-all shadow-md"
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
                      className="ring-2 ring-line shadow-md"
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
                          className="text-ink font-grotesk font-bold text-sm sm:text-base hover:text-cyan-glow transition-colors truncate"
                        >
                          {topic.authorName}
                        </Link>
                      ) : (
                        <span className="text-ink font-grotesk font-bold text-sm sm:text-base truncate">
                          {topic.authorName}
                        </span>
                      )}

                      {topic.authorHandle && (
                        <span className="text-xs text-ink-muted hidden sm:inline truncate">
                          @{topic.authorHandle.replace(/^@/, '')}
                        </span>
                      )}

                      <span className="px-1.5 py-0.2 text-[11px] font-sans font-bold uppercase tracking-[0.08em] bg-cyan-soft text-cyan-glow rounded-chip">
                        AUTHOR
                      </span>

                      <StageBadge stage={topic.authorStage} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-ink-muted mt-0.5">
                      <span className="flex items-center gap-1" title={new Date(topic.createdAt).toLocaleString()}>
                        <Clock className="w-3 h-3 text-ink-muted/60" />
                        <span>{relativeTime(topic.createdAt)}</span>
                      </span>
                      <span className="text-ink-muted/60">·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-ink-muted/60" />
                        <span>{topic.views} views</span>
                      </span>
                    </div>
                  </div>
                </div>

                <TopicShareButton />
              </div>

              {/* Topic Body */}
              {topicWithdrawn ? (
                <div className="rounded-control border border-line-subtle bg-abyss/60 p-3.5 sm:p-4">
                  <ForumWithdrawnBody className="text-xs sm:text-sm text-ink-muted leading-relaxed italic" />
                </div>
              ) : editingTopic ? (
                <form ref={topicFormRef} onSubmit={handleTopicSave} className="space-y-2.5" data-testid="forum-revise-topic-form">
                  {topicError && (
                    <div className="p-2.5 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs flex items-center gap-2 rounded-control">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{topicError}</span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={topicTitleDraft}
                    onChange={(e) => setTopicTitleDraft(e.target.value)}
                    aria-label="Revise topic title"
                    className="w-full bg-surface-2 border border-line focus:border-cyan-glow focus:shadow-field-focus p-3 text-sm text-ink outline-none rounded-control transition-[border-color,box-shadow]"
                  />
                  <ForumEditor
                    value={topicBodyDraft}
                    onChange={setTopicBodyDraft}
                    onSubmit={() => topicFormRef.current?.requestSubmit()}
                    disabled={topicBusy}
                    size="tall"
                    autoFocus
                    aria-label="Revise topic body"
                    testId="forum-revise-topic-editor"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopic(false)
                        setTopicError(null)
                      }}
                      className="px-3 py-1.5 rounded-control text-xs font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={topicBusy || topicTitleDraft.trim().length < 5 || forumVisibleLength(topicBodyDraft) < 10}
                      className="px-4 py-1.5 rounded-control bg-cyan-glow hover:bg-cyan-hover disabled:opacity-50 text-abyss text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      {topicBusy ? 'Sealing...' : 'Seal revision'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-control border border-line-subtle bg-abyss/60 p-3.5 sm:p-4 text-xs sm:text-sm text-ink-body leading-relaxed">
                  <ForumPostBody content={topic.content} />
                </div>
              )}

              {/* Action Footer */}
              <div className="pt-2 border-t border-line-subtle flex items-center justify-between gap-2">
                <VoteButton
                  count={topic.upvotes}
                  voted={topic.voted}
                  targetId={topic.id}
                  targetType="topic"
                  onResult={handleTopicVote}
                  size="inline"
                />

                <div className="flex items-center gap-3">
                  {canAuthorTopic && (
                    <ForumAuthorTools
                      confirmingWithdraw={confirmingTopicWithdraw}
                      busy={topicBusy}
                      onRevise={() => {
                        setTopicTitleDraft(topic.title)
                        setTopicBodyDraft(topic.content)
                        setConfirmingTopicWithdraw(false)
                        setEditingTopic(true)
                        setTopicError(null)
                      }}
                      onStartWithdraw={() => {
                        setEditingTopic(false)
                        setConfirmingTopicWithdraw(true)
                      }}
                      onCancelWithdraw={() => setConfirmingTopicWithdraw(false)}
                      onConfirmWithdraw={() => void handleTopicWithdraw()}
                    />
                  )}
                  <ForumFlagControl
                    topicId={topic.id}
                    authorId={topic.userId}
                    withdrawn={topicWithdrawn}
                    deletedAt={topic.deletedAt}
                  />
                  {!topicWithdrawn && !topic.isLocked && (
                    <button
                      type="button"
                      onClick={handleQuoteTopic}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      data-testid="forum-quote-topic"
                    >
                      <Quote className="w-3.5 h-3.5" />
                      Quote
                    </button>
                  )}
                  <div className="text-[11px] text-ink-muted flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-glow" />
                    <span>{topic.repliesCount} comments</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Reply Composer */}
            {topic.isLocked ? (
              <div
                className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 sm:p-5 text-center space-y-1.5"
                data-testid="forum-thread-locked"
              >
                <p className="text-xs text-ink font-bold">Thread locked</p>
                <p className="text-xs text-ink-muted">{FORUM_LOCKED_ERROR}</p>
              </div>
            ) : (
              <ReplyComposer ref={topComposerRef} topicId={topic.id} onPosted={handlePosted} />
            )}

            {/* Comments Stream */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs sm:text-sm font-grotesk font-bold uppercase tracking-[0.08em] text-ink flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-glow" />
                  <span>{posts.length} Comments</span>
                </h2>
                {posts.length > 0 && (
                  <div
                    className="flex items-center gap-1 text-[11px]"
                    role="group"
                    aria-label="Sort comments"
                    data-testid="forum-reply-sort"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReplySort(opt.id)}
                        className={`px-2 py-1 font-bold uppercase tracking-[0.08em] rounded-t-control border-b-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                          replySort === opt.id
                            ? 'bg-surface-2 text-ink border-cyan-glow'
                            : 'text-ink-muted border-transparent hover:text-ink hover:bg-surface-2'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {posts.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted rounded-card border border-line-subtle bg-surface-1">
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
                      topicLocked={topic.isLocked}
                      replyingToId={replyingToId}
                      onReplyClick={handleReplyClick}
                      onQuoteClick={handleQuotePost}
                      onCancelReply={() => {
                        setReplyingToId(null)
                        setReplyQuote('')
                      }}
                      onPosted={handlePosted}
                      onPostVote={handlePostVote}
                      onUpdated={handlePostUpdated}
                      quoteDraft={replyQuote}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (4 cols): Transmission Intel & Guidelines */}
          <div className="lg:col-span-4 flex flex-col space-y-3.5 sm:space-y-5">
            {/* Transmission Intel Card */}
            <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-line-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-glow" />
                  <h3 className="font-grotesk text-xs sm:text-sm font-bold text-ink uppercase tracking-[0.08em]">
                    THREAD INFO
                  </h3>
                </div>
                <span className="text-[11px] font-sans font-bold tracking-[0.08em] text-cyan-glow bg-cyan-soft px-2 py-0.5 rounded-chip">
                  LIVE
                </span>
              </div>

              <div className="space-y-1.5 font-sans text-xs">
                <div className="rounded-control border border-line-subtle bg-abyss/60 p-2 flex items-center justify-between">
                  <span className="text-ink-muted text-[11px] uppercase font-bold tracking-[0.08em]">BOARD</span>
                  <span className="text-ink font-bold uppercase">{topic.categoryName || 'General'}</span>
                </div>
                <div className="rounded-control border border-line-subtle bg-abyss/60 p-2 flex items-center justify-between">
                  <span className="text-ink-muted text-[11px] uppercase font-bold tracking-[0.08em]">AUTHOR STAGE</span>
                  <StageBadge stage={topic.authorStage} />
                </div>
                <div className="rounded-control border border-line-subtle bg-abyss/60 p-2 flex items-center justify-between">
                  <span className="text-ink-muted text-[11px] uppercase font-bold tracking-[0.08em]">TOTAL VIEWS</span>
                  <span className="text-cyan-glow font-bold">{topic.views}</span>
                </div>
                <div className="rounded-control border border-line-subtle bg-abyss/60 p-2 flex items-center justify-between">
                  <span className="text-ink-muted text-[11px] uppercase font-bold tracking-[0.08em]">TOTAL REPLIES</span>
                  <span className="text-ink font-bold">{topic.repliesCount}</span>
                </div>
              </div>
            </div>

            {/* Directives Reminder */}
            <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-line-subtle pb-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-glow" />
                <h3 className="font-grotesk text-xs sm:text-sm font-bold text-ink uppercase tracking-[0.08em]">
                  COMMUNITY RULES
                </h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Be constructive and civil. Keep credentials private, and encourage growth across every stage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ForumShell>
  )
}
