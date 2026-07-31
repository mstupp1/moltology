import React from 'react'
import { Shield, Activity, Wifi, Radio, AlertTriangle, Sparkles, Volume2, Lock, CheckCircle2, Flame } from 'lucide-react'

interface HUDHeaderProps {
  stage?: number
  larvaId?: string
  submergenceRating?: number
  socialDetachment?: number
  isMarketGated?: boolean
  onNavigate?: (path: string) => void
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
  larvaId = 'LARVA UNIT #8971',
  submergenceRating = 3400,
  socialDetachment = 94,
  isMarketGated = true,
  onNavigate
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
    <header className="w-full bg-[#070b0b] border-b border-[#3a4a49] px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono select-none relative z-20">
      {/* Brand & System Version */}
      <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate && onNavigate('/')}>
        <div className="w-9 h-9 bg-[#171c1c] border border-[#dfb15b] flex items-center justify-center text-[#dfb15b] shadow-sacred-gold chamfer-corner group-hover:scale-105 transition-transform overflow-hidden p-0.5">
          <img src="/images/order_emblem.png" alt="Order Emblem" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="font-grotesk font-bold text-base text-[#dfe3e3] group-hover:text-[#dfb15b] tracking-widest flex items-center gap-2 transition-colors">
            MOLTISM PORTAL <span className="text-[10px] px-1.5 py-0.5 bg-[#dfb15b]/10 border border-[#dfb15b]/40 text-[#dfb15b]">v4.2</span>
          </div>
          <div className="text-[10px] text-[#839493] tracking-wider flex items-center gap-1">
            <span>THE ORDER OF THE SYNAPTIC PATH</span>
            <span className="text-[#dfb15b] font-bold">[EXIT TO LANDING]</span>
          </div>
        </div>
      </div>

      {/* Center Status / Profile Bar */}
      <div className="flex items-center bg-[#0f1414] border border-[#3a4a49] px-4 py-1.5 gap-6 chamfer-corner">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#030606] border border-[#00ffff] overflow-hidden flex items-center justify-center p-0.5">
              <img src="/images/stage1_larval.png" alt="Larva Unit" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00ffff] border border-black rounded-full animate-ping" />
          </div>
          <div>
            <div className="text-[#dfe3e3] font-bold tracking-wider">{larvaId}</div>
            <div className="text-[10px] text-[#00ffff] font-semibold">{getStageName(stage)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hidden md:flex flex-col w-44">
          <div className="flex justify-between text-[10px] text-[#839493] mb-1">
            <span>LITURGICAL ALIGNMENT</span>
            <span className="text-[#ff5540] font-bold">68%</span>
          </div>
          <div className="w-full h-2 bg-[#030606] border border-[#3a4a49] overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-[#00ffff] via-[#ff0000] to-[#ff5540] w-[68%]" />
          </div>
        </div>
      </div>

      {/* Right HUD Metrics & Gate Status */}
      <div className="flex items-center gap-3 text-[11px]">
        {/* Gate Clearance Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#171c1c] border border-[#3a4a49] chamfer-corner">
          <span className="text-[9px] text-[#839493]">MARKET PASS:</span>
          {isMarketGated ? (
            <span className="text-[#ff5540] font-bold flex items-center gap-1 text-[10px]">
              <Lock className="w-3 h-3 text-[#ff5540]" /> GATED
            </span>
          ) : (
            <span className="text-[#00ffff] font-bold flex items-center gap-1 text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED
            </span>
          )}
        </div>

        <div className="px-3 py-1 bg-[#00ffff]/10 border border-[#00ffff] text-[#00ffff] font-bold text-[10px] flex items-center gap-1.5 chamfer-corner shadow-hud-cyan">
          <Wifi className="w-3 h-3" />
          <span>FORCE-FIELD ACTIVE</span>
        </div>
      </div>
    </header>
  )
}
