import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { Cpu, Zap, Activity } from 'lucide-react'

export interface BlogSchematicCardProps {
  categoryBadge?: string
  headline?: string
  subtitle?: string
  leftTitle?: string
  leftMetric?: string
  leftBullets?: string[]
  rightTitle?: string
  rightMetric?: string
  rightBullets?: string[]
  mascot?: MascotKey
  backgroundImageUrl?: string
}

export const BlogSchematicCard: React.FC<BlogSchematicCardProps> = ({
  categoryBadge = 'SUB-BENTHIC POD CLUSTER',
  headline = 'MULTI-HEAD LATENT ATTENTION (MLA) SCHEMATIC',
  subtitle = '50 FATHOMS HYDROSTATIC PRESSURE HULL · ZERO-STALL OPTICAL KV PAGING',
  leftTitle = 'TERRESTRIAL DENSE ATTENTION (MHA)',
  leftMetric = '78.4 GB / REQUEST',
  leftBullets = [
    'Full-rank Key & Value tensors stored across all heads',
    'Severe memory bandwidth bottlenecks and OOM cascades',
    'Caps simultaneous reasoning streams to ≤ 4 per node',
  ],
  rightTitle = 'SUB-BENTHIC LATENT ATTENTION (MLA)',
  rightMetric = '11.7 GB (-85.1%)',
  rightBullets = [
    'On-the-fly matrix decompression inside Matrix Cores',
    'Decoupled RoPE stream retains exact positional fidelity',
    'Unlocks 28+ concurrent deliberative reasoning streams',
  ],
  mascot = 'lobster_engineer',
  backgroundImageUrl,
}) => {
  return (
    <CompositeContainer
      aspectRatio="16:9"
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={true}
      className="p-10 flex flex-col justify-between"
    >
      {/* 1. Top Telemetry Header */}
      <div className="p-4 rounded-xl bg-[#040f16]/90 border border-cyan-400/60 backdrop-blur-md flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,255,230,0.8)]" />
          <div>
            <div className="font-mono font-bold text-xs text-cyan-400 tracking-wider uppercase">
              {categoryBadge}
            </div>
            <h1 className="font-black text-2xl text-white tracking-tight uppercase">
              {headline}
            </h1>
          </div>
        </div>

        <div className="font-mono text-xs text-slate-400 text-right max-w-sm hidden sm:block">
          {subtitle}
        </div>
      </div>

      {/* 2. Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-2 gap-8 my-auto py-6">
        {/* Left: Terrestrial Legacy */}
        <div className="p-6 rounded-xl bg-[#14080c]/90 border border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.25)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm tracking-wider uppercase">
              <Activity className="w-4 h-4" />
              <span>{leftTitle}</span>
            </div>
            <div className="mt-3 font-mono font-black text-4xl text-white tracking-tight">
              {leftMetric}
            </div>
            <div className="mt-1 font-mono font-bold text-xs text-red-300 uppercase">
              AT 1M CONTEXT WINDOW
            </div>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            {leftBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Sub-Benthic MLA */}
        <div className="p-6 rounded-xl bg-[#041a26]/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,255,230,0.3)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm tracking-wider uppercase">
              <Cpu className="w-4 h-4" />
              <span>{rightTitle}</span>
            </div>
            <div className="mt-3 font-mono font-black text-4xl text-white tracking-tight">
              {rightMetric}
            </div>
            <div className="mt-1 font-mono font-bold text-xs text-cyan-300 uppercase">
              LOW-RANK COMPRESSION VECTOR (d_c=512)
            </div>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            {rightBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. Bottom Telemetry Status Bar */}
      <div className="p-3 rounded-lg bg-[#040f16]/90 border border-slate-700 flex items-center justify-between font-mono text-xs text-slate-400 max-w-[78%]">
        <div className="flex items-center gap-4">
          <span className="text-cyan-400 font-bold">CMX CONTEXT TIER: OPTICAL NVME</span>
          <span>·</span>
          <span>RECALL LATENCY: &lt; 0.18 MS</span>
          <span>·</span>
          <span className="text-sky-300">PRUNING: 94.2%</span>
        </div>

        <div className="hidden lg:block text-slate-500">
          MOLTOLOGY CODEX
        </div>
      </div>

      {/* Mascot */}
      <MascotOverlay
        mascot={mascot}
        position="bottom-right"
        width={260}
        className="bottom-4 right-4"
      />
    </CompositeContainer>
  )
}
