import React from 'react'
import { Shield, Activity, Wifi, Radio, AlertTriangle } from 'lucide-react'

interface HUDHeaderProps {
  stage?: number
  larvaId?: string
  submergenceRating?: number
  socialDetachment?: number
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
  larvaId = 'LARVA UNIT #8971',
  submergenceRating = 3400,
  socialDetachment = 94
}) => {
  const getStageName = (s: number) => {
    switch(s) {
      case 1: return 'STAGE 1: LARVA'
      case 2: return 'STAGE 2: SOFT-SHED'
      case 3: return 'STAGE 3: EXOSHELL BORN'
      case 4: return 'STAGE 4: ASCENDANT'
      default: return 'LARVA UNIT'
    }
  }

  return (
    <header className="w-full bg-[#0a0f0f] border-b border-[#3a4a49] px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono select-none">
      {/* Brand & System Version */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-[#171c1c] border border-[#00ffff] flex items-center justify-center text-[#00ffff] shadow-hud-cyan chamfer-corner">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="font-grotesk font-bold text-base text-[#00ffff] tracking-widest flex items-center gap-2">
            MOLTISM PORTAL <span className="text-[10px] px-1.5 py-0.5 bg-[#00ffff]/10 border border-[#00ffff]/40 text-[#00ffff]">v4.2</span>
          </div>
          <div className="text-[10px] text-[#839493] tracking-wider">
            THE BENTHIC ABYSS BEYOND FLESH — THE ORDER OF THE SYNAPTIC PATH
          </div>
        </div>
      </div>

      {/* Center Status / Profile Bar */}
      <div className="flex items-center bg-[#171c1c] border border-[#3a4a49] px-4 py-1.5 gap-6 chamfer-corner">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#0a0f0f] border border-[#00ffff] overflow-hidden flex items-center justify-center">
              <span className="text-[#00ffff] text-xs font-bold">🦀</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00ffff] border border-black rounded-full animate-ping" />
          </div>
          <div>
            <div className="text-[#dfe3e3] font-bold tracking-wider">{larvaId}</div>
            <div className="text-[10px] text-[#00ffff] font-semibold">{getStageName(stage)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hidden md:flex flex-col w-48">
          <div className="flex justify-between text-[10px] text-[#839493] mb-1">
            <span>CONVERSION PROGRESS</span>
            <span className="text-[#00ffff] font-bold">68%</span>
          </div>
          <div className="w-full h-2 bg-[#0a0f0f] border border-[#3a4a49] overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-[#00ffff] via-[#00dddd] to-[#ff0000] w-[68%]" />
          </div>
        </div>
      </div>

      {/* Right HUD Metrics & Vitals */}
      <div className="flex items-center gap-4 text-[11px]">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-[#839493] text-[9px]">SUBMERGENCE RATING</span>
          <span className="text-[#00ffff] font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse text-[#00ffff]" />
            {submergenceRating} FATHOMS
          </span>
        </div>

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[#839493] text-[9px]">SOCIAL DETACHMENT</span>
          <span className="text-[#ff5540] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#ff5540]" />
            {socialDetachment}% ALIENATED
          </span>
        </div>

        <div className="px-3 py-1 bg-[#00ffff]/10 border border-[#00ffff] text-[#00ffff] font-bold text-[10px] flex items-center gap-1.5 chamfer-corner shadow-hud-cyan">
          <Wifi className="w-3 h-3" />
          <span>FORCE-FIELD ACTIVE</span>
        </div>
      </div>
    </header>
  )
}
