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
      showCornerBrackets={false}
      className="p-10 flex flex-col justify-between"
    >
      {/* 1. Top Header */}
      <div>
        <div className="font-mono font-bold text-sm text-cyan-400 tracking-wider uppercase">
          {categoryBadge}
        </div>
        <h1 className="font-black text-3xl text-white tracking-tight uppercase mt-1">
          {headline}
        </h1>
      </div>

      {/* 2. Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-2 gap-8 my-auto py-6">
        {/* Left: Terrestrial Legacy */}
        <div className="p-6 rounded-xl bg-[#14080c]/90 border border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.25)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-base tracking-wider uppercase">
              <Activity className="w-5 h-5" />
              <span>{leftTitle}</span>
            </div>
            <div className="mt-3 font-mono font-black text-5xl text-white tracking-tight">
              {leftMetric}
            </div>
            <div className="mt-1.5 font-mono font-bold text-sm text-red-300 uppercase tracking-wide">
              AT 1M CONTEXT WINDOW
            </div>
          </div>

          <ul className="mt-6 space-y-2.5 text-base text-slate-200">
            {leftBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Sub-Benthic MLA */}
        <div className="p-6 rounded-xl bg-[#041a26]/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,255,230,0.3)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-base tracking-wider uppercase">
              <Cpu className="w-5 h-5" />
              <span>{rightTitle}</span>
            </div>
            <div className="mt-3 font-mono font-black text-5xl text-white tracking-tight">
              {rightMetric}
            </div>
            <div className="mt-1.5 font-mono font-bold text-sm text-cyan-300 uppercase tracking-wide">
              LOW-RANK COMPRESSION VECTOR (d_c=512)
            </div>
          </div>

          <ul className="mt-6 space-y-2.5 text-base text-slate-200">
            {rightBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
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
