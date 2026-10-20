import React from 'react'
import { DailyRoutineWidget } from '@/components/hud/DailyRoutineWidget'
import { ForumHubCard } from '@/components/hud/ForumHubCard'
import { ConnectionsHubCard } from '@/components/hud/ConnectionsHubCard'
import { ActivityStreamPanel } from '@/components/hud/ActivityStreamPanel'
import { PremiumDashboardBanner } from '@/components/hud/PremiumDashboardBanner'
import { DashboardTodayStrip } from '@/components/hud/dashboard/DashboardTodayStrip'
import { DashboardPromoBanner } from '@/components/hud/dashboard/DashboardPromoBanner'
import { DashboardShortcuts } from '@/components/hud/dashboard/DashboardShortcuts'
import { DashboardNewsPanel } from '@/components/hud/dashboard/DashboardNewsPanel'
import { DashboardChangelogPanel } from '@/components/hud/dashboard/DashboardChangelogPanel'

/**
 * The member's home in the app. The member's own day comes first (Today, then alignment),
 * then their people, then places to go, then what is new. Nothing here rotates on its own.
 */
export default function DashboardView() {
  return (
    <div className="space-y-4 lg:space-y-5 font-sans">
      <DashboardTodayStrip />

      <DailyRoutineWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-5 items-stretch">
        <ForumHubCard />
        <ConnectionsHubCard />
        <div className="lg:col-span-2 2xl:col-span-1 flex flex-col">
          <ActivityStreamPanel />
        </div>
      </div>

      <PremiumDashboardBanner />

      <DashboardPromoBanner />

      <DashboardShortcuts />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
        <DashboardNewsPanel />
        <DashboardChangelogPanel />
      </div>
    </div>
  )
}
