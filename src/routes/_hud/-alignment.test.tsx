import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
  }),
  redirect: vi.fn((args) => args),
}))

import { Route } from './alignment'
import { redirect } from '@tanstack/react-router'
import { DAILY_ALIGNMENT_HUB_ID } from '@/lib/alignment-tasks'

describe('/alignment Route redirect', () => {
  it('redirects to the dashboard Daily Alignment surface with replace=true', () => {
    const beforeLoad = Route.options.beforeLoad as any

    expect(() => {
      beforeLoad()
    }).toThrow()

    expect(redirect).toHaveBeenCalledWith({
      to: '/dashboard',
      hash: DAILY_ALIGNMENT_HUB_ID,
      replace: true,
    })
  })
})
