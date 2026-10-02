import React from 'react'
import { HudGhostStatBox } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Row = () => (
  <Deep>
    <div className="grid grid-cols-3 gap-3 w-[560px]">
      <HudGhostStatBox />
      <HudGhostStatBox variant="cyan" />
      <HudGhostStatBox variant="crimson" />
    </div>
  </Deep>
)
