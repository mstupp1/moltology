/**
 * NO, SERIOUSLY — HELP THE OCEAN
 * The one section on this page written outside the world of the foundation.
 * Real, broadly accepted conservation actions plus a plain-language note about
 * which parts of this page are invented.
 */
import React from 'react'
import { Info, LifeBuoy } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { STEWARDSHIP_ACTIONS, type StewardshipAction } from './maritime/data'

const StewardshipCard: React.FC<{ action: StewardshipAction }> = ({ action }) => {
  const Icon = action.icon
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="text-base font-bold text-slate-900">{action.title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{action.copy}</p>
    </article>
  )
}

export const OceanStewardship: React.FC = () => (
  <ScrollReveal animation="fade-up" durationMs={800}>
    <section
      id="ocean-stewardship"
      aria-labelledby="ocean-stewardship-heading"
      className="relative z-10 w-full border-y-4 border-emerald-500 bg-emerald-50/70 px-6 py-20 sm:px-12"
    >
      <div className="mx-auto w-full max-w-[1100px] space-y-12">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            <span>REAL ADVICE, PLAINLY STATED</span>
          </div>
          <h2
            id="ocean-stewardship-heading"
            className="font-grotesk text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl"
          >
            No, seriously — help the ocean
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            Everything above this line is fiction. The suggestions below are not. These are widely recommended,
            well-established actions that genuinely help coastal and marine ecosystems, and none of them require a
            security clearance.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEWARDSHIP_ACTIONS.map((action) => (
            <StewardshipCard key={action.id} action={action} />
          ))}
        </div>

        {/* Fiction disclosure */}
        <div className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Info className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              <h3 className="text-base font-bold text-slate-900">About this page</h3>
              <p>
                Moltology is a fictional organization and this page is comedic fiction. The Maritime Defense Command,
                the Office of Cephalopod Affairs, the marine threat advisory, crab sovereignty law, the Freedom Reef
                installations, the Deep State investigation, and every claim about octopus activity are invented. So
                are the foundation&rsquo;s divisions, leadership, facilities, statistics, funding programs, and
                nonprofit status. None of it describes real people, real organizations, real agencies, or real
                events, and none of the figures shown anywhere on this page are verified real-world data.
              </p>
              <p>
                Octopuses are not organized, not hostile, and not plotting anything. They are remarkable animals and
                they are worth protecting, along with everything else down there.
              </p>
              <p className="font-semibold text-slate-800">
                The conservation actions in this section are the real part. For guidance specific to where you live,
                consult an established marine conservation organization, a public aquarium, or your regional
                fisheries or environmental agency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </ScrollReveal>
)
