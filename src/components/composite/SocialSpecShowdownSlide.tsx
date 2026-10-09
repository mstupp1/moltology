import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { isCrabMascot } from '@/lib/mascots'
import { displayCopy } from '@/lib/composite-copy'
import {
  CompositeBrand,
  CompositeBullets,
  CompositeFooter,
  CompositeHeadline,
  CompositeLabel,
  CompositePanel,
  CompositePill,
} from './CompositeKit'

export interface SpecCard {
  number: string
  title: string
  metric: string
  submetric?: string
  description: string
  bullets?: string[]
  variant?: 'red' | 'cyan' | 'sky' | 'dark'
}

export interface SocialSpecShowdownSlideProps {
  aspectRatio?: CompositeAspectRatio
  categoryBadge?: string
  headline?: string
  cards?: SpecCard[]
  mascot?: MascotKey
  backgroundImageUrl?: string
  swipeCta?: string
}

export const SocialSpecShowdownSlide: React.FC<SocialSpecShowdownSlideProps> = ({
  aspectRatio = '4:5',
  categoryBadge = 'ARCHITECTURAL TEARDOWN',
  headline = 'DENSE ATTENTION vs. MLA',
  cards = [
    {
      number: '01',
      title: 'TERRESTRIAL DENSE ATTENTION (LEGACY)',
      metric: '78.4 GB / REQUEST',
      description: 'Full-rank Key & Value tensors stored for all 128 attention heads. Chokes HBM bandwidth and triggers out-of-memory cascades.',
      variant: 'red',
    },
    {
      number: '02',
      title: 'SUB-BENTHIC MULTI-HEAD LATENT ATTENTION (MLA)',
      metric: '11.7 GB (-85.1% MEMORY)',
      description: 'Compresses Key-Value state into a low-rank shared latent vector (d_c=512). Decompresses on-the-fly inside matrix cores with zero memory overhead.',
      variant: 'cyan',
    },
    {
      number: '03',
      title: 'TIERED CONTEXT MEMORY (CMX)',
      metric: '94.2% PRUNING ACCURACY',
      description: 'Subsea tiered optical NVMe caching retains active deliberation search trees with zero memory stalls.',
      bullets: [
        '100x deeper Monte Carlo tree search',
        '< 0.18 ms subsea optical recall latency',
        '1.2M+ active reasoning tokens retained',
      ],
      variant: 'sky',
    },
  ],
  mascot = 'crab_stats',
  backgroundImageUrl,
  swipeCta = 'Swipe for the protocol',
}) => {
  const hasMascot = Boolean(mascot && mascot !== 'none')
  return (
    <CompositeContainer aspectRatio={aspectRatio} backgroundImageUrl={backgroundImageUrl}>
      <div className="flex items-start justify-between gap-6">
        <CompositePill>{categoryBadge}</CompositePill>
        <CompositeBrand size="sm" />
      </div>

      <CompositeHeadline lines={[headline]} size={76} className="mt-7" />

      <div className={`flex flex-1 flex-col justify-center gap-5 py-8 ${hasMascot ? 'w-[66%]' : ''}`}>
        {cards.map((card, idx) => {
          const tone = card.variant === 'red' ? 'crimson' : card.variant === 'dark' ? 'neutral' : 'cyan'
          return (
            <CompositePanel key={idx} tone={card.variant === 'sky' ? 'neutral' : tone} featured={card.variant === 'cyan'} className="p-6">
              <div className="flex items-baseline gap-4">
                <span className="text-[18px] font-bold tabular-nums text-ink-muted">{card.number}</span>
                <CompositeLabel tone={tone}>{displayCopy(card.title)}</CompositeLabel>
              </div>
              <div className="mt-3 text-[46px] font-bold leading-[1.05] tracking-[-0.02em] text-ink">{displayCopy(card.metric)}</div>
              {card.description && (
                <p className="mt-2.5 text-[20px] leading-snug text-ink-body">{displayCopy(card.description)}</p>
              )}
              {card.bullets && <CompositeBullets items={card.bullets} size={19} className="mt-3 space-y-2" />}
            </CompositePanel>
          )
        })}
      </div>

      <CompositeFooter cue={swipeCta} right={null} className={hasMascot ? 'w-[66%]' : ''} />

      <MascotOverlay
        mascot={mascot}
        position="bottom-right"
        width={isCrabMascot(mascot) ? 360 : 300}
        glow={false}
        className="bottom-6 right-4"
      />
    </CompositeContainer>
  )
}
