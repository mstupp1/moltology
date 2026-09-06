import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ForumPostCard } from './ForumPostCard'
import { ForumShell } from './ForumShell'
import { updateForumPostFn, deleteForumPostFn, type ForumPostEntry } from '@/lib/server/api'
import type { ForumPostTreeNode } from '@/lib/forum-utils'
import { FORUM_WITHDRAWN_BODY } from '@/lib/forum-utils'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => (
    <a href={params?.profileId ? `/member/${params.profileId}` : to} {...props}>
      {children}
    </a>
  ),
}))

const forumAuth = {
  isAuthenticated: true,
  isPending: false,
  userId: 'authed-user' as string | null,
  openAuth: vi.fn(),
}

vi.mock('@/components/forum/ForumShell', () => ({
  useForumAuth: () => forumAuth,
  ForumShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
  },
}))

vi.mock('@/lib/server/api', () => ({
  updateForumPostFn: vi.fn(),
  deleteForumPostFn: vi.fn(),
  createForumPostFn: vi.fn(),
  createForumReportFn: vi.fn(),
  toggleForumPostVoteFn: vi.fn(),
  toggleForumTopicVoteFn: vi.fn(),
  searchMembersFn: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

function post(overrides: Partial<ForumPostEntry> = {}): ForumPostEntry {
  return {
    id: 'post-1',
    topicId: 'topic-1',
    parentId: null,
    userId: 'member-a',
    authorName: 'claw_lord',
    authorHandle: 'claw_lord',
    authorAvatar: '/images/stage1_larva.png',
    authorStage: 2,
    content: 'The molt is not optional.',
    upvotes: 1,
    createdAt: '2026-08-01T12:00:00.000Z',
    ...overrides,
  }
}

function node(
  entry: ForumPostEntry,
  children: ForumPostTreeNode<ForumPostEntry>[] = [],
): ForumPostTreeNode<ForumPostEntry> {
  return { post: entry, depth: 0, children }
}

const cardHandlers = {
  onReplyClick: vi.fn(),
  onQuoteClick: vi.fn(),
  onCancelReply: vi.fn(),
  onPosted: vi.fn(),
  onPostVote: vi.fn(() => vi.fn()),
  onUpdated: vi.fn(),
}

describe('ForumPostCard', () => {
  const mockPost = {
    id: 'post-101',
    topicId: 'topic-999',
    parentId: null,
    userId: 'user-author-1',
    authorName: 'CLAW_MASTER',
    authorHandle: 'claw_master',
    authorAvatar: '/images/stage1_larva.png',
    authorStage: 3,
    content: 'This is a test comment from the claw master.',
    upvotes: 5,
    createdAt: '2026-08-01T12:00:00.000Z',
    voted: false,
  }

  const baseNode = {
    post: mockPost,
    depth: 0,
    children: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    forumAuth.userId = 'authed-user'
    forumAuth.isAuthenticated = true
    forumAuth.isPending = false
  })

  it('renders author info, stage badge, and content', () => {
    render(
      <ForumPostCard
        node={baseNode}
        topicId="topic-999"
        replyingToId={null}
        {...cardHandlers}
      />,
    )

    expect(screen.getByText('CLAW_MASTER')).toBeInTheDocument()
    expect(screen.getByText('@claw_master')).toBeInTheDocument()
    expect(screen.getByText('STAGE 3')).toBeInTheDocument()
    expect(screen.getByText('This is a test comment from the claw master.')).toBeInTheDocument()
    expect(screen.getByTestId('forum-post-card')).toHaveAttribute('id', 'post-post-101')
  })

  it('displays OP badge when post author matches topic author', () => {
    render(
      <ForumPostCard
        node={baseNode}
        topicId="topic-999"
        topicAuthorId="user-author-1"
        replyingToId={null}
        {...cardHandlers}
      />,
    )

    const opBadge = screen.getByTitle('Original Poster')
    expect(opBadge).toBeInTheDocument()
    expect(opBadge).toHaveTextContent('OP')
  })

  it('does not display OP badge when post author is different from topic author', () => {
    render(
      <ForumPostCard
        node={baseNode}
        topicId="topic-999"
        topicAuthorId="different-user-id"
        replyingToId={null}
        {...cardHandlers}
      />,
    )

    expect(screen.queryByTitle('Original Poster')).not.toBeInTheDocument()
  })

  it('copies permalink to clipboard when copy link button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(
      <ForumPostCard
        node={baseNode}
        topicId="topic-999"
        replyingToId={null}
        {...cardHandlers}
      />,
    )

    const copyBtn = screen.getByTitle('Copy link to post')
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(screen.getByTitle('Link copied!')).toBeInTheDocument()
    })
  })

  it('invokes onReplyClick when reply button is pressed', () => {
    const onReplyClick = vi.fn()
    render(
      <ForumPostCard
        node={baseNode}
        topicId="topic-999"
        replyingToId={null}
        {...cardHandlers}
        onReplyClick={onReplyClick}
      />,
    )

    fireEvent.click(screen.getByTestId('forum-reply-to-comment'))
    expect(onReplyClick).toHaveBeenCalledWith('post-101')
  })
})

