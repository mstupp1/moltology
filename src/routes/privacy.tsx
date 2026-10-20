import { createFileRoute } from '@tanstack/react-router'
import { seo } from '@/lib/seo'
import { PrivacyPolicyPage } from '@/components/PrivacyPolicyPage'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Privacy Policy | Moltology',
        description: 'How Moltology collects, uses, stores, and shares personal information, including Google sign-in data, and how to request deletion.',
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
