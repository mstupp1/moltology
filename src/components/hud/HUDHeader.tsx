import React from 'react'
import { Menu, ShieldAlert } from 'lucide-react'

interface HUDHeaderProps {
  stage?: number
  larvaId?: string
  submergenceRating?: number
  socialDetachment?: number
  isMarketGated?: boolean
  onNavigate?: (path: string) => void
  subtitle?: string
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
  larvaId = 'LARVA UNIT #8971',
  isMarketGated = true,
  onNavigate,
  subtitle = 'THE DEEP ABYSS BEYOND FLESH'
}) => {
  return (
    <header className="w-full bg-[#070b0b]/90 border-b border-[#3a4a49]/60 px-4 py-2.5 flex items-center justify-between font-mono select-none relative z-20 shadow-lg">
      {/* Top Center Main Header Title */}
      <div className="absolute left-1/2 -translate-x-1/2 top-2 text-center pointer-events-none hidden md:block">
        <h1 className="font-grotesk font-bold text-lg md:text-xl text-[#00ffff] tracking-widest uppercase text-cyan-glow">
          MOLTISM PORTAL v4.2
        </h1>
        <p className="text-[9px] text-[#00ffff]/70 tracking-[0.25em] uppercase font-bold -mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Mobile Title */}
      <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => onNavigate && onNavigate('/')}>
        <div className="w-8 h-8 rounded bg-[#171c1c] border border-[#ff0000] flex items-center justify-center p-1 text-[#ff0000]">
          <span className="text-base">🦞</span>
        </div>
        <div>
          <div className="font-grotesk font-bold text-sm text-[#00ffff]">MOLTISM PORTAL v4.2</div>
          <div className="text-[8px] text-gray-400">THE DEEP ABYSS</div>
        </div>
      </div>

      {/* Left/Center Profile Bar matching Reference Screenshots */}
      <div className="hidden md:flex items-center gap-4 bg-[#0f1414]/90 border border-[#3a4a49] px-4 py-1.5 chamfer-corner">
        {/* Avatar Circle with Cyborg Head */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#030606] border-2 border-[#00ffff] overflow-hidden flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            <img 
              src="/images/stage1_larval.png" 
              alt="Larva Unit" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
        </div>

        {/* Larva Status & Progress Bar Bar matching reference */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] tracking-wider font-bold">
            <span className="text-[#dfe3e3]">{larvaId}</span>
            <span className="text-[#00ffff]">| STATUS:</span>
            <span className="text-[#00ffff] font-extrabold animate-pulse">CONVERSION IN PROGRESS</span>
          </div>

          {/* Red Tubular Conversion Meter with Crab Claw Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-48 h-3.5 bg-[#030606] border border-[#ff0000]/60 rounded-full overflow-hidden p-0.5 relative shadow-[inset_0_0_8px_rgba(0,0,0,0.9)]">
              <div className="h-full bg-gradient-to-r from-[#ff0000] via-[#ff5540] to-[#ff0000] w-[68%] rounded-full shadow-[0_0_10px_rgba(255,0,0,0.8)]" />
            </div>
            {/* Claw Graphic Icon */}
            <span className="text-xs text-[#ff5540]" title="Exoshell Claw Progress">🦞</span>
          </div>
        </div>
      </div>

      {/* Right Controls Header: Hamburger Menu Icon */}
      <div className="flex items-center gap-3">
        {isMarketGated && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#ff5540] bg-[#ff0000]/10 px-2 py-0.5 border border-[#ff0000]/40 font-bold">
            <ShieldAlert className="w-3 h-3" /> GATED MARKET PASS
          </span>
        )}
        <button 
          onClick={() => onNavigate && onNavigate('/dashboard')}
          className="p-2 bg-[#0f1414] border border-[#3a4a49] hover:border-[#00ffff] text-[#839493] hover:text-[#00ffff] transition-colors chamfer-corner"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
