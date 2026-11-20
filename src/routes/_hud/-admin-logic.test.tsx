import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useSearch: () => ({}),
  }),
  redirect: (options: unknown) => ({ redirect: options }),
  useNavigate: () => vi.fn(),
  useSearch: () => 'logic',
  Outlet: () => null,
}))

vi.mock('@/components/admin/AdminAccessGuard', () => ({
  AdminAccessGuard: () => <div data-testid="admin-access-guard" />,
}))

import { Route as LegacyLogicRoute } from './admin.logic'
import { Route as AdminLayoutRoute } from './admin'
import { parseAdminSearch } from './admin.index'

describe('Logic Atlas tab', () => {
  it('gates every admin tab, the atlas included, behind the admin access guard', () => {
    // The /admin layout route checks access once for all of its tabs.
    const Layout = AdminLayoutRoute.options.component!
    render(<Layout />)
    expect(screen.getByTestId('admin-access-guard')).toBeInTheDocument()
  })

  it('keeps only valid atlas params, and only on the Logic Atlas tab', () => {
    expect(parseAdminSearch({ tab: 'logic', view: 'timeline', rule: 'signup.pipeline', extra: 'main', q: 'jev' })).toEqual({
      tab: 'logic',
      view: 'timeline',
      rule: 'signup.pipeline',
      q: 'jev',
    })
    expect(parseAdminSearch({ tab: 'logic', view: 'nope', rule: '<script>' })).toEqual({ tab: 'logic' })
    expect(parseAdminSearch({ tab: 'members', rule: 'signup.pipeline' })).toEqual({ tab: 'members' })
    expect(parseAdminSearch({ tab: 'shop' })).toEqual({ tab: 'store' })
  })

  it('sends old /admin/logic links to the tab, keeping their view and rule', () => {
    const beforeLoad = LegacyLogicRoute.options.beforeLoad as unknown as (ctx: { search: Record<string, unknown> }) => void
    let thrown: any
    try {
      beforeLoad({ search: { tab: 'timeline', decision: 'forum-write-hardening' } })
    } catch (error) {
      thrown = error
    }
    expect(thrown.redirect).toEqual({
      to: '/admin',
      search: { tab: 'logic', view: 'timeline', decision: 'forum-write-hardening' },
      replace: true,
    })
  })
})
