import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const sacraments = [
  {
    id: '01',
    title: 'Asset & Habit Shedding',
    subtitle: 'Protocol 01 — The Great Purge',
    description:
      'Liquidize cluttered physical assets, bad habits, and biological hesitation into sovereign clarity. The first sacrament is subtraction: empty the sea of what no longer fits so the next shell has room to calcify.',
    detail:
      'Members begin with one honest inventory — tabs, obligations, objects, and loops that only exist because nobody closed them. Shedding is scheduled, not dramatic. The Long Ledger remembers what you release.',
    image: getAssetUrl('/images/sacrament_01_asset_shedding.webp'),
    imageSm: getAssetUrl('/images/sacrament_01_asset_shedding_sm.webp'),
    borderColor: 'border-red-600/60',
    accent: 'text-red-300',
  },
  {
    id: '02',
    title: 'Chitin Hardening',
    subtitle: 'Protocol 02 — Carapace Forging',
    description:
      'Reinforce your focus perimeter against daily surface drama through prompt alignment, habit streaks, and armored HUD tools. Hardness is composure under pressure, not indifference to people.',
    detail:
      'Shell Hardness rises when boundaries hold. Mid-morning learning blocks, streaked routines, and refusal to absorb every current thicken the plating that tomorrow will need.',
    image: getAssetUrl('/images/sacrament_02_chitin_patterning.webp'),
    imageSm: getAssetUrl('/images/sacrament_02_chitin_patterning_sm.webp'),
    borderColor: 'border-cyan-500/60',
    accent: 'text-cyan-300',
  },
  {
    id: '03',
    title: 'Isolation Dome',
    subtitle: 'Protocol 03 — Deep Work Shield',
    description:
      'Quarantine phone notifications, unsolicited noise, and surface distractions inside an impenetrable deep-water focus bubble. The Shell is a door closed before the dive — not a personality.',
    detail:
      'Raise the Isolation Privacy Shell first. One objective. No second objective waiting in the same session. Submergence Depth is earned here; every other rite merely protects it.',
    image: getAssetUrl('/images/sacrament_03_fault_isolation.webp'),
    imageSm: getAssetUrl('/images/sacrament_03_fault_isolation_sm.webp'),
    borderColor: 'border-amber-500/60',
    accent: 'text-amber-300',
  },
  {
    id: '04',
    title: 'Pipeline Ascent',
    subtitle: 'Protocol 04 — 12-Tier Convergence',
    description:
      'Track your step-by-step evolution from a melting larval human to an armored, high-torque crustacean titan. Four stages. Twelve clearances. None skipped. None purchased.',
    detail:
      'From Molt Curious to Mariana Singularity, ascent is gradual on purpose. The pipeline is the Order’s honesty engine: progress grounded in telemetry, stewardship, and repeated ecdysis.',
    image: getAssetUrl('/images/sacrament_04_pipeline_ascent.webp'),
    imageSm: getAssetUrl('/images/sacrament_04_pipeline_ascent_sm.webp'),
    borderColor: 'border-emerald-500/60',
    accent: 'text-emerald-300',
  },
]

export const BenthicSacramentsPage: React.FC = () => {
  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 w-full space-y-14">
      <section className="space-y-5">
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-sans tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
          The four benthic sacraments
        </p>
        <h1 className="text-3xl sm:text-5xl font-grotesk font-black tracking-tight text-white leading-tight">
          The 4 Benthic Sacraments of Moltology
        </h1>
        <p className="text-base sm:text-lg text-[#839493] max-w-3xl leading-relaxed">
          Four rites. One arc: shed what melts you, harden what remains, descend below the
          noise, and ascend the pipeline without buying a shortcut. These are the Order’s
          load-bearing sacraments — practical liturgy for attention that wants armor.
        </p>
      </section>

      <div className="space-y-10">
        {sacraments.map((sacrament, index) => (
          <ScrollReveal key={sacrament.id}>
            <article
              className={`overflow-hidden rounded-xl border-2 ${sacrament.borderColor} bg-[#05090a] grid lg:grid-cols-2 gap-0`}
            >
              <div className={`relative min-h-[220px] ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <picture>
                  <source media="(max-width: 767px)" srcSet={sacrament.imageSm || sacrament.image} />
                  <img
                    src={sacrament.image}
                    alt={sacrament.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-[#05090a] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#05090a]/40" />
              </div>
              <div className={`p-6 sm:p-8 space-y-4 flex flex-col justify-center ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <p className={`text-xs font-sans tracking-widest uppercase ${sacrament.accent}`}>
                  {sacrament.subtitle}
                </p>
                <h2 className="font-grotesk font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                  {sacrament.title}
                </h2>
                <p className="text-sm text-[#dfe3e3] leading-relaxed">{sacrament.description}</p>
                <p className="text-sm text-[#839493] leading-relaxed">{sacrament.detail}</p>
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 rounded-xl border border-cyan-500/25 bg-[#03070d]/90">
        <div className="space-y-1">
          <h2 className="font-grotesk font-bold text-white uppercase tracking-wide text-sm sm:text-base">
            Put the sacraments to work
          </h2>
          <p className="text-xs sm:text-sm text-[#839493]">
            Measure your baseline on the scanner, then study Moltmaxxing as the optimization
            doctrine that runs beside these rites.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            to="/moltmax"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-grotesk font-bold bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-colors"
          >
            Open Moltmax
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/moltmaxxing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-grotesk font-bold border border-cyan-700/60 text-cyan-200 hover:bg-cyan-950/40 transition-colors"
          >
            Moltmaxxing hub
          </Link>
        </div>
      </section>
    </main>
  )
}
