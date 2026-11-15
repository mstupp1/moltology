import React from 'react'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'

/** The header band's shape while a forum page loads: crumbs row, then a title row. */
function BandGhost({ titleWidth = '55%', action = false }: { titleWidth?: string; action?: boolean }) {
  return (
    <div>
      <div className="hud-title-band-top bg-surface-2">
        <div className="flex min-h-9 items-center gap-2">
          <HudGhostSkeleton variant="neutral" preset="text" width={48} height={11} />
          <HudGhostSkeleton variant="neutral" preset="text" width={140} height={11} />
        </div>
      </div>
      <div className="hud-title-band-rest bg-surface-2 border-b border-line-subtle pt-2 pb-4 md:pb-5 flex items-center justify-between gap-4">
        <HudGhostSkeleton variant="neutral" preset="heading" width={titleWidth} height={26} />
        {action ? <HudGhostSkeleton variant="neutral" preset="button" width={112} height={32} /> : null}
      </div>
    </div>
  )
}

function RowGhost() {
  return (
    <div className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 space-y-2">
      <HudGhostSkeleton variant="neutral" preset="text" width={110} height={11} />
      <HudGhostSkeleton variant="neutral" preset="heading" width="70%" height={18} />
      <HudGhostSkeleton variant="neutral" preset="text" width="95%" height={12} />
      <div className="flex items-center gap-2 pt-1">
        <HudGhostSkeleton variant="neutral" preset="avatar" width={28} height={28} />
        <HudGhostSkeleton variant="neutral" preset="text" width={120} height={11} />
      </div>
    </div>
  )
}

/** First paint of a board: band, toolbar, then post cards beside the board rail. */
export function ForumBoardGhost() {
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 select-none animate-in fade-in duration-150" data-testid="forum-board-ghost">
      <BandGhost titleWidth="40%" action />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">
        <div className="lg:col-span-8 space-y-2.5">
          <HudGhostSkeleton variant="neutral" preset="custom" width="100%" height={44} className="rounded-card" />
          {Array.from({ length: 4 }).map((_, i) => (
            <RowGhost key={i} />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <HudGhostSkeleton key={i} variant="neutral" preset="custom" width="100%" height={52} className="rounded-card" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** First paint of a post: band, the opening post, the reply bar, replies, and the rail. */
export function ForumThreadGhost() {
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 select-none animate-in fade-in duration-150" data-testid="forum-thread-ghost">
      <BandGhost titleWidth="65%" action />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          <div className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 lg:p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <HudGhostSkeleton variant="neutral" preset="avatar" width={44} height={44} />
              <div className="space-y-1.5">
                <HudGhostSkeleton variant="neutral" preset="text" width={140} height={13} />
                <HudGhostSkeleton variant="neutral" preset="text" width={90} height={11} />
              </div>
            </div>
            {['100%', '96%', '88%', '60%'].map((w, i) => (
              <HudGhostSkeleton key={i} variant="neutral" preset="text" width={w} height={13} />
            ))}
          </div>
          <HudGhostSkeleton variant="neutral" preset="custom" width="100%" height={52} className="rounded-card" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <HudGhostSkeleton variant="neutral" preset="avatar" width={36} height={36} />
                <HudGhostSkeleton variant="neutral" preset="text" width={160} height={12} />
              </div>
              <HudGhostSkeleton variant="neutral" preset="text" width="92%" height={12} />
              <HudGhostSkeleton variant="neutral" preset="text" width="70%" height={12} />
            </div>
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-3">
          <HudGhostSkeleton variant="neutral" preset="custom" width="100%" height={210} className="rounded-card" />
          <HudGhostSkeleton variant="neutral" preset="custom" width="100%" height={220} className="rounded-card" />
        </div>
      </div>
    </div>
  )
}
