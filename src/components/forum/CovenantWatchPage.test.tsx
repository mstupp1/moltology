import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CovenantWatchPage } from './CovenantWatchPage'
import { listForumReportsFn, reviewForumReportFn } from '@/lib/server/api'
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
      },
    ])

    render(<CovenantWatchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-list')).toBeInTheDocument()
    })
    expect(screen.getByText('Surface noise')).toBeInTheDocument()
    expect(screen.getByText('Repeated promo.')).toBeInTheDocument()
    expect(screen.getByText(/Flagged by claw_lord/)).toBeInTheDocument()
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

  it('shows the sealed state when the ledger is gated', async () => {
    vi.mocked(listForumReportsFn).mockRejectedValue(new Error(FORUM_REPORT_COPY.watchSealed))

    render(<CovenantWatchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('covenant-watch-error')).toHaveTextContent(FORUM_REPORT_COPY.watchSealed)
    })
    expect(screen.queryByTestId('covenant-watch-list')).not.toBeInTheDocument()
  })
})
