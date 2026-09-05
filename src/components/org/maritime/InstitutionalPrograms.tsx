/**
 * ADDITIONAL INSTITUTIONAL PROGRAMS
 * Smaller standing programs run under the Maritime Defense Command umbrella.
 */
import React from 'react'
import { CheckCircle2, Landmark } from 'lucide-react'
import { INSTITUTIONAL_PROGRAMS, type InstitutionalProgram } from './data'
import { MaritimeHeading } from './primitives'

const ProgramCard: React.FC<{ program: InstitutionalProgram }> = ({ program }) => {
  const Icon = program.icon
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-3xl border bg-[#050f16]/90 ${program.panelTone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <span className="inline-flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-slate-300" aria-hidden="true" />
          <span className="font-grotesk text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
            {program.program}
          </span>
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${program.chipTone}`}
        >
          {program.code}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-8">
        <h3
          className={`font-grotesk text-2xl sm:text-3xl font-black uppercase leading-none tracking-tight ${program.headlineTone}`}
        >
          {program.headline}
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">{program.subheadline}</p>

        <div className="flex flex-wrap gap-2">
          {program.chant.map((line) => (
            <span
              key={line}
              className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 font-grotesk text-[11px] font-black uppercase tracking-[0.14em] text-white"
            >
              {line}
            </span>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">PROGRAM DOCTRINE</p>
          <ul className="space-y-1.5">
            {program.doctrine.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-snug text-slate-300">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

export const InstitutionalPrograms: React.FC = () => (
  <section aria-labelledby="mdc-programs" className="space-y-10">
    <MaritimeHeading
      id="mdc-programs"
      eyebrow="STANDING PROGRAMS · COMMAND PORTFOLIO"
      eyebrowIcon={Landmark}
      title="ADDITIONAL INSTITUTIONAL PROGRAMS"
      subtitle="Smaller offices, each with a budget line, a review board, and an opinion."
    />

    <div className="grid gap-6 lg:grid-cols-2">
      {INSTITUTIONAL_PROGRAMS.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  </section>
)
