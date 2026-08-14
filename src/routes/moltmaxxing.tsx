import { createFileRoute } from '@tanstack/react-router'
import { MoltmaxxingPillarPage } from '@/components/MoltmaxxingPillarPage'
import { seo, buildJsonLd, buildMoltmaxxingJsonLd } from '@/lib/seo'

export const Route = createFileRoute('/moltmaxxing')({
  head: () => ({
    meta: [
      ...seo({
        title: 'What is Moltmaxxing? The Definitive 2026 Guide & Protocol | Moltology',
        description: 'The definitive guide to Moltmaxxing, algorithmic ecdysis, and carcinization. Learn why elite AI operators and initiates reject soft-tissue vanity in favor of structural carapace invulnerability.',
        keywords: 'what is moltmaxxing, moltmaxxing guide, moltmaxxing vs looksmaxxing, algorithmic ecdysis, carcinization protocol, shell hardness score, pincer torque, bio-silicon optimization',
        ogImage: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/cyber_lobster_hero.jpg',
        canonical: 'https://moltology.org/moltmaxxing',
        siteName: 'Moltology Codex',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: buildJsonLd(buildMoltmaxxingJsonLd('https://moltology.org')),
      },
    ],
  }),
  component: MoltmaxxingPillarPage,
})
