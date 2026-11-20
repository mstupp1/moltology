import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useSearch: () => ({}),
  }),
  useNavigate: () => vi.fn(),
  useLocation: () => '/admin/logic',
  useSearch: () => undefined,
  Outlet: () => null,
}))

vi.mock('@/components/admin/AdminAccessGuard', () => ({
  AdminAccessGuard: () => <div data-testid="admin-access-guard" />,
}))

import { Route } from './admin.logic'
import { Route as AdminLayoutRoute } from './admin'

describe('Logic Atlas route', () => {
  it('gates every admin tab, the atlas included, behind the admin access guard', () => {
    // The /admin layout route checks access once for all of its tabs.
    const Layout = AdminLayoutRoute.options.component!
    render(<Layout />)
    expect(screen.getByTestId('admin-access-guard')).toBeInTheDocument()
  })

  it('keeps only valid search params', () => {
    const validate = Route.options.validateSearch as (search: Record<string, unknown>) => unknown
    expect(validate({ tab: 'timeline', rule: 'signup.pipeline', view: 'main', q: 'jev' })).toEqual({
      tab: 'timeline',
      rule: 'signup.pipeline',
      q: 'jev',
    })
    expect(validate({ tab: 'nope', rule: '<script>' })).toEqual({})
  })
})
