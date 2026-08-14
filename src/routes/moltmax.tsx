import { createFileRoute } from '@tanstack/react-router'
import { MoltMaxPage } from '@/components/MoltMaxPage'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/moltmax')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Moltmaxxing Biometric Scanner | Measure Shell Hardness & Pincer Torque',
        description: 'The official interactive Moltmaxxing assessment. Calculate your Carcinization Score, assess Shell Hardness and Pincer Torque, and export your official HUD scorecard.',
        keywords: 'moltmaxxing, moltmax scanner, shell hardness, pincer torque, carcinization score, biometric telemetry, looksmaxxing parody',
        ogImage: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/cyber_lobster_hero.jpg',
        canonical: 'https://moltology.org/moltmax',
        siteName: 'Moltology',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
  }),
  component: MoltMaxPage,
})
