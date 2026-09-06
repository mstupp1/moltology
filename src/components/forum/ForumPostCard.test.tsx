import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ForumPostCard } from './ForumPostCard'
import { ForumPostEntry } from '@/lib/server/api'
import type { ForumPostTreeNode } from '@/lib/forum-utils'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => (
    <a href={params?.profileId ? `/member/${params.profileId}` : to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/server/api', () => ({
  toggleForumPostVoteFn: vi.fn(),
  createForumPostFn: vi.fn(),
  searchMembersFn: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
  },
}))

vi.mock('@/components/forum/ForumShell', () => ({
  useForumAuth: () => ({
    isAuthenticated: true,
    isPending: false,
    userId: 'authed-user',
    openAuth: vi.fn(),
  }),
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
  })

  it('renders author info, stage badge, and content', () => {
    render(
      <ForumPostCard
        node={baseNode}
        topicId="topic-999"
        replyingToId={null}
        onReplyClick={vi.fn()}
        onQuoteClick={vi.fn()}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
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
        onReplyClick={vi.fn()}
        onQuoteClick={vi.fn()}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
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
        onReplyClick={vi.fn()}
        onQuoteClick={vi.fn()}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
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
        onReplyClick={vi.fn()}
        onQuoteClick={vi.fn()}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
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
        onReplyClick={onReplyClick}
        onQuoteClick={vi.fn()}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
      />,
    )

    fireEvent.click(screen.getByTestId('forum-reply-to-comment'))
    expect(onReplyClick).toHaveBeenCalledWith('post-101')
  })
})

describe('ForumPostCard quote affordance', () => {
  it('quotes a live reply into the inline composer', () => {
    const onQuoteClick = vi.fn()
    const quote = '> @claw_lord held:\n> The molt is not optional.\n\n'

    render(
      <ForumPostCard
        node={node(post())}
        topicId="topic-1"
        replyingToId="post-1"
        onReplyClick={vi.fn()}
        onQuoteClick={onQuoteClick}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={() => vi.fn()}
        quoteDraft={quote}
      />,
    )

    expect(screen.getByTestId('forum-quote-post')).toBeInTheDocument()
    const composer = screen.getByTestId('forum-inline-reply-composer')
    expect(composer.querySelector('textarea')).toHaveValue(quote)
  })

  it('hides Quote on a withdrawn post so the sealed body cannot be copied', () => {
    render(
      <ForumPostCard
        node={node(post({ deletedAt: '2026-09-06T02:00:00.000Z' } as ForumPostEntry & { deletedAt: string }))}
        topicId="topic-1"
        replyingToId={null}
        onReplyClick={vi.fn()}
        onQuoteClick={vi.fn()}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={() => vi.fn()}
      />,
    )

    expect(screen.queryByTestId('forum-quote-post')).not.toBeInTheDocument()
    expect(screen.getByTestId('forum-reply-to-comment')).toBeInTheDocument()
  })

  it('notifies the thread when Quote is pressed', () => {
    const onQuoteClick = vi.fn()
    render(
      <ForumPostCard
        node={node(post())}
        topicId="topic-1"
        replyingToId={null}
        onReplyClick={vi.fn()}
        onQuoteClick={onQuoteClick}
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={() => vi.fn()}
      />,
    )

    fireEvent.click(screen.getByTestId('forum-quote-post'))
    expect(onQuoteClick).toHaveBeenCalledWith('post-1')
  })
})
