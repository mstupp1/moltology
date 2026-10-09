import React, { Suspense, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Maximize2, Plus } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { LandingAuthCtaSkeleton } from '@/components/LandingAuthCtaSkeleton'
import { Eyebrow, StoryImg } from '@/components/what-is-moltology/story/StoryPrimitives'
import {
  activeStepForProgress,
  clamp01,
  useMediaQuery,
  usePrefersReducedMotion,
  useScrollProgress,
} from '@/components/what-is-moltology/story/motion'
import { VOICE_STAGE_ACCENTS, VOICE_STAGE_LABELS } from '@/components/what-is-moltology/story/content'
import { DepthLayer, SeamFade, SectionBackdrop, useTilt } from './HomeDepth'
import { HOME_BACKDROPS, HOME_FAQ, HOME_FINAL_IMAGE, HOME_MELT_MOMENTS, HOME_READINGS, HOME_STEPS, HOME_VOICES, type HomeReading, type HomeStep } from './content'

const LazyLandingAuthCtas = React.lazy(() =>
  import('@/components/LandingAuthCtas').then((m) => ({ default: m.LandingAuthCtas }))
)

export interface HomeSectionProps {
  authReady: boolean
  onNavigate: (path: string) => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

const sectionTitle =
  'font-grotesk font-bold tracking-[-0.03em] text-ink text-[2.4rem] sm:text-5xl lg:text-6xl leading-[1.04] [text-wrap:balance]'
const lede = 'text-base sm:text-lg text-ink-muted leading-relaxed [text-wrap:pretty]'
const textLink =
  'group inline-flex items-center gap-2 rounded-control font-grotesk font-bold text-sm transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/**
 * The moment of the list that is lit, given how far the list has travelled through the viewport.
 * Lines light up between 30% and 70% of the trip, so each one is read near the middle of the screen.
 */
export function litMomentForProgress(progress: number, count: number): number {
  return activeStepForProgress(clamp01((progress - 0.3) / 0.4), count)
}

/* ── Recognition: the melt, in moments the visitor has lived ─────────── */

export const HomeMelt: React.FC = () => {
  const listRef = useRef<HTMLOListElement>(null)
  const reduced = usePrefersReducedMotion()
  const [lit, setLit] = useState(0)
  useScrollProgress(listRef, (p) => {
    const next = litMomentForProgress(p, HOME_MELT_MOMENTS.length)
    setLit((prev) => (prev === next ? prev : next))
  })

  return (
    <section
      aria-labelledby="home-melt-title"
      className="relative isolate overflow-hidden py-24 sm:py-36 bg-gradient-to-b from-[#020408] via-[#061722] to-[#020408]"
    >
      <SectionBackdrop image={HOME_BACKDROPS.surface} position="50% 20%" tone="surface" />
      <DepthLayer kind="shafts" className="-z-10 opacity-25" />
      <DepthLayer kind="snow" className="-z-10 opacity-25" />
      <SeamFade />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-16 lg:gap-20 items-center">
        <ScrollReveal>
          <Eyebrow color="#ff6358">Sound familiar?</Eyebrow>
          <h2 id="home-melt-title" className={`mt-5 ${sectionTitle}`}>
            You are not lazy. You are unarmored.
          </h2>
          <p className={`mt-6 max-w-md ${lede}`}>
            Most days don’t fall apart. They melt, one small interruption at a time.
          </p>
        </ScrollReveal>

        <div>
          <ol ref={listRef} className="space-y-5 sm:space-y-7" aria-label="Moments of the melt">
            {HOME_MELT_MOMENTS.map((moment, index) => {
              const state = reduced || index === lit ? 'now' : index < lit ? 'past' : 'next'
              return (
                <li
                  key={moment}
                  className="font-grotesk font-medium text-xl sm:text-2xl lg:text-[1.7rem] leading-snug transition-colors duration-500"
                  style={{
                    color:
                      state === 'now' ? '#ffffff' : state === 'past' ? 'rgba(255,99,88,0.55)' : 'rgba(223,227,227,0.22)',
                  }}
                >
                  {moment}
                </li>
              )
            })}
          </ol>
          <ScrollReveal>
            <p className="mt-12 sm:mt-14 max-w-lg text-base sm:text-lg text-ink-body leading-relaxed [text-wrap:pretty]">
              Moltology has a name for this: the Great Melt. It isn’t a character flaw. It is what happens to
              anything soft that lives on the surface.
            </p>
            <Link to="/what-is-moltology" className={`mt-6 text-crimson-text ${textLink}`}>
              Read the whole story
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/* ── The idea: carcinization, and what a shell is made of ────────────── */

const ReadingCard: React.FC<{ reading: HomeReading }> = ({ reading }) => {
  const tilt = useTilt<HTMLElement>()
  return (
    <article
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="home-tilt group relative h-full overflow-hidden rounded-card border border-line-subtle bg-[#05090c] shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:border-line-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <StoryImg
          image={reading.image}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#05090c] to-transparent" />
      </div>
      <div className="p-6 sm:p-7 pt-2 sm:pt-3">
        <p className="font-grotesk text-[11px] font-bold tracking-[0.08em] uppercase" style={{ color: reading.accent }}>
          {reading.name}
        </p>
        <h3 className="mt-2 font-grotesk font-bold text-2xl text-ink">{reading.plain}</h3>
        <p className="mt-2 text-[15px] text-ink-body leading-relaxed">{reading.body}</p>
      </div>
      <span className="home-tilt-glare" aria-hidden="true" />
    </article>
  )
}

export const HomeIdea: React.FC = () => (
  <section
    aria-labelledby="home-idea-title"
    className="relative isolate overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-[#020408] via-[#03101a] to-[#020408]"
  >
    <SectionBackdrop image={HOME_BACKDROPS.seabed} position="50% 75%" drift={14} tone="seabed" />
    <div className="absolute inset-x-0 top-0 h-1/2 -z-10 bg-gradient-to-b from-[#020408]/80 via-[#020408]/35 to-transparent" aria-hidden="true" />
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <ScrollReveal className="max-w-3xl">
        <Eyebrow>The strange part</Eyebrow>
        <h2 id="home-idea-title" className={`mt-5 ${sectionTitle}`}>
          Nature keeps turning things into crabs.
        </h2>
        <p className={`mt-6 ${lede}`}>
          Biologists call it carcinization. At least five unrelated crustaceans evolved into the same calm,
          armored, gripping shape, because it works. Moltology builds that same shape around your attention.
        </p>
      </ScrollReveal>

      <div className="mt-16 sm:mt-20 grid gap-6 md:grid-cols-3">
        {HOME_READINGS.map((reading, index) => (
          <ScrollReveal key={reading.id} delayMs={index * 110} className="h-full">
            <ReadingCard reading={reading} />
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal>
        <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <p className="text-sm sm:text-base text-ink-muted">
            Your dashboard reads all three from what you actually do, not what you hoped to do.
          </p>
          <Link to="/what-is-moltology/beliefs" className={`shrink-0 text-cyan-glow ${textLink}`}>
            What Moltologists believe
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  </section>
)

/* ── How it works: four steps beside the real screens ────────────────── */

const ScreenFrame: React.FC<{ step: HomeStep; onExpand: () => void; children: React.ReactNode }> = ({
  step,
  onExpand,
  children,
}) => {
  const tilt = useTilt<HTMLButtonElement>(3)
  return (
    <button
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      type="button"
      onClick={onExpand}
      aria-label={`Expand screenshot: ${step.title}`}
      className="home-tilt group relative block w-full text-left cursor-zoom-in rounded-panel focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
    >
      <div className="relative overflow-hidden rounded-panel border border-line-subtle bg-surface-1 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-colors duration-500 group-hover:border-line-strong">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-8 sm:h-9 border-b border-line-subtle bg-surface-2" aria-hidden="true">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-white/15" />
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-white/15" />
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto max-w-[220px] w-full rounded-control bg-surface-1 border border-line-subtle px-3 py-0.5 text-[11px] text-ink-muted text-center truncate">
            {step.url}
          </div>
          <div className="w-[34px] sm:w-[42px]" />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden">
          {children}
          <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-1/85 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-ink shadow-menu transition-colors group-hover:border-line-strong group-hover:text-cyan-glow">
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            Click to expand
          </span>
          <span className="home-tilt-glare" aria-hidden="true" />
        </div>
      </div>
    </button>
  )
}

const stepScreenshotClass = 'absolute inset-0 h-full w-full object-cover object-top'

const StepAction: React.FC<{ step: HomeStep; onNavigate: (path: string) => void }> = ({ step, onNavigate }) => (
  <button
    type="button"
    onClick={() => onNavigate(step.actionRoute)}
    className="group/cta mt-5 inline-flex items-center gap-2 font-grotesk font-bold text-sm text-cyan-glow hover:text-ink transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow rounded-control"
  >
    {step.actionText}
    <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
  </button>
)

/** Quiet artwork supports the steps without decorative map or sonar rings. */
const HowBackdrop: React.FC = () => (
  <SectionBackdrop image={HOME_BACKDROPS.practice} tone="practice" drift={0} />
)

const HowItWorksIntro: React.FC = () => (
  <>
    <Eyebrow color="#00ffcc">How it works</Eyebrow>
    <h2 id="home-how-title" className={`mt-5 ${sectionTitle}`}>
      Small enough to start today.
    </h2>
    <p className={`mt-5 max-w-md ${lede}`}>No overhaul and no 5 a.m. club. One small shed at a time.</p>
  </>
)

export const HomeHowItWorks: React.FC<Pick<HomeSectionProps, 'onNavigate'>> = ({ onNavigate }) => {
  const sectionRef = useRef<HTMLElement>(null)
  const isWide = useMediaQuery('(min-width: 1024px)')
  const reduced = usePrefersReducedMotion()
  const pinned = isWide && !reduced
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<number | null>(null)

  useScrollProgress(
    sectionRef,
    (p) => {
      if (!pinned) return
      const next = activeStepForProgress(p, HOME_STEPS.length)
      setActive((prev) => (prev === next ? prev : next))
    },
    'pin',
  )

  const lightbox = (
    <ImageLightbox
      isOpen={expanded !== null}
      onClose={() => setExpanded(null)}
      currentIndex={expanded ?? 0}
      onIndexChange={setExpanded}
      onNavigate={onNavigate}
      images={HOME_STEPS.map((step) => ({
        src: step.screenshot.src,
        alt: step.screenshotAlt,
        title: step.title,
        description: step.body,
        actionRoute: step.actionRoute,
        actionText: step.actionText,
      }))}
    />
  )

  if (!pinned) {
    return (
      <section ref={sectionRef} aria-labelledby="home-how-title" className="relative isolate overflow-hidden py-24 sm:py-32">
        <HowBackdrop />
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <ScrollReveal>
            <HowItWorksIntro />
          </ScrollReveal>
          <ol className="mt-16 space-y-20 sm:space-y-24">
            {HOME_STEPS.map((step, index) => (
              <li key={step.id}>
                <ScrollReveal>
                  <p className="font-grotesk text-sm font-bold text-[#00ffcc]">Step {index + 1}</p>
                  <h3 className="mt-2 font-grotesk font-bold text-2xl sm:text-3xl text-ink">{step.title}</h3>
                  <p className="mt-3 text-base text-ink-body leading-relaxed [text-wrap:pretty]">{step.body}</p>
                  <div className="mt-6">
                    <ScreenFrame step={step} onExpand={() => setExpanded(index)}>
                      <StoryImg image={step.screenshot} alt={step.screenshotAlt} className={stepScreenshotClass} />
                    </ScreenFrame>
                  </div>
                  <StepAction step={step} onNavigate={onNavigate} />
                </ScrollReveal>
              </li>
            ))}
          </ol>
        </div>
        {lightbox}
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-how-title"
      className="relative"
      style={{ height: `${HOME_STEPS.length * 70 + 40}svh` }}
    >
      <div className="sticky top-0 isolate h-[100svh] overflow-hidden flex items-center pt-16">
        <HowBackdrop />
        <div className="w-full max-w-6xl mx-auto px-8 grid grid-cols-[0.8fr_1.2fr] gap-16 items-center">
          <div>
            <HowItWorksIntro />
            <ol className="mt-10 space-y-1 border-l border-line-subtle">
              {HOME_STEPS.map((step, index) => {
                const isActive = index === active
                return (
                  <li key={step.id} className="relative pl-6 py-3" aria-current={isActive ? 'step' : undefined}>
                    <span
                      className="absolute -left-px top-3 bottom-3 w-0.5 rounded-full transition-colors duration-500"
                      style={{ background: isActive ? '#00ffcc' : 'transparent' }}
                      aria-hidden="true"
                    />
                    <h3
                      className="font-grotesk font-bold text-xl transition-colors duration-500"
                      style={{ color: isActive ? '#ffffff' : 'rgba(223,227,227,0.35)' }}
                    >
                      <span className="mr-3 tabular-nums text-sm" style={{ color: isActive ? '#00ffcc' : 'inherit' }}>
                        0{index + 1}
                      </span>
                      {step.title}
                    </h3>
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
                      style={{ gridTemplateRows: isActive ? '1fr' : '0fr', opacity: isActive ? 1 : 0 }}
                    >
                      <div className="overflow-hidden">
                        <p className="pt-2 text-[15px] text-ink-body leading-relaxed max-w-md">{step.body}</p>
                        <StepAction step={step} onNavigate={onNavigate} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          <ScreenFrame step={HOME_STEPS[active]} onExpand={() => setExpanded(active)}>
            {HOME_STEPS.map((step, index) => (
              <div
                key={step.id}
                className="absolute inset-0 transition-[opacity,transform] duration-700 ease-out"
                style={{ opacity: index === active ? 1 : 0, transform: index === active ? 'none' : 'scale(1.04)' }}
                aria-hidden={index === active ? undefined : true}
              >
                <StoryImg
                  image={step.screenshot}
                  alt={index === active ? step.screenshotAlt : ''}
                  className={stepScreenshotClass}
                />
              </div>
            ))}
          </ScreenFrame>
        </div>
      </div>
      {lightbox}
    </section>
  )
}

/* ── Voices: three members, three small wins ─────────────────────────── */

export const HomeVoices: React.FC = () => (
  <section aria-labelledby="home-voices-title" className="relative isolate overflow-hidden py-24 sm:py-32">
    <SectionBackdrop image={HOME_BACKDROPS.gallery} position="60% 50%" tone="gallery" />
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020408]/45 via-transparent to-transparent" aria-hidden="true" />
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <ScrollReveal className="max-w-3xl">
        <Eyebrow color="#00ffcc">From the community</Eyebrow>
        <h2 id="home-voices-title" className={`mt-5 ${sectionTitle}`}>
          Nobody arrives armored.
        </h2>
      </ScrollReveal>

      <div className="mt-14 sm:mt-16 grid gap-6 md:grid-cols-3">
        {HOME_VOICES.map((voice, index) => (
          <ScrollReveal key={voice.name} delayMs={index * 110}>
            <figure className="home-voice-glass flex h-full flex-col justify-between rounded-card border border-line-subtle p-7 sm:p-8">
              <blockquote className="font-grotesk text-lg sm:text-xl text-ink leading-snug [text-wrap:pretty]">
                &ldquo;{voice.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full" style={{ background: VOICE_STAGE_ACCENTS[voice.stage] }} aria-hidden="true" />
                <span className="font-grotesk font-bold text-sm text-ink">{voice.name}</span>
                <span className="text-xs text-ink-muted">
                  {VOICE_STAGE_LABELS[voice.stage]} · {voice.clearance}
                </span>
              </figcaption>
            </figure>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal>
        <Link to="/what-is-moltology/what-moltologists-say" className={`mt-12 text-[#00ffcc] ${textLink}`}>
          Hear more from members
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </ScrollReveal>
    </div>
  </section>
)

/* ── Questions people ask right before they join ─────────────────────── */

export const HomeFaq: React.FC = () => (
  <section aria-labelledby="home-faq-title" className="relative isolate overflow-hidden py-24 sm:py-32">
    {/* No artwork here: a breather between the voices and the invitation, lit faintly from above. */}
    <div
      className="absolute inset-0 -z-10"
      style={{
        background:
          'radial-gradient(ellipse 45% 40% at 22% 18%, rgba(0, 195, 255, 0.1), transparent 70%), radial-gradient(ellipse 40% 35% at 75% 85%, rgba(0, 255, 204, 0.05), transparent 70%)',
      }}
      aria-hidden="true"
    />
    <DepthLayer kind="shafts" className="-z-10 opacity-40" />
    <SeamFade />
    <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
      <ScrollReveal>
        <Eyebrow>Questions</Eyebrow>
        <h2 id="home-faq-title" className={`mt-5 ${sectionTitle}`}>
          Before you dive in.
        </h2>
      </ScrollReveal>
      <div className="space-y-3">
        {HOME_FAQ.map((item) => (
          <details
            key={item.question}
            className="group rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset px-5 sm:px-6 transition-colors hover:border-line open:border-line"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 sm:py-6 font-grotesk font-bold text-lg sm:text-xl text-ink hover:text-cyan-glow transition-colors [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow rounded-control">
              {item.question}
              <Plus
                className="h-5 w-5 shrink-0 text-cyan-glow transition-transform duration-300 group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            <p className="pb-6 -mt-1 max-w-2xl text-base text-ink-body leading-relaxed [text-wrap:pretty]">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
)

/* ── The invitation ──────────────────────────────────────────────────── */

export const HomeFinalCta: React.FC<HomeSectionProps> = ({ authReady, onNavigate, onOpenAuth }) => (
  <section aria-labelledby="home-final-title" className="relative px-5 sm:px-8 pb-24 sm:pb-32">
    <ScrollReveal animation="scale-up">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-panel border border-cyan-glow/40 bg-gradient-to-br from-[#04161c] via-[#03090d] to-[#020408] grid md:grid-cols-[1.15fr_0.85fr] items-center">
        {/* Separate desktop and portrait compositions cover the whole invitation. */}
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <StoryImg image={HOME_FINAL_IMAGE} className="home-final-art h-full w-full object-cover" />
          <div className="home-final-vignette absolute inset-0" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#020408]/55 to-[#020408]/80 md:bg-gradient-to-r md:from-[#020408]/70 md:via-[#020408]/15 md:to-transparent" aria-hidden="true" />
        <DepthLayer kind="caustics" className="-z-10 opacity-30" />
        <DepthLayer kind="snow" className="-z-10 opacity-25" />
        <div className="px-6 py-12 sm:p-14 lg:p-16">
          <h2
            id="home-final-title"
            className="font-grotesk font-bold tracking-[-0.03em] text-ink text-4xl sm:text-5xl lg:text-6xl leading-[1.02] [text-wrap:balance]"
          >
            Start with one small shed.
          </h2>
          <p className="mt-5 max-w-md text-base sm:text-lg text-ink-body leading-relaxed">
            Free to join, no card needed. Try the demo first if you’d rather look around.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
            <Suspense fallback={<LandingAuthCtaSkeleton variant="bottom" />}>
              {authReady ? (
                <LazyLandingAuthCtas variant="bottom" onNavigate={onNavigate} onOpenAuth={onOpenAuth} />
              ) : (
                <LandingAuthCtaSkeleton variant="bottom" />
              )}
            </Suspense>
          </div>
          <Link to="/guide" className="mt-7 group inline-flex items-center gap-2 rounded-control text-sm text-ink-muted hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
            <BookOpen className="w-4 h-4 text-[#ffb547]" aria-hidden="true" />
            Not ready yet? Get the free field manual.
          </Link>
        </div>
        <div className="order-first md:order-none h-64 md:h-full md:min-h-[30rem]" aria-hidden="true" />
      </div>
    </ScrollReveal>
  </section>
)
