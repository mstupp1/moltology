import { createFileRoute } from '@tanstack/react-router'
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard'
import { AdminStore } from '@/components/admin/AdminStore'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
export const Route = createFileRoute('/_hud/admin/store')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({ meta: privatePageSeo({ title: 'Store operations | Moltology', description: 'Staff store operations.' }) }),
  pendingComponent: HudWorkspaceGhost,
  component: () => <AdminAccessGuard skeleton={<HudWorkspaceGhost />}><AdminStore /></AdminAccessGuard>,
})
