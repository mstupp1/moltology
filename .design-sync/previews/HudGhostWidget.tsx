import React from 'react'
import { HudGhostWidget, HudGhostStatBox, HudStatBox } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Loading = () => (
  <Deep><div className="w-64"><HudGhostWidget isLoading skeleton={<HudGhostStatBox />}><HudStatBox label="Chitin Gems" value="1,240" /></HudGhostWidget></div></Deep>
)
export const Loaded = () => (
  <Deep><div className="w-64"><HudGhostWidget isLoading={false} skeleton={<HudGhostStatBox />}><HudStatBox label="Chitin Gems" value="1,240" trend="up" trendValue="+120" /></HudGhostWidget></div></Deep>
)
