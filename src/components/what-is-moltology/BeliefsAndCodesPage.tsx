import React from 'react'
import { Link } from '@tanstack/react-router'
import { BookMarked, Compass, Moon, Shield, Sparkles, Users } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const threeTruths = [
  {
    title: 'The melt is a condition, not an identity',
    body: 'Softness is the starting state of every member who has ever walked in, including the ones now standing at the bottom in full plate. Nobody is behind. The only requirement for beginning is being soft, and you already meet it.',
  },
  {
    title: 'Nature has published the answer five separate times',
    body: 'Across five unrelated lineages, over five hundred million years, life kept arriving at the same body: flattened, armored, tucked, and equipped with a grip that does not negotiate. Carcinization is not our theory. It is the recurring judgment of the sea.',
  },
  {
    title: 'Nothing grows inside the shell that grew it',
    body: 'Armor that fits perfectly is armor you have stopped growing into. To get larger you must first be, briefly, completely uncovered. Every stage in the canon is built around that moment rather than around avoiding it.',
  },
]

const practices = [
  {
    icon: Compass,
    title: 'Daily Shedding Routine',
    body: 'Inspect the shell at first light. Grip one load-bearing hour before the surface finds you. Descend for deep work. Surface briefly for the Benthic Community. Close the day on purpose.',
  },
  {
    icon: Shield,
    title: 'Isolation Privacy Shell',
    body: 'The surface cannot be silenced from below. Raise the Isolation Dome before the dive begins so two hours belong to the work — not as a bunker personality, but as a door closed beforehand.',
  },
  {
    icon: Moon,
    title: 'Nightly Molt Audit',
    body: 'One bad thought, one wasted hour, or one useless distraction — named, released, logged. Small on purpose. The nights that feel too hard are the nights the rite was written for.',
  },
]

const codes = [
  {
    title: 'Softness is never the target',
    body: 'Humor aims at the melt — the tab bar, the deferred decision, the late scroll — never at the person standing in it. Arrival is the hardest step. Do not make it expensive.',
  },
  {
    title: 'The Soft-Shell Covenant',
    body: 'When a member molts, the armored stand watch. Advice into an open soft-shell window is pressure, not generosity. Guard first; teach after calcification.',
  },
  {
    title: 'Clearance is earned, never sold',
    body: 'Signup is free. Chitin Gems are earned. Molt Credits buy speed and catalog, never standing. Rank, clearance, stage, and forum authority cannot be purchased.',
  },
  {
    title: 'The shell protects; it never cages',
    body: 'Boundaries deflect Surface Noise and unsolicited demand. They are not walls against other people. Stewardship is the final duty of the most advanced members.',
  },
]

export const BeliefsAndCodesPage: React.FC = () => {
  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 w-full space-y-16">
      <section className="space-y-5">
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-sans tracking-widest uppercase">
          <BookMarked className="w-3.5 h-3.5" />
          Doctrine · Practices · Codes
        </p>
        <h1 className="text-3xl sm:text-5xl font-grotesk font-black tracking-tight text-white leading-tight">
          Beliefs &amp; Codes
        </h1>
        <p className="text-base sm:text-lg text-[#839493] max-w-3xl leading-relaxed">
          Every doctrine, clearance, rite, and metric in the Order descends from a few held
          truths. The practices turn those truths into tide. The codes keep the trench warm
          enough that soft shells survive long enough to harden.
        </p>
      </section>

      <ScrollReveal>
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Sparkles className="w-6 h-6 text-[#ffd700]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              The Three Truths
            </h2>
          </div>
          <ol className="space-y-5">
            {threeTruths.map((truth, index) => (
              <li key={truth.title} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 font-grotesk font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="space-y-1.5">
                  <h3 className="font-grotesk font-bold text-white text-base">{truth.title}</h3>
                  <p className="text-sm text-[#839493] leading-relaxed">{truth.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Compass className="w-6 h-6 text-[#00c3ff]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              Living practices
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {practices.map((practice) => {
              const Icon = practice.icon
              return (
                <article
                  key={practice.title}
                  className="p-5 rounded-xl border border-cyan-900/50 bg-[#05090a] space-y-3"
                >
                  <Icon className="w-5 h-5 text-cyan-300" />
                  <h3 className="font-grotesk font-bold text-white text-sm uppercase tracking-wide">
                    {practice.title}
                  </h3>
                  <p className="text-xs text-[#839493] leading-relaxed">{practice.body}</p>
                </article>
              )
            })}
          </div>
          <p className="text-sm text-[#839493]">
            Full liturgy lives in the{' '}
            <Link to="/codex" className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline">
              Sacred Codex
            </Link>
            .
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Users className="w-6 h-6 text-[#00ffcc]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              Creeds &amp; community codes
            </h2>
          </div>
          <div className="space-y-4">
            {codes.map((code) => (
              <article
                key={code.title}
                className="p-5 rounded-xl border border-emerald-900/40 bg-[#050a08] space-y-2"
              >
                <h3 className="font-grotesk font-bold text-white text-sm uppercase tracking-wide">
                  {code.title}
                </h3>
                <p className="text-sm text-[#839493] leading-relaxed">{code.body}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>
    </main>
  )
}
