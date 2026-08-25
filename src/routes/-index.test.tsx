import { describe, it, expect, vi } from 'vitest'
import { getAssetUrl } from '@/lib/assets'
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
  it('preloads only the widescreen LCP still', () => {
    const headFn = Route.options.head
    expect(headFn).toBeTypeOf('function')
    const head = headFn({} as never)

    expect(head.links).toEqual(
      expect.arrayContaining([
        { rel: 'canonical', href: SITE_ORIGIN },
        { rel: 'preload', as: 'image', href: getAssetUrl('/images/hero_widescreen_bg.jpg') },
      ]),
    )

    const preloads = (head.links ?? []).filter((link: { rel?: string }) => link.rel === 'preload')
    expect(preloads).toHaveLength(1)
  })
})
