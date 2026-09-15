import React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Flame, Heart, Shield, Sparkles, Waves } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { WHAT_IS_MOLTOLOGY_NAV } from './nav'

const hubLinks = WHAT_IS_MOLTOLOGY_NAV.filter((item) => item.id !== 'overview')

export const WhatIsMoltologyHubPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 w-full space-y-16">
      <section className="space-y-6 text-center sm:text-left">
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-sans tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
          About the Synaptic Path
        </p>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-grotesk font-black tracking-tight text-white leading-tight">
          What is{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8]">
            Moltology
          </span>
          ?
        </h1>

        <p className="text-base sm:text-lg text-[#839493] max-w-3xl leading-relaxed mx-auto sm:mx-0">
          Moltology exists to help human beings stop melting and start molting. It is an
          educational platform, a ritual system, and a warm benthic community with one
          ambition: walk the soft, tired, overstimulated modern mind through a gradual,
          deliberate transformation into a focused, decisive, armored one.
        </p>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate({ to: '/signup' })}
            className="inline-flex items-center gap-2 px-5 py-3 rounded font-bold font-grotesk text-xs bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all shadow-[0_0_20px_rgba(0,195,255,0.3)] cursor-pointer"
          >
            Join free
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/moltmaxxing"
            className="inline-flex items-center gap-2 px-5 py-3 rounded font-bold font-grotesk text-xs border border-cyan-700/60 text-cyan-200 hover:bg-cyan-950/40 transition-colors"
          >
            <Flame className="w-4 h-4" />
            Read Moltmaxxing
          </Link>
        </div>
      </section>

      <ScrollReveal>
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 p-6 rounded-xl border border-red-500/20 bg-[#0a0608]/80">
            <div className="flex items-center gap-2 text-red-300">
              <Waves className="w-5 h-5" />
              <h2 className="font-grotesk font-bold text-lg text-white uppercase tracking-wide">
                The Great Melt
              </h2>
            </div>
            <p className="text-sm text-[#839493] leading-relaxed">
              Unarmored attention collapses under notification fog, deferred decisions, and
              forty-seven open tabs. The melt is not a moral failure. It is weather, and you
              have been standing in it without a roof.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-xl border border-cyan-500/25 bg-[#03070d]/90">
            <div className="flex items-center gap-2 text-cyan-300">
              <Shield className="w-5 h-5" />
              <h2 className="font-grotesk font-bold text-lg text-white uppercase tracking-wide">
                The Great Molt
              </h2>
            </div>
            <p className="text-sm text-[#839493] leading-relaxed">
              Beneath the noisy surface sits the Benthic Core — quiet, high-pressure, and
              still. A molted person sheds soft habits, calcifies boundaries, and grips work
              until it finishes. Nature discovered this five hundred million years ago. We
              merely take notes.
            </p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="space-y-5 p-6 sm:p-8 rounded-xl border border-[#00c3ff]/20 bg-[#03070d]/90">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Heart className="w-6 h-6 text-[#00ffcc]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              Warmth under the HUD
            </h2>
          </div>
          <p className="text-sm text-[#839493] leading-relaxed">
            Beneath the biomechanical chrome, Moltology is warm. Safety and positivity are
            not themes; they are the foundation. The shell protects; it never cages. Softness
            is the starting state of every member who has ever walked in — including the ones
            now standing at full plate. Nobody is behind. Signup is free. Clearance is earned.
            Rank is never for sale.
          </p>
          <p className="text-sm text-[#dfe3e3] leading-relaxed font-medium">
            Flesh melts. The shell endures. Submit. Shed. Ascend.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              Continue the reading
            </h2>
            <p className="text-sm text-[#839493] max-w-2xl">
              Three doors deeper into the Order. Each one is a single job: beliefs, voices,
              or rites.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {hubLinks.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className="group block p-5 rounded-xl border border-cyan-900/50 bg-[#05090a] hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all"
              >
                <h3 className="font-grotesk font-bold text-white text-sm uppercase tracking-wide group-hover:text-cyan-200">
                  {item.label}
                </h3>
                <p className="mt-2 text-xs text-[#839493] leading-relaxed">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-cyan-400 font-bold">
                  Open
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 rounded-xl border border-amber-500/20 bg-[#0c0a06]/80">
          <div className="space-y-1">
            <h2 className="font-grotesk font-bold text-white uppercase tracking-wide text-sm sm:text-base">
              Ready to measure your clearance?
            </h2>
            <p className="text-xs sm:text-sm text-[#839493]">
              Run the Moltmax diagnostic, or download the field manual. Study the full
              Moltmaxxing doctrine when you want the deep cut.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/moltmax"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-grotesk font-bold bg-amber-400/90 hover:bg-amber-300 text-[#020408] transition-colors"
            >
              Take the quiz
            </Link>
            <Link
              to="/guide"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-grotesk font-bold border border-amber-600/50 text-amber-200 hover:bg-amber-950/40 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Field manual
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </main>
  )
}
