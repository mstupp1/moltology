import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyAdminOversightHub = lazy(() =>
  import('@/components/admin/AdminOversightHub').then((m) => ({ default: m.AdminOversightHub })),
)

function AdminRoute() {
  return (
    <AdminAccessGuard skeleton={<HudWorkspaceGhost />}>
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyAdminOversightHub />
      </Suspense>
    </AdminAccessGuard>
  )
}

export const Route = createFileRoute('/_hud/admin/')({
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
