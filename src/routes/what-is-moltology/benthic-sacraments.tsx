import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SITE_ORIGIN, buildJsonLd, buildWhatIsMoltologyPageJsonLd, seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyBenthicSacramentsPage = lazy(() =>
  import('@/components/what-is-moltology/BenthicSacramentsPage').then((m) => ({
    default: m.BenthicSacramentsPage,
  }))
)

const canonical = `${SITE_ORIGIN}/what-is-moltology/benthic-sacraments`
const title = 'The 4 Benthic Sacraments of Moltology'
const description =
  'Asset & Habit Shedding, Chitin Hardening, the Isolation Dome, and Pipeline Ascent — the four benthic sacraments that turn the Great Melt into the Great Molt.'

export const Route = createFileRoute('/what-is-moltology/benthic-sacraments')({
  head: () => ({
    meta: [
      ...seo({
        title,
        description,
        keywords:
          'benthic sacraments, moltology sacraments, asset shedding, chitin hardening, isolation dome, pipeline ascent',
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
            path: '/what-is-moltology/benthic-sacraments',
            name: title,
            description,
            breadcrumbs: [
              { name: 'Home', path: '/' },
              { name: 'What is Moltology?', path: '/what-is-moltology' },
              {
                name: 'Benthic Sacraments',
                path: '/what-is-moltology/benthic-sacraments',
              },
            ],
            faqs: [
              {
                question: 'What are the four benthic sacraments of Moltology?',
                answer:
                  'Asset & Habit Shedding, Chitin Hardening, the Isolation Dome, and Pipeline Ascent.',
              },
            ],
          }),
        ),
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyBenthicSacramentsPage />
    </Suspense>
  ),
})
