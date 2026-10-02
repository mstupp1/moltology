import React from 'react'
import { HUDSpinner, HudButton } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Sizes = () => (
  <Deep><div className="flex items-end gap-6"><HUDSpinner size="xs" /><HUDSpinner size="sm" /><HUDSpinner size="md" /><HUDSpinner size="lg" /></div></Deep>
)
export const Variants = () => (
  <Deep><div className="flex items-end gap-6"><HUDSpinner variant="cyan" label="Loading" /><HUDSpinner variant="crimson" label="Retrying" /><HUDSpinner variant="neutral" label="Waiting" /></div></Deep>
)
export const InButton = () => (
  <Deep><HudButton disabled><HUDSpinner size="xs" variant="cyan" /> Saving…</HudButton></Deep>
)
