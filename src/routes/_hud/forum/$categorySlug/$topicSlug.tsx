import React, { useState, useEffect, useMemo, useRef } from 'react'
import { LocalTime } from '@/components/ui/LocalTime'
import { formatDayTime } from '@/lib/dates'
import { forumVisibleLength } from '@/lib/forum-markdown'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ArrowLeft, Eye, Link2, Check, Quote, AlertTriangle, Lock } from 'lucide-react'
import { ForumShell } from '@/components/forum/ForumShell'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { pillTabClass } from '@/components/ui/pillTab'
import { ForumBandCrumbs } from '@/components/forum/ForumBandCrumbs'
import { ForumThreadRail, MoreFromBoard } from '@/components/forum/ForumThreadRail'
import { ForumThreadGhost } from '@/components/forum/ForumGhosts'
import { VoteButton, StageBadge, PinBadge, LockBadge, WithdrawnBadge } from '@/components/forum/ForumBits'
import { ReplyComposer, type ReplyComposerHandle } from '@/components/forum/ReplyComposer'
import { ForumPostCard } from '@/components/forum/ForumPostCard'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { ForumAuthorTools, ForumRevisedMark, ForumWithdrawnBody } from '@/components/forum/ForumAuthorTools'
import { ForumFlagControl } from '@/components/forum/ForumFlagControl'
import { ForumEditor } from '@/components/forum/ForumEditor'
import {
  getForumTopicDetailFn,
  getForumRepliesFn,
  updateForumTopicFn,
  deleteForumTopicFn,
  ForumPostEntry,
  ForumTopicEntry,
} from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { syncForumVotesFromServer } from '@/lib/forum-vote-cache'
import { relativeTime, buildForumPostTree, type ForumReplySort } from '@/lib/forum-utils'
import { mergeById } from '@/lib/pagination'
import { AutoLoadMore } from '@/components/ui/AutoLoadMore'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useAppQueryClient } from '@/lib/query/account'
import { FRESH, forumKeys } from '@/lib/query/content'
import { useForgetForumReads } from '@/hooks/useForgetForumReads'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { seo } from '@/lib/seo'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { ForumPostBody } from '@/components/forum/ForumPostBody'
import { buildForumQuoteMarkup, isForumQuoteSourceWithdrawn } from '@/lib/forum-quotes'
import { FORUM_BODY_MAX_CHARS, FORUM_TITLE_MAX_CHARS, FORUM_LOCKED_ERROR, validateForumContent } from '@/lib/community-rules'

