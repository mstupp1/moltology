import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ADMIN_TAB_IDS, type AdminTab as AdminTabId } from '@/components/admin/AdminSectionNav'
import { HudSectionGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyAdminOversightHub = lazy(() =>
  import('@/components/admin/AdminOversightHub').then((m) => ({ default: m.AdminOversightHub })),
)


function AdminRoute() {
  const { tab } = Route.useSearch()
  return (
    // The /admin layout route checks access and draws the band.
    <Suspense fallback={<HudSectionGhost />}>
      <LazyAdminOversightHub tab={tab} />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/admin/')({
  validateSearch: (search: Record<string, unknown>): { tab?: AdminTabId } => {
    // 'shop' and 'purchases' are older names of the Store tab.
    const tab = search.tab === 'purchases' || search.tab === 'shop' ? 'store' : search.tab
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
  pendingComponent: HudSectionGhost,
})
