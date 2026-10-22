/**
 * /moltmaxxing: the plain explainer for the word. Definition first (it is what search quotes),
 * then the four moves, melt vs molt, the real daily Liturgies, the audit readings and the FAQ.
 * Copy lives in src/lib/moltmaxxing-content.ts so the page and its JSON-LD agree.
 */
import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MainFooter } from '@/components/MainFooter'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { MoltmaxGuideCard } from '@/components/guide/MoltmaxGuideCard'
import { MoltmaxGuideModal } from '@/components/guide/MoltmaxGuideModal'
import { MoltmaxGuideFloatingPill } from '@/components/guide/MoltmaxGuideFloatingPill'
import { Eyebrow, PrimaryCta, SecondaryCta, StoryHero, StoryImg } from '@/components/what-is-moltology/story/StoryPrimitives'
import { STORY_MEDIA, type StoryImage } from '@/components/what-is-moltology/story/content'
import { HOME_BACKDROPS, HOME_READINGS } from '@/components/home/content'
import { MOLTMAX_QUESTIONS } from '@/lib/moltmax-quiz'
import {
  AUDIT_READINGS,
  MELT_VS_MOLT,
  MOLTMAXXING_DAY,
  MOLTMAXXING_DEFINITION,
  MOLTMAXXING_FAQ,
  MOLTMAXXING_MOVES,
  type MoltmaxxingMove,
} from '@/lib/moltmaxxing-content'

const sectionTitle =
  'font-grotesk font-bold tracking-[-0.03em] text-ink text-4xl sm:text-5xl leading-[1.04] [text-wrap:balance]'
const lede = 'text-base sm:text-lg text-ink-muted leading-relaxed [text-wrap:pretty]'
const readingImage = (id: string): StoryImage => HOME_READINGS.find((reading) => reading.id === id)?.image ?? STORY_MEDIA.plating

const MOVE_IMAGES: Record<MoltmaxxingMove['id'], StoryImage> = {
  shed: STORY_MEDIA.plating,
  harden: readingImage('hardness'),
  grip: readingImage('torque'),
  deep: readingImage('depth'),
}

const QUESTION_COUNT = MOLTMAX_QUESTIONS.length

const MoveCard: React.FC<{ move: MoltmaxxingMove; index: number }> = ({ move, index }) => (
  <article className="group h-full overflow-hidden rounded-card border border-line-subtle bg-surface-1 hud-sheen">
    <div className="relative aspect-[16/9] sm:aspect-[4/3] overflow-hidden">
      <StoryImg
        image={MOVE_IMAGES[move.id]}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-1 to-transparent" />
    </div>
    <div className="p-5 sm:p-6 pt-1 sm:pt-2">
      <p className="font-grotesk text-xs font-bold tracking-[0.08em] uppercase text-ink-muted">
        <span className="text-cyan-glow">{String(index + 1).padStart(2, '0')}</span> · {move.term}
      </p>
      <h3 className="mt-2 font-grotesk font-bold text-2xl text-ink">{move.verb}</h3>
      <p className="mt-1 font-grotesk font-medium text-ink-body">{move.plain}</p>
      <p className="mt-3 text-[15px] text-ink-muted leading-relaxed [text-wrap:pretty]">{move.body}</p>
    </div>
  </article>
)

