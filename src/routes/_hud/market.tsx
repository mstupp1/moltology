import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { MarketShopPage } from '@/components/hud/market/MarketShopPage'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

function MarketRoute() {
  return <MarketShopPage />
}

export const Route = createFileRoute('/_hud/market')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Ascension Market | Molt Credits & Chitin Gem Vault',
        description:
          'Buy Molt Credits, exchange shed material, and unlock prestige cosmetics with earned Chitin Gems in the Benthic Market.',
        canonical: 'https://moltology.org/market',
        siteName: 'Moltology Market',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: 'https://moltology.org/market' }],
  }),
  component: MarketRoute,
  pendingComponent: HudWorkspaceGhost,
})
