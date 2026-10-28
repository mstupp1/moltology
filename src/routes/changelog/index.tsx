import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getPublicChangelogsFn } from '@/lib/server/api'
import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'
import type { ChangelogEntry } from '@/lib/changelogs-data'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyChangelogIndexPage = lazy(() =>
  import('@/components/changelog/ChangelogIndexPage').then((m) => ({ default: m.ChangelogIndexPage }))
)

function ChangelogIndexRoute() {
  return (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyChangelogIndexPage />
    </Suspense>
  )
}

export const Route = createFileRoute('/changelog/')({
  loader: async () => {
    try {
      const logs = await getPublicChangelogsFn()
      if (logs && logs.length > 0) return logs as ChangelogEntry[]
    } catch (e) {
      console.warn('Loader error fetching changelogs:', e)
    }
    return INITIAL_CHANGELOGS
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Change log | Moltology',
        description: 'New features, improvements, and fixes to make your day in Moltology easier.',
        keywords: 'Moltology change log, new features, improvements, fixes',
        ogImage: getAssetUrl('/images/ai_learning_ascension_cover.jpg'),
        canonical: 'https://moltology.org/changelog',
        siteName: 'Moltology Changelog',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/changelog' },
    ],
  }),
  component: ChangelogIndexRoute,
})
