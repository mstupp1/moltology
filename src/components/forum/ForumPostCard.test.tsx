import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ForumPostCard } from './ForumPostCard'

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

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
  },
}))

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
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
      />
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
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
      />
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
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
      />
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
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
      />
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
        onCancelReply={vi.fn()}
        onPosted={vi.fn()}
        onPostVote={vi.fn(() => vi.fn())}
      />
    )

    fireEvent.click(screen.getByTestId('forum-reply-to-comment'))
    expect(onReplyClick).toHaveBeenCalledWith('post-101')
  })
})
