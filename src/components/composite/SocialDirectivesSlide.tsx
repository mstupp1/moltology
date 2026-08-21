import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { ArrowUpRight } from 'lucide-react'

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
  ctaHeader = 'READ THE FULL DISPATCH & SCHEMATICS',
  ctaButtonText = 'EXPLORE: MOLTOLOGY.ORG/NEWS',
  ctaSubtitle = '🔗 Link in bio & live story telemetry feed',
  mascot = 'lobster_pointing',
  backgroundImageUrl,
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
      <div className="mt-4 space-y-1">
        <h1 className="text-[52px] leading-tight font-black text-white tracking-tight uppercase">
          {headlinePart1}
        </h1>
        <h2 className="text-[52px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400 drop-shadow-[0_0_20px_rgba(0,255,230,0.4)] tracking-tight uppercase">
          {headlinePart2}
        </h2>
      </div>

      {/* 3. Actionable Directives List */}
      <div className="mt-5 space-y-3.5">
        {directives.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-[#04141e]/90 border border-cyan-500/40 backdrop-blur-md shadow-lg flex items-start gap-4"
          >
            {/* Number Pill */}
            <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-400/90 text-cyan-300 font-mono font-black text-xl flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,195,255,0.25)]">
              {item.number}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-mono font-bold text-lg text-white tracking-wide uppercase">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-slate-300 font-sans leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Hero CTA Card & Pointing Lobster */}
      <div className="mt-5 relative flex-1 flex items-stretch">
        <div className="w-[62%] p-6 rounded-2xl bg-[#041a26]/95 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,255,230,0.25)] flex flex-col justify-between">
          <div>
            <div className="font-mono font-bold text-xs text-sky-400 uppercase tracking-wider mb-2">
              {ctaHeader}
            </div>
            <div className="w-full py-4 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#020b10] font-mono font-black text-lg uppercase tracking-tight flex items-center justify-between shadow-[0_0_20px_rgba(0,255,230,0.4)] cursor-pointer">
              <span>{ctaButtonText}</span>
              <ArrowUpRight className="w-6 h-6 stroke-[3]" />
            </div>
          </div>

          <div className="text-xs text-slate-400 font-sans pt-2">
            {ctaSubtitle}
          </div>
        </div>

        {/* Mascot */}
        <MascotOverlay
          mascot={mascot}
          position="bottom-right"
          width={390}
          className="bottom-10 right-2"
        />
      </div>

      {/* 5. Bottom Logo & Watermark */}
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/80">
        <div className="font-mono text-xs text-slate-500 tracking-wider">
          ONE NATION UNDER CHITIN
        </div>

        <MoltNationLogo size="sm" theme="dark" />
      </div>
    </CompositeContainer>
  )
}
