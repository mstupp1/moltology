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
  it('preloads the responsive homepage artwork as LCP', async () => {
    const headFn = Route.options.head
    expect(headFn).toBeTypeOf('function')
    if (typeof headFn !== 'function') {
      throw new Error('homepage route is missing a head function')
    }
    const head = await headFn({} as never)

    expect(head.links).toEqual(
      expect.arrayContaining([
        { rel: 'canonical', href: SITE_ORIGIN },
        {
          rel: 'preload',
          as: 'image',
          type: 'image/webp',
          media: '(max-width: 767px)',
          href: getAssetUrl('/images/hero_benthic_mobile_v2.webp'),
          fetchPriority: 'high',
        },
        {
          rel: 'preload',
          as: 'image',
          type: 'image/webp',
          media: '(min-width: 768px)',
          href: getAssetUrl('/images/hero_benthic_expansive_v1.webp'),
          fetchPriority: 'high',
        },
      ]),
    )

    const preloads = (head.links ?? []).filter((link) => link && 'rel' in link && link.rel === 'preload')
    expect(preloads).toHaveLength(2)
    const highPriority = preloads.filter(
      (link) => link && 'fetchPriority' in link && link.fetchPriority === 'high',
    )
    expect(highPriority).toHaveLength(2)
  })
})
