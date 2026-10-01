import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
  }),
}))

vi.mock('@/components/admin/AdminAccessGuard', () => ({
  AdminAccessGuard: () => <div data-testid="admin-access-guard" />,
}))

import { Route } from './watch'

describe('Covenant Watch route', () => {
  it('gates the steward ledger behind the admin access guard', () => {
    const Page = Route.options.component!
    render(<Page />)
    expect(screen.getByTestId('admin-access-guard')).toBeInTheDocument()
  })
})