function TopicShareButton({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const toast = useOptionalToast()
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast?.toast.success('Link copied.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast?.toast.error('Could not copy the link.')
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Share"
        title="Copy a link to this post"
        className="inline-flex min-h-8 min-w-8 items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-cyan-glow" /> : <Link2 className="w-3.5 h-3.5" />}
      </button>
    )
  }

  return (
    <HudButton
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      icon={copied ? <Check className="w-3.5 h-3.5 text-cyan-glow" /> : <Link2 className="w-3.5 h-3.5" />}
      title="Copy a link to this post"
      data-testid="forum-share"
    >
      {copied ? 'Copied' : 'Share'}
    </HudButton>
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
    const title = topic?.title ? `${topic.title} | Forum | Moltology` : 'Post | Forum | Moltology'
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
  pendingComponent: ForumThreadGhost,
  staleTime: FRESH.forum,
  preloadStaleTime: FRESH.forum,
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
  const queryClient = useAppQueryClient()
  const forgetForumReads = useForgetForumReads()
  const detailKey = forumKeys.topic(categorySlug, topicSlug, userId)
  const detailKeyHash = JSON.stringify(detailKey)
  // A revisit paints the member's saved thread (their votes included), not the loader's guest copy.
  const [detail, setDetailState] = useState<typeof loader>(
    () => (userId ? queryClient.getQueryData<typeof loader>(detailKey) : undefined) ?? loader,
  )
  const firstLoaderRef = useRef(loader)
  /** Local changes (votes, replies, edits) also update the saved copy. */
  const setDetail = (next: typeof loader | ((current: typeof loader) => typeof loader)) => {
    setDetailState((current) => {
      const value = typeof next === 'function' ? next(current) : next
      if (userId && value) queryClient.setQueryData(JSON.parse(detailKeyHash), value)
      return value
    })
  }
  const [replySort, setReplySort] = useState<ForumReplySort>('oldest')
  const [repliesLoading, setRepliesLoading] = useState(false)
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
    // The first loader result is already in state (or replaced by the saved member copy).
    if (loader === firstLoaderRef.current) return
    setDetailState(loader)
  }, [loader])

  // Hydrate vote flags without bumping the view counter again.
  useEffect(() => {
    if (!userId || !loader) return
    let active = true
    ;(async () => {
      try {
        const res = await queryClient.fetchQuery({
          queryKey: JSON.parse(detailKeyHash) as readonly unknown[],
          queryFn: async () => {
            const token = await getAuthJWTToken()
            const fresh = await getForumTopicDetailFn({
              data: {
                slugOrId: topicSlug,
                categorySlug,
                userId,
                token: token ?? undefined,
                trackView: false,
              },
            })
            if (fresh) syncForumVotesFromServer(userId, [fresh.topic, ...fresh.posts])
            return fresh
          },
          staleTime: FRESH.forum,
        })
        if (active && res) setDetailState(res)
      } catch {
        // Keep loader detail if vote hydration fails
      }
    })()
    return () => {
      active = false
    }
  }, [userId, topicSlug, categorySlug, loader, queryClient, detailKeyHash])

  const posts = detail?.posts ?? []
  const topic = detail?.topic
  const nextReplyOffset = detail?.nextReplyOffset ?? null

  /**
   * Loads the next page of replies, or (on a sort change while partial) the first page
   * in the new order. A failed next page rejects so the scroll loader can offer "Try again".
   */
  const loadReplies = async (sort: ForumReplySort, offset: number) => {
    if (!detail || repliesLoading) return
    setRepliesLoading(true)
    try {
      const token = userId ? await getAuthJWTToken() : null
      const page = await getForumRepliesFn({
        data: {
          topicId: detail.topic.id,
          sort,
          offset,
          ...(userId ? { userId, token: token ?? undefined } : {}),
        },
      })
      if (userId) syncForumVotesFromServer(userId, page.posts)
      setDetail((current) =>
        current
          ? {
              ...current,
              posts: offset === 0 ? page.posts : mergeById(current.posts, page.posts),
              nextReplyOffset: page.nextOffset,
            }
          : current,
      )
    } catch (err) {
      if (offset > 0) throw err
      toast?.toast.error('Could not load replies. Try again.')
    } finally {
      setRepliesLoading(false)
    }
  }

  // A shared link to a reply further down keeps loading pages until that reply is on screen.
  const [linkedPostId] = useState(() =>
    typeof window !== 'undefined' && window.location.hash.startsWith('#post-') ? window.location.hash.slice(6) : null,
  )
  const linkedFoundRef = useRef(false)
  useEffect(() => {
    if (!linkedPostId || linkedFoundRef.current || repliesLoading) return
    if (posts.some((p) => p.id === linkedPostId)) {
      linkedFoundRef.current = true
      requestAnimationFrame(() => document.getElementById(`post-${linkedPostId}`)?.scrollIntoView({ block: 'center' }))
      return
    }
    if (nextReplyOffset !== null) void loadReplies(replySort, nextReplyOffset).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedPostId, posts, nextReplyOffset, repliesLoading])

  const changeReplySort = (sort: ForumReplySort) => {
    if (sort === replySort) return
    setReplySort(sort)
    // With every reply loaded the tree re-sorts locally; otherwise the server
    // picks which replies come first in the new order.
    if (nextReplyOffset !== null) void loadReplies(sort, 0)
  }

  const postTree = useMemo(
    () => buildForumPostTree(posts as ForumPostEntry[], replySort),
    [posts, replySort],
  )

  if (!detail || !topic) {
    return (
      <ForumShell>
        <div className="max-w-2xl mx-auto w-full py-16 text-center font-sans space-y-3">
          <h1 className="font-grotesk font-semibold text-xl text-ink">Post not found</h1>
          <p className="text-xs text-ink-muted">This post does not exist or was removed.</p>
          <Link
            to="/forum"
            className="inline-flex min-h-8 items-center gap-2 px-3 text-2xs font-semibold rounded-control border border-line bg-surface-2 text-ink hover:bg-surface-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to the forum
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
      ...detail,
      topic: { ...topic, repliesCount: topic.repliesCount + 1, lastReplyAt: new Date().toISOString() },
      posts: [...posts, post],
    })
    setReplyQuote('')
    forgetForumReads()
  }

  const handlePostUpdated = (post: ForumPostEntry) => {
    setDetail({
      ...detail,
      posts: posts.map((p) => (p.id === post.id ? { ...p, ...post } : p)),
    })
    forgetForumReads()
  }

  const handleTopicUpdated = (next: ForumTopicEntry) => {
    setDetail({
      ...detail,
      topic: { ...topic, ...next },
    })
    forgetForumReads()
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

  const canReply = !topic.isLocked && !topicWithdrawn
  const board = topic.categorySlug
    ? { slug: topic.categorySlug, name: topic.categoryName || 'Board', color: topic.categoryColor }
    : { slug: categorySlug, name: topic.categoryName || 'Board', color: topic.categoryColor }
  const replyCount = nextReplyOffset === null ? posts.length : Math.max(topic.repliesCount, posts.length)
  const handle = topic.authorHandle?.replace(/^@/, '')
  const authorParams = topic.userId
    ? { profileId: resolveMemberPublicParam({ id: topic.userId, handle: topic.authorHandle }) }
    : null
  const flags = topic.isPinned || topic.isLocked || topicWithdrawn

  return (
    <ForumShell>
      <div className="space-y-2 sm:space-y-4 lg:space-y-5 font-sans relative pb-8">
        <div>
          <ForumBandCrumbs board={board} />
          <HudTitlePanel
            treatment="band"
            joined
            title={<span className="break-words">{topic.title}</span>}
            actions={
              <span className="hidden sm:inline-flex">
                <TopicShareButton />
              </span>
            }
          >
            {flags ? (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {topic.isPinned && <PinBadge />}
                {topic.isLocked && <LockBadge />}
                {topicWithdrawn && <WithdrawnBadge />}
              </div>
            ) : null}
          </HudTitlePanel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 lg:gap-5 items-start">
          <div className="lg:col-span-8 min-w-0 space-y-2 sm:space-y-4">
            {/* The post itself */}
            <article
              className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 lg:p-5 space-y-3"
              data-testid="forum-topic-post"
            >
              <div className="flex items-center gap-3 min-w-0">
                {authorParams ? (
                  <Link to="/member/$profileId" params={authorParams} className="shrink-0 focus:outline-hidden" tabIndex={-1} aria-hidden="true">
                    <ForumAvatar
                      src={topic.authorAvatar}
                      authorName={topic.authorName}
                      authorHandle={topic.authorHandle}
                      userId={topic.userId}
                      avatarConfig={topic.authorAvatarConfig}
                      alt=""
                      size="lg"
                      loading="eager"
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
                    loading="eager"
                  />
                )}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {authorParams ? (
                      <Link
                        to="/member/$profileId"
                        params={authorParams}
                        className="text-ink font-semibold text-sm sm:text-base truncate hover:text-cyan-glow transition-colors rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      >
                        {topic.authorName}
                      </Link>
                    ) : (
                      <span className="text-ink font-semibold text-sm sm:text-base truncate">{topic.authorName}</span>
                    )}
                    <StageBadge stage={topic.authorStage} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-1.5 text-2xs text-ink-muted">
                    {handle ? <span className="hidden sm:inline truncate">@{handle}</span> : null}
                    {handle ? <span className="hidden sm:inline" aria-hidden="true">·</span> : null}
                    <LocalTime value={topic.createdAt} format={relativeTime} titleFormat={formatDayTime} />
                    <ForumRevisedMark createdAt={topic.createdAt} updatedAt={topic.updatedAt} deletedAt={topic.deletedAt} />
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      {topic.views} views
                    </span>
                  </div>
                </div>
              </div>

              {topicWithdrawn ? (
                <ForumWithdrawnBody className="text-sm text-ink-muted leading-relaxed italic" />
              ) : editingTopic ? (
                <form ref={topicFormRef} onSubmit={handleTopicSave} className="space-y-2.5" data-testid="forum-revise-topic-form">
                  {topicError && (
                    <div className="p-2.5 bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs flex items-center gap-2 rounded-control">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{topicError}</span>
                    </div>
                  )}
                  <p className="text-2xs text-ink-muted">{topicTitleDraft.trim().length} / {FORUM_TITLE_MAX_CHARS} title characters</p>
                  <input
                    maxLength={FORUM_TITLE_MAX_CHARS}
                    type="text"
                    value={topicTitleDraft}
                    onChange={(e) => setTopicTitleDraft(e.target.value)}
                    aria-label="Edit post title"
                    className="w-full bg-surface-2 border border-line focus:border-cyan-glow focus:shadow-field-focus p-3 text-sm text-ink outline-hidden rounded-control transition-[border-color,box-shadow]"
                  />
                  <ForumEditor
                    value={topicBodyDraft}
                    onChange={setTopicBodyDraft}
                    onSubmit={() => topicFormRef.current?.requestSubmit()}
                    disabled={topicBusy}
                    size="tall"
                    autoFocus
                    aria-label="Edit post body"
                    testId="forum-revise-topic-editor"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <HudButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTopic(false)
                        setTopicError(null)
                      }}
                    >
                      Cancel
                    </HudButton>
                    <HudButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={topicBusy || topicTitleDraft.trim().length < 5 || forumVisibleLength(topicBodyDraft) < 10 || topicBodyDraft.trim().length > FORUM_BODY_MAX_CHARS}
                    >
                      {topicBusy ? 'Saving...' : 'Save changes'}
                    </HudButton>
                  </div>
                </form>
              ) : (
                <ForumPostBody content={topic.content} className="space-y-2.5 text-sm sm:text-md text-ink-body leading-relaxed" />
              )}

              <div className="-ml-2 flex flex-wrap items-center gap-1">
                <VoteButton
                  count={topic.upvotes}
                  voted={topic.voted}
                  targetId={topic.id}
                  targetType="topic"
                  authorId={topic.userId}
                  onResult={handleTopicVote}
                  size="inline"
                />
                {canReply && (
                  <button
                    type="button"
                    onClick={handleQuoteTopic}
                    className="inline-flex min-h-8 items-center gap-1.5 px-2 text-2xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    data-testid="forum-quote-topic"
                  >
                    <Quote className="w-3.5 h-3.5" />
                    Quote
                  </button>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <span className="sm:hidden">
                    <TopicShareButton compact />
                  </span>
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
                </div>
              </div>
            </article>

            {topic.isLocked ? (
              <div
                className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 flex items-start gap-2.5"
                data-testid="forum-thread-locked"
              >
                <Lock className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="text-xs text-ink font-semibold">Thread locked</p>
                  <p className="text-xs text-ink-muted">{FORUM_LOCKED_ERROR}</p>
                </div>
              </div>
            ) : (
              <ReplyComposer ref={topComposerRef} topicId={topic.id} onPosted={handlePosted} collapsible />
            )}

            <section className="space-y-2.5 sm:space-y-3" aria-labelledby="forum-replies-heading">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="forum-replies-heading" className="font-grotesk text-base font-semibold text-ink">
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </h2>
                {posts.length > 1 && (
                  <div
                    className="flex items-center gap-1 rounded-control bg-abyss/40 p-0.5"
                    role="group"
                    aria-label="Sort replies"
                    data-testid="forum-reply-sort"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => changeReplySort(opt.id)}
                        aria-pressed={replySort === opt.id}
                        disabled={repliesLoading}
                        className={pillTabClass(replySort === opt.id, 'min-h-8 normal-case tracking-normal text-xs')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {posts.length === 0 ? (
                <p className="py-6 text-center text-xs text-ink-muted">
                  {canReply ? 'No replies yet. Be the first to respond.' : 'No replies.'}
                </p>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
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
                  {nextReplyOffset !== null && (
                    <AutoLoadMore
                      label="Load more replies"
                      loading={repliesLoading}
                      testId="forum-replies-load-more"
                      onLoad={() => loadReplies(replySort, nextReplyOffset)}
                    />
                  )}
                </div>
              )}
            </section>

            <MoreFromBoard topic={{ ...topic, categorySlug: board.slug }} className="lg:hidden" />
          </div>

          <div className="hidden lg:block lg:col-span-4 lg:self-stretch">
            <ForumThreadRail
              topic={topic}
              posts={posts as ForumPostEntry[]}
              canReply={canReply}
              onReply={() => topComposerRef.current?.open()}
              onVote={handleTopicVote}
            />
          </div>
        </div>
      </div>
    </ForumShell>
  )
}
