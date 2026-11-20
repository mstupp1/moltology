import React from 'react'
import { Outlet, createFileRoute, useLocation, useSearch } from '@tanstack/react-router'
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard'
import { ADMIN_TAB_IDS, type AdminSection, type AdminTab } from '@/components/admin/AdminSectionNav'
import { AdminShell } from '@/components/admin/AdminShell'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function sectionFor(pathname: string, tab: unknown): AdminSection {
  if (pathname.startsWith('/admin/logic')) return 'logic'
  return ADMIN_TAB_IDS.includes(tab as AdminTab) ? (tab as AdminTab) : 'watch'
}

/**
 * One Admin page for the hub's tabs (/admin?tab=…) and the Logic Atlas (/admin/logic): the
 * access check and header band are drawn once here, so switching tabs swaps only the content.
 */
function AdminLayout() {
  const pathname = useLocation({ select: (location) => location.pathname })
  // The open tab's validated search (/admin maps old tab names such as ?tab=shop to store).
  const tab = useSearch({ strict: false, select: (search) => (search as { tab?: unknown }).tab })
  const current = sectionFor(pathname, tab)
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
