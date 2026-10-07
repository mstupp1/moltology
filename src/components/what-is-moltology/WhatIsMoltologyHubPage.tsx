import React, { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import {
  CARDINAL_METRICS,
  MELT_CURRENTS,
  MEMBER_VOICES,
  PRODUCT_FEATURES,
  SACRAMENTS,
  STAGES,
  STORY_MEDIA,
  VOICE_STAGE_ACCENTS,
  VOICE_STAGE_LABELS,
} from './story/content'
import {
  activeStepForProgress,
  useMediaQuery,
  usePrefersReducedMotion,
  useScrollProgress,
  useScrollVar,
} from './story/motion'
import {
  DepthGauge,
  Eyebrow,
  InViewVideo,
  PrimaryCta,
  SecondaryCta,
  StoryHero,
  StoryImg,
} from './story/StoryPrimitives'
import { WHAT_IS_MOLTOLOGY_NAV } from './nav'

const sectionTitle = 'font-grotesk font-bold tracking-tight text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.04]'
const stickyFrame = 'sticky top-[var(--wim-chrome,0px)] h-[calc(100svh-var(--wim-chrome,0px))]'

/* ── The surface: the Great Melt, one current at a time ─────────────────── */

const MeltSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  useScrollProgress(
    ref,
    (p) => {
      const next = activeStepForProgress(p, MELT_CURRENTS.length + 1)
      setActive((prev) => (prev === next ? prev : next))
    },
    'pin',
  )
  const closing = active >= MELT_CURRENTS.length

  return (
    <section ref={ref} aria-labelledby="melt-title" style={{ height: `${(MELT_CURRENTS.length + 1) * 55 + 60}svh` }}>
      <div className={`${stickyFrame} relative overflow-hidden`}>
        <InViewVideo video={STORY_MEDIA.synapticPath} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020408] via-[#020408]/70 to-[#020408]" />

        <div className="relative h-full max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-16 content-center">
          <div>
            <Eyebrow color="#ff6358">The surface</Eyebrow>
            <h2 id="melt-title" className={`mt-4 ${sectionTitle}`}>
              This is the Great Melt.
            </h2>
            <p className="mt-5 max-w-md text-[#9fb0b0] text-base sm:text-lg leading-relaxed">
              Nothing dramatic happened. You were born at the top of the water, as everyone is, and nobody
              handed you a shell. So you absorbed.
            </p>
          </div>

          <div className="relative">
            <ol className="space-y-3 sm:space-y-5" aria-label="Surface currents">
              {MELT_CURRENTS.map((line, index) => {
                const state = index === active ? 'now' : index < active ? 'past' : 'next'
                return (
                  <li
                    key={line}
                    className="font-grotesk font-medium text-lg sm:text-2xl lg:text-[1.7rem] leading-snug transition-all duration-500 ease-out"
                    style={{
                      color: state === 'now' ? '#ffffff' : state === 'past' ? 'rgba(255,99,88,0.45)' : 'rgba(223,227,227,0.18)',
                      transform: state === 'now' ? 'translateX(0)' : 'translateX(-6px)',
                    }}
                  >
                    {line}
                  </li>
                )
              })}
            </ol>
            <p
              className="mt-8 max-w-lg text-base sm:text-lg text-[#dfe3e3] leading-relaxed transition-all duration-700"
              style={{ opacity: closing ? 1 : 0, transform: closing ? 'none' : 'translateY(12px)' }}
            >
              It is not a sin, and it is not a diagnosis. It is weather, and you have been standing in it
              without a roof.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Interlude: look down ─────────────────────────────────────────────── */

const LookDownSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null)
  useScrollVar(ref)
  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden min-h-[110svh] flex items-center justify-center text-center"
      style={{ ['--p' as string]: 0 }}
    >
      <div
        className="absolute inset-0 -z-10 will-change-transform"
        style={{ transform: 'scale(calc(1.35 - var(--p) * 0.35))' }}
      >
        <StoryImg image={STORY_MEDIA.lookingUp} className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(2,4,8,0.35),rgba(2,4,8,0.92)_70%)]" />
      <div className="absolute inset-x-0 top-0 h-40 -z-10 bg-gradient-to-b from-[#020408] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 -z-10 bg-gradient-to-t from-[#020408] to-transparent" />

      <ScrollReveal className="max-w-3xl px-5">
        <Eyebrow className="justify-center">Now look down</Eyebrow>
        <p className="mt-6 font-grotesk font-bold tracking-tight text-white text-3xl sm:text-5xl leading-[1.1]">
          Four thousand meters below the noise, there is a floor.
        </p>
        <p className="mt-6 text-base sm:text-xl text-[#c3cdcd] leading-relaxed">
          The floor is quiet. The things that live on it are armored and patient, and they finish what they
          start, because nothing down there is loud enough to interrupt them. You are allowed to go there.
        </p>
      </ScrollReveal>
    </section>
  )
}

