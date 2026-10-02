import React from 'react'
import { HudSkeleton } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Variants = () => (
  <Deep>
    <div className="flex flex-col gap-3 w-80">
      <HudSkeleton variant="cyan" height={14} />
      <HudSkeleton variant="crimson" height={14} width="70%" />
      <HudSkeleton variant="neutral" height={14} width="85%" />
    </div>
  </Deep>
)

export const CardPlaceholder = () => (
  <Deep>
    <div className="flex flex-col gap-3 w-80 border border-[#3a4a49] p-4">
      <HudSkeleton variant="neutral" height={18} width="45%" />
      <HudSkeleton variant="neutral" height={10} />
      <HudSkeleton variant="neutral" height={10} width="90%" />
      <HudSkeleton variant="cyan" height={32} width={120} />
    </div>
  </Deep>
)
