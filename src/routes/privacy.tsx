import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPolicyPage } from '@/components/PrivacyPolicyPage'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Privacy Policy | Moltology Benthic Protocol',
        description: 'Benthic data governance, telemetry privacy, and zero-leakage chitinous encryption standards.',
        canonical: 'https://moltology.org/privacy',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/privacy' },
    ],
  }),
  component: PrivacyPolicyPage,
})
