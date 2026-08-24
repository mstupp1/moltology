import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { ArrowRight, Sparkles } from 'lucide-react'

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
  swipeCta = 'SWIPE FOR HARD DATA',
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
    <CompositeContainer
      aspectRatio={aspectRatio}
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
    >
      {/* 1. Category Pill Badge (Clean, No '//') */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-cyan-950/70 border border-cyan-400/80 shadow-[0_0_15px_rgba(0,195,255,0.25)]">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-lg tracking-widest text-cyan-300 uppercase">
            {finalBadge}
          </span>
        </div>
      </div>

      {/* 2. Punchy Main Headline */}
      <div className="mt-5 space-y-1">
        {finalH1 && (
          <h1 className="text-[64px] leading-[1.02] font-black text-white tracking-tight uppercase">
            {finalH1}
          </h1>
        )}
        {finalH2 && (
          <h2 className="text-[64px] leading-[1.02] font-black text-white tracking-tight uppercase">
            {finalH2}
          </h2>
        )}
        {finalHighlight && (
          <h2 className="text-[64px] leading-[1.02] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-sky-400 drop-shadow-[0_0_20px_rgba(0,255,230,0.4)] tracking-tight uppercase">
            {finalHighlight}
          </h2>
        )}
      </div>

      {/* 3. Narrative Paragraph (Clean, Border Removed) */}
      {finalNarrative && (
        <div className="mt-5">
          <p className="text-[29px] leading-snug font-medium text-slate-100">
            {finalNarrative}
          </p>
        </div>
      )}

      {/* 4. Two Comparison Metric Panels */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Left Panel */}
        <div
          className={`p-7 rounded-2xl border backdrop-blur-md ${
            finalLeftMetric.variant === 'red'
              ? 'bg-[#1a080c]/90 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : 'bg-[#041822]/90 border-cyan-400/80 shadow-[0_0_20px_rgba(0,255,230,0.2)]'
          }`}
        >
          <div
            className={`font-mono font-bold text-[18px] tracking-wider uppercase ${
              finalLeftMetric.variant === 'red' ? 'text-red-400' : 'text-cyan-400'
            }`}
          >
            {finalLeftMetric.label}
          </div>
          <div className="mt-3.5 font-mono font-black text-[64px] leading-none text-white tracking-tight">
            {finalLeftMetric.value}
          </div>
          <div
            className={`mt-2 font-mono font-bold text-[20px] tracking-wide uppercase ${
              finalLeftMetric.variant === 'red' ? 'text-red-300' : 'text-cyan-300'
            }`}
          >
            {finalLeftMetric.sublabel}
          </div>
          {finalLeftMetric.description && (
            <p className="mt-3.5 text-[19px] text-slate-200 font-sans leading-snug">
              {finalLeftMetric.description}
            </p>
          )}
        </div>

        {/* Right Panel */}
        <div
          className={`p-7 rounded-2xl border backdrop-blur-md ${
            finalRightMetric.variant === 'red'
              ? 'bg-[#1a080c]/90 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : 'bg-[#041822]/90 border-cyan-400/80 shadow-[0_0_20px_rgba(0,255,230,0.2)]'
          }`}
        >
          <div
            className={`font-mono font-bold text-[18px] tracking-wider uppercase ${
              finalRightMetric.variant === 'red' ? 'text-red-400' : 'text-cyan-400'
            }`}
          >
            {finalRightMetric.label}
          </div>
          <div className="mt-3.5 font-mono font-black text-[64px] leading-none text-white tracking-tight">
            {finalRightMetric.value}
          </div>
          <div
            className={`mt-2 font-mono font-bold text-[20px] tracking-wide uppercase ${
              finalRightMetric.variant === 'red' ? 'text-red-300' : 'text-cyan-300'
            }`}
          >
            {finalRightMetric.sublabel}
          </div>
          {finalRightMetric.description && (
            <p className="mt-3.5 text-[19px] text-slate-200 font-sans leading-snug">
              {finalRightMetric.description}
            </p>
          )}
        </div>
      </div>

      {/* 5. Lower Highlight Banner & Mascot */}
      <div className="mt-6 relative flex-1 flex items-start">
        <div className="w-[62%] h-fit p-7 rounded-2xl bg-[#061a26]/90 border border-cyan-500/50 backdrop-blur-md shadow-lg flex flex-col">
          <div className="flex items-center gap-3 text-sky-300 font-black text-2xl mb-3.5">
            <Sparkles className="w-6 h-6 text-cyan-300" />
            <span>Key Architectural Metrics</span>
          </div>
          <ul className="space-y-2.5 text-slate-100 text-[21px]">
            {finalBullets.map((pt, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="font-semibold">{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mascot */}
        <MascotOverlay
          mascot={mascot}
          position="bottom-right"
          width={mascot === 'crab_stats' ? 330 : 370}
          className="bottom-4 right-2"
        />
      </div>

      {/* 6. Bottom Navigation Cue & Watermark */}
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/80">
        <div className="flex items-center gap-3 font-mono font-bold text-[22px] text-slate-300">
          <span>{swipeCta}</span>
          <ArrowRight className="w-7 h-7 text-cyan-400 animate-pulse" />
        </div>

        <MoltNationLogo size="md" theme="dark" />
      </div>
    </CompositeContainer>
  )
}