describe('ForumPostCard quote affordance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    forumAuth.userId = 'authed-user'
    forumAuth.isAuthenticated = true
    forumAuth.isPending = false
  })

  it('quotes a live reply into the inline composer', () => {
    const onQuoteClick = vi.fn()
    const quote = '> @claw_lord held:\n> The molt is not optional.\n\n'

    render(
      <ForumPostCard
        node={node(post())}
        topicId="topic-1"
        replyingToId="post-1"
        {...cardHandlers}
        onQuoteClick={onQuoteClick}
        quoteDraft={quote}
      />,
    )

    expect(screen.getByTestId('forum-quote-post')).toBeInTheDocument()
    const composer = screen.getByTestId('forum-inline-reply-composer')
    expect(composer.querySelector('textarea')).toHaveValue(quote)
  })

  it('hides Quote and Reply on a withdrawn post so the sealed body cannot be copied', () => {
    render(
      <ForumPostCard
        node={node(post({ deletedAt: '2026-09-06T02:00:00.000Z' }))}
        topicId="topic-1"
        replyingToId={null}
        {...cardHandlers}
      />,
    )

    expect(screen.queryByTestId('forum-quote-post')).not.toBeInTheDocument()
    expect(screen.queryByTestId('forum-reply-to-comment')).not.toBeInTheDocument()
    expect(screen.queryByTestId('forum-flag')).not.toBeInTheDocument()
    expect(screen.getByTestId('forum-withdrawn-body')).toBeInTheDocument()
  })

  it('shows Flag on another member reply and hides it on your own', () => {
    const { rerender } = render(
      <ForumPostCard
        node={node(post({ userId: 'member-a' }))}
        topicId="topic-1"
        replyingToId={null}
        {...cardHandlers}
      />,
    )
    fireEvent.pointerDown(screen.getByTestId('forum-post-actions-menu'))
    expect(screen.getByTestId('forum-flag')).toBeInTheDocument()

    forumAuth.userId = 'member-a'
    rerender(
      <ForumPostCard
        node={node(post({ userId: 'member-a' }))}
        topicId="topic-1"
        replyingToId={null}
        {...cardHandlers}
      />,
    )
    fireEvent.pointerDown(screen.getByTestId('forum-post-actions-menu'))
    expect(screen.queryByTestId('forum-flag')).not.toBeInTheDocument()
  })

  it('notifies the thread when Quote is pressed', () => {
    const onQuoteClick = vi.fn()
    render(
      <ForumPostCard
        node={node(post())}
        topicId="topic-1"
        replyingToId={null}
        {...cardHandlers}
        onQuoteClick={onQuoteClick}
      />,
    )

    fireEvent.click(screen.getByTestId('forum-quote-post'))
    expect(onQuoteClick).toHaveBeenCalledWith('post-1')
  })
})

const authorPost: ForumPostEntry = {
  id: 'post-1',
  topicId: 'topic-1',
  parentId: null,
  userId: 'author-1',
  authorName: 'claw_lord',
  authorHandle: 'claw_lord',
  authorAvatar: '/images/stage1_larva.png',
  authorStage: 1,
  content: 'Ask @pincer_prime before the next molt.',
  upvotes: 0,
  createdAt: '2026-09-06T01:00:00.000Z',
}

