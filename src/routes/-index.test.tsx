import { describe, it, expect, vi } from 'vitest'
import { SITE_ORIGIN } from '@/lib/seo'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
  }),
}))

vi.mock('@/components/LandingPage', () => ({
  LandingPage: () => null,
}))

import { Route } from './index'

describe('Homepage route head', () => {
  it('keeps the canonical link without preloading retired hero artwork', async () => {
    const headFn = Route.options.head
    expect(headFn).toBeTypeOf('function')
    if (typeof headFn !== 'function') {
      throw new Error('homepage route is missing a head function')
    }
    const head = await headFn({} as never)

    expect(head.links).toEqual(expect.arrayContaining([{ rel: 'canonical', href: SITE_ORIGIN }]))
    const preloads = (head.links ?? []).filter((link) => link && 'rel' in link && link.rel === 'preload')
    expect(preloads).toHaveLength(0)
  })
})
