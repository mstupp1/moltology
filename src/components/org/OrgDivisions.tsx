/**
 * ORGANIZATIONAL DIVISIONS
 * The internal structure of the foundation, presented in the corporate light
 * palette used across the rest of the Organization overview.
 */
import React from 'react'
import { Building2 } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ORG_DIVISIONS, type OrgDivision } from './maritime/data'

const DivisionCard: React.FC<{ division: OrgDivision }> = ({ division }) => {
  const Icon = division.icon
  return (
    <article
      className={`group flex h-full flex-col gap-4 rounded-3xl border bg-white p-6 shadow-lg shadow-sky-100 transition-all hover:-translate-y-1 hover:shadow-xl ${division.accentBorder}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${division.accentBg} ${division.accentText}`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-grotesk text-[10px] font-extrabold uppercase tracking-[0.14em] ${division.accentBorder} ${division.accentBg} ${division.accentText}`}
        >
          {division.code}
        </span>
      </div>

      <h3 className="font-grotesk text-sm font-bold uppercase leading-snug tracking-tight text-sky-900">
        {division.name}
      </h3>
      <p className="text-xs font-semibold leading-relaxed text-slate-600">{division.summary}</p>
      <p className="text-xs leading-relaxed text-slate-500">{division.detail}</p>

      <dl className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[10px] uppercase tracking-wider">
        <div>
          <dt className="sr-only">Established</dt>
          <dd className="font-bold text-slate-400">{division.established}</dd>
        </div>
        <div className="text-right">
          <dt className="sr-only">Reports to</dt>
          <dd className="font-bold text-slate-400">REPORTS TO {division.reportsTo}</dd>
        </div>
      </dl>
    </article>
  )
}

export const OrgDivisions: React.FC = () => (
  <ScrollReveal animation="fade-up" durationMs={800}>
    <section
      id="divisions"
      aria-labelledby="org-divisions-heading"
      className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-12"
    >
      <div className="mb-12 space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-600">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          <span>HOW WE ARE ORGANIZED</span>
        </div>
        <h2
          id="org-divisions-heading"
          className="font-grotesk text-3xl font-bold uppercase tracking-tight text-sky-900 sm:text-4xl"
        >
          DIVISIONS OF THE FOUNDATION
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600">
          Six divisions, each with its own remit, its own seal, and its own opinion about the other five. All six
          report through the High Synod.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {ORG_DIVISIONS.map((division) => (
          <DivisionCard key={division.code} division={division} />
        ))}
      </div>
    </section>
  </ScrollReveal>
)
