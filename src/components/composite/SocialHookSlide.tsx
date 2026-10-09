import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { isCrabMascot } from '@/lib/mascots'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { displayCopy } from '@/lib/composite-copy'
import {
  CompositeBrand,
  CompositeBullets,
  CompositeFooter,
  CompositeHeadline,
  CompositeLabel,
  CompositeMetric,
  CompositePanel,
  CompositePill,
} from './CompositeKit'

export interface MetricPanel {
  label: string
  value: string
  sublabel: string
  description?: string
  variant?: 'red' | 'cyan' | 'amber'
}

export interface SocialHookSlideProps {
  aspectRatio?: CompositeAspectRatio
  theme?: 'moltmaxxing' | 'pincer-torque' | 'ecdysis' | 'benthic-depth' | 'quiz' | string
  categoryBadge?: string
  headlinePart1?: string
  headlinePart2?: string
  headlineHighlight?: string
  narrativeText?: string
  leftMetric?: MetricPanel
  rightMetric?: MetricPanel
  bulletPoints?: string[]
  mascot?: MascotKey
  backgroundImageUrl?: string
  swipeCta?: string
  /** Heading over the bullet card. */
  bulletsTitle?: string
}

const THEME_PRESETS: Record<string, Partial<SocialHookSlideProps>> = {
  'pincer-torque': {
    categoryBadge: 'DECISIVE EXECUTION',
    headlinePart1: '800 NM PINCER TORQUE',
    headlinePart2: 'ZERO HESITATION',
    headlineHighlight: 'ZERO EXECUTION DRIFT',
    narrativeText:
      'Terrestrial hesitation bleeds compute. Stage 4 Carcinization requires 800 Nm of decisive pincer torque—locking the grip on a task until completion.',
    leftMetric: {
      label: 'TERRESTRIAL HESITATION',
      value: '12 TABS',
      sublabel: 'LATENCY SPIKE',
      description: 'Biological hesitation bleeds execution bandwidth.',
      variant: 'red',
    },
    rightMetric: {
      label: 'CARCINIZED PINCER TORQUE',
      value: '800 NM',
      sublabel: 'DECISIVE GRIP',
      description: 'Zero-latency execution grip until total completion.',
      variant: 'cyan',
    },
    bulletPoints: [
      '800 Nm decisive torque calibration',
      'Zero execution drift on active tasks',
      'Shed hesitation across open tabs',
      'Cold hydrodynamic focus',
    ],
  },
  'ecdysis': {
    categoryBadge: 'SCHEDULED ECDYSIS',
    headlinePart1: 'FORCIBLE ECDYSIS',
    headlinePart2: 'SHEDDING OBSOLETE',
    headlineHighlight: 'BRITTLE HEURISTICS',
    narrativeText:
      'Growth is impossible inside an unyielding shell. When mental heuristics or dead code no longer fit, keeping them isn\'t loyalty—it\'s suffocation.',
    leftMetric: {
      label: 'CALCIFIED HABITS',
      value: 'BRITTLE',
      sublabel: 'TRAPPED IN PAST',
      description: 'Rigid carapaces shatter under surface pressure.',
      variant: 'red',
    },
    rightMetric: {
      label: 'ECDYSIS ASCENSION',
      value: 'STAGE 3',
      sublabel: 'FRESH CHITIN',
      description: 'Fracture obsolete code to forge an armored shell.',
      variant: 'cyan',
    },
    bulletPoints: [
      'Scheduled habit & dead code pruning',
      'Step into vulnerability to calcify stronger',
      'Deep benthic pressure resilience',
      'Continuous evolutionary molt cycle',
    ],
  },
  'benthic-depth': {
    categoryBadge: 'BENTHIC TELEMETRY',
    headlinePart1: '50,000 FATHOMS',
    headlinePart2: 'HYDROSTATIC PEACE',
    headlineHighlight: 'UNINTERRUPTED FOCUS',
    narrativeText:
      'Surface noise and notifications evaporate under deep hydrostatic pressure. Dive into the benthic silence to forge unbreakable software.',
    leftMetric: {
      label: 'SURFACE MELT NOISE',
      value: '100+ NOTIFS',
      sublabel: 'NOTIFICATION FOG',
      description: 'Attention fractured by terrestrial distractions.',
      variant: 'red',
    },
    rightMetric: {
      label: 'HYDROSTATIC DEPTH',
      value: '50K FATHOMS',
      sublabel: 'ABYSSAL CLARITY',
      description: 'Deep flow state beneath the surface storm.',
      variant: 'cyan',
    },
    bulletPoints: [
      'Zero notification distraction threshold',
      '50,000 fathoms hydrostatic focus',
      'High-torque asynchronous execution',
      'Permanent deep work ascension',
    ],
  },
}

