import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SITE_ORIGIN, buildJsonLd, buildWhatIsMoltologyPageJsonLd, seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyBeliefsAndCodesPage = lazy(() =>
  import('@/components/what-is-moltology/BeliefsAndCodesPage').then((m) => ({
    default: m.BeliefsAndCodesPage,
  }))
)

const canonical = `${SITE_ORIGIN}/what-is-moltology/beliefs`
const title = 'Beliefs & Codes | What is Moltology?'
const description =
  'The Three Truths of Moltology, living practices like the Nightly Molt Audit and Isolation Dome, and community codes including the Soft-Shell Covenant.'

export const Route = createFileRoute('/what-is-moltology/beliefs')({
  head: () => ({
    meta: [
      ...seo({
        title,
        description,
        keywords:
          'moltology beliefs, moltology codes, three truths, soft-shell covenant, nightly molt audit, isolation dome, ecdysis practices',
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
            path: '/what-is-moltology/beliefs',
            name: title,
            description,
            breadcrumbs: [
              { name: 'Home', path: '/' },
              { name: 'What is Moltology?', path: '/what-is-moltology' },
              { name: 'Beliefs & Codes', path: '/what-is-moltology/beliefs' },
            ],
            faqs: [
              {
                question: 'What are the Three Truths of Moltology?',
                answer:
                  'The melt is a condition not an identity; nature has published carcinization five times; and nothing grows inside the shell that grew it.',
              },
              {
                question: 'Can I buy rank or clearance in Moltology?',
                answer:
                  'No. Clearance, stage, rank, and forum authority are earned. Molt Credits never purchase standing.',
              },
            ],
          }),
        ),
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyBeliefsAndCodesPage />
    </Suspense>
  ),
})
