import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ForumFlagControl } from './ForumFlagControl'
import { createForumReportFn } from '@/lib/server/api'
import { FORUM_REPORT_COPY } from '@/lib/forum-reports'

const forumAuth = {
  isAuthenticated: true,
  isPending: false,
  userId: 'viewer-1' as string | null,
  openAuth: vi.fn(),
}

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), hud: vi.fn() }

vi.mock('@/components/forum/ForumShell', () => ({
  useForumAuth: () => forumAuth,
}))

vi.mock('@/lib/server/api', () => ({
  createForumReportFn: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/hooks/useHudPersist', () => ({
  useHudPersist: () => ({ begin: vi.fn(), end: vi.fn() }),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  useOptionalToast: () => ({ toast }),
}))

describe('ForumFlagControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    forumAuth.userId = 'viewer-1'
    forumAuth.isAuthenticated = true
  })

  it('hides the flag on own posts, withdrawn posts, and guests', () => {
    const { rerender } = render(
      <ForumFlagControl topicId="topic-1" postId="post-1" authorId="viewer-1" />,
    )
    expect(screen.queryByTestId('forum-flag')).not.toBeInTheDocument()

    rerender(<ForumFlagControl topicId="topic-1" authorId="author-1" withdrawn />)
    expect(screen.queryByTestId('forum-flag')).not.toBeInTheDocument()

    forumAuth.userId = null
    rerender(<ForumFlagControl topicId="topic-1" authorId="author-1" />)
    expect(screen.queryByTestId('forum-flag')).not.toBeInTheDocument()
  })

  it('submits a preset reason and shows a calm confirmation', async () => {
    vi.mocked(createForumReportFn).mockResolvedValue({
      id: 'report-1',
      topicId: 'topic-1',
      postId: 'post-1',
      reason: 'surface_noise',
      note: null,
      status: 'open',
      createdAt: '2026-09-06T04:00:00.000Z',
      alreadyReported: false,
    })

    render(<ForumFlagControl topicId="topic-1" postId="post-1" authorId="author-1" />)

    fireEvent.click(screen.getByTestId('forum-flag'))
    expect(screen.getByTestId('forum-flag-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/Surface noise/i))
    fireEvent.click(screen.getByTestId('forum-flag-submit'))

    await waitFor(() => {
      expect(createForumReportFn).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topicId: 'topic-1',
          postId: 'post-1',
          reason: 'surface_noise',
          token: 'a.b.c',
        }),
      })
    })
    expect(toast.success).toHaveBeenCalledWith(FORUM_REPORT_COPY.toastReceived)
    expect(screen.queryByTestId('forum-flag-dialog')).not.toBeInTheDocument()
  })

  it('confirms quietly when the reporter already has an open flag', async () => {
    vi.mocked(createForumReportFn).mockResolvedValue({
      id: 'report-1',
      topicId: 'topic-1',
      postId: null,
      reason: 'other',
      note: null,
      status: 'open',
      createdAt: '2026-09-06T04:00:00.000Z',
      alreadyReported: true,
    })

    render(<ForumFlagControl topicId="topic-1" authorId="author-1" />)
    fireEvent.click(screen.getByTestId('forum-flag'))
    fireEvent.click(screen.getByLabelText(/Something else/i))
    fireEvent.click(screen.getByTestId('forum-flag-submit'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(FORUM_REPORT_COPY.toastAlready)
    })
  })
})
