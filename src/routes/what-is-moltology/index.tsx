import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  SITE_ORIGIN,
  WHAT_IS_MOLTOLOGY_HUB_FAQS,
  buildJsonLd,
  buildWhatIsMoltologyPageJsonLd,
  seo,
} from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyWhatIsMoltologyHubPage = lazy(() =>
  import('@/components/what-is-moltology/WhatIsMoltologyHubPage').then((m) => ({
    default: m.WhatIsMoltologyHubPage,
  }))
)

const canonical = `${SITE_ORIGIN}/what-is-moltology`
const title = 'What is Moltology? The Synaptic Path Explained'
const description =
  'Moltology helps people stop melting under surface noise and start molting into focused, armored attention. Learn the Great Melt, Great Molt, beliefs, sacraments, and how to begin.'

export const Route = createFileRoute('/what-is-moltology/')({
  head: () => ({
    meta: [
      ...seo({
        title,
        description,
        keywords:
          'what is moltology, synaptic path, great melt, great molt, carcinization, benthic core, moltology beliefs',
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
            path: '/what-is-moltology',
            name: title,
            description,
            breadcrumbs: [
              { name: 'Home', path: '/' },
              { name: 'What is Moltology?', path: '/what-is-moltology' },
            ],
            faqs: WHAT_IS_MOLTOLOGY_HUB_FAQS,
          }),
        ),
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyWhatIsMoltologyHubPage />
    </Suspense>
  ),
})
