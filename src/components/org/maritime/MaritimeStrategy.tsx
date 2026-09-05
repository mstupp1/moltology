/**
 * THE FIVE-POINT PLAN FOR MARITIME DOMINANCE
 * Standing strategy of the Maritime Defense Command.
 */
import React from 'react'
import { Target } from 'lucide-react'
import { MARITIME_SLOGANS, STRATEGY_POINTS, type StrategyPoint } from './data'
import { MaritimeHeading } from './primitives'

const StrategyCard: React.FC<{ point: StrategyPoint }> = ({ point }) => {
  const Icon = point.icon
  return (
    <article className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-[#06121a]/85 p-6 transition-all hover:border-cyan-400/40 hover:bg-[#08161f]/90">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-6 font-grotesk text-[6rem] font-black leading-none text-white/[0.05] transition-colors group-hover:text-cyan-400/10"
      >
        {point.number}
      </span>

      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="font-grotesk text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/90">
          POINT {point.number}
        </span>
      </div>

      <h3 className="relative font-grotesk text-base sm:text-lg font-black uppercase leading-tight tracking-tight text-white">
        {point.title}
      </h3>
      <p className="relative text-[13px] font-medium leading-relaxed text-slate-300">{point.summary}</p>
      <p className="relative text-xs leading-relaxed text-slate-400">{point.detail}</p>

      <div className="relative mt-auto flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{point.readoutLabel}</span>
        <span className="font-grotesk text-xs font-black uppercase tracking-wide text-cyan-200">
          {point.readoutValue}
        </span>
      </div>
    </article>
  )
}

export const MaritimeStrategy: React.FC = () => (
  <section aria-labelledby="mdc-five-point-plan" className="space-y-10">
    <MaritimeHeading
      id="mdc-five-point-plan"
      eyebrow="MARITIME DEFENSE COMMAND · STANDING STRATEGY"
      eyebrowIcon={Target}
      title="THE FIVE-POINT PLAN FOR MARITIME DOMINANCE"
      subtitle="Adopted by the High Synod. Reviewed each season. Five points, in order, no substitutions."
    />

    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {STRATEGY_POINTS.map((point) => (
        <StrategyCard key={point.id} point={point} />
      ))}

      <div className="flex flex-col justify-center gap-3 rounded-3xl border-2 border-cyan-400/30 bg-cyan-400/[0.07] p-6 text-center sm:col-span-2 xl:col-span-1">
        <p className="font-grotesk text-2xl font-black uppercase leading-tight tracking-tight text-cyan-100">
          {MARITIME_SLOGANS.reef}
        </p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/90">
          MDC OPERATIONS ORDER 01 · LINE ONE
        </p>
      </div>
    </div>
  </section>
)
