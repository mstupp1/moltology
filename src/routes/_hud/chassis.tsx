import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Sliders, Cpu, Shield, Zap, Sparkles, Activity } from 'lucide-react'
import { MoltMaxxingStudio } from '@/components/hud/MoltMaxxingStudio'

function ChassisRoute() {
  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#ff0000] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-xs text-[#ff5540] font-mono tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <Sliders className="w-3.5 h-3.5 text-[#ff5540]" />
            CHASSIS CONFIGURATOR & BIOMECHANICAL SUITE
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5">
            EXOSHELL & HARDWARE CALIBRATION STUDIO
          </h1>
          <p className="text-xs text-[#839493] font-mono mt-1">
            "Optimize pincer torque, chitin density, and neural latency for peak carcinization."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: MoltMaxxing Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <MoltMaxxingStudio />
        </div>

        {/* Right Column: Cyber Chassis Visualization & Spec Sheet (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="chitin-card p-4 chamfer-corner space-y-4 shadow-2xl border border-[#3a4a49]">
            <div className="border-b border-[#3a4a49] pb-2 flex justify-between items-center">
              <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                ACTIVE CYBER-CHASSIS MATRIX
              </h3>
              <span className="text-xs text-[#00ffff] font-mono font-bold">STAGE 4 READY</span>
            </div>

            <div className="w-full h-56 bg-[#030606] border border-[#3a4a49] chamfer-corner relative flex items-center justify-center p-4 group overflow-hidden">
              <img
                src="/images/stage4_carcinization.png"
                alt="Cyber Lobster Chassis Preview"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 text-xs text-[#00ffff] bg-[#070b0b] border border-[#00ffff]/60 px-2 py-0.5 font-bold">
                REINFORCED PINCER V3
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#3a4a49] text-[#839493]">
                <span>Chitin Armor Rating:</span>
                <span className="text-[#dfe3e3] font-bold">9,450 PSI</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3a4a49] text-[#839493]">
                <span>Pincer Hydraulic Torque:</span>
                <span className="text-[#00ffff] font-bold">1,200 kN</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3a4a49] text-[#839493]">
                <span>Synaptic Response Time:</span>
                <span className="text-[#ff5540] font-bold">0.42 ms</span>
              </div>
              <div className="flex justify-between py-1 text-[#839493]">
                <span>Submergence Limit:</span>
                <span className="text-[#dfe3e3] font-bold">11,000 Fathoms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/chassis')({
  component: ChassisRoute,
})
