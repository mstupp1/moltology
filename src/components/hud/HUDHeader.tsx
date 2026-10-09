import React, { useRef } from 'react'
import { HUDProgressBar } from './HUDProgressBar'

export interface HUDHeaderProps {
  stage?: number
  xp?: number
  larvaId?: string
  className?: string
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage,
  xp,
  className = '',
}) => {
  const scanlineRef = useRef<HTMLDivElement>(null)

  return (
    <header className={`hidden md:flex w-full bg-abyss/95 border-b border-line-subtle px-2.5 sm:px-4 py-1.5 sm:py-2 items-center gap-2 sm:gap-3 font-sans select-none relative z-30 shrink-0 ${className}`}>

      {/* HUD scanline overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div
          ref={scanlineRef}
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.5) 2px, rgba(0,255,255,0.5) 3px)',
          }}
        />
      </div>

      <HUDProgressBar stage={stage} xp={xp} className="flex-1" />
    </header>
  )
}
