import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminAccessGuard } from './AdminAccessGuard'
import { AdminOversightHub } from './AdminOversightHub'

const access = { canView: false, pending: false }
const session = { userId: 'staff-1' as string | null, isPending: false }

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock('@/hooks/useHiddenPageAccess', () => ({
  useHiddenPageAccess: () => access,
}))

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => session,
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('token'),
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  useOptionalToast: () => ({
    toast: { success: vi.fn(), error: vi.fn() },
  }),
}))

vi.mock('@/components/forum/CovenantWatchPage', () => ({
  CovenantWatchPage: () => <div data-testid="covenant-watch">Watch ledger</div>,
}))

vi.mock('@/lib/server/api', () => ({
  getAdminTelemetryFn: vi.fn().mockResolvedValue({
    pendingFlags: 2,
    activeSessions: 5,
    healthy: true,
  }),
  searchAdminMembersFn: vi.fn().mockResolvedValue({ viewerCanManageRoles: false, members: [] }),
  setAdminMemberRoleFn: vi.fn(),
  listAdminPurchasesFn: vi.fn().mockResolvedValue([]),
}))

describe('Admin access and oversight hub', () => {
  beforeEach(() => {
    access.canView = false
    access.pending = false
    session.userId = 'staff-1'
    session.isPending = false
  })

  it('shows an unavailable notice for non-admins and the hub for staff', async () => {
    const { rerender } = render(
      <AdminAccessGuard>
        <AdminOversightHub />
      </AdminAccessGuard>,
    )
    expect(screen.getByTestId('admin-unavailable')).toHaveTextContent('This page is not available')
    expect(screen.queryByTestId('admin-oversight-hub')).not.toBeInTheDocument()

    access.canView = true
    rerender(
      <AdminAccessGuard>
        <AdminOversightHub />
      </AdminAccessGuard>,
    )
    expect(screen.getByTestId('admin-oversight-hub')).toBeInTheDocument()
    expect(screen.getByTestId('covenant-watch')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Healthy')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('admin-tab-sectors'))
    expect(screen.getByTestId('admin-sectors')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Composite Studio/i })).toHaveAttribute('href', '/render/composite')
    expect(screen.getByRole('link', { name: /Logic Atlas/i })).toHaveAttribute('href', '/admin/logic')
    expect(screen.queryByTestId('covenant-watch')).not.toBeInTheDocument()
  })
})
