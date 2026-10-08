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
  leftCaption?: string
  rightCaption?: string
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
  leftCaption = 'At 1M context window',
  rightCaption = 'Low-rank compression vector (d_c=512)',
  mascot = 'lobster_engineer',
  backgroundImageUrl,
}) => {
  const hasMascot = Boolean(mascot && mascot !== 'none')
  const panel = (tone: 'red' | 'cyan', title: string, metric: string, caption: string, bullets: string[]) => {
    const red = tone === 'red'
    const Icon = red ? Activity : Cpu
    return (
      <div
        className={`p-8 rounded-2xl flex flex-col ${
          red
            ? 'bg-[#14080c]/90 border border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.18)]'
            : 'bg-[#041a26]/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,195,255,0.28)]'
        }`}
      >
        <div className={`flex items-center gap-2.5 font-mono font-bold text-lg tracking-wider uppercase ${red ? 'text-red-400' : 'text-cyan-400'}`}>
          <Icon className="w-6 h-6 shrink-0" />
          <span>{title}</span>
        </div>
        <div className="mt-4 font-mono font-black text-6xl text-white tracking-tight leading-none">{metric}</div>
        {caption && (
          <div className={`mt-3 font-mono font-bold text-base uppercase tracking-wide ${red ? 'text-red-300' : 'text-cyan-300'}`}>
            {caption}
          </div>
        )}
        <ul className="mt-7 space-y-3 text-xl leading-snug text-slate-200">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${red ? 'bg-red-400' : 'bg-cyan-400'}`} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <CompositeContainer
      aspectRatio="16:9"
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
    >
      {/* 1. Header: badge, headline and the (previously unused) subtitle */}
      <div className={hasMascot ? 'pr-[300px]' : ''}>
        <div className="font-mono font-bold text-lg text-cyan-400 tracking-[0.18em] uppercase">{categoryBadge}</div>
        <h1 className="font-black text-5xl text-white tracking-tight uppercase mt-2 leading-[1.05] [text-wrap:balance]">
          {headline}
        </h1>
        {subtitle && <p className="mt-3 font-mono text-lg text-slate-400 tracking-wide uppercase">{subtitle}</p>}
      </div>

      {/* 2. Side-by-side panels; the right column is left clear for the mascot */}
      <div className={`grid grid-cols-2 gap-8 my-auto ${hasMascot ? 'mr-[250px]' : ''}`}>
        {panel('red', leftTitle, leftMetric, leftCaption, leftBullets)}
        {panel('cyan', rightTitle, rightMetric, rightCaption, rightBullets)}
      </div>

      <MascotOverlay mascot={mascot} position="bottom-right" width={300} className="bottom-6 right-6" />
    </CompositeContainer>
  )
}
