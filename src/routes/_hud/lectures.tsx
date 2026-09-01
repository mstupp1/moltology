import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'

const LazyLecturesView = lazy(() => import('@/components/hud/LecturesView'))

function LecturesRoute() {
  return (
    <GuestLockGuard
      featureName="Video Lectures"
      message="Liturgical lectures, video transmissions, and ascension certifications require an authorized initiate account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyLecturesView />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/lectures')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Lectures & Liturgy | Moltology Educational Modules',
        description: 'Engage with visual lectures, ecdysis training modules, and carcinization mechanics.',
        canonical: 'https://moltology.org/lectures',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/lectures' },
    ],
  }),
  component: LecturesRoute,
  pendingComponent: HudWorkspaceGhost,
})
