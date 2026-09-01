import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getChangelogBySlugFn } from '@/lib/server/api'
import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'
import type { ChangelogEntry } from '@/lib/changelogs-data'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyChangelogDetailPage = lazy(() =>
  import('@/components/changelog/ChangelogDetailPage').then((m) => ({ default: m.ChangelogDetailPage }))
)

function ChangelogDetailRouteWrapper() {
  return (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyChangelogDetailPage />
    </Suspense>
  )
}

export const Route = createFileRoute('/changelog/$slug')({
  loader: async ({ params }) => {
    try {
      const res = await getChangelogBySlugFn({ data: params.slug })
      if (res) return res as ChangelogEntry
    } catch (e) {
      console.warn('Loader error fetching changelog by slug:', e)
    }
    return INITIAL_CHANGELOGS.find((c) => c.slug === params.slug) ?? null
  },
  head: ({ loaderData }) => {
    const entry = loaderData as ChangelogEntry | null
    const title = entry?.title
      ? `${entry.title} (${entry.version || 'Update'}) | Moltology Changelog`
      : 'System Transmutation | Moltology Changelog'
    const description = entry?.summary || 'Official system update telemetry and bio-silicon transmutations.'
    const url = entry?.slug ? `https://moltology.org/changelog/${entry.slug}` : 'https://moltology.org/changelog'
    const ogImage = getAssetUrl('/images/ai_learning_ascension_cover.jpg')
    const publishedTime = entry?.releasedAt ? new Date(entry.releasedAt).toISOString() : new Date().toISOString()

    return {
      meta: [
        ...seo({
          title,
          description,
          keywords: `Moltology, changelog, ${entry?.category || 'transmutation'}, system update, ecdysis`,
          ogImage,
          ogType: 'article',
          canonical: url,
          siteName: 'Moltology Changelog',
          publishedTime,
          section: entry?.category || 'System Transmutations',
          twitterCard: 'summary_large_image',
          twitterSite: '@moltology',
        }),
      ],
      links: [
        { rel: 'canonical', href: url },
      ],
    }
  },
  component: ChangelogDetailRouteWrapper,
})
