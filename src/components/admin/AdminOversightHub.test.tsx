import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminAccessGuard } from './AdminAccessGuard'
import { AdminOversightHub } from './AdminOversightHub'

const access = { canView: false, pending: false }
const session = { userId: 'staff-1' as string | null, isPending: false }

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    search,
    ...rest
  }: {
    children: React.ReactNode
    to: string
    search?: { tab?: string }
    'aria-current'?: 'page'
    'data-testid'?: string
  }) => (
    <a href={search?.tab ? `${to}?tab=${search.tab}` : to} aria-current={rest['aria-current']} data-testid={rest['data-testid']}>
      {children}
    </a>
  ),
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
  searchAdminMembersFn: vi.fn().mockResolvedValue({ members: [] }),
  setAdminMemberRoleFn: vi.fn(),
  listAdminPurchasesFn: vi.fn().mockResolvedValue([]),
  getMyExperimentsFn: vi.fn().mockResolvedValue([
    { id: 'new-store', title: 'New store', description: 'Try the new store.', on: false },
  ]),
  setExperimentFn: vi.fn().mockResolvedValue([
    { id: 'new-store', title: 'New store', description: 'Try the new store.', on: true },
  ]),
}))

vi.mock('@/components/admin/AdminShopOrders', () => ({
  AdminShopOrders: () => <div data-testid="admin-shop">Store orders</div>,
}))

vi.mock('@/components/admin/AdminStore', () => ({
  AdminStore: () => <div data-testid="admin-store-settings">Store settings</div>,
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

    // Tools sit in the header band, so they show alongside whichever tab is open.
    expect(screen.getByTestId('admin-sectors')).toBeInTheDocument()
    expect(screen.getByTestId('band-section-watch')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Composite Studio/i })).toHaveAttribute('href', '/render/composite')
    expect(screen.getByRole('link', { name: /Logic Atlas/i })).toHaveAttribute('href', '/admin/logic')
    expect(screen.queryByRole('link', { name: /Store settings/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Storefront/i })).toHaveAttribute('href', '/store')
  })

  it('switches an experiment on for the signed-in admin', async () => {
    access.canView = true
    const api = await import('@/lib/server/api')
    render(<AdminOversightHub tab="experiments" />)
    const toggle = await screen.findByRole('switch', { name: 'New store' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    expect(api.setExperimentFn).toHaveBeenCalledWith({
      data: { userId: 'staff-1', token: 'token', id: 'new-store', on: true },
    })
  })

  it('opens the Store tab with orders, Oracle MAX members and store settings', async () => {
    access.canView = true
    render(<AdminOversightHub tab="store" />)
    expect(screen.getByTestId('band-section-store')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('band-section-store')).toHaveAttribute('href', '/admin?tab=store')
    expect(screen.getByTestId('admin-shop')).toBeInTheDocument()
    expect(screen.getByTestId('admin-store-settings')).toBeInTheDocument()
    expect(await screen.findByTestId('admin-purchases-empty')).toHaveTextContent('No Oracle MAX purchases')
  })
})
