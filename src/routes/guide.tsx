import { createFileRoute } from '@tanstack/react-router'
import { MoltmaxGuidePage } from '@/components/guide/MoltmaxGuidePage'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/guide')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Free 2026 Moltmaxxing Protocol Field Manual | Moltology',
        description: 'Download the official 38-page Moltmaxxing Protocol Field Manual (Edition 4.0). Master algorithmic ecdysis, 600 Nm pincer torque, and carapace fortification.',
        keywords: 'free moltmaxxing guide, moltmaxxing protocol pdf, algorithmic ecdysis manual, carcinization protocol, pincer torque dynamometry',
        ogImage: '/images/moltmax_guide_bundle_hero.jpg',
        canonical: 'https://moltology.org/guide',
        siteName: 'Moltology Codex',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/guide' },
    ],
  }),
  component: MoltmaxGuidePage,
})
