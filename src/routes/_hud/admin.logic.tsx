import React, { Suspense, lazy } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { parseLogicAtlasSearch, type LogicAtlasSearch } from '@/lib/logic-atlas/search'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyLogicAtlasPage = lazy(() =>
  import('@/components/admin/logic-atlas/LogicAtlasPage').then((m) => ({ default: m.LogicAtlasPage })),
)

function LogicAtlasRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()

  return (
    <AdminAccessGuard skeleton={<HudWorkspaceGhost />}>
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyLogicAtlasPage
          search={search}
          onSearchChange={(next: LogicAtlasSearch) =>
            navigate({ to: '/admin/logic', search: next, replace: true })
          }
        />
      </Suspense>
    </AdminAccessGuard>
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
  pendingComponent: HudWorkspaceGhost,
})
