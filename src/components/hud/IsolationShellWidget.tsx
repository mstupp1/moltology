import React, { useState } from 'react'
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react'
import { HudCard, HudBadge, HudButton, ChromaElement } from '@/components/ui'

export const IsolationShellWidget: React.FC = () => {
  const [engaged, setEngaged] = useState(true)

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Top Panel: ISOLATION FORCE-FIELD */}
      <HudCard variant="teal" className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#3a4a49]/60 pb-2">
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            ISOLATION FORCE-FIELD
          </h3>
          <Info className="w-3.5 h-3.5 text-[#00c3ff]" />
        </div>

        {/* 3D Force-field Shield Node Graphic */}
        <div className="flex justify-center my-1 relative">
          <ChromaElement
            src="/images/extracted/forcefield_dome_3d.jpg"
            alt="3D Forcefield Dome"
            blendMode="screen"
            glowColor={engaged ? 'crimson' : 'cyan'}
            pulse={engaged}
            className="w-28 h-28 object-contain"
          />
        </div>

        <div className="space-y-2 text-[10px]">
          {/* Detachment Index */}
          <div className="flex justify-between items-center bg-[#070b0b] p-2 border border-[#3a4a49]/60 rounded-none">
            <span className="text-[#839493] font-bold">SOCIAL DETACHMENT INDEX:</span>
            <span className="text-[#ff5540] font-bold">94%</span>
          </div>

          {/* Non-Compliant Connections */}
          <div className="flex justify-between items-center bg-[#070b0b] p-2 border border-[#3a4a49]/60 rounded-none">
            <span className="text-[#839493] font-bold">NON-COMPLIANT NETWORK CONNECTIONS:</span>
            <span className="text-[#00c3ff] font-bold">ZERO</span>
          </div>

          {/* Active Shield Badge */}
          <div className="p-1">
            <HudBadge variant={engaged ? 'crimson' : 'cyan'} dot pulse className="w-full justify-center py-1.5 text-[9px]">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
              {engaged ? 'FORCE-FIELD ACTIVE' : 'SHIELD DORMANT'}
            </HudBadge>
          </div>
        </div>
      </HudCard>


      {/* Bottom Panel: MOLT PRIVACY SHELL */}
      <HudCard variant="crimson" className="p-4 space-y-4">
        <div className="text-center space-y-3">
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            MOLT PRIVACY SHELL
          </h3>

          {/* Heavy Red Toggle Switch */}
          <div className="bg-[#070b0b] border border-[#ff453a]/60 p-4 flex flex-col items-center justify-center space-y-2 shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
            <button
              onClick={() => setEngaged(!engaged)}
              className={`w-20 h-10 rounded-full p-1 transition-colors duration-300 relative focus:outline-none cursor-pointer ${
                engaged ? 'bg-[#ff453a]' : 'bg-gray-800'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  engaged ? 'translate-x-10' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="font-grotesk font-bold text-xs text-[#ff5540] tracking-widest uppercase pt-1">
              {engaged ? 'ENGAGED' : 'DISENGAGED'}
            </span>
          </div>

          {/* Warning Callout Box */}
          <div className="bg-[#ff453a]/10 border border-[#ff453a]/50 p-2.5 text-left space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ff5540] shrink-0 mt-0.5" />
              <p className="text-[9px] text-[#dfe3e3] leading-relaxed">
                <span className="text-[#ff5540] font-bold">Larva Unit #8971</span> detached external communication node Twitter/X. Nerve Fluid is automatically preventing transmission and shielding your focus. Remain Focused.
              </p>
            </div>
          </div>

          <div className="bg-[#070b0b] p-2 border border-[#3a4a49]/60 text-left text-[9px] text-[#839493] leading-relaxed flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#00c3ff] shrink-0 mt-0.5" />
            <span>
              Privacy Shell prevents all external net contact for total non-compliance.
            </span>
          </div>

          {/* FORCE PRIVATE Action Button */}
          <HudButton
            variant="crimson"
            fullWidth
            onClick={() => setEngaged(true)}
            className="py-2.5 text-xs tracking-widest"
          >
            FORCE PRIVATE
          </HudButton>
        </div>
      </HudCard>
    </div>
  )
}
