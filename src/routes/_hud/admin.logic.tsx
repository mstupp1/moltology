import React, { Suspense, lazy } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { HudSectionGhost } from '@/components/hud/HudGhostSkeletons'
import { parseLogicAtlasSearch, type LogicAtlasSearch } from '@/lib/logic-atlas/search'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyLogicAtlasPage = lazy(() =>
  import('@/components/admin/logic-atlas/LogicAtlasPage').then((m) => ({ default: m.LogicAtlasPage })),
)

function LogicAtlasRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()

  return (
    // The /admin layout route checks access and draws the band.
    <Suspense fallback={<HudSectionGhost />}>
      <LazyLogicAtlasPage
        search={search}
        onSearchChange={(next: LogicAtlasSearch) =>
          navigate({ to: '/admin/logic', search: next, replace: true })
        }
      />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/admin/logic')({
  validateSearch: (search: Record<string, unknown>): LogicAtlasSearch => parseLogicAtlasSearch(search),
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Logic Atlas | Moltology',
        description: 'Staff map of business rules, code anchors, and past decisions.',
      }),
    ],
  }),
  component: LogicAtlasRoute,
  pendingComponent: HudSectionGhost,
})
