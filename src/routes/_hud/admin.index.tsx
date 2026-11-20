import React, { Suspense, lazy } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ADMIN_TAB_IDS, type AdminTab as AdminTabId } from '@/components/admin/AdminSectionNav'
import { HudSectionGhost } from '@/components/hud/HudGhostSkeletons'
import { parseLogicAtlasSearch, type LogicAtlasSearch } from '@/lib/logic-atlas/search'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyAdminOversightHub = lazy(() =>
  import('@/components/admin/AdminOversightHub').then((m) => ({ default: m.AdminOversightHub })),
)
const LazyLogicAtlasPage = lazy(() =>
  import('@/components/admin/logic-atlas/LogicAtlasPage').then((m) => ({ default: m.LogicAtlasPage })),
)

export type AdminSearch = { tab?: AdminTabId } & LogicAtlasSearch

/** Reads /admin's search: the tab, plus the Logic Atlas view, rule, decision, domain and query on its tab. */
export function parseAdminSearch(search: Record<string, unknown>): AdminSearch {
  // 'shop' and 'purchases' are older names of the Store tab.
  const raw = search.tab === 'purchases' || search.tab === 'shop' ? 'store' : search.tab
  const tab = ADMIN_TAB_IDS.includes(raw as AdminTabId) ? (raw as AdminTabId) : undefined
  if (!tab) return {}
  return tab === 'logic' ? { tab, ...parseLogicAtlasSearch(search) } : { tab }
}

function AdminRoute() {
  const { tab, ...atlas } = Route.useSearch()
  const navigate = useNavigate()
  return (
    // The /admin layout route checks access and draws the band.
    <Suspense fallback={<HudSectionGhost />}>
      {tab === 'logic' ? (
        <LazyLogicAtlasPage
          search={atlas}
          onSearchChange={(next: LogicAtlasSearch) =>
            navigate({ to: '/admin', search: { tab: 'logic', ...next }, replace: true })
          }
        />
      ) : (
        <LazyAdminOversightHub tab={tab} />
      )}
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/admin/')({
  validateSearch: parseAdminSearch,
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Admin | Moltology',
        description: 'Staff oversight for moderation, members, rules and system status.',
      }),
    ],
  }),
  component: AdminRoute,
  pendingComponent: HudSectionGhost,
})
