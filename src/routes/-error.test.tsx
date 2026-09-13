import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
  }),
  redirect: vi.fn((args) => args),
}))

import { Route } from './error'
import { redirect } from '@tanstack/react-router'

describe('OAuth error redirect (/error)', () => {
  it('sends Better Auth callback failures to /auth with the error code', () => {
    const beforeLoad = Route.options.beforeLoad as (args: { search: { error?: string } }) => void

    expect(() => {
      beforeLoad({ search: { error: 'account_not_linked' } })
    }).toThrow()

    expect(redirect).toHaveBeenCalledWith({
      to: '/auth',
      search: { error: 'account_not_linked' },
      replace: true,
    })
  })
})
