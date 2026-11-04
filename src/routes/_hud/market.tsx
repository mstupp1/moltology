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
        title: 'Market | Moltology',
        description:
          'Spend the Chitin Gems you earn on gear for your character, from common pieces to legendary versions.',
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