function renderCard(
  entry: ForumPostEntry,
  sessionUser: string | null,
  onUpdated = vi.fn(),
) {
  forumAuth.userId = sessionUser
  forumAuth.isAuthenticated = Boolean(sessionUser)

  return render(
    <ForumShell>
      <ForumPostCard
        node={node(entry)}
        topicId="topic-1"
        replyingToId={null}
        {...cardHandlers}
        onUpdated={onUpdated}
      />
    </ForumShell>,
  )
}

describe('ForumPostCard author tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    forumAuth.userId = 'authed-user'
    forumAuth.isAuthenticated = true
    forumAuth.isPending = false
  })

  it('shows revise and withdraw only for the signed-in author', () => {
    renderCard(authorPost, 'author-1')
    fireEvent.pointerDown(screen.getByTestId('forum-post-actions-menu'))
    expect(screen.getByTestId('forum-author-tools')).toBeInTheDocument()
    expect(screen.getByTestId('forum-revise')).toBeInTheDocument()
    expect(screen.getByTestId('forum-withdraw')).toBeInTheDocument()
    expect(screen.getByTestId('forum-mention-link')).toHaveTextContent('@pincer_prime')
  })

  it('hides author tools from other members', () => {
    renderCard(authorPost, 'someone-else')
    expect(screen.queryByTestId('forum-author-tools')).not.toBeInTheDocument()
    expect(screen.getByText(/Ask/)).toBeInTheDocument()
  })

  it('re-renders mention links after the author seals a revision', async () => {
    const onUpdated = vi.fn()
    vi.mocked(updateForumPostFn).mockResolvedValue({
      ...authorPost,
      content: 'Revised hail for @pincer_prime after the molt.',
      updatedAt: '2026-09-06T01:10:00.000Z',
    })

    const { rerender } = renderCard(authorPost, 'author-1', onUpdated)
    fireEvent.pointerDown(screen.getByTestId('forum-post-actions-menu'))
    fireEvent.click(screen.getByTestId('forum-revise'))
    fireEvent.change(screen.getByLabelText('Revise reply'), {
      target: { value: 'Revised hail for @pincer_prime after the molt.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /seal revision/i }))

    await waitFor(() => {
      expect(updateForumPostFn).toHaveBeenCalled()
    })
    expect(onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Revised hail for @pincer_prime after the molt.' }),
    )

    rerender(
      <ForumShell>
        <ForumPostCard
          node={node({
            ...authorPost,
            content: 'Revised hail for @pincer_prime after the molt.',
            updatedAt: '2026-09-06T01:10:00.000Z',
          })}
          topicId="topic-1"
          replyingToId={null}
          {...cardHandlers}
          onUpdated={onUpdated}
        />
      </ForumShell>,
    )

    expect(screen.getByTestId('forum-mention-link')).toHaveTextContent('@pincer_prime')
    expect(screen.getByText(/Revised hail/)).toBeInTheDocument()
    expect(screen.getByTestId('forum-revised-mark')).toBeInTheDocument()
  })

  it('shows the withdrawn tombstone instead of the body', () => {
    renderCard(
      {
        ...authorPost,
        content: '',
        deletedAt: '2026-09-06T02:00:00.000Z',
      },
      'author-1',
    )
    expect(screen.getByTestId('forum-withdrawn-body')).toHaveTextContent(FORUM_WITHDRAWN_BODY)
    expect(screen.queryByTestId('forum-mention-link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('forum-reply-to-comment')).not.toBeInTheDocument()
  })

  it('confirms withdraw before sealing the reply', async () => {
    const onUpdated = vi.fn()
    vi.mocked(deleteForumPostFn).mockResolvedValue({
      ...authorPost,
      content: '',
      deletedAt: '2026-09-06T02:00:00.000Z',
    })

    renderCard(authorPost, 'author-1', onUpdated)
    fireEvent.pointerDown(screen.getByTestId('forum-post-actions-menu'))
    fireEvent.click(screen.getByTestId('forum-withdraw'))
    expect(screen.getByTestId('forum-withdraw-confirm')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('forum-withdraw-confirm-btn'))

    await waitFor(() => {
      expect(deleteForumPostFn).toHaveBeenCalled()
    })
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: '2026-09-06T02:00:00.000Z' }))
  })
})
