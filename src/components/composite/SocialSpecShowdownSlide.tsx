import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { ArrowRight } from 'lucide-react'

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
  swipeCta = 'SWIPE FOR ASCENSION PROTOCOL',
}) => {
  return (
    <CompositeContainer
      aspectRatio={aspectRatio}
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
    >
      {/* 1. Category Pill Badge */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-cyan-950/70 border border-cyan-400/80 shadow-[0_0_15px_rgba(0,195,255,0.25)]">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-lg tracking-widest text-cyan-300 uppercase">
            {categoryBadge}
          </span>
        </div>
      </div>

      {/* 2. Headline */}
      <div className="mt-4">
        <h1 className="text-[62px] leading-[1.02] font-black text-white tracking-tight uppercase">
          {headline}
        </h1>
      </div>

      {/* 3. Three Structured Comparison Cards */}
      <div className="mt-4 space-y-4 flex-1">
        {cards.map((card, idx) => {
          const variantClasses = {
            red: 'bg-[#1a080c]/90 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
            cyan: 'bg-[#041822]/90 border-cyan-400/85 shadow-[0_0_20px_rgba(0,255,230,0.25)]',
            sky: 'bg-[#061a26]/90 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.2)]',
            dark: 'bg-[#081014]/90 border-slate-700',
          }[card.variant || 'cyan']

          const headerColor = {
            red: 'text-red-400',
            cyan: 'text-cyan-400',
            sky: 'text-sky-400',
            dark: 'text-slate-300',
          }[card.variant || 'cyan']

          return (
            <div
              key={idx}
              className={`w-[64%] p-6 rounded-2xl border backdrop-blur-md transition-all ${variantClasses}`}
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-md bg-black/50 border border-white/25 font-mono font-black text-sm text-white">
                  {card.number}
                </span>
                <span className={`font-mono font-bold text-[19px] tracking-wider uppercase ${headerColor}`}>
                  {card.title}
                </span>
              </div>

              <div className="mt-2.5 font-mono font-black text-[40px] leading-tight text-white tracking-tight">
                {card.metric}
              </div>

              {card.description && (
                <p className="mt-2 text-[17px] text-slate-200 font-sans leading-snug">
                  {card.description}
                </p>
              )}

              {card.bullets && (
                <ul className="mt-2.5 space-y-1.5 text-[15px] text-slate-200">
                  {card.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <span className="font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}

        {/* Mascot overlay */}
        <MascotOverlay
          mascot={mascot}
          position="bottom-right"
          width={360}
          className="bottom-14 right-2"
        />
      </div>

      {/* 4. Bottom Navigation & Logo */}
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
