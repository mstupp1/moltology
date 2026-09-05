/**
 * ============================================================================
 * MARITIME DEFENSE & OCEAN STEWARDSHIP
 * The operational branch of the foundation. Styled as one more section of
 * the same institutional profile — white cards, sky-900 headings, and the
 * page's existing amber/emerald/rose status accents — rather than a
 * separate dark microsite bolted onto the bottom of the page.
 * ============================================================================
 */
import React from 'react'
import { Anchor, Compass, Fish, Waves } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { CephalopodDossier } from './maritime/CephalopodDossier'
import { CrabSovereignty } from './maritime/CrabSovereignty'
import { DeepStateBoard } from './maritime/DeepStateBoard'
import { FreedomReefs } from './maritime/FreedomReefs'
import { InstitutionalPrograms } from './maritime/InstitutionalPrograms'
import { MaritimeStrategy } from './maritime/MaritimeStrategy'
import { PropagandaWall } from './maritime/PropagandaWall'
import { TakeAction } from './maritime/TakeAction'
import { ThreatAdvisory } from './maritime/ThreatAdvisory'
import { MARITIME_SLOGANS } from './maritime/data'
import { ClassificationStamp, SonarPlate, TelemetryRow } from './maritime/primitives'

const CONSERVATION_AIMS = [
  'Protect coastal habitat',
  'Restore damaged reef',
  'Reduce marine pollution',
  'Preserve biodiversity',
  'Maintain resilient marine ecosystems',
]

const STRATEGIC_RATIONALE = [
  'Crustacean territorial stability',
  'Shell security and vacancy supply',
  'Molt continuity across seasons',
  'Suppression of hostile cephalopod expansion',
]

export const MaritimeDefense: React.FC<{ onSupport?: () => void }> = ({ onSupport }) => (
  <div id="maritime" className="relative z-10 w-full bg-white border-y border-sky-100">
    <div className="mx-auto w-full max-w-[1200px] space-y-20 px-6 py-20 sm:space-y-24 sm:px-12">
      {/* ---------------------------------------------------------------- */}
      {/* BRANCH MASTHEAD                                                   */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section aria-labelledby="maritime-branch-heading" className="space-y-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <ClassificationStamp label="DIV-03 · MDC" tone="sky" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">
                  OPERATIONAL BRANCH · MOLTOLOGY FOUNDATION
                </span>
              </div>

              <h2
                id="maritime-branch-heading"
                className="font-grotesk text-3xl font-bold uppercase leading-[1.05] tracking-tight text-sky-900 sm:text-5xl lg:text-[3.25rem]"
              >
                MARITIME DEFENSE &amp;<br className="hidden sm:block" /> OCEAN STEWARDSHIP
              </h2>

              <p className="font-grotesk text-base font-bold uppercase tracking-[0.04em] text-sky-700 sm:text-lg">
                Protecting the reef. Preserving crab sovereignty. Monitoring cephalopod activity.
              </p>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Moltology has run marine restoration work since 2024. The stated aims are conventional and the
                methods are conventional: coastline, habitat, water quality, and the species that depend on all
                three. Everything below this line follows from those aims.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                    CONSERVATION AIMS
                  </p>
                  <ul className="space-y-1.5">
                    {CONSERVATION_AIMS.map((aim) => (
                      <li key={aim} className="flex items-start gap-2 text-xs leading-snug text-slate-600">
                        <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                        <span>{aim}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                    WHY A HEALTHY REEF IS STRATEGIC
                  </p>
                  <ul className="space-y-1.5">
                    {STRATEGIC_RATIONALE.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs leading-snug text-slate-600">
                        <Anchor className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Command readout */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100 sm:p-7">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `url(${getAssetUrl('/images/benthic_abyss_hero.jpg')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">
                      <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                      COMMAND READOUT
                    </span>
                    <ClassificationStamp label="LIVE" tone="emerald" />
                  </div>

                  <SonarPlate className="mx-auto max-w-[220px]" label="PERIMETER" />

                  <div className="rounded-2xl border border-sky-100 bg-[#f8fbff] px-4 py-2">
                    <TelemetryRow label="Advisory level" value="ORANGE" tone="text-orange-700" />
                    <TelemetryRow label="Reef installations" value="5 SITES" />
                    <TelemetryRow label="Sectors monitored" value="01-12" />
                    <TelemetryRow label="Open investigations" value="1 · FILE DS-11" tone="text-rose-700" />
                    <TelemetryRow label="Watch floor" value="STAFFED" tone="text-emerald-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Central message */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 px-6 py-12 text-center sm:px-12 sm:py-16">
            <p className="font-grotesk text-4xl font-bold uppercase leading-none tracking-tight text-sky-900 sm:text-6xl lg:text-7xl">
              {MARITIME_SLOGANS.save}
            </p>
            <p className="mt-4 font-grotesk text-lg font-bold uppercase leading-tight tracking-tight text-amber-700 sm:text-2xl lg:text-3xl">
              {MARITIME_SLOGANS.because}
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-sky-600">
              <Fish className="h-3.5 w-3.5" aria-hidden="true" />
              MARITIME DEFENSE COMMAND · STANDING MESSAGE
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* ---------------------------------------------------------------- */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <ThreatAdvisory />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <CephalopodDossier />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <CrabSovereignty />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <MaritimeStrategy />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <FreedomReefs />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <DeepStateBoard />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <InstitutionalPrograms />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <PropagandaWall />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" durationMs={800}>
        <TakeAction onSupport={onSupport} />
      </ScrollReveal>
    </div>
  </div>
)
