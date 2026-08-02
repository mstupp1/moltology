import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ShieldAlert, Shield, Lock, EyeOff, Radio, AlertTriangle } from 'lucide-react'
import { IsolationShellWidget } from '@/components/hud/IsolationShellWidget'

function IsolationRoute() {
  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#ff0000] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-xs text-[#ff5540] font-mono tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-[#ff5540]" />
            ISOLATION PROTOCOLS & PRIVACY FORCE-FIELD
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5">
            BENTHIC ISOLATION & DETACHMENT HUB
          </h1>
          <p className="text-xs text-[#839493] font-mono mt-1">
            "Shield your neural pathway from social interference and biological distraction."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Isolation Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="chitin-card p-5 chamfer-corner space-y-4 shadow-2xl">
            <div className="border-b border-[#3a4a49] pb-2 flex justify-between items-center">
              <h2 className="font-grotesk text-sm font-bold tracking-wider text-[#dfe3e3] uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00ffff]" />
                FORCE-FIELD HARMONIZATION CONTROLS
              </h2>
              <span className="text-xs text-[#00ffff] bg-[#00ffff]/15 border border-[#00ffff]/60 px-2 py-0.5 font-bold">
                ACTIVE DEFENSE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="chitin-card-inset p-4 chamfer-corner space-y-2 border border-[#3a4a49]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#dfe3e3]">SOCIAL NOISE FILTER</span>
                  <span className="text-xs text-[#ff5540] font-bold">99.4% SUPPRESSED</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Filters external social calls, emotional alerts, and unverified biological notifications.
                </p>
                <div className="w-full h-2 bg-[#030606] border border-[#3a4a49] overflow-hidden p-0.5">
                  <div className="h-full bg-[#ff0000] w-[99.4%]" />
                </div>
              </div>

              <div className="chitin-card-inset p-4 chamfer-corner space-y-2 border border-[#3a4a49]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#dfe3e3]">ANONYMITY DENSITY</span>
                  <span className="text-xs text-[#00ffff] font-bold">STAGE 2 COATING</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Encodes output telemetry into encrypted Benthic byte streams.
                </p>
                <div className="w-full h-2 bg-[#030606] border border-[#3a4a49] overflow-hidden p-0.5">
                  <div className="h-full bg-[#00ffff] w-[85%]" />
                </div>
              </div>
            </div>

            <div className="chitin-card-inset p-4 chamfer-corner space-y-3 border border-[#3a4a49]">
              <h3 className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#ff5540]" />
                FORCE-FIELD PARAMETER CALIBRATION
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#839493]">Submergence Frequency Attenuation</span>
                    <span className="text-[#00ffff] font-bold">8.4 kHz</span>
                  </div>
                  <input type="range" min="1" max="10" defaultValue="8" className="w-full accent-[#00ffff] bg-[#030606]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#839493]">Empathy Signal Dampening</span>
                    <span className="text-[#ff0000] font-bold">MAXIMUM</span>
                  </div>
                  <input type="range" min="1" max="10" defaultValue="10" className="w-full accent-[#ff0000] bg-[#030606]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widget (4 cols) */}
        <div className="lg:col-span-4">
          <IsolationShellWidget />
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/isolation')({
  component: IsolationRoute,
})
