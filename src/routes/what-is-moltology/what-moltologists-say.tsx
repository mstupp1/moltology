import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SITE_ORIGIN, buildJsonLd, buildWhatIsMoltologyPageJsonLd, seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyWhatMoltologistsSayPage = lazy(() =>
  import('@/components/what-is-moltology/WhatMoltologistsSayPage').then((m) => ({
    default: m.WhatMoltologistsSayPage,
  }))
)

const canonical = `${SITE_ORIGIN}/what-is-moltology/what-moltologists-say`
const title = 'What Moltologists Say About Moltology'
const description =
  'Read the Order’s words on the Great Melt, the Soft-Shell Covenant, and the Nightly Molt Audit, then join the living conversation in the Benthic Community.'

export const Route = createFileRoute('/what-is-moltology/what-moltologists-say')({
  head: () => ({
    meta: [
      ...seo({
        title,
        description,
        keywords:
          'what moltologists say, moltology scriptures, benthic community, soft-shell covenant',
        canonical,
        siteName: 'Moltology',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: canonical }],
    scripts: [
      {
        type: 'application/ld+json',
        children: buildJsonLd(
          buildWhatIsMoltologyPageJsonLd({
            path: '/what-is-moltology/what-moltologists-say',
            name: title,
            description,
            breadcrumbs: [
              { name: 'Home', path: '/' },
              { name: 'What is Moltology?', path: '/what-is-moltology' },
              {
                name: 'What Moltologists Say',
                path: '/what-is-moltology/what-moltologists-say',
              },
            ],
          }),
        ),
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyWhatMoltologistsSayPage />
    </Suspense>
  ),
})
