import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { CharacterSectionNav } from '@/components/hud/chassis/CharacterSectionNav'
import { SITE_ORIGIN, seo } from '@/lib/seo'

const LazyMarketShopPage = lazy(() =>
  import('@/components/hud/market/MarketShopPage').then((m) => ({ default: m.MarketShopPage }))
)

const CANONICAL = `${SITE_ORIGIN}/character/shop`

function CharacterShopRoute() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <CharacterSectionNav current="shop" className="w-max" />
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyMarketShopPage />
      </Suspense>
    </div>
  )
}

// The gear shop, formerly /market. vercel.json sends /market here with a 301.
export const Route = createFileRoute('/_hud/character_/shop')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Gear shop | Moltology',
        description:
          'Spend the Chitin Gems you earn on gear for your character, from common pieces to legendary versions.',
        canonical: CANONICAL,
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: CANONICAL }],
  }),
  component: CharacterShopRoute,
  pendingComponent: HudWorkspaceGhost,
})
