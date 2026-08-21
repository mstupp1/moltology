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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-400/80 shadow-[0_0_15px_rgba(0,195,255,0.25)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-sm tracking-wider text-cyan-300 uppercase">
            {categoryBadge}
          </span>
        </div>
      </div>

      {/* 2. Headline */}
      <div className="mt-4">
        <h1 className="text-[50px] leading-tight font-black text-white tracking-tight uppercase">
          {headline}
        </h1>
      </div>

      {/* 3. Three Structured Comparison Cards */}
      <div className="mt-4 space-y-4 flex-1">
        {cards.map((card, idx) => {
          const isThird = idx === 2
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
              className={`p-5 rounded-xl border backdrop-blur-md transition-all ${variantClasses} ${
                isThird ? 'w-[64%]' : 'w-full'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-black/40 border border-white/20 font-mono font-black text-xs text-white">
                  {card.number}
                </span>
                <span className={`font-mono font-bold text-sm tracking-wider uppercase ${headerColor}`}>
                  {card.title}
                </span>
              </div>

              <div className="mt-2 font-mono font-black text-3xl text-white tracking-tight">
                {card.metric}
              </div>

              {card.description && (
                <p className="mt-2 text-sm text-slate-300 font-sans leading-relaxed">
                  {card.description}
                </p>
              )}

              {card.bullets && (
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {card.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-cyan-400" />
                      <span>{b}</span>
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
          width={350}
          className="bottom-14 right-2"
        />
      </div>

      {/* 4. Bottom Navigation & Logo */}
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/80">
        <div className="flex items-center gap-2 font-mono font-bold text-base text-slate-400">
          <span>{swipeCta}</span>
          <ArrowRight className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>

        <MoltNationLogo size="sm" theme="dark" />
      </div>
    </CompositeContainer>
  )
}
