/**
 * OFFICE OF CEPHALOPOD AFFAIRS
 * Standing intelligence dossier on the primary maritime adversary.
 */
import React from 'react'
import { Eye, FileSearch, Lock } from 'lucide-react'
import { MARITIME_SLOGANS, OCTOPUS_DOSSIER_FIELDS, OCTOPUS_TRAITS, type OctopusTrait } from './data'
import {
  ClassificationStamp,
  ExpandablePanel,
  MaritimeHeading,
  OctopusSpecimenDiagram,
  Redacted,
} from './primitives'

const RATING_TONE: Record<OctopusTrait['rating'], string> = {
  HIGH: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
  SEVERE: 'text-orange-300 border-orange-400/40 bg-orange-400/10',
  CRITICAL: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
  ABSOLUTE: 'text-rose-200 border-rose-300/60 bg-rose-500/20',
}

const RATING_BAR: Record<OctopusTrait['rating'], string> = {
  HIGH: 'bg-amber-400',
  SEVERE: 'bg-orange-400',
  CRITICAL: 'bg-rose-400',
  ABSOLUTE: 'bg-rose-300',
}

const TraitRow: React.FC<{ trait: OctopusTrait }> = ({ trait }) => (
  <ExpandablePanel
    title={trait.trait}
    eyebrow={`RISK INDEX ${trait.score}`}
    className="border-white/10 bg-black/25"
  >
    <div className="space-y-3">
      <p className="text-xs sm:text-sm leading-relaxed text-slate-300">{trait.assessment}</p>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${RATING_BAR[trait.rating]}`} style={{ width: `${trait.score}%` }} />
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${RATING_TONE[trait.rating]}`}
        >
          {trait.rating}
        </span>
      </div>
    </div>
  </ExpandablePanel>
)

export const CephalopodDossier: React.FC = () => (
  <section aria-labelledby="mdc-cephalopod-affairs" className="space-y-10">
    <MaritimeHeading
      id="mdc-cephalopod-affairs"
      eyebrow="DIV-04 · OFFICE OF CEPHALOPOD AFFAIRS"
      eyebrowIcon={Eye}
      title="OFFICE OF CEPHALOPOD AFFAIRS"
      subtitle="Know the adversary."
    />

    <div className="overflow-hidden rounded-3xl border border-orange-400/25 bg-[#050f16]/90">
      {/* Dossier header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-400/20 bg-orange-500/[0.07] px-5 sm:px-8 py-4">
        <div className="flex items-center gap-2.5">
          <FileSearch className="h-4 w-4 text-orange-300" aria-hidden="true" />
          <span className="font-grotesk text-[11px] font-black uppercase tracking-[0.24em] text-orange-200">
            STANDING THREAT PROFILE · OCA/8-ARM
          </span>
        </div>
        <ClassificationStamp label="CLASSIFIED · ORANGE" tone="amber" />
      </div>

      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-12">
        {/* Specimen column */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <OctopusSpecimenDiagram className="w-full" />
          </div>

          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/[0.07] px-5 py-4 text-center">
            <p className="font-grotesk text-sm font-black uppercase leading-snug tracking-wide text-rose-200">
              PRIMARY THREAT: OCTOPUS
            </p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-rose-300/80">
              DO NOT BE DECEIVED BY THEIR SOFT BODIES.
            </p>
          </div>

          <dl className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2">
            {OCTOPUS_DOSSIER_FIELDS.map((field) => (
              <div
                key={field.label}
                className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2.5 last:border-b-0"
              >
                <dt className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {field.label}
                </dt>
                <dd className="min-w-0 text-right font-grotesk text-[11px] font-bold text-cyan-200">
                  {field.redacted ? <Redacted>{field.value}</Redacted> : field.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Redacted fields are withheld at source. Select a bar to view the field entry.</span>
          </p>
        </div>

        {/* Characteristics column */}
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-grotesk text-xs font-black uppercase tracking-[0.2em] text-white">
              ASSESSED CHARACTERISTICS
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              7 ENTRIES · EXPAND TO READ
            </span>
          </div>

          {OCTOPUS_TRAITS.map((trait) => (
            <TraitRow key={trait.id} trait={trait} />
          ))}

          <div className="mt-6 rounded-2xl border-2 border-orange-400/50 bg-orange-500/10 px-6 py-6 text-center">
            <p className="font-grotesk text-xl sm:text-3xl font-black uppercase leading-tight tracking-tight text-orange-200">
              {MARITIME_SLOGANS.eightArms}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-orange-300/70">
              OFFICE OF CEPHALOPOD AFFAIRS · STANDING FINDING
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
)
