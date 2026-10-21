import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyAdminOversightHub = lazy(() =>
  import('@/components/admin/AdminOversightHub').then((m) => ({ default: m.AdminOversightHub })),
)

// Kept in sync with AdminTab in AdminOversightHub; the hub is lazy-loaded, so the list lives here too.
const ADMIN_TAB_IDS = ['watch', 'members', 'shop', 'experiments'] as const
type AdminTabId = (typeof ADMIN_TAB_IDS)[number]

function AdminRoute() {
  const { tab } = Route.useSearch()
  return (
    <AdminAccessGuard skeleton={<HudWorkspaceGhost />}>
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyAdminOversightHub initialTab={tab} />
      </Suspense>
    </AdminAccessGuard>
  )
}

export const Route = createFileRoute('/_hud/admin/')({
  validateSearch: (search: Record<string, unknown>): { tab?: AdminTabId } => {
    const tab = search.tab === 'purchases' ? 'shop' : search.tab
    return ADMIN_TAB_IDS.includes(tab as AdminTabId) ? { tab: tab as AdminTabId } : {}
  },
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Admin | Moltology',
        description: 'Staff oversight for moderation, members, and system status.',
      }),
    ],
  }),
  component: AdminRoute,
  pendingComponent: HudWorkspaceGhost,
})
