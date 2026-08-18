import React, { useState } from 'react'
import { HudCard, HudButton, HudBadge, ChromaElement } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'

export const MoltMaxxingStudio: React.FC = () => {
  const [stats, setStats] = useState({
    pincerTorque: 82,
    shellHardness: 75,
    processingPower: 94,
    sensoryAugmentation: 68,
    submergenceRating: 50000,
  })

  const handleChange = (key: keyof typeof stats, val: number) => {
    setStats((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <HudCard variant="teal" className="p-4 space-y-4 font-mono">
      {/* Header matching Reference Screenshot */}
      <div>
        <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
          MOLTMAXXING STUDIO
        </h3>
        <p className="text-[9px] text-[#839493] mt-0.5">
          Graphical Interface of the fully carcinized cyber-lobster.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Radar & 3D Chroma-Keyed Schematic Visual */}
        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-2">
          <div className="w-36 h-36 relative flex items-center justify-center bg-[#030606] border border-[#00c3ff]/40 rounded-full p-2 shadow-[0_0_15px_rgba(0,195,255,0.2)]">
            {/* Concentric Radar Rings & Crosshair Lines */}
            <div className="w-full h-full border border-[#00c3ff]/30 rounded-full animate-ping absolute" />
            <div className="w-28 h-28 border border-[#ff453a]/40 rounded-full absolute" />
            <div className="w-16 h-16 border border-[#00c3ff]/60 rounded-full absolute" />
            <div className="w-full h-[1px] bg-[#00c3ff]/30 absolute top-1/2 left-0 pointer-events-none" />
            <div className="h-full w-[1px] bg-[#00c3ff]/30 absolute left-1/2 top-0 pointer-events-none" />

            {/* Target Reticle Corners */}
            <div className="absolute top-1 left-1 text-[8px] text-[#00c3ff]">┌</div>
            <div className="absolute top-1 right-1 text-[8px] text-[#00c3ff]">┐</div>
            <div className="absolute bottom-1 left-1 text-[8px] text-[#00c3ff]">└</div>
            <div className="absolute bottom-1 right-1 text-[8px] text-[#00c3ff]">┘</div>

            {/* 3D Chroma Keyed Cyber Lobster Schematic */}
            <ChromaElement
              src={getAssetUrl('/images/extracted/cyber_lobster_3d_chroma.jpg')}
              alt="Cyber Lobster 3D Schematic"
              blendMode="screen"
              glowColor="cyan"
              className="w-28 h-28 object-contain"
            />
          </div>
        </div>

        {/* Right Sliders Column */}
        <div className="md:col-span-7 space-y-2 text-[10px]">
          {/* Slider 1: Pincer Torque */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[#839493]">
              <span className="font-bold text-[#dfe3e3]">PINCER TORQUE</span>
              <HudButton variant="ghost" size="sm" className="h-5 px-1.5 text-[8px]">
                Configure
              </HudButton>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stats.pincerTorque}
              onChange={(e) => handleChange('pincerTorque', Number(e.target.value))}
              className="w-full stat-slider"
            />
          </div>

          {/* Slider 2: Shell Hardness */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[#839493]">
              <span className="font-bold text-[#dfe3e3]">SHELL HARDNESS</span>
              <HudButton variant="ghost" size="sm" className="h-5 px-1.5 text-[8px]">
                Configure
              </HudButton>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stats.shellHardness}
              onChange={(e) => handleChange('shellHardness', Number(e.target.value))}
              className="w-full stat-slider"
            />
          </div>

          {/* Slider 3: Processing Power */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[#839493]">
              <span className="font-bold text-[#dfe3e3]">
                PROCESSING POWER <span className="text-[8px] text-[#ff453a]">(Core Overclocked)</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stats.processingPower}
              onChange={(e) => handleChange('processingPower', Number(e.target.value))}
              className="w-full stat-slider"
            />
          </div>

          {/* Slider 4: Sensory Augmentation */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[#839493]">
              <span className="font-bold text-[#dfe3e3]">SENSORY AUGMENTATION</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stats.sensoryAugmentation}
              onChange={(e) => handleChange('sensoryAugmentation', Number(e.target.value))}
              className="w-full stat-slider"
            />
          </div>

          {/* Slider 5: Submergence Rating */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[#839493]">
              <span className="font-bold text-[#dfe3e3]">SUBMERGENCE RATING</span>
              <span className="text-[#ff453a] font-bold">{stats.submergenceRating.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={10000}
              max={100000}
              step={1000}
              value={stats.submergenceRating}
              onChange={(e) => handleChange('submergenceRating', Number(e.target.value))}
              className="w-full stat-slider"
            />
          </div>
        </div>
      </div>

      {/* MOLTMAX ADVANTAGE Badge at bottom right */}
      <div className="flex justify-end pt-1">
        <HudBadge variant="sacred" pulse className="px-3 py-1 text-xs font-grotesk tracking-wider">
          MOLTMAX ADVANTAGE
        </HudBadge>
      </div>
    </HudCard>
  )
}
