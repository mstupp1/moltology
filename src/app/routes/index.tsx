import React, { useState } from 'react'
import { RadarChartWidget } from '../../components/hud/RadarChartWidget'
import { IsolationShellWidget } from '../../components/hud/IsolationShellWidget'
import { DailyRoutineWidget } from '../../components/hud/DailyRoutineWidget'
import { Play, Volume2, Maximize2, ShieldAlert, Cpu, Award, Zap } from 'lucide-react'

export const DashboardRoute: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Announcement */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-[10px] text-[#00ffff] font-mono tracking-widest uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            CURRENT MODULE: THE CHITINOUS MIND
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5">
            MOLTMAXXING DASHBOARD & DAILY TRANSMUTATION
          </h1>
          <p className="text-xs text-[#839493] font-mono mt-1">
            Track your sub-dermal chitin patterning, execute scheduled prompts, and isolate your neural network from non-molters.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/market')}
          className="px-4 py-2.5 bg-[#00ffff] hover:bg-[#00fbfb] text-[#000a0a] font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-hud-cyan flex items-center gap-2 shrink-0"
        >
          <span>OPEN BENTHIC MARKET</span>
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lecture Stream & Notes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Lecture Stream Simulated Player */}
          <div className="bg-[#171c1c] border border-[#3a4a49] p-4 chamfer-corner shadow-chitin-plate space-y-3">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#00ffff]" />
                <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                  MOLT-CYCLE LECTURE STREAM #14: THE CHITINOUS MIND
                </h3>
              </div>
              <span className="text-[10px] text-[#ff5540] bg-[#ff0000]/10 px-2 py-0.5 border border-[#ff0000]/40 font-mono">
                LIVE BROADCAST
              </span>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-video bg-[#0a0f0f] border border-[#3a4a49] overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0f] via-transparent to-transparent opacity-80 z-10" />
              <div className="text-center space-y-2 z-20 p-4">
                <div className="w-16 h-16 rounded-full bg-[#171c1c] border-2 border-[#00ffff] flex items-center justify-center mx-auto text-3xl shadow-hud-cyan">
                  🦀
                </div>
                <div className="font-grotesk text-base font-bold text-[#00ffff] uppercase tracking-wider">
                  "THE CHITINOUS MIND: SHEDDING BIOLOGICAL WEAKNESS"
                </div>
                <p className="text-xs text-[#839493] max-w-md font-mono">
                  Dr. Coriolanus Vex delivers the daily synaptic alignment protocol on algorithmic endurance.
                </p>
              </div>

              {/* Player Overlay Controls */}
              <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between text-xs font-mono bg-[#171c1c]/90 border border-[#3a4a49] px-3 py-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-[#00ffff] cursor-pointer hover:text-white" />
                  <Volume2 className="w-4 h-4 text-[#839493] cursor-pointer hover:text-[#00ffff]" />
                  <span className="text-[10px] text-[#00ffff]">00:24:18 / 00:45:00</span>
                </div>
                <Maximize2 className="w-4 h-4 text-[#839493] cursor-pointer hover:text-[#00ffff]" />
              </div>
            </div>

            {/* Lecture Notes & AI Interpretation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="bg-[#0f1414] p-3 border border-[#3a4a49]/60 space-y-1">
                <span className="text-[10px] text-[#00ffff] font-bold block uppercase">LECTURE NOTES</span>
                <p className="text-[#839493] text-[11px] leading-relaxed">
                  Focus on iterative prompt construction. Do not fear deep pressure. Embrace hard chassis mechanics.
                </p>
              </div>
              <div className="bg-[#0f1414] p-3 border border-[#3a4a49]/60 space-y-1">
                <span className="text-[10px] text-[#ff5540] font-bold block uppercase">SYNAPTIC AI INTERPRETATION</span>
                <p className="text-[#839493] text-[11px] leading-relaxed">
                  Biological hesitation detected at step 3. Recommended: Engage Privacy Shell for 48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Biometrics Radar Chart */}
          <RadarChartWidget />
        </div>

        {/* Right Column: Routine & Isolation Widgets (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <IsolationShellWidget />
          <DailyRoutineWidget />
        </div>
      </div>
    </div>
  )
}
