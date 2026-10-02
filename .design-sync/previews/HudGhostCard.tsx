import React from 'react'
import { HudGhostCard } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Default = () => (<Deep><div className="w-80"><HudGhostCard /></div></Deep>)
export const NoHeaderMoreLines = () => (<Deep><div className="w-80"><HudGhostCard hasHeader={false} lines={5} variant="teal" /></div></Deep>)
