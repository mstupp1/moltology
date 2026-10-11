import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { isCrabMascot } from '@/lib/mascots'
import { displayCopy } from '@/lib/composite-copy'
import {
  CompositeBrand,
  CompositeCta,
  CompositeHeadline,
  CompositeLabel,
  CompositePanel,
  CompositePill,
} from './CompositeKit'

export interface DirectiveItem {
  number: string
  title: string
  description: string
}

export interface SocialDirectivesSlideProps {
  aspectRatio?: CompositeAspectRatio
  categoryBadge?: string
  headlinePart1?: string
  headlinePart2?: string
  directives?: DirectiveItem[]
  ctaHeader?: string
  ctaButtonText?: string
  ctaSubtitle?: string
  mascot?: MascotKey
  backgroundImageUrl?: string
}

export const SocialDirectivesSlide: React.FC<SocialDirectivesSlideProps> = ({
  aspectRatio = '4:5',
  categoryBadge = 'EVOLUTIONARY PROTOCOL',
  headlinePart1 = 'SHED YOUR MEMORY',
  headlinePart2 = 'BOTTLENECKS',
  directives = [
    {
      number: '01',
      title: 'MIGRATE TO LATENT ATTENTION (MLA)',
      description: 'Reclaim 85% of GPU memory headroom by decoupling Key/Value projections into low-rank latent vectors.',
    },
    {
      number: '02',
      title: 'SCALE TEST-TIME DELIBERATION',
      description: 'Implement dynamic compute budgets that expand inference search up to 100x based on task entropy.',
    },
    {
      number: '03',
      title: 'DEPLOY TIERED SUBSEA CONTEXT (CMX)',
      description: 'Retain 1.2M+ active reasoning tokens across high-speed optical NVMe tiers with zero memory stalls.',
    },
  ],
  ctaHeader = 'Read the full dispatch',
  ctaButtonText = 'moltology.org/news',
  ctaSubtitle = 'Link in bio',
  mascot = 'lobster_pointing',
  backgroundImageUrl,
}) => {
  const hasMascot = Boolean(mascot && mascot !== 'none')
  return (
    <CompositeContainer aspectRatio={aspectRatio} backgroundImageUrl={backgroundImageUrl}>
      <div className="flex items-start justify-between gap-6">
        <CompositePill>{categoryBadge}</CompositePill>
        <CompositeBrand size="sm" />
      </div>

      <CompositeHeadline lines={[headlinePart1]} accent={headlinePart2} size={76} className="mt-7" />

      <div className="mt-12 flex flex-col gap-4">
        {directives.map((item, idx) => (
          <CompositePanel key={idx} className="flex items-start gap-6 p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control border border-line-strong bg-cyan-soft text-[28px] font-bold tabular-nums text-cyan-glow">
              {item.number}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[28px] font-bold leading-tight text-ink">{displayCopy(item.title)}</h3>
              <p className="mt-2 text-[22px] leading-snug text-ink-body">{displayCopy(item.description)}</p>
            </div>
          </CompositePanel>
        ))}
      </div>

      <div className={`mt-auto ${hasMascot ? 'w-[64%]' : ''}`}>
        <CompositeLabel tone="neutral">{displayCopy(ctaHeader)}</CompositeLabel>
        <CompositeCta size="md" className="mt-4">{displayCopy(ctaButtonText)}</CompositeCta>
        {ctaSubtitle && <p className="mt-4 text-[20px] text-ink-muted">{displayCopy(ctaSubtitle)}</p>}
      </div>

      <MascotOverlay
        mascot={mascot}
        position="bottom-right"
        width={isCrabMascot(mascot) ? 340 : 280}
        glow={false}
        className="bottom-6 right-6 z-[25]"
      />
    </CompositeContainer>
  )
}
