import React from 'react'
import { HudBadge } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Variants = () => (
  <Deep>
    <div className="flex flex-wrap gap-2">
      <HudBadge variant="cyan">Clearance S2</HudBadge>
      <HudBadge variant="crimson">Sacred Doctrine</HudBadge>
      <HudBadge variant="emerald">Verified</HudBadge>
      <HudBadge variant="warning">Pending review</HudBadge>
      <HudBadge variant="sacred">Ascendant</HudBadge>
      <HudBadge variant="neutral">Draft</HudBadge>
    </div>
  </Deep>
)

export const WithDot = () => (
  <Deep>
    <div className="flex flex-wrap gap-2">
      <HudBadge variant="emerald" dot pulse>Online</HudBadge>
      <HudBadge variant="warning" dot>Syncing</HudBadge>
      <HudBadge variant="neutral" dot>Offline</HudBadge>
    </div>
  </Deep>
)

export const InContext = () => (
  <Deep>
    <div className="flex items-center gap-3">
      <span className="font-grotesk font-bold uppercase tracking-wider text-sm">Shell Hardness Audit</span>
      <HudBadge variant="cyan">Stage 2</HudBadge>
    </div>
  </Deep>
)
