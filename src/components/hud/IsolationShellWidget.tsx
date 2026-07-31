import React, { useState } from 'react'
import { Shield, ShieldAlert, Lock, AlertTriangle, Users } from 'lucide-react'

export const IsolationShellWidget: React.FC = () => {
  const [engaged, setEngaged] = useState(true)

  return (
    <div className="bg-[#171c1c] border border-[#3a4a49] p-4 chamfer-corner shadow-chitin-plate space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#ff5540]" />
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            MOLT PRIVACY SHELL & ISOLATION
          </h3>
        </div>
        <span className={`text-[10px] px-2 py-0.5 border font-mono ${
          engaged 
            ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff]' 
            : 'bg-[#ff0000]/10 border-[#ff0000] text-[#ff5540]'
        }`}>
          {engaged ? 'SHIELDING ACTIVE' : 'NETWORK EXPOSED'}
        </span>
      </div>

      {/* Main Switch Container */}
      <div className="bg-[#0f1414] border border-[#3a4a49] p-4 text-center space-y-3 chamfer-corner relative overflow-hidden">
        {/* Force Field Visual Graphic */}
        <div className="w-24 h-24 mx-auto relative">
          <img 
            src="/images/isolation_shell_dome.png" 
            alt="Isolation Force Field Dome" 
            className={`w-full h-full object-contain transition-all duration-500 ${
              engaged 
                ? 'drop-shadow-[0_0_12px_rgba(0,255,255,0.7)] scale-105' 
                : 'grayscale opacity-40 scale-95'
            }`}
          />
        </div>

        <div className="text-[10px] text-[#839493] uppercase tracking-widest font-mono">
          ISOLATION FORCE-FIELD STATUS
        </div>
        
        <button
          onClick={() => setEngaged(!engaged)}
          className={`w-full py-3 px-4 font-grotesk font-bold text-sm tracking-widest uppercase transition-all duration-200 border chamfer-corner flex items-center justify-center gap-3 ${
            engaged
              ? 'bg-[#00ffff] border-[#00ffff] text-[#000a0a] shadow-hud-cyan animate-pulse-glow'
              : 'bg-[#ff0000] border-[#ff0000] text-white shadow-hud-red'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{engaged ? 'ENGAGED — NETWORK PURITY ACTIVE' : 'DISENGAGED — FORCE PRIVATE'}</span>
        </button>

        <p className="text-[10px] text-[#839493] leading-relaxed font-mono">
          {engaged
            ? 'Privacy Shell blocks external unvalidated communication nodes (family, non-compliant contacts) to preserve focus on total carcinization.'
            : 'WARNING: Disengaging Privacy Shell exposes your neural frequencies to unaligned biological interference.'}
        </p>
      </div>

      {/* Detachment Metrics */}
      <div className="space-y-2 text-[10px] font-mono">
        <div className="flex justify-between items-center bg-[#0a0f0f] p-2 border border-[#3a4a49]/60">
          <span className="text-[#839493] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#00ffff]" />
            SOCIAL DETACHMENT INDEX:
          </span>
          <span className="text-[#00ffff] font-bold">94%</span>
        </div>

        <div className="flex justify-between items-center bg-[#0a0f0f] p-2 border border-[#3a4a49]/60">
          <span className="text-[#839493] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff5540]" />
            NON-COMPLIANT NETWORK CONNECTIONS:
          </span>
          <span className="text-[#ff5540] font-bold">0 DETECTED</span>
        </div>
      </div>
    </div>
  )
}
