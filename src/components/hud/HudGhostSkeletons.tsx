import React from 'react'
import { HudGhostSkeleton, HudGhostCard, HudGhostStatBox } from '@/components/ui/HudGhostLoader'

/**
 * Clean Ghost Skeleton composite for the Launchpad Carousel.
 */
export function LaunchpadCarouselGhost() {
  return (
    <div className="bg-[#070b0c]/90 border border-[#3a4a49]/60 p-4 sm:p-5 rounded-sm space-y-4 shadow-sm relative lg:h-[785px] flex flex-col justify-between">
      {/* Header bar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49]/40 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <HudGhostSkeleton variant="cyan" preset="avatar" width={32} height={32} />
          <div className="space-y-1">
            <HudGhostSkeleton variant="cyan" preset="heading" width={160} height={16} />
            <HudGhostSkeleton variant="neutral" preset="text" width={220} height={11} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HudGhostSkeleton variant="neutral" preset="button" width={28} height={28} />
          <HudGhostSkeleton variant="neutral" preset="button" width={28} height={28} />
        </div>
      </div>

      {/* Hero launchpad card skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch flex-1 min-h-0 py-2">
        <HudGhostCard variant="neutral" lines={4} className="md:col-span-2 min-h-[200px] h-full" />
        <HudGhostCard variant="cyan" lines={6} className="min-h-[200px] h-full" />
      </div>

      {/* Footer / dots skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-[#3a4a49]/30">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <HudGhostSkeleton key={i} variant={i === 0 ? 'cyan' : 'neutral'} width={20} height={6} cornerCut={false} />
          ))}
        </div>
        <HudGhostSkeleton variant="neutral" preset="badge" width={80} height={18} />
      </div>
    </div>
  )
}

/**
 * Clean Ghost Skeleton composite for the Daily Routine Alignment Widget.
 */
export function DailyRoutineGhost() {
  return (
    <div className="bg-[#070b0c]/90 border border-[#3a4a49]/60 p-4 sm:p-5 rounded-sm space-y-4 shadow-sm relative">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-[#3a4a49]/40 pb-3">
        <div className="flex items-center gap-3">
          <HudGhostSkeleton variant="teal" preset="avatar" width={28} height={28} />
          <div className="space-y-1">
            <HudGhostSkeleton variant="teal" preset="heading" width={150} height={16} />
            <HudGhostSkeleton variant="neutral" preset="text" width={180} height={11} />
          </div>
        </div>
        <HudGhostSkeleton variant="teal" preset="badge" width={76} height={20} />
      </div>

      {/* Progress Meter skeleton */}
      <div className="bg-[#090e0f]/80 border border-[#3a4a49]/50 p-3 rounded-sm space-y-2">
        <div className="flex items-center justify-between">
          <HudGhostSkeleton variant="neutral" preset="text" width={100} height={12} />
          <HudGhostSkeleton variant="teal" preset="heading" width={50} height={16} />
        </div>
        <HudGhostSkeleton variant="neutral" height={12} width="100%" />
      </div>

      {/* Routine Items List skeleton */}
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#090e0f]/60 border border-[#3a4a49]/40 p-2.5 rounded-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <HudGhostSkeleton variant="neutral" width={16} height={16} cornerCut={false} />
              <div className="space-y-1 flex-1">
                <HudGhostSkeleton variant="neutral" preset="heading" width="45%" height={13} />
                <HudGhostSkeleton variant="neutral" preset="text" width="70%" height={10} />
              </div>
            </div>
            <HudGhostSkeleton variant="neutral" preset="badge" width={60} height={18} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Clean Ghost Skeleton composite for the Dashboard News / Dispatch Widget.
 */
export function DashboardNewsGhost() {
  return (
    <div className="bg-[#070b0c]/90 border border-[#3a4a49]/60 p-4 sm:p-5 rounded-sm space-y-4 shadow-sm relative">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#3a4a49]/40 pb-3">
        <div className="flex items-center gap-3">
          <HudGhostSkeleton variant="crimson" preset="avatar" width={28} height={28} />
          <div className="space-y-1">
            <HudGhostSkeleton variant="crimson" preset="heading" width={160} height={16} />
            <HudGhostSkeleton variant="neutral" preset="text" width={190} height={11} />
          </div>
        </div>
        <HudGhostSkeleton variant="crimson" preset="badge" width={70} height={20} />
      </div>

      {/* Featured News Post Banner Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-[#090e0f]/80 border border-[#3a4a49]/50 p-4 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <HudGhostSkeleton variant="crimson" preset="badge" width={80} height={18} />
            <HudGhostSkeleton variant="neutral" preset="text" width={70} height={11} />
          </div>
          <HudGhostSkeleton variant="neutral" preset="heading" width="85%" height={20} />
          <HudGhostSkeleton variant="neutral" preset="text" width="100%" height={12} />
          <HudGhostSkeleton variant="neutral" preset="text" width="75%" height={12} />
          <div className="pt-2 flex items-center justify-between">
            <HudGhostSkeleton variant="crimson" preset="button" width={95} height={28} />
            <HudGhostSkeleton variant="neutral" preset="text" width={85} height={11} />
          </div>
        </div>

        {/* Headlines List Skeleton */}
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#090e0f]/50 border border-[#3a4a49]/40 p-2.5 rounded-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <HudGhostSkeleton variant="neutral" preset="badge" width={50} height={14} />
                <HudGhostSkeleton variant="neutral" preset="text" width={50} height={9} />
              </div>
              <HudGhostSkeleton variant="neutral" preset="heading" width="100%" height={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Clean Ghost Skeleton composite for the Subterranean Vats & Telemetry Hub.
 */
export function SubterraneanHubGhost() {
  return (
    <div className="space-y-5 font-sans select-none">
      {/* Subterranean Header Banner Ghost */}
      <div className="bg-[#070b0c]/90 border border-[#3a4a49]/60 p-4 rounded-sm space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <HudGhostSkeleton variant="crimson" preset="heading" width={240} height={18} />
            <HudGhostSkeleton variant="neutral" preset="text" width={360} height={12} />
          </div>
          <HudGhostSkeleton variant="crimson" preset="badge" width={90} height={24} />
        </div>
      </div>

      {/* Grid of Bio-Vat Specimen Cards Ghost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <HudGhostCard key={i} variant="neutral" lines={4} className="min-h-[200px]" />
        ))}
      </div>
    </div>
  )
}

/**
 * Clean Ghost Skeleton composite for Initiate Activity Feed list.
 */
export function ActivityFeedGhost() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-[#080d0e]/80 border border-[#3a4a49]/50 p-3 rounded-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <HudGhostSkeleton variant="neutral" preset="avatar" width={28} height={28} />
            <div className="space-y-1 flex-1">
              <HudGhostSkeleton variant="neutral" preset="heading" width="40%" height={13} />
              <HudGhostSkeleton variant="neutral" preset="text" width="70%" height={11} />
            </div>
          </div>
          <div className="text-right space-y-1 shrink-0">
            <HudGhostSkeleton variant="neutral" preset="badge" width={70} height={18} />
            <HudGhostSkeleton variant="neutral" preset="text" width={50} height={9} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Standard Ghost Skeleton composite for the Hub Workspace outlet.
 * Used during route transitions across hub pages.
 */
export function HudWorkspaceGhost() {
  return (
    <div className="space-y-4 font-sans select-none animate-in fade-in duration-150" data-testid="hud-workspace-ghost">
      {/* Top Banner Skeleton */}
      <div className="bg-[#070b0c]/90 border border-[#3a4a49]/60 p-4 sm:p-5 chamfer-corner space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HudGhostSkeleton variant="cyan" preset="avatar" width={32} height={32} />
            <div className="space-y-1">
              <HudGhostSkeleton variant="cyan" preset="heading" width={180} height={18} />
              <HudGhostSkeleton variant="neutral" preset="text" width={260} height={12} />
            </div>
          </div>
          <HudGhostSkeleton variant="cyan" preset="badge" width={90} height={24} />
        </div>
      </div>

      {/* Main Grid Content Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HudGhostCard variant="neutral" lines={4} className="md:col-span-2 min-h-[220px]" />
        <div className="space-y-3 flex flex-col justify-between">
          <HudGhostStatBox variant="cyan" />
          <HudGhostStatBox variant="neutral" />
        </div>
      </div>

      {/* Secondary Row Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HudGhostCard variant="neutral" lines={3} />
        <HudGhostCard variant="neutral" lines={3} />
      </div>
    </div>
  )
}

/**
 * Ghost skeleton for Chassis Status (stats | paper doll + vault | abilities).
 */
export function ChassisStatusGhost() {
  return (
    <div
      className="flex flex-col flex-1 min-h-0 h-full font-sans relative min-w-0 w-full select-none animate-in fade-in duration-150"
      data-testid="chassis-status-ghost"
    >
      <div className="shrink-0 bg-[#070b0c]/90 border border-[#3a4a49]/60 border-l-4 border-l-[#00c3ff]/40 p-3.5 sm:p-4 md:p-5 chamfer-corner space-y-2 shadow-sm">
        <HudGhostSkeleton variant="cyan" preset="text" width={120} height={10} />
        <HudGhostSkeleton variant="cyan" preset="heading" width={200} height={20} />
        <HudGhostSkeleton variant="neutral" preset="text" width="55%" height={12} />
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,14rem)] flex-1 min-h-0 gap-3.5 sm:gap-5 min-w-0 mt-3.5 sm:mt-5">
        <div className="hidden md:block">
          <HudGhostCard variant="cyan" lines={6} className="h-full min-h-[240px]" />
        </div>

        <div className="flex flex-col flex-1 min-h-0 gap-3.5 sm:gap-5 min-w-0">
          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl flex flex-col flex-1 min-h-[12rem] space-y-4">
            <HudGhostSkeleton variant="neutral" preset="heading" width={120} height={14} />
            <div className="flex flex-1 items-center justify-center gap-3 py-2">
              <div className="hidden sm:flex flex-col gap-2 items-center">
                <HudGhostSkeleton variant="neutral" width={64} height={96} />
                <HudGhostSkeleton variant="neutral" width={64} height={96} />
                <HudGhostSkeleton variant="neutral" width={64} height={96} />
              </div>
              <HudGhostSkeleton variant="cyan" preset="avatar" width={120} height={120} />
              <div className="hidden sm:flex flex-col gap-2 items-center">
                <HudGhostSkeleton variant="neutral" width={64} height={96} />
                <HudGhostSkeleton variant="neutral" width={64} height={96} />
              </div>
            </div>
            <div className="flex sm:hidden gap-1.5 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <HudGhostSkeleton key={i} variant="neutral" width={48} height={72} />
              ))}
            </div>
          </div>

          <div className="md:hidden space-y-3.5 shrink-0">
            <HudGhostCard variant="neutral" lines={2} />
            <HudGhostCard variant="neutral" lines={2} />
          </div>

          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3 shrink-0">
            <HudGhostSkeleton variant="neutral" preset="heading" width={140} height={14} />
            <div className="flex justify-center">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1.5 sm:gap-2 justify-items-center mx-auto w-fit">
                {Array.from({ length: 10 }).map((_, i) => (
                  <HudGhostSkeleton key={i} variant="neutral" width={64} height={96} className="md:w-20 md:h-[120px]" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <HudGhostCard variant="neutral" lines={6} className="h-full min-h-[240px]" />
        </div>
      </div>
    </div>
  )
}

