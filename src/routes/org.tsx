import { createFileRoute } from '@tanstack/react-router'
import { OrgPage } from '@/components/OrgPage'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/org')({
  head: () => ({
    meta: [
      ...seo({
        title: 'The Organization | Moltology Hierarchy & Ascension Tiers',
        description: 'Explore the structural hierarchy, ecdysis chambers, and organizational doctrines of the Order of the Synaptic Path.',
        keywords: 'Moltology Organization, Ascension Tiers, Benthic Council, Ecdysis Chambers, Carcinization Hierarchy',
        canonical: 'https://moltology.org/org',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/org' },
    ],
  }),
  component: OrgPage,
})
