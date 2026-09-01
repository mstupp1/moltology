import { createFileRoute } from '@tanstack/react-router'
import { MoltMaxPage } from '@/components/MoltMaxPage'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'

export const Route = createFileRoute('/moltmax')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Moltmax Clearance Audit | Measure the Shell, Meet the Depth',
        description: 'Complete the official 15-vector Moltmax clearance audit. Observe your shell hardness, pincer torque, neural flow, ecdysis discipline, and pressure tolerance.',
        keywords: 'moltmaxxing, moltmax audit, shell hardness, pincer torque, ecdysis, carcinization stage, benthic clearance',
        ogImage: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/cyber_lobster_hero.jpg',
        canonical: 'https://moltology.org/moltmax',
        siteName: 'Moltology',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/moltmax' },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        href: getAssetUrl('/images/hero_widescreen_bg.webp'),
        fetchPriority: 'high',
      },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(max-width: 767px)',
        href: getAssetUrl('/images/chitin_texture_bg_sm.webp'),
        fetchPriority: 'high',
      },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: getAssetUrl('/images/chitin_texture_bg.webp'),
        fetchPriority: 'high',
      },
    ],
  }),
  component: MoltMaxPage,
})