export const MoltmaxxingPillarPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-abyss text-ink-body font-sans selection:bg-cyan-glow/30 selection:text-white flex flex-col">
      <PublicHeader onOpenAuth={openAuth} />

      <main className="flex-1">
        <StoryHero
          tall={false}
          media={{ image: STORY_MEDIA.crab }}
          eyebrow="Moltmaxxing"
          title="What is Moltmaxxing?"
          lede={
            <>
              <p className="text-ink">{MOLTMAXXING_DEFINITION}</p>
              <p className="mt-4">
                Crabs have been doing a version of it for hundreds of millions of years. You can start tonight.
              </p>
            </>
          }
          actions={
            <>
              <PrimaryCta to="/moltmax">Take the diagnostic</PrimaryCta>
              <SecondaryCta to="/guide">Get the Field Manual</SecondaryCta>
            </>
          }
        />

        {/* The four moves */}
        <section aria-labelledby="moves-title" className="py-16 sm:py-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <ScrollReveal>
              <Eyebrow>How it works</Eyebrow>
              <h2 id="moves-title" className={`mt-5 max-w-3xl ${sectionTitle}`}>
                Four moves, repeated daily.
              </h2>
              <p className={`mt-5 max-w-2xl ${lede}`}>
                Every Moltology word has an ordinary meaning underneath it. These are the four that matter most.
              </p>
            </ScrollReveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {MOLTMAXXING_MOVES.map((move, index) => (
                <ScrollReveal key={move.id} delayMs={index * 80} className="h-full">
                  <MoveCard move={move} index={index} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Melt vs molt */}
        <section
          aria-labelledby="melt-title"
          className="relative isolate overflow-hidden py-16 sm:py-28 bg-gradient-to-b from-abyss via-surface-1 to-abyss"
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20">
            <ScrollReveal>
              <Eyebrow color="#ff6a60">The opposite</Eyebrow>
              <h2 id="melt-title" className={`mt-5 ${sectionTitle}`}>
                Melt or molt.
              </h2>
              <p className={`mt-5 ${lede}`}>
                Meltmaxxing is the trend where people let their face go slack on camera, from 0% to 100% melted. It is
                funny because it is familiar. Most days melt the same way, one small interruption at a time.
              </p>
              <div className="mt-10 border-t border-line-subtle pt-8">
                <h3 className="font-grotesk font-bold text-xl text-ink">And looksmaxxing?</h3>
                <p className="mt-3 text-base text-ink-muted leading-relaxed [text-wrap:pretty]">
                  Looksmaxxing works on how you look. Moltmaxxing works on how you hold up: your focus, your boundaries
                  and your follow-through. You can do both. Only one of them comes with a shell.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="rounded-panel border border-line-subtle bg-surface-1 hud-sheen overflow-hidden">
                <div className="hidden sm:grid grid-cols-2 border-b border-line-subtle font-grotesk text-xs font-bold tracking-[0.08em] uppercase">
                  <p className="px-6 py-4 text-crimson-text">A melted day</p>
                  <p className="px-6 py-4 text-cyan-glow border-l border-line-subtle">A molted day</p>
                </div>
                <ul className="divide-y divide-line-subtle">
                  {MELT_VS_MOLT.melt.map((melt, index) => (
                    <li key={melt} className="grid sm:grid-cols-2">
                      <p className="px-5 sm:px-6 pt-5 sm:py-5 text-[15px] text-ink-muted leading-relaxed">
                        <span className="sm:hidden font-grotesk text-xs font-bold tracking-[0.08em] uppercase text-crimson-text">Melted · </span>
                        {melt}
                      </p>
                      <p className="px-5 sm:px-6 pt-2 pb-5 sm:py-5 text-[15px] text-ink leading-relaxed sm:border-l border-line-subtle">
                        <span className="sm:hidden font-grotesk text-xs font-bold tracking-[0.08em] uppercase text-cyan-glow">Molted · </span>
                        {MELT_VS_MOLT.molt[index]}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* A Moltmaxxing day: the real daily Liturgies */}
        <section aria-labelledby="day-title" className="py-16 sm:py-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20">
            <ScrollReveal className="lg:sticky lg:top-28 self-start">
              <Eyebrow>The routine</Eyebrow>
              <h2 id="day-title" className={`mt-5 ${sectionTitle}`}>
                A Moltmaxxing day.
              </h2>
              <p className={`mt-5 ${lede}`}>
                Members get the same eight small tasks every day, called Liturgies, in their dashboard. Each one is
                small on purpose, and each one checked off counts toward your next stage.
              </p>
              <p className="mt-5 text-base text-ink-body leading-relaxed [text-wrap:pretty]">
                You don’t need all eight on day one. Most people start with the first and the last.
              </p>
            </ScrollReveal>

            <ol className="relative border-l border-line-subtle ml-2 sm:ml-0">
              {MOLTMAXXING_DAY.map((task) => (
                <li key={task.key} className="relative pl-6 sm:pl-8 pb-8 last:pb-0">
                  <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-surface-3 border border-line" aria-hidden="true" />
                  <p className="font-grotesk text-xs font-bold tracking-[0.08em] text-ink-muted tabular-nums">{task.time}</p>
                  <h3 className="mt-1 font-grotesk font-bold text-lg sm:text-xl text-ink">{task.title}</h3>
                  <p className="mt-1.5 text-[15px] text-ink-muted leading-relaxed [text-wrap:pretty]">{task.note}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The audit readings */}
        <section aria-labelledby="audit-title" className="py-16 sm:py-24 border-y border-line-subtle bg-surface-1/40">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <ScrollReveal>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <Eyebrow>The diagnostic</Eyebrow>
                  <h2 id="audit-title" className={`mt-5 ${sectionTitle}`}>
                    Where are you starting from?
                  </h2>
                  <p className={`mt-5 max-w-2xl ${lede}`}>
                    The free Moltmaxxing Audit asks {QUESTION_COUNT} questions about how you handle pressure, finish
                    work and protect your focus. It takes about four minutes and needs no account.
                  </p>
                </div>
                <PrimaryCta to="/moltmax" className="self-start lg:self-auto shrink-0">
                  Take the diagnostic
                </PrimaryCta>
              </div>
            </ScrollReveal>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-card border border-line-subtle bg-line-subtle sm:grid-cols-2 lg:grid-cols-4">
              {AUDIT_READINGS.map((reading) => (
                <li key={reading.name} className="bg-surface-1 p-5 sm:p-6">
                  <p className="font-grotesk text-xs font-bold tracking-[0.08em] uppercase text-ink-muted tabular-nums">
                    Score {reading.min}–{reading.max}
                  </p>
                  <h3 className="mt-2 font-grotesk font-bold text-lg text-ink">{reading.name}</h3>
                  <p className="mt-2 text-[15px] text-ink-muted leading-relaxed [text-wrap:pretty]">{reading.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-ink-muted">
              Every reading comes with three next steps. None of them is a verdict.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <MoltmaxGuideCard source="moltmaxxing_pillar_inline" onOpenGuideModal={() => setIsGuideModalOpen(true)} />
        </div>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="pb-16 sm:pb-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
            <ScrollReveal>
              <Eyebrow>Questions</Eyebrow>
              <h2 id="faq-title" className={`mt-5 ${sectionTitle}`}>
                Common questions.
              </h2>
              <p className={`mt-5 ${lede}`}>
                Want the longer story? Read{' '}
                <Link to="/what-is-moltology" className="text-ink hover:text-cyan-glow transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow rounded-control">
                  what Moltology is
                </Link>
                .
              </p>
            </ScrollReveal>
            <div className="space-y-3">
              {MOLTMAXXING_FAQ.map((item, index) => (
                <details
                  key={item.question}
                  open={index === 0}
                  className="group rounded-card border border-line-subtle bg-surface-1 hud-sheen px-5 sm:px-6 transition-colors hover:border-line open:border-line"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-grotesk font-bold text-lg text-ink hover:text-cyan-glow transition-colors [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow rounded-control">
                    {item.question}
                    <Plus className="h-5 w-5 shrink-0 text-cyan-glow transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
                  </summary>
                  <p className="pb-6 -mt-1 max-w-2xl text-base text-ink-body leading-relaxed [text-wrap:pretty]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Invitation */}
        <section aria-labelledby="final-title" className="px-5 sm:px-8 pb-24 sm:pb-32">
          <ScrollReveal animation="scale-up">
            <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-panel border border-line-subtle">
              <div className="absolute inset-0 -z-10" aria-hidden="true">
                <StoryImg image={HOME_BACKDROPS.seabed} className="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-abyss/90 via-abyss/60 to-abyss/10" aria-hidden="true" />
              <div className="px-6 py-14 sm:p-16 max-w-2xl">
                <h2 id="final-title" className={sectionTitle}>
                  Your first shed takes one evening.
                </h2>
                <p className="mt-5 max-w-md text-base sm:text-lg text-ink-body leading-relaxed">
                  Take the diagnostic, read your result, and let one thing go before bed tonight.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <PrimaryCta to="/moltmax">Take the diagnostic</PrimaryCta>
                  <button
                    type="button"
                    onClick={() => openAuth('signup')}
                    className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-control font-grotesk font-bold text-sm border border-line bg-surface-1/80 hud-sheen backdrop-blur-md text-ink hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    Join free
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <MainFooter />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} />

      <MoltmaxGuideFloatingPill onOpenGuideModal={() => setIsGuideModalOpen(true)} />

      <MoltmaxGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        source="moltmaxxing_pillar_floating_pill"
        onOpenAuthSignup={() => openAuth('signup')}
      />
    </div>
  )
}
