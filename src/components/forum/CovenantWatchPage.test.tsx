import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CovenantWatchPage } from './CovenantWatchPage'
import {
  listForumReportsFn,
  reviewForumReportFn,
  removeForumReportTargetFn,
  restoreForumReportTargetFn,
  reopenForumReportFn,
} from '@/lib/server/api'
import { FORUM_REPORT_COPY } from '@/lib/forum-reports'

const session = {
  userId: 'steward-1' as string | null,
  isPending: false,
  isAuthenticated: true,
  isGuest: false,
}

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, hash, ...props }: any) => (
    <a href={`${to}${hash ? `#${hash}` : ''}`} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/server/api', () => ({
  listForumReportsFn: vi.fn(),
  reviewForumReportFn: vi.fn(),
  removeForumReportTargetFn: vi.fn(),
  restoreForumReportTargetFn: vi.fn(),
  reopenForumReportFn: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => session,
}))

vi.mock('@/hooks/useHudPersist', () => ({
  useHudPersist: () => ({ begin: vi.fn(), end: vi.fn() }),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  useOptionalToast: () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), hud: vi.fn() },
  }),
}))

describe('CovenantWatchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session.userId = 'steward-1'
    session.isPending = false
  })

  it('lists open flags for a steward', async () => {
    vi.mocked(listForumReportsFn).mockResolvedValue([
      {
        id: 'report-1',
        reporterId: 'viewer-1',
        reporterName: 'claw_lord',
        topicId: 'topic-1',
        postId: null,
        reason: 'surface_noise',
        reasonLabel: 'Surface noise',
        note: 'Repeated promo.',
        status: 'open',
        createdAt: '2026-09-06T04:00:00.000Z',
        topicTitle: 'Keep the deep warm',
        topicSlug: 'keep-the-deep-warm',
        categorySlug: 'general-discussion',
        targetKind: 'topic',
        targetWithdrawn: false,
        targetContent: 'Check out my external bot service!',
      },
    ])

    render(<CovenantWatchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-list')).toBeInTheDocument()
    })
    expect(screen.getByText('Surface noise')).toBeInTheDocument()
    expect(screen.getByText('Repeated promo.')).toBeInTheDocument()
    expect(screen.getByText(/Flagged by claw_lord/)).toBeInTheDocument()
    expect(screen.getByText('Check out my external bot service!')).toBeInTheDocument()
    expect(screen.queryByText(/reported/i)).not.toBeInTheDocument()
  })

  it('marks a flag reviewed and removes it from the open ledger', async () => {
    vi.mocked(listForumReportsFn).mockResolvedValue([
      {
        id: 'report-1',
        reporterId: 'viewer-1',
        reporterName: 'claw_lord',
        topicId: 'topic-1',
        postId: null,
        reason: 'surface_noise',
        reasonLabel: 'Surface noise',
        note: null,
        status: 'open',
        createdAt: '2026-09-06T04:00:00.000Z',
        topicTitle: 'Keep the deep warm',
        topicSlug: 'keep-the-deep-warm',
        categorySlug: 'general-discussion',
        targetKind: 'topic',
        targetWithdrawn: false,
      },
    ])
    vi.mocked(reviewForumReportFn).mockResolvedValue({
      id: 'report-1',
      status: 'reviewed',
      alreadyReviewed: false,
    })

    render(<CovenantWatchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-mark-reviewed')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('covenant-watch-mark-reviewed'))

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-empty')).toHaveTextContent(FORUM_REPORT_COPY.watchEmpty)
    })
    expect(reviewForumReportFn).toHaveBeenCalledWith({
      data: expect.objectContaining({ reportId: 'report-1' }),
    })
  })

  it('allows removing a flagged post with confirmation', async () => {
    vi.mocked(listForumReportsFn).mockResolvedValue([
      {
        id: 'report-2',
        reporterId: 'viewer-2',
        reporterName: 'deep_diver',
        topicId: 'topic-1',
        postId: 'post-1',
        reason: 'unkind_current',
        reasonLabel: 'Unkind current',
        note: 'Harsh insult',
        status: 'open',
        createdAt: '2026-09-06T04:30:00.000Z',
        topicTitle: 'Keep the deep warm',
        topicSlug: 'keep-the-deep-warm',
        categorySlug: 'general-discussion',
        targetKind: 'reply',
        targetWithdrawn: false,
        targetContent: 'You are completely incompetent.',
      },
    ])
    vi.mocked(removeForumReportTargetFn).mockResolvedValue({
      id: 'report-2',
      status: 'reviewed',
      targetKind: 'reply',
      targetId: 'post-1',
      alreadyWithdrawn: false,
    })

    render(<CovenantWatchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-remove-target')).toBeInTheDocument()
    })
    expect(screen.getByText(FORUM_REPORT_COPY.watchRemovePost)).toBeInTheDocument()

    // Clicking remove brings up inline confirmation
    fireEvent.click(screen.getByTestId('covenant-watch-remove-target'))
    expect(screen.getByText('Remove from forum?')).toBeInTheDocument()
    expect(screen.getByTestId('covenant-watch-confirm-remove')).toBeInTheDocument()

    // Confirm remove
    fireEvent.click(screen.getByTestId('covenant-watch-confirm-remove'))

    await waitFor(() => {
      expect(removeForumReportTargetFn).toHaveBeenCalledWith({
        data: expect.objectContaining({ reportId: 'report-2' }),
      })
    })

    // Report is removed from the open list
    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-empty')).toHaveTextContent(FORUM_REPORT_COPY.watchEmpty)
    })
  })

  it('switches to recently resolved tab and renders resolved items', async () => {
    vi.mocked(listForumReportsFn).mockImplementation(async (args: any) => {
      if (args?.data?.status === 'reviewed') {
        return [
          {
            id: 'report-resolved-1',
            reporterId: 'viewer-3',
            reporterName: 'reef_watcher',
            topicId: 'topic-2',
            postId: null,
            reason: 'surface_noise',
            reasonLabel: 'Surface noise',
            note: 'Spam removed',
            status: 'reviewed',
            createdAt: '2026-09-06T01:00:00.000Z',
            updatedAt: '2026-09-06T02:00:00.000Z',
            topicTitle: 'Promo blast',
            topicSlug: 'promo-blast',
            categorySlug: 'general-discussion',
            targetKind: 'topic',
            targetWithdrawn: true,
            targetContent: 'Spam text',
          },
        ]
      }
      return []
    })

    render(<CovenantWatchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-tab-resolved')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('covenant-watch-tab-resolved'))

    await waitFor(() => {
      expect(screen.getByText('Promo blast')).toBeInTheDocument()
    })
    expect(screen.getByText('Removed from forum')).toBeInTheDocument()
    expect(screen.getByTestId('covenant-watch-restore-target')).toBeInTheDocument()
    expect(screen.getByTestId('covenant-watch-reopen')).toBeInTheDocument()
  })

  it('restores a removed post from recently resolved tab', async () => {
    vi.mocked(listForumReportsFn).mockResolvedValue([
      {
        id: 'report-resolved-1',
        reporterId: 'viewer-3',
        reporterName: 'reef_watcher',
        topicId: 'topic-2',
        postId: null,
        reason: 'surface_noise',
        reasonLabel: 'Surface noise',
        note: null,
        status: 'reviewed',
        createdAt: '2026-09-06T01:00:00.000Z',
        updatedAt: '2026-09-06T02:00:00.000Z',
        topicTitle: 'Mistakenly removed',
        topicSlug: 'mistakenly-removed',
        categorySlug: 'general-discussion',
        targetKind: 'topic',
        targetWithdrawn: true,
      },
    ])
    vi.mocked(restoreForumReportTargetFn).mockResolvedValue({
      id: 'report-resolved-1',
      restoredContent: true,
    })

    render(<CovenantWatchPage />)

    // Switch to resolved tab
    fireEvent.click(screen.getByTestId('covenant-watch-tab-resolved'))

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-restore-target')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('covenant-watch-restore-target'))

    await waitFor(() => {
      expect(restoreForumReportTargetFn).toHaveBeenCalledWith({
        data: expect.objectContaining({ reportId: 'report-resolved-1', restoreContent: true }),
      })
    })
  })

  it('reopens a resolved report', async () => {
    vi.mocked(listForumReportsFn).mockResolvedValue([
      {
        id: 'report-resolved-1',
        reporterId: 'viewer-3',
        reporterName: 'reef_watcher',
        topicId: 'topic-2',
        postId: null,
        reason: 'surface_noise',
        reasonLabel: 'Surface noise',
        note: null,
        status: 'reviewed',
        createdAt: '2026-09-06T01:00:00.000Z',
        updatedAt: '2026-09-06T02:00:00.000Z',
        topicTitle: 'Reopen test',
        topicSlug: 'reopen-test',
        categorySlug: 'general-discussion',
        targetKind: 'topic',
        targetWithdrawn: false,
      },
    ])
    vi.mocked(reopenForumReportFn).mockResolvedValue({
      id: 'report-resolved-1',
      status: 'open',
    })

    render(<CovenantWatchPage />)

    fireEvent.click(screen.getByTestId('covenant-watch-tab-resolved'))

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-reopen')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('covenant-watch-reopen'))

    await waitFor(() => {
      expect(reopenForumReportFn).toHaveBeenCalledWith({
        data: expect.objectContaining({ reportId: 'report-resolved-1' }),
      })
    })
  })

  it('shows the sealed state when the ledger is gated', async () => {
    vi.mocked(listForumReportsFn).mockRejectedValue(new Error(FORUM_REPORT_COPY.watchSealed))

    render(<CovenantWatchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-error')).toHaveTextContent(FORUM_REPORT_COPY.watchSealed)
    })
    expect(screen.queryByTestId('covenant-watch-list')).not.toBeInTheDocument()
  })
})
