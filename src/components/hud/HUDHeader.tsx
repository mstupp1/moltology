import React, { useRef } from 'react'
import { HUDProgressBar } from './HUDProgressBar'

export interface HUDHeaderProps {
  stage?: number
  larvaId?: string
  className?: string
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
  className = '',
}) => {
  const scanlineRef = useRef<HTMLDivElement>(null)

  return (
    <header className={`hidden md:flex w-full bg-[#020608]/95 border-b border-[#00c3ff]/20 px-2.5 sm:px-4 py-1.5 sm:py-2 items-center gap-2 sm:gap-3 font-sans select-none relative z-30 shadow-[0_2px_20px_rgba(0,195,255,0.1)] shrink-0 ${className}`}>

      {/* HUD scanline overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div
          ref={scanlineRef}
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.5) 2px, rgba(0,255,255,0.5) 3px)',
          }}
        />
        {/* Moving scan sweep - GPU Accelerated */}
        <div
          className="absolute top-0 left-0 right-0 h-6 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,195,255,0.06) 50%, transparent 100%)',
            animation: 'hudScan 4s linear infinite',
            willChange: 'transform',
          }}
        />
      </div>

      <HUDProgressBar stage={stage} className="flex-1" />
    </header>
  )
}
