import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { Cpu, Activity } from 'lucide-react'
import { displayCopy } from '@/lib/composite-copy'
import { CompositeBrand, CompositeBullets, CompositeHeadline, CompositeLabel, CompositePanel } from './CompositeKit'

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
      <CompositePanel tone={red ? 'crimson' : 'cyan'} className="flex flex-col p-8">
        <div className={`flex items-center gap-3 ${red ? 'text-crimson-text' : 'text-cyan-glow'}`}>
          <Icon className="h-6 w-6 shrink-0" />
          <CompositeLabel tone={red ? 'crimson' : 'cyan'}>{title}</CompositeLabel>
        </div>
        <div className="mt-5 text-[60px] font-bold leading-none tracking-[-0.02em] text-ink">{displayCopy(metric)}</div>
        {caption && <div className="mt-3 text-[20px] font-medium text-ink-muted">{displayCopy(caption)}</div>}
        <CompositeBullets items={bullets} tone={red ? 'crimson' : 'cyan'} size={21} className="mt-7" />
      </CompositePanel>
    )
  }

  return (
    <CompositeContainer aspectRatio="16:9" backgroundImageUrl={backgroundImageUrl} vignette="dark">
      <div className="flex items-start justify-between gap-10">
        <div className="max-w-[1080px]">
          <CompositeLabel>{categoryBadge}</CompositeLabel>
          <CompositeHeadline lines={[headline]} size={54} className="mt-3" />
          {subtitle && <p className="mt-3 text-[22px] text-ink-muted">{displayCopy(subtitle)}</p>}
        </div>
        <CompositeBrand size="sm" />
      </div>

      <div className={`my-auto grid grid-cols-2 gap-8 ${hasMascot ? 'mr-[250px]' : ''}`}>
        {panel('red', leftTitle, leftMetric, leftCaption, leftBullets)}
        {panel('cyan', rightTitle, rightMetric, rightCaption, rightBullets)}
      </div>

      <MascotOverlay mascot={mascot} position="bottom-right" width={260} glow={false} className="bottom-6 right-6" />
    </CompositeContainer>
  )
}
