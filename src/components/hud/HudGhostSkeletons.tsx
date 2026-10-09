import React from 'react'
import { HudGhostSkeleton, HudGhostCard, HudGhostStatBox } from '@/components/ui/HudGhostLoader'

/** Card shell overrides so ghost primitives match the live card shape. */
const GHOST_CARD = 'rounded-card border-line-subtle bg-surface-1 shadow-none'

/**
 * Clean Ghost Skeleton composite for the Launchpad Carousel.
 */
export function LaunchpadCarouselGhost() {
  return (
    <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-4 sm:p-5 space-y-4 relative lg:h-[785px] flex flex-col justify-between">
      {/* Header bar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-subtle pb-3 shrink-0">
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
        <HudGhostCard variant="neutral" lines={4} className={`${GHOST_CARD} md:col-span-2 min-h-[200px] h-full`} />
        <HudGhostCard variant="cyan" lines={6} className={`${GHOST_CARD} min-h-[200px] h-full`} />
      </div>

      {/* Footer / dots skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-line-subtle">
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
    <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-5 space-y-4 relative min-w-0 overflow-hidden">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-subtle pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <HudGhostSkeleton variant="teal" preset="avatar" width={28} height={28} />
          <div className="space-y-1 min-w-0">
            <HudGhostSkeleton variant="teal" preset="heading" width={150} height={16} />
            <HudGhostSkeleton variant="neutral" preset="text" width={180} height={11} />
          </div>
        </div>
        <HudGhostSkeleton variant="teal" preset="badge" width={76} height={20} />
      </div>

      {/* Progress Meter skeleton */}
      <div className="rounded-card border border-line-subtle bg-surface-2 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <HudGhostSkeleton variant="neutral" preset="text" width={100} height={12} />
          <HudGhostSkeleton variant="teal" preset="heading" width={50} height={16} />
        </div>
        <HudGhostSkeleton variant="neutral" height={12} width="100%" />
      </div>

      {/* Routine Items List skeleton */}
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line-subtle bg-surface-2 p-2.5 flex items-center justify-between gap-3">
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
    <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-4 sm:p-5 space-y-4 relative">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-line-subtle pb-3">
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
        <div className="md:col-span-2 rounded-card border border-line-subtle bg-surface-2 p-4 space-y-3">
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
            <div key={i} className="rounded-card border border-line-subtle bg-surface-2 p-2.5 space-y-1.5">
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
 * Clean Ghost Skeleton composite for Initiate Activity Feed list.
 */
export function ActivityFeedGhost() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-card border border-line-subtle bg-surface-2 p-3 flex items-center justify-between gap-3">
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
      <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-4 sm:p-5 space-y-3">
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
        <HudGhostCard variant="neutral" lines={4} className={`${GHOST_CARD} md:col-span-2 min-h-[220px]`} />
        <div className="space-y-3 flex flex-col justify-between">
          <HudGhostStatBox variant="cyan" className={GHOST_CARD} />
          <HudGhostStatBox variant="neutral" className={GHOST_CARD} />
        </div>
      </div>

      {/* Secondary Row Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HudGhostCard variant="neutral" lines={3} className={GHOST_CARD} />
        <HudGhostCard variant="neutral" lines={3} className={GHOST_CARD} />
      </div>
    </div>
  )
}

