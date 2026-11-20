import React from 'react'
import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { AcademyNav } from '@/components/academy/AcademyChrome'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'

/**
 * The Academy's two tabs, Catalog (/academy) and Certificates (/academy/certificates), share
 * this header band, so switching between them swaps only the content under it. Course, lesson,
 * track and credential pages sit outside it with their own crumbs.
 */
function AcademySectionsLayout() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const current = pathname.startsWith('/academy/certificates') ? 'certificates' : 'catalog'
  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5 font-sans">
      <HudTitlePanel treatment="band" title="Academy" sections={<AcademyNav current={current} />} />
      <Outlet />
    </div>
  )
}

export const Route = createFileRoute('/_hud/academy/_sections')({
  component: AcademySectionsLayout,
})
