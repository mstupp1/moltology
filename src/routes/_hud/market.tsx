import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

const LazyMarketShopPage = lazy(() =>
  import('@/components/hud/market/MarketShopPage').then((m) => ({ default: m.MarketShopPage }))
)

function MarketRoute() {
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyMarketShopPage />
    </Suspense>
  )
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
