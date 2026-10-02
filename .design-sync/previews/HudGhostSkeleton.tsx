import React from 'react'
import { HudGhostSkeleton } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Presets = () => (
  <Deep>
    <div className="flex flex-col gap-3 w-80">
      <div className="flex items-center gap-3">
        <HudGhostSkeleton preset="avatar" width={32} height={32} />
        <HudGhostSkeleton preset="heading" width="60%" height={16} />
      </div>
      <HudGhostSkeleton preset="text" />
      <HudGhostSkeleton preset="text" width="80%" />
      <div className="flex gap-2"><HudGhostSkeleton preset="badge" width={60} height={18} /><HudGhostSkeleton preset="button" width={96} height={32} /></div>
      <HudGhostSkeleton preset="chart" height={80} />
    </div>
  </Deep>
)

export const Tints = () => (
  <Deep>
    <div className="flex flex-col gap-3 w-80">
      <HudGhostSkeleton variant="neutral" preset="text" />
      <HudGhostSkeleton variant="teal" preset="text" />
      <HudGhostSkeleton variant="cyan" preset="text" />
      <HudGhostSkeleton variant="crimson" preset="text" cornerCut />
    </div>
  </Deep>
)
