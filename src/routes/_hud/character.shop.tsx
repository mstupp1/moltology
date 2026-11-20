import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudSectionGhost } from '@/components/hud/HudGhostSkeletons'
import { loadShopPage } from '@/components/hud/chassis/character-pages'
import { SITE_ORIGIN, seo } from '@/lib/seo'

const LazyMarketShopPage = lazy(() =>
  loadShopPage().then((m) => ({ default: m.MarketShopPage }))
)

const CANONICAL = `${SITE_ORIGIN}/character/shop`

function CharacterShopRoute() {
  return (
    <div>
      <Suspense fallback={<HudSectionGhost />}>
        <LazyMarketShopPage />
      </Suspense>
    </div>
  )
}

// The gear shop, formerly /market. vercel.json sends /market here with a 301.
export const Route = createFileRoute('/_hud/character/shop')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Shop | Moltology',
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
  pendingComponent: HudSectionGhost,
})
