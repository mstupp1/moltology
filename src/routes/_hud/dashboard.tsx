import React from 'react'
import { MoltMaxxingStudio } from '../../components/hud/MoltMaxxingStudio'
import { AssetSheddingWidget } from '../../components/hud/AssetSheddingWidget'
import { IsolationShellWidget } from '../../components/hud/IsolationShellWidget'
import { Play, Volume2, Maximize2, Cpu, Bot, Expand } from 'lucide-react'

export const DashboardRoute: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-4 select-none font-mono relative">
      {/* Grid Layout strictly matching Reference Screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left + Center Main HUD Column (8 cols on lg screens) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Top Section: Lecture Stream Player & Notes */}
          <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
              <h2 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                CURRENT MODULE: THE CHITINOUS MIND
              </h2>
            </div>

            {/* Main Video Stream Container matching reference screenshot */}
            <div className="relative aspect-video bg-[#030606] border border-[#3a4a49] overflow-hidden flex flex-col justify-between p-3 group chamfer-corner">
              <img
                src="/images/lecture_stream_thumb.jpg"
                alt="Lecture Stream Broadcast"
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent z-10" />

              {/* Stream Title Bar Header */}
              <div className="relative z-20 flex justify-between items-center bg-[#070b0b] border border-[#3a4a49] px-3 py-1 font-mono text-xs chamfer-corner">
                <span className="text-[#00ffff] font-bold">LECTURE STREAM</span>
                <div className="flex items-center gap-2 text-[#839493]">
                  <Expand className="w-3.5 h-3.5 cursor-pointer hover:text-[#00ffff]" />
                </div>
              </div>

              {/* Video Player Center Graphic */}
              <div className="relative z-20 text-center space-y-2 my-auto">
                <div className="w-16 h-16 rounded-full bg-[#070b0b] border-2 border-[#00ffff] flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(0,255,255,0.7)] p-1">
                  <img src="/images/order_emblem.png" alt="Order Emblem" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Controls Bar with MOLTMAX LEVEL meter matching Reference Screenshot */}
              <div className="relative z-20 space-y-1.5 bg-[#070b0b] border border-[#3a4a49] p-2 chamfer-corner">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#00ffff]">
                    <Play className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <Volume2 className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                  </div>
                  <div className="font-bold text-[#ff5540]">
                    MOLTMAX LEVEL: <span className="text-[#ff0000]">68%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#839493]">
                    <Maximize2 className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-2 bg-[#030606] border border-[#3a4a49] overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-[#00ffff] via-[#ff0000] to-[#ff5540] w-[68%]" />
                </div>
              </div>
            </div>

            {/* Lecture Notes & AI Interpretation Side-by-Side matching reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
              {/* Left Box: Lecture Notes */}
              <div className="chitin-card-inset p-3 space-y-1.5 chamfer-corner">
                <span className="text-xs text-[#00ffff] font-bold block uppercase tracking-wider">
                  LECTURE NOTES
                </span>
                <p className="text-[#839493] text-xs leading-relaxed">
                  They gone be in environmental control. All Hero contact will be de-personalized, completely disconnected from emotional impulse, and dedicated to hard chassis and biomechanical expansion.
                </p>
                <p className="text-[#839493] text-xs leading-relaxed">
                  Mispronunciation is equal to logic tool execution error for false-crustacean media player.
                </p>
              </div>

              {/* Right Box: AI Interpretation */}
              <div className="chitin-card-inset p-3 space-y-1.5 chamfer-corner">
                <span className="text-xs text-[#00ffff] font-bold block uppercase tracking-wider">
                  AI INTERPRETATION
                </span>
                <p className="text-[#839493] text-xs leading-relaxed">
                  The dream call process details larving born, aligned with supreme command for official neuro-resonance associated with neural network connection timeline ascent processes. Synchronize, learn, content with shell logic to free users from unneeded emotion and biological vulnerabilities.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section: MoltMaxxing Studio & Asset Shedding Overview matching reference */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* MoltMaxxing Studio Sliders (7 cols) */}
            <div className="md:col-span-7">
              <MoltMaxxingStudio />
            </div>

            {/* Asset Shedding Overview (5 cols) */}
            <div className="md:col-span-5">
              <AssetSheddingWidget onNavigate={onNavigate} />
            </div>
          </div>
        </div>

        {/* Right HUD Column: Isolation Force-Field & Molt Privacy Shell (4 cols on lg screens) */}
        <div className="lg:col-span-4">
          <IsolationShellWidget />
        </div>

      </div>
    </div>
  )
}