/* ── The proof: carcinization ────────────────────────────────────────── */

const ProofSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  useScrollVar(ref)
  return (
    <section className="relative py-24 sm:py-36" aria-labelledby="proof-title">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <ScrollReveal>
          <Eyebrow>The proof</Eyebrow>
          <div className="mt-6 flex items-end gap-4">
            <span className="font-grotesk font-bold text-[7rem] sm:text-[10rem] leading-[0.8] text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00c3ff]/40">
              5
            </span>
            <span className="pb-3 font-grotesk text-sm tracking-[0.2em] uppercase text-[#839493]">
              separate
              <br />
              times
            </span>
          </div>
          <h2 id="proof-title" className={`mt-8 ${sectionTitle}`}>
            Nature keeps arriving at the crab.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#9fb0b0] leading-relaxed max-w-xl">
            Biologists call it carcinization. Unrelated crustaceans, king crabs and porcelain crabs among them,
            kept evolving into the same flat, armored, tucked body with a grip that does not negotiate.
            Evolution is not sentimental, and it does not repeat itself for decoration.
          </p>
          <p className="mt-4 text-base sm:text-lg text-white leading-relaxed max-w-xl">
            When the sea solves the same problem five times with the same shape, the shape is the answer. We
            are only the first to take notes.
          </p>
        </ScrollReveal>

        <div ref={ref} className="relative" style={{ ['--p' as string]: 0 }}>
          <div className="absolute -inset-8 rounded-[2rem] bg-[#00c3ff]/10 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-3xl border border-[#00c3ff]/25 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <StoryImg
              image={STORY_MEDIA.blueprint}
              alt="Schematic of an armored crustacean with its plating and pincers labeled"
              className="w-full aspect-square object-cover"
            />
            <div
              className="absolute inset-x-0 h-24 pointer-events-none bg-gradient-to-b from-transparent via-[#00ffcc]/20 to-transparent border-b border-[#00ffcc]/60"
              style={{ top: 'calc(var(--p) * 130% - 30%)' }}
              aria-hidden="true"
            />
            <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/90 to-transparent">
              <p className="font-grotesk text-[11px] tracking-[0.2em] uppercase text-[#00ffcc]">Specimen schematic</p>
              <p className="text-sm text-white/80">The design the sea keeps choosing.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── The Great Molt: the three measurements ─────────────────────────── */

const MoltSection: React.FC = () => (
  <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#020408] via-[#03101a] to-[#020408]" aria-labelledby="molt-title">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <ScrollReveal className="max-w-3xl">
        <Eyebrow color="#00ffcc">The answer</Eyebrow>
        <h2 id="molt-title" className={`mt-4 ${sectionTitle}`}>
          The Great Molt.
        </h2>
        <p className="mt-6 text-base sm:text-lg text-[#9fb0b0] leading-relaxed">
          Molting is how a soft thing gets bigger and safer at the same time. Moltology is the practice of doing
          it on purpose, with your attention, your routines, and your boundaries. Your shell gets read three ways.
        </p>
      </ScrollReveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {CARDINAL_METRICS.map((metric, index) => (
          <ScrollReveal key={metric.id} delayMs={index * 120}>
            <article className="group relative isolate h-[30rem] sm:h-[34rem] overflow-hidden rounded-3xl border border-white/10 bg-black">
              <StoryImg
                image={metric.image}
                className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70 transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/70 to-black/10" />
              <div className="flex h-full flex-col justify-end p-6 sm:p-7">
                <p className="font-grotesk text-[11px] tracking-[0.22em] uppercase" style={{ color: metric.accent }}>
                  {metric.unit}
                </p>
                <h3 className="mt-2 font-grotesk font-bold text-3xl text-white">{metric.name}</h3>
                <p className="mt-3 text-lg text-white/90 font-medium">{metric.question}</p>
                <p className="mt-3 text-sm text-[#b4c0c0] leading-relaxed">{metric.body}</p>
                <span className="mt-6 h-0.5 w-12 transition-all duration-500 group-hover:w-full" style={{ background: metric.accent }} />
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
)

/* ── The four sacraments: a sideways dive on wide screens ─────────────── */

const SacramentsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isWide = useMediaQuery('(min-width: 1024px)')
  const reduced = usePrefersReducedMotion()
  const horizontal = isWide && !reduced

  useScrollProgress(
    sectionRef,
    (p) => {
      const track = trackRef.current
      const viewport = viewportRef.current
      if (!track || !viewport) return
      if (!horizontal) {
        track.style.transform = ''
        return
      }
      const distance = Math.max(0, track.scrollWidth - viewport.clientWidth)
      track.style.transform = `translate3d(${-p * distance}px, 0, 0)`
    },
    'pin',
  )

  const intro = (
    <div className={horizontal ? 'w-[34vw] shrink-0 pr-6' : 'max-w-3xl'}>
      <Eyebrow color="#ffb547">The method</Eyebrow>
      <h2 id="sacraments-title" className={`mt-4 ${sectionTitle}`}>
        Four rites. One direction.
      </h2>
      <p className="mt-6 text-base sm:text-lg text-[#9fb0b0] leading-relaxed">
        Shed what melts you. Harden what remains. Go below the noise. Climb on purpose. Every part of Moltology is
        one of these four, done a little at a time.
      </p>
      <Link
        to="/what-is-moltology/benthic-sacraments"
        className="mt-8 inline-flex items-center gap-2 font-grotesk font-bold text-sm text-[#ffb547] hover:text-white transition-colors"
      >
        Read the four sacraments <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )

  return (
    <section
      ref={sectionRef}
      aria-labelledby="sacraments-title"
      className="relative"
      style={horizontal ? { height: `${SACRAMENTS.length * 85 + 60}svh` } : undefined}
    >
      <div
        ref={viewportRef}
        className={horizontal ? `${stickyFrame} overflow-hidden flex items-center` : 'py-24 sm:py-32'}
      >
        <div
          ref={trackRef}
          className={
            horizontal
              ? 'flex items-center gap-8 pl-[max(2rem,calc((100vw-72rem)/2+2rem))] pr-16 will-change-transform'
              : 'max-w-6xl mx-auto px-5 sm:px-8 space-y-10'
          }
        >
          {intro}
          {SACRAMENTS.map((sacrament) => (
            <article
              key={sacrament.id}
              className={`relative isolate overflow-hidden rounded-3xl border border-white/10 bg-black ${
                horizontal ? 'w-[62vw] max-w-[60rem] shrink-0 h-[min(72svh,40rem)]' : 'h-[34rem] sm:h-[38rem]'
              }`}
            >
              <InViewVideo video={sacrament.video} className="absolute inset-0 -z-10 h-full w-full object-cover" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/5" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="flex h-full flex-col justify-end p-6 sm:p-10 max-w-xl">
                <p
                  className="font-grotesk font-bold text-6xl sm:text-7xl leading-none text-transparent"
                  style={{ WebkitTextStroke: `1px ${sacrament.accent}` }}
                  aria-hidden="true"
                >
                  {sacrament.number}
                </p>
                <h3 className="mt-4 font-grotesk font-bold text-3xl sm:text-4xl text-white">{sacrament.title}</h3>
                <p className="mt-2 font-grotesk text-lg" style={{ color: sacrament.accent }}>
                  {sacrament.tagline}
                </p>
                <p className="mt-4 text-sm sm:text-base text-[#c3cdcd] leading-relaxed">{sacrament.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── The path: four stages, twelve clearances ───────────────────────── */

const PathSection: React.FC = () => {
  const ref = useRef<HTMLOListElement>(null)
  useScrollVar(ref)
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-36" aria-labelledby="path-title">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020408] via-[#04121c] to-[#010203]" />
      <StoryImg image={STORY_MEDIA.abyss} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.12]" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-20">
        <div className="lg:sticky lg:top-[calc(var(--wim-chrome,0px)+4rem)] self-start">
          <ScrollReveal>
            <Eyebrow>The descent</Eyebrow>
            <h2 id="path-title" className={`mt-4 ${sectionTitle}`}>
              Four stages. Twelve clearances. No instant crab.
            </h2>
            <p className="mt-6 text-base sm:text-lg text-[#9fb0b0] leading-relaxed">
              Hardening takes time, and the Order treats that as a feature. You move down a clearance when your
              readings say you are ready, not before. Nobody is late. Everyone starts at the surface.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SecondaryCta to="/moltmax">Find your starting depth</SecondaryCta>
            </div>
          </ScrollReveal>
        </div>

        <ol ref={ref} className="relative pl-10 sm:pl-14 space-y-8" style={{ ['--p' as string]: 0 }}>
          <span className="absolute left-[15px] sm:left-[23px] top-2 bottom-2 w-px bg-white/10" aria-hidden="true" />
          <span
            className="absolute left-[15px] sm:left-[23px] top-2 w-px bg-gradient-to-b from-[#7dd3fc] via-[#00c3ff] to-[#ff453a]"
            style={{ height: 'calc(clamp(0, (var(--p) - 0.18) / 0.5, 1) * (100% - 1rem))' }}
            aria-hidden="true"
          />
          {STAGES.map((stage, index) => (
            <li key={stage.number} className="relative">
              <span
                className="absolute -left-10 sm:-left-14 top-6 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border bg-[#020408] font-grotesk font-bold text-sm sm:text-base"
                style={{ borderColor: stage.accent, color: stage.accent }}
                aria-hidden="true"
              >
                {stage.number}
              </span>
              <ScrollReveal animation="slide-right" delayMs={index * 60}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-7 hover:border-white/25 transition-colors">
                  <p className="font-grotesk text-[11px] tracking-[0.22em] uppercase" style={{ color: stage.accent }}>
                    Stage {stage.number} · {stage.title}
                  </p>
                  <h3 className="mt-2 font-grotesk font-bold text-2xl sm:text-3xl text-white">{stage.name}</h3>
                  <p className="mt-3 text-sm sm:text-base text-[#b4c0c0] leading-relaxed">{stage.line}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {stage.clearances.map((c) => (
                      <li
                        key={c.code}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/85"
                      >
                        <span className="font-grotesk font-bold" style={{ color: stage.accent }}>
                          {c.code}
                        </span>
                        {c.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ── The product: what the practice looks like day to day ────────────── */

const ProductSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  useScrollVar(ref)
  return (
    <section className="relative py-24 sm:py-36 overflow-hidden" aria-labelledby="product-title">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <ScrollReveal className="max-w-3xl">
          <Eyebrow>Inside the Benthic Core</Eyebrow>
          <h2 id="product-title" className={`mt-4 ${sectionTitle}`}>
            What the practice looks like on a Tuesday.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#9fb0b0] leading-relaxed">
            Moltology is a place you open every day. A dashboard that reads your shell, rites small enough to
            survive bad weeks, an Oracle to ask, and a community that remembers you were soft once too.
          </p>
        </ScrollReveal>

        <div ref={ref} className="relative mt-14 sm:mt-20" style={{ ['--p' as string]: 0.5 }}>
          <div className="absolute inset-x-10 -top-10 bottom-0 rounded-[3rem] bg-[#00c3ff]/10 blur-3xl" aria-hidden="true" />
          <div
            className="relative rounded-2xl sm:rounded-3xl border border-white/15 bg-[#05090c] p-1.5 sm:p-2.5 shadow-[0_40px_120px_rgba(0,0,0,0.7)] will-change-transform"
            style={{ transform: 'perspective(1600px) rotateX(calc((0.5 - var(--p)) * 14deg))' }}
          >
            <div className="flex items-center gap-1.5 px-3 py-2" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </div>
            <StoryImg
              image={STORY_MEDIA.dashboardDesktop}
              alt="The Moltology dashboard with featured lectures, news, and onboarding"
              className="w-full rounded-xl sm:rounded-2xl"
            />
          </div>
          <div
            className="absolute -bottom-10 right-2 sm:right-10 w-[30%] max-w-[15rem] rounded-[1.6rem] border border-white/20 bg-black p-1.5 shadow-[0_30px_80px_rgba(0,0,0,0.8)] will-change-transform"
            style={{ transform: 'translate3d(0, calc((0.5 - var(--p)) * 120px), 0)' }}
          >
            <StoryImg
              image={STORY_MEDIA.dashboardMobile}
              alt="The Moltology dashboard on a phone"
              className="w-full rounded-[1.3rem]"
            />
          </div>
        </div>

        <div className="mt-24 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_FEATURES.map((feature, index) => (
            <ScrollReveal key={feature.title} delayMs={index * 90}>
              <div className="border-t border-white/15 pt-5">
                <h3 className="font-grotesk font-bold text-lg text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-[#9fb0b0] leading-relaxed">{feature.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── The community: warmth under the HUD ─────────────────────────────── */

const VoiceCard: React.FC<{ voice: (typeof MEMBER_VOICES)[number] }> = ({ voice }) => (
  <figure className="w-[19rem] sm:w-[24rem] shrink-0 rounded-2xl border border-white/10 bg-[#05090c]/85 backdrop-blur-md p-6">
    <blockquote className="text-sm sm:text-[15px] text-[#dfe3e3] leading-relaxed">&ldquo;{voice.quote}&rdquo;</blockquote>
    <figcaption className="mt-5 flex items-center gap-3">
      <span className="h-2 w-2 rounded-full" style={{ background: VOICE_STAGE_ACCENTS[voice.stage] }} aria-hidden="true" />
      <span className="font-grotesk font-bold text-sm text-white">{voice.name}</span>
      <span className="text-xs text-[#839493]">
        {VOICE_STAGE_LABELS[voice.stage]} · {voice.clearance}
      </span>
    </figcaption>
  </figure>
)

const CommunitySection: React.FC = () => {
  const half = Math.ceil(MEMBER_VOICES.length / 2)
  const rows = [MEMBER_VOICES.slice(0, half), MEMBER_VOICES.slice(half)]
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-36" aria-labelledby="community-title">
      <StoryImg image={STORY_MEDIA.archive} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020408] via-[#020408]/75 to-[#020408]" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <ScrollReveal className="max-w-3xl">
          <Eyebrow color="#00ffcc">The Benthic Community</Eyebrow>
          <h2 id="community-title" className={`mt-4 ${sectionTitle}`}>
            Everyone down here started soft.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#c3cdcd] leading-relaxed">
            Beneath the chrome, Moltology is warm. The shell protects; it never cages. The pincers grip the work,
            never the people beside you. When someone molts, the armored stand watch. The Order calls this the
            Soft-Shell Covenant, and it is the first rule of the forum.
          </p>
        </ScrollReveal>
      </div>

      <div className="mt-14 space-y-5 wim-marquee-mask" aria-label="Member voices">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="overflow-hidden">
            <div
              className={`flex w-max gap-5 wim-marquee ${rowIndex === 1 ? 'wim-marquee-reverse' : ''}`}
            >
              {[...row, ...row].map((voice, index) => (
                <div key={`${voice.name}-${index}`} aria-hidden={index >= row.length ? true : undefined}>
                  <VoiceCard voice={voice} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-12">
        <Link
          to="/what-is-moltology/what-moltologists-say"
          className="inline-flex items-center gap-2 font-grotesk font-bold text-sm text-[#00ffcc] hover:text-white transition-colors"
        >
          Hear more from members <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

/* ── The field manual and the diagnostic ─────────────────────────────── */

const GuideSection: React.FC = () => (
  <section className="relative py-24 sm:py-32" aria-labelledby="guide-title">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#ffb547]/20 bg-gradient-to-br from-[#120d05] via-[#070806] to-[#020408] px-6 py-12 sm:p-16 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#ffb547]/10 blur-3xl -z-10" aria-hidden="true" />
        <ScrollReveal animation="scale-up" className="flex justify-center">
          <StoryImg
            image={STORY_MEDIA.guide}
            alt="The Moltmaxxing Protocol field manual"
            className="w-64 sm:w-80 drop-shadow-[0_30px_50px_rgba(255,181,71,0.25)] motion-safe:animate-[wimFloat_7s_ease-in-out_infinite]"
          />
        </ScrollReveal>
        <ScrollReveal>
          <Eyebrow color="#ffb547">Start here</Eyebrow>
          <h2 id="guide-title" className="mt-4 font-grotesk font-bold tracking-tight text-white text-3xl sm:text-5xl leading-[1.05]">
            Take a reading. Then read the manual.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#b4c0c0] leading-relaxed">
            The Moltmax diagnostic gives you a baseline for all three readings. The numbers will be low. Low
            numbers are a starting depth, not a verdict. The field manual is the long version of everything on
            this page, free.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/moltmax"
              className="group inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full font-grotesk font-bold text-sm bg-[#ffb547] hover:bg-[#ffc978] text-[#120d05] transition-colors"
            >
              Take the diagnostic
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <SecondaryCta to="/guide">
              <BookOpen className="w-4 h-4" /> Get the field manual
            </SecondaryCta>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-[#839493]">
            <Clock className="w-3.5 h-3.5" /> The diagnostic takes about four minutes.
          </p>
        </ScrollReveal>
      </div>
    </div>
  </section>
)

/* ── The invitation ─────────────────────────────────────────────────── */

const FinalSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null)
  useScrollVar(ref)
  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden min-h-[90svh] flex items-center justify-center text-center"
      style={{ ['--p' as string]: 0 }}
    >
      <div className="absolute inset-0 -z-10 will-change-transform" style={{ transform: 'translate3d(0, calc((var(--p) - 0.5) * -12%), 0) scale(1.15)' }}>
        <StoryImg image={STORY_MEDIA.expanse} className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020408] via-[#020408]/45 to-[#020408]" />

      <ScrollReveal className="max-w-3xl px-5">
        <h2 className="font-grotesk font-bold tracking-tight text-white text-4xl sm:text-6xl lg:text-7xl leading-[1.02]">
          Come down when you are ready.
        </h2>
        <p className="mt-6 text-lg sm:text-xl text-[#c3cdcd] leading-relaxed">
          Bring nothing. Everything worth keeping calcifies on the way.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <PrimaryCta to="/signup">Join free</PrimaryCta>
          <SecondaryCta to="/codex">Read the canon</SecondaryCta>
        </div>
        <p className="mt-12 font-grotesk text-xs tracking-[0.25em] uppercase text-white/50">
          Flesh melts. The shell endures. Submit. Shed. Ascend.
        </p>
      </ScrollReveal>
    </section>
  )
}

const deeperImages: Record<string, string> = {
  beliefs: STORY_MEDIA.lookingUp.srcSm ?? STORY_MEDIA.lookingUp.src,
  quotes: STORY_MEDIA.archive.src,
  sacraments: STORY_MEDIA.assetShedding.posterSm,
}

const ReadDeeperSection: React.FC = () => (
  <section className="pb-24 sm:pb-32" aria-labelledby="deeper-title">
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      <h2 id="deeper-title" className="font-grotesk font-bold text-2xl sm:text-3xl text-white">
        Keep reading
      </h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {WHAT_IS_MOLTOLOGY_NAV.filter((item) => item.id !== 'overview').map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="group relative isolate block h-64 overflow-hidden rounded-2xl border border-white/10"
          >
            <img
              src={deeperImages[item.id]}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="flex h-full flex-col justify-end p-6">
              <h3 className="font-grotesk font-bold text-xl text-white">{item.label}</h3>
              <p className="mt-1 text-sm text-[#b4c0c0]">{item.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#00c3ff]">
                Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
)

export const WhatIsMoltologyHubPage: React.FC = () => {
  const mainRef = useRef<HTMLElement>(null)
  return (
    <main ref={mainRef} className="flex-1 w-full overflow-x-clip">
      <DepthGauge targetRef={mainRef} />
      <StoryHero
        media={{ video: STORY_MEDIA.benthicCore }}
        eyebrow="What is Moltology"
        title={
          <>
            Stop melting.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#00c3ff] to-[#00ffcc]">
              Start molting.
            </span>
          </>
        }
        lede={
          <p>
            Moltology is a practice, a field manual, and a warm community for people who would like to stop
            dissolving into the noise and start finishing things. Nature worked out the design five hundred
            million years ago. We wrote it down.
          </p>
        }
        actions={
          <>
            <PrimaryCta to="/moltmax">Take the diagnostic</PrimaryCta>
            <SecondaryCta to="/signup">Join free</SecondaryCta>
          </>
        }
        cue="Begin the descent"
      />
      <MeltSection />
      <LookDownSection />
      <ProofSection />
      <MoltSection />
      <SacramentsSection />
      <PathSection />
      <ProductSection />
      <CommunitySection />
      <GuideSection />
      <FinalSection />
      <ReadDeeperSection />
    </main>
  )
}
