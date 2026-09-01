import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { getPublicChangelogs } from '@/lib/changelogs'
import { seo } from '@/lib/seo'

const LazySupportPortalView = lazy(() => import('@/components/hud/SupportPortalView'))

function SupportPortalRoute() {
  const loaderData = Route.useLoaderData()
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazySupportPortalView loaderData={loaderData} />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/support')({
  loader: async () => {
    try {
      const data = await getPublicChangelogs()
      return { changelogs: Array.isArray(data) ? data : [] }
    } catch (err) {
      console.error('[Support Route Loader] Failed fetching changelogs:', err)
      return { changelogs: [] }
    }
  },
  component: SupportPortalRoute,
  pendingComponent: HudWorkspaceGhost,
  head: () => ({
    meta: seo({ title: 'Benthic Support Portal & System Changelog | Moltology' }),
  }),
})
