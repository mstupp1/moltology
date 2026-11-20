import React from 'react'
import { Outlet, createFileRoute, useSearch } from '@tanstack/react-router'
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard'
import { ADMIN_TAB_IDS, type AdminSection, type AdminTab } from '@/components/admin/AdminSectionNav'
import { AdminShell } from '@/components/admin/AdminShell'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function sectionFor(tab: unknown): AdminSection {
  return ADMIN_TAB_IDS.includes(tab as AdminTab) ? (tab as AdminTab) : 'watch'
}

/**
 * One Admin page for every tab (/admin?tab=…, Logic Atlas included): the access check and header
 * band are drawn once here, so switching tabs swaps only the content.
 */
function AdminLayout() {
  // The open tab's validated search (/admin maps old tab names such as ?tab=shop to store).
  const tab = useSearch({ strict: false, select: (search) => (search as { tab?: unknown }).tab })
  const current = sectionFor(tab)
  return (
    <AdminAccessGuard skeleton={<HudWorkspaceGhost />}>
      <AdminShell current={current}>
        <Outlet />
      </AdminShell>
    </AdminAccessGuard>
  )
}

export const Route = createFileRoute('/_hud/admin')({
  component: AdminLayout,
})
