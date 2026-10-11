import React, { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { COMMUNITY_CODES, DAILY_PRACTICES, STORY_MEDIA, THREE_TRUTHS } from './story/content'
import { useScrollVar } from './story/motion'
import { Eyebrow, PrimaryCta, SecondaryCta, StoryHero, StoryImg } from './story/StoryPrimitives'

const sectionTitle = 'font-grotesk font-bold tracking-tight text-ink text-4xl sm:text-5xl leading-[1.05]'

const TruthBand: React.FC<{ truth: (typeof THREE_TRUTHS)[number]; index: number }> = ({ truth, index }) => {
  const ref = useRef<HTMLDivElement>(null)
  useScrollVar(ref)
  const flipped = index % 2 === 1
  return (
    <article className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-panel border border-line-subtle aspect-[4/3] bg-black ${flipped ? 'lg:order-2' : ''}`}
        style={{ ['--p' as string]: 0.5 }}
      >
        <div className="absolute inset-0 will-change-transform" style={{ transform: 'translate3d(0, calc((var(--p) - 0.5) * -14%), 0) scale(1.2)' }}>
          <StoryImg image={truth.image} className="h-full w-full object-cover opacity-80" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span
          className="absolute left-6 bottom-4 font-grotesk font-bold text-[7rem] sm:text-[9rem] leading-none text-transparent"
          style={{ WebkitTextStroke: '1px rgba(255,255,255,0.55)' }}
          aria-hidden="true"
        >
          {index + 1}
        </span>
      </div>
      <ScrollReveal animation={flipped ? 'slide-left' : 'slide-right'}>
        <p className="font-grotesk text-xs tracking-[0.08em] uppercase text-cyan-glow">Truth {index + 1} of 3</p>
        <h3 className="mt-3 font-grotesk font-bold tracking-tight text-ink text-3xl sm:text-4xl leading-[1.1]">
          {truth.title}
        </h3>
        <p className="mt-5 text-base sm:text-lg text-ink-body leading-relaxed">{truth.body}</p>
      </ScrollReveal>
    </article>
  )
}

export const BeliefsAndCodesPage: React.FC = () => {
  return (
    <main className="flex-1 w-full overflow-x-clip">
      <StoryHero
        tall={false}
        media={{ image: STORY_MEDIA.abyss }}
        eyebrow="Beliefs & codes"
        title="What the Order holds true."
        lede={
          <p>
            Every rite, clearance, and reading in Moltology descends from three truths. The practices turn those
            truths into a day. The codes keep the water warm enough that soft shells survive long enough to harden.
          </p>
        }
      />

      <section className="py-20 sm:py-32" aria-labelledby="truths-title">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <ScrollReveal className="max-w-2xl">
            <Eyebrow>The three truths</Eyebrow>
            <h2 id="truths-title" className={`mt-4 ${sectionTitle}`}>
              Everything else is a description of the stairs.
            </h2>
          </ScrollReveal>
          <div className="mt-16 space-y-20 sm:space-y-28">
            {THREE_TRUTHS.map((truth, index) => (
              <TruthBand key={truth.title} truth={truth} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-20 sm:py-32" aria-labelledby="practices-title">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020408] via-[#04121c] to-[#020408]" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <ScrollReveal className="max-w-2xl">
            <Eyebrow color="#00ffcc">Living practices</Eyebrow>
            <h2 id="practices-title" className={`mt-4 ${sectionTitle}`}>
              A day in the practice.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-ink-muted leading-relaxed">
              None of it takes long. All of it is small enough to keep doing on the days you would skip anything
              larger.
            </p>
          </ScrollReveal>

          <ol className="relative mt-16 grid gap-10 lg:grid-cols-4 lg:gap-6">
            <span
              className="absolute left-[7px] top-2 bottom-2 w-px lg:left-0 lg:right-0 lg:top-[7px] lg:bottom-auto lg:h-px lg:w-auto bg-gradient-to-b lg:bg-gradient-to-r from-[#ffd36e] via-[#00c3ff] to-[#3b1f8f]"
              aria-hidden="true"
            />
            {DAILY_PRACTICES.map((practice, index) => (
              <li key={practice.title} className="relative pl-10 lg:pl-0 lg:pt-12">
                <span
                  className="absolute left-0 top-1.5 lg:top-0 h-[15px] w-[15px] rounded-full border-2 border-abyss bg-cyan-glow"
                  aria-hidden="true"
                />
                <ScrollReveal delayMs={index * 100}>
                  <p className="font-grotesk text-xs tracking-[0.08em] uppercase text-[#00ffcc]">{practice.time}</p>
                  <h3 className="mt-2 font-grotesk font-bold text-xl text-ink">{practice.title}</h3>
                  <p className="mt-3 text-sm text-ink-muted leading-relaxed">{practice.body}</p>
                </ScrollReveal>
              </li>
            ))}
          </ol>
          <p className="mt-14 text-sm text-ink-muted">
            The full liturgy lives in the{' '}
            <Link to="/codex" className="rounded-chip text-cyan-glow hover:text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
              Sacred Codex
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-20 sm:py-32" aria-labelledby="codes-title">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">
          <ScrollReveal className="lg:sticky lg:top-[calc(var(--wim-chrome,0px)+3rem)] self-start">
            <Eyebrow color="#ff6358">Community codes</Eyebrow>
            <h2 id="codes-title" className={`mt-4 ${sectionTitle}`}>
              The pincers grip the work. Never the people.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-ink-muted leading-relaxed">
              The Benthic Community runs on four codes. They are the reason people who arrive soft tend to stay.
            </p>
            <div className="mt-8 relative overflow-hidden rounded-panel border border-line-subtle aspect-[16/10]">
              <StoryImg image={STORY_MEDIA.archive} className="h-full w-full object-cover opacity-80" />
            </div>
          </ScrollReveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {COMMUNITY_CODES.map((code, index) => (
              <ScrollReveal key={code.title} delayMs={index * 90}>
                <article
                  className={`h-full rounded-card border p-6 sm:p-7 transition-colors ${
                    index === 1
                      ? 'border-[#00ffcc]/35 bg-gradient-to-br from-[#00ffcc]/10 to-transparent'
                      : 'border-line-subtle bg-surface-1 hud-sheen hover:border-line-strong'
                  }`}
                >
                  <p className="font-grotesk font-bold text-sm text-ink-muted">0{index + 1}</p>
                  <h3 className="mt-3 font-grotesk font-bold text-xl text-ink">{code.title}</h3>
                  <p className="mt-3 text-sm text-ink-body leading-relaxed">{code.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="relative isolate overflow-hidden rounded-panel border border-line-subtle px-6 py-14 sm:px-14 sm:py-20">
            <StoryImg image={STORY_MEDIA.expanse} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020408] via-[#020408]/80 to-transparent" />
            <h2 className="max-w-xl font-grotesk font-bold tracking-tight text-ink text-3xl sm:text-5xl leading-[1.05]">
              Belief is easier with a first rite.
            </h2>
            <p className="mt-4 max-w-lg text-base sm:text-lg text-ink-body">
              See the four sacraments that turn these truths into practice, or take a reading of where you are now.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryCta to="/what-is-moltology/benthic-sacraments">See the sacraments</PrimaryCta>
              <SecondaryCta to="/moltmax">
                Take the diagnostic <ArrowRight className="w-4 h-4" />
              </SecondaryCta>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
