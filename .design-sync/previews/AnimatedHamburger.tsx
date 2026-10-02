import React, { useState } from 'react'
import { AnimatedHamburger } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const States = () => (
  <Deep>
    <div className="flex items-center gap-8 text-[#dfe3e3]">
      <div className="flex flex-col items-center gap-2"><AnimatedHamburger isOpen={false} size="lg" /><span className="text-[10px] uppercase tracking-wider text-[#839493]">Closed</span></div>
      <div className="flex flex-col items-center gap-2"><AnimatedHamburger isOpen size="lg" /><span className="text-[10px] uppercase tracking-wider text-[#839493]">Open</span></div>
    </div>
  </Deep>
)

export const Sizes = () => (
  <Deep><div className="flex items-center gap-6 text-[#00c3ff]"><AnimatedHamburger isOpen={false} size="sm" /><AnimatedHamburger isOpen={false} size="md" /><AnimatedHamburger isOpen={false} size="lg" /></div></Deep>
)

export const InMenuButton = () => {
  const [open, setOpen] = useState(false)
  return (
    <Deep>
      <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} className="p-2 border border-[#3a4a49] text-[#dfe3e3] hover:border-[#00c3ff]">
        <AnimatedHamburger isOpen={open} />
      </button>
    </Deep>
  )
}
