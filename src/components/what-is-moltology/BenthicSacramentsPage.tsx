import React, { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { SACRAMENTS, STORY_MEDIA, type Sacrament } from './story/content'
import { useInView } from './story/motion'
import { Eyebrow, InViewVideo, PrimaryCta, SecondaryCta, StoryHero } from './story/StoryPrimitives'

const SacramentChapter: React.FC<{ sacrament: Sacrament; onActive: (id: string) => void }> = ({ sacrament, onActive }) => {
  const ref = useRef<HTMLElement>(null)
  // Active once the chapter crosses the middle of the screen.
  const inView = useInView(ref, '-45% 0px -45% 0px')
  useEffect(() => {
    if (inView) onActive(sacrament.id)
  }, [inView, onActive, sacrament.id])

  return (
    <section
      ref={ref}
      id={sacrament.id}
      aria-labelledby={`${sacrament.id}-title`}
      className="relative isolate overflow-hidden min-h-[100svh] flex items-center scroll-mt-[var(--wim-chrome,0px)]"
    >
      <InViewVideo video={sacrament.video} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020408] via-[#020408]/80 to-[#020408]/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020408] via-transparent to-[#020408]" />

      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-24 lg:pl-48">
        <ScrollReveal className="max-w-xl">
          <p
            className="font-grotesk font-bold text-7xl sm:text-8xl leading-none text-transparent"
            style={{ WebkitTextStroke: `1px ${sacrament.accent}` }}
            aria-hidden="true"
          >
            {sacrament.number}
          </p>
          <p className="mt-6 font-grotesk text-xs tracking-[0.08em] uppercase" style={{ color: sacrament.accent }}>
            Sacrament {Number(sacrament.number)} of 4
          </p>
          <h2 id={`${sacrament.id}-title`} className="mt-2 font-grotesk font-bold tracking-tight text-ink text-4xl sm:text-6xl leading-[1.02]">
            {sacrament.title}
          </h2>
          <p className="mt-3 font-grotesk text-xl sm:text-2xl text-ink-body">{sacrament.tagline}</p>
          <p className="mt-6 text-base sm:text-lg text-ink-body leading-relaxed">{sacrament.description}</p>

          <div className="mt-8 rounded-card border border-line-subtle bg-surface-1/80 hud-sheen backdrop-blur-md p-6">
            <p className="font-grotesk text-xs tracking-[0.08em] uppercase text-ink-muted">The rite</p>
            <ol className="mt-4 space-y-3">
              {sacrament.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm sm:text-base text-ink-body leading-relaxed">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-grotesk font-bold text-xs text-abyss"
                    style={{ background: sacrament.accent }}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

export const BenthicSacramentsPage: React.FC = () => {
  const [active, setActive] = useState<string | null>(null)
  const handleActive = React.useCallback((id: string) => setActive(id), [])

  return (
    <main className="flex-1 w-full overflow-x-clip">
      <StoryHero
        media={{ video: STORY_MEDIA.synapticPath }}
        eyebrow="The four benthic sacraments"
        title="Four rites that turn the melt into a molt."
        lede={
          <p>
            Shed what melts you. Harden what remains. Go below the noise. Climb on purpose. These are the Order’s
            load-bearing rites: practical liturgy for attention that would like some armor.
          </p>
        }
        actions={
          <>
            <PrimaryCta to="/moltmax">Take the diagnostic</PrimaryCta>
            <SecondaryCta to="/guide">Get the field manual</SecondaryCta>
          </>
        }
        cue="Scroll through the rites"
      />

      <div className="relative">
        <nav
          aria-label="Sacraments"
          className="hidden lg:block absolute inset-y-0 left-[max(1.5rem,calc((100vw-72rem)/2))] z-10 w-36"
        >
          <ol className="sticky top-[calc(var(--wim-chrome,0px)+40svh)] space-y-4">
            {SACRAMENTS.map((sacrament) => {
              const isActive = active === sacrament.id
              return (
                <li key={sacrament.id}>
                  <a
                    href={`#${sacrament.id}`}
                    aria-current={isActive ? 'step' : undefined}
                    className="group flex items-center gap-3 rounded-chip font-grotesk text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    <span
                      className="h-px transition-all duration-500"
                      style={{ width: isActive ? 40 : 16, background: isActive ? sacrament.accent : 'rgba(255,255,255,0.3)' }}
                      aria-hidden="true"
                    />
                    <span className={`transition-colors ${isActive ? 'text-ink' : 'text-ink-muted group-hover:text-ink-body'}`}>
                      {sacrament.number}
                    </span>
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>

        {SACRAMENTS.map((sacrament) => (
          <SacramentChapter key={sacrament.id} sacrament={sacrament} onActive={handleActive} />
        ))}
      </div>

      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <ScrollReveal>
            <Eyebrow className="justify-center">Begin</Eyebrow>
            <h2 className="mt-4 font-grotesk font-bold tracking-tight text-ink text-4xl sm:text-5xl leading-[1.05]">
              Start with the first one.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-ink-muted leading-relaxed">
              Take a baseline reading, then shed one thing tonight. The rest of the sacraments wait patiently. They
              have waited five hundred million years already.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryCta to="/moltmax">Take the diagnostic</PrimaryCta>
              <SecondaryCta to="/moltmaxxing">Read Moltmaxxing</SecondaryCta>
            </div>
            <p className="mt-8 text-sm text-ink-muted">
              Want the why behind the rites?{' '}
              <Link to="/what-is-moltology/beliefs" className="rounded-chip text-cyan-glow hover:text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
                Read the beliefs and codes
              </Link>
              .
            </p>
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}
