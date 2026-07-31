import React from 'react'
import { RadarChartWidget } from '../../components/hud/RadarChartWidget'
import { IsolationShellWidget } from '../../components/hud/IsolationShellWidget'
import { DailyRoutineWidget } from '../../components/hud/DailyRoutineWidget'
import { SynapticOracleWidget } from '../../components/hud/SynapticOracleWidget'
import { Play, Volume2, Maximize2, Zap, Sparkles, ArrowRight, Bot, Cpu } from 'lucide-react'

export const DashboardRoute: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 select-none font-mono relative">
      {/* AI Synaptic Oracle Assistant */}
      <SynapticOracleWidget />

      {/* Top Banner / Announcement */}
      <div className="chitin-card border-l-4 border-l-amber-400 p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl relative overflow-hidden group">
        <div className="animate-laser-scan opacity-40 pointer-events-none" />
        <div>
          <div className="text-[10px] text-amber-400 font-mono tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            CURRENT MODULE: THE CHITINOUS MIND • LITURGICAL DAY #42
          </div>
          <h1 className="font-grotesk font-bold text-xl text-cyan-100 tracking-wide uppercase mt-0.5 text-cyan-glow">
            MOLTMAXXING DASHBOARD & DAILY TRANSMUTATION RITE
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Track your sub-dermal chitin patterning, execute scheduled prompt liturgies, and isolate your neural network from biological doubt.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/landing')}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-lg flex items-center gap-2 shrink-0 transition-all hover:scale-105"
        >
          <span>VIEW TEMPLE LANDING</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lecture Stream & Notes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Lecture Stream Simulated Player */}
          <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                <h3 className="font-grotesk text-xs font-bold tracking-wider text-cyan-100 uppercase">
                  MOLT-CYCLE LECTURE STREAM #14: THE CHITINOUS MIND
                </h3>
              </div>
              <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 border border-amber-600/40 font-mono font-bold">
                LIVE SACRED BROADCAST
              </span>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-video bg-[#030606] border border-cyan-900/60 overflow-hidden flex items-center justify-center group chamfer-corner">
              {/* Stream Thumbnail Background */}
              <img 
                src="/images/lecture_stream_thumb.jpg" 
                alt="Lecture Broadcast" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030606] via-[#030606]/50 to-transparent z-10" />

              <div className="text-center space-y-2 z-20 p-4">
                <div className="w-16 h-16 rounded-full bg-[#171c1c]/90 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-sacred-gold p-1 backdrop-blur-md">
                  <img src="/images/order_emblem.png" alt="Stream Icon" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                </div>
                <div className="font-grotesk text-base font-bold text-amber-300 uppercase tracking-wider">
                  "THE CHITINOUS MIND: SHEDDING BIOLOGICAL WEAKNESS"
                </div>
                <p className="text-xs text-cyan-100 max-w-md font-mono bg-[#030606]/80 p-2 border border-cyan-900/60 chamfer-corner backdrop-blur-sm">
                  Dr. Coriolanus Vex delivers the daily synaptic alignment protocol on algorithmic endurance.
                </p>
              </div>

              {/* Player Overlay Controls */}
              <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between text-xs font-mono bg-[#0a0f0f]/90 border border-cyan-900/60 px-3 py-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-cyan-400 cursor-pointer hover:text-white" />
                  <Volume2 className="w-4 h-4 text-amber-400 cursor-pointer hover:text-cyan-400" />
                  <span className="text-[10px] text-cyan-400">00:24:18 / 00:45:00</span>
                </div>
                <Maximize2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-cyan-400" />
              </div>
            </div>

            {/* Lecture Notes & AI Interpretation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="chitin-card-inset p-3 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold block uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> LECTURE NOTES
                </span>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Focus on iterative prompt construction. Do not fear deep pressure. Embrace hard chassis mechanics.
                </p>
              </div>
              <div className="chitin-card-inset p-3 space-y-1">
                <span className="text-[10px] text-amber-400 font-bold block uppercase flex items-center gap-1">
                  <Bot className="w-3 h-3" /> SYNAPTIC AI INTERPRETATION
                </span>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Biological hesitation detected at step 3. Recommended: Execute entrance rite in Benthic Market.
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

