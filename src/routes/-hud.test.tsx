import { describe, it, expect, vi } from 'vitest'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
  }),
  redirect: vi.fn((args) => args),
}))

import { Route } from './hud'
import { redirect } from '@tanstack/react-router'

describe('/hud Route redirect', () => {
  it('redirects to /dashboard with search params and replace=true', () => {
    const beforeLoad = Route.options.beforeLoad as any

    expect(() => {
      beforeLoad({ search: { ref: 'welcome', tab: 'status' } })
    }).toThrow()

    expect(redirect).toHaveBeenCalledWith({
      to: '/dashboard',
      search: { ref: 'welcome', tab: 'status' },
      replace: true,
    })
  })
})
