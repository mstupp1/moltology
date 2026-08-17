import { createFileRoute } from '@tanstack/react-router'
import { TermsOfServicePage } from '@/components/TermsOfServicePage'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Terms of Engagement | Moltology Service Directives',
        description: 'Terms of engagement, covenant agreements, and protocols governing initiate access to the Moltology platform.',
        canonical: 'https://moltology.org/terms',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/terms' },
    ],
  }),
  component: TermsOfServicePage,
})