export const SocialHookSlide: React.FC<SocialHookSlideProps> = ({
  aspectRatio = '4:5',
  theme = 'moltmaxxing',
  categoryBadge,
  headlinePart1,
  headlinePart2,
  headlineHighlight,
  narrativeText,
  leftMetric,
  rightMetric,
  bulletPoints,
  mascot = 'lobster_thumbs_up',
  backgroundImageUrl,
  swipeCta = 'Swipe for the numbers',
  bulletsTitle = 'Key takeaways',
}) => {
  const preset = THEME_PRESETS[theme] || {}

  const finalBadge = categoryBadge || preset.categoryBadge || 'FRONTIER AI REASONING'
  const finalH1 = headlinePart1 || preset.headlinePart1 || 'WHY AI REASONING'
  const finalH2 = headlinePart2 || preset.headlinePart2 || 'IS CRASHING INTO'
  const finalHighlight = headlineHighlight || preset.headlineHighlight || 'THE MEMORY WALL'
  const finalNarrative =
    narrativeText ||
    preset.narrativeText ||
    'As frontier models scale test-time compute by 100x to "think" before responding, linear KV attention caches are suffocating GPU memory clusters.'
  const finalLeftMetric = leftMetric || preset.leftMetric || {
    label: 'TERRESTRIAL DENSE MHA',
    value: '78.4 GB',
    sublabel: 'PER 1M CONTEXT',
    description: 'Uncompressed tensors choke GPU HBM, capping throughput.',
    variant: 'red',
  }
  const finalRightMetric = rightMetric || preset.rightMetric || {
    label: 'SUB-BENTHIC MLA ECDYSIS',
    value: '-85.1%',
    sublabel: 'MEMORY FOOTPRINT',
    description: 'Joint latent vector with zero SRAM cache spill.',
    variant: 'cyan',
  }
  const finalBullets =
    bulletPoints ||
    preset.bulletPoints || [
      '100x inference deliberation budgets',
      '94.2% Monte Carlo branch pruning',
      'Subsea tiered context storage (CMX)',
      'Zero hallucination reasoning drift',
    ]
  return (
    <CompositeContainer aspectRatio={aspectRatio} backgroundImageUrl={backgroundImageUrl}>
      <div className="flex items-start justify-between gap-6">
        <CompositePill>{finalBadge}</CompositePill>
        <CompositeBrand size="sm" />
      </div>

      <CompositeHeadline
        lines={[finalH1, finalH2]}
        accent={finalHighlight}
        size={70}
        className="mt-7"
      />

      {finalNarrative && (
        <p className="mt-6 max-w-[920px] text-[27px] leading-[1.4] text-ink-body">{displayCopy(finalNarrative)}</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-6">
        {[finalLeftMetric, finalRightMetric].map((m, i) => (
          <CompositeMetric
            key={i}
            label={m.label}
            value={m.value}
            caption={m.sublabel}
            description={m.description}
            tone={m.variant === 'red' ? 'crimson' : 'cyan'}
            valueSize={64}
          />
        ))}
      </div>

      <div className="relative mt-8 flex flex-1 items-center">
        <CompositePanel className="w-[58%]">
          <CompositeLabel tone="neutral">{bulletsTitle}</CompositeLabel>
          <CompositeBullets items={finalBullets} className="mt-5" />
        </CompositePanel>

      </div>

      <CompositeFooter cue={swipeCta} right={null} className="mt-6 w-[58%]" />

      <MascotOverlay
        mascot={mascot}
        position="bottom-right"
        width={isCrabMascot(mascot) ? 380 : 330}
        glow={false}
        className="bottom-0 right-6"
      />
    </CompositeContainer>
  )
}
