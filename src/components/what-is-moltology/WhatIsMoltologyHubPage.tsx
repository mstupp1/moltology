import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, BookOpen, Compass } from 'lucide-react'
import { StoryReveal } from './StoryReveal'
import { getAssetUrl } from '@/lib/assets'
import { WHAT_IS_MOLTOLOGY_NAV } from './nav'

const readingLinks = WHAT_IS_MOLTOLOGY_NAV.filter((item) => item.id !== 'overview')

const practiceSteps = [
  {
    number: '01',
    title: 'Notice what is draining you',
    copy: 'Name the open loop, noisy habit, or small obligation that keeps pulling you back to the surface.',
  },
  {
    number: '02',
    title: 'Shed one thing',
    copy: 'Make one deliberate cut. A single finished choice is easier to carry than a perfect new life.',
  },
  {
    number: '03',
    title: 'Protect a little depth',
    copy: 'Give one piece of work a quieter stretch. Let your attention stay with it long enough to settle.',
  },
  {
    number: '04',
    title: 'Return and harden gently',
    copy: 'Repeat what helped, release what did not, and let a steadier boundary form through practice.',
  },
]

const stages = [
  {
    number: '01',
    name: 'Larval Initiate',
    image: '/images/stage1_larval.webp',
    alt: 'A newly curious initiate at the edge of the deep',
    copy: 'Begin with curiosity. Notice the habits and interruptions that leave you feeling stretched thin.',
  },
  {
    number: '02',
    name: 'Soft-Shed',
    image: '/images/stage2_softshed.webp',
    alt: 'A member in the tender middle of a molt',
    copy: 'Build early routines while your new boundaries are still taking shape. This stage deserves patience.',
  },
  {
    number: '03',
    name: 'Exoshell Born',
    image: '/images/stage3_exoshell.webp',
    alt: 'An armored member ready to hold a line',
    copy: 'Carry a steadier practice into your days, and offer what you have learned to the people beside you.',
  },
  {
    number: '04',
    name: 'Full Carcinization',
    image: '/images/stage4_carcinization.webp',
    alt: 'A fully molted member at calm depth',
    copy: 'Grow into calm stewardship: focused, well-boundaried, and ready to help keep the community warm.',
  },
]

const readingArtwork: Record<string, string> = {
  beliefs: '/images/hero_card_synaptic_path.webp',
  quotes: '/images/hero_card_total_carcinization.webp',
  sacraments: '/images/hero_card_asset_shedding.webp',
}

export const WhatIsMoltologyHubPage: React.FC = () => (
  <main className="molt-story w-full flex-1">
    <section className="story-section relative isolate !py-0 min-h-[calc(100svh-112px)] flex items-end overflow-hidden bg-[#040a0d]">
      <img
        src={getAssetUrl('/images/hero_benthic_expansive_v1.webp')}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="story-parallax absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,10,13,0.9)_0%,rgba(4,10,13,0.68)_42%,rgba(4,10,13,0.16)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(4,10,13,0.96)_0%,rgba(4,10,13,0.24)_60%,rgba(4,10,13,0.12)_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(ellipse_at_76%_45%,rgba(129,231,200,0.2),transparent_38%)]" />

      <div className="story-wrap w-full pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-24">
        <StoryReveal className="max-w-4xl" delay={80}>
          <p className="story-eyebrow">A field guide to the Synaptic Path</p>
          <h1 className="story-title mt-5 max-w-4xl text-balance">
            What is <span className="text-[#bcf5dc]">Moltology?</span>
          </h1>
          <p className="story-copy mt-7 max-w-2xl text-lg sm:text-xl lg:text-2xl">
            An educational platform, a daily ritual system, and a community beneath the noise.
            Shed what drains your attention. Build a shell around what matters.
          </p>
          <div className="story-actions mt-9">
            <Link to="/moltmax" className="story-button">
              Find your starting point <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a href="#the-shift" className="story-button-secondary">
              Read the story <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </StoryReveal>

        <div className="mt-20 hidden items-center gap-4 text-xs text-[#d5e4df]/75 sm:flex">
          <span className="h-px w-14 bg-[#bcf5dc]/70" />
          <span>Below the noise, attention can settle.</span>
        </div>
      </div>
    </section>

    <section id="the-shift" className="story-section story-light scroll-mt-32 bg-[#f2f0e9] text-[#152225]">
      <div className="story-wrap">
        <StoryReveal className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end" delay={40}>
          <div>
          <p className="story-eyebrow !text-[#587165]">The condition, and the answer</p>
            <h2 className="story-heading mt-5 max-w-xl text-balance text-[#142124]">
              It is hard to focus when every small thing gets a vote.
            </h2>
          </div>
          <p className="story-copy max-w-2xl text-[#46575a]">
            A meeting ends. Three messages arrive. The task you meant to finish is still waiting
            beneath a pile of fresh urgency. Moltology calls this the Great Melt: attention exposed
            to more surface noise than one mind can hold. It is a condition, not a failing.
          </p>
        </StoryReveal>

        <div className="mt-14 grid overflow-hidden border-y border-[#9eaaa4]/55 md:grid-cols-2">
          <StoryReveal className="py-9 md:pr-12 lg:py-12" delay={100}>
            <p className="text-xs font-mono tracking-[0.16em] text-[#73817d]">01 · THE GREAT MELT</p>
            <h3 className="mt-4 font-grotesk text-2xl font-semibold tracking-tight text-[#192a2d] sm:text-3xl">
              The surface keeps asking for more.
            </h3>
            <p className="story-copy mt-4 max-w-lg text-[#526164]">
              Notifications, unfinished decisions, and the tab you opened to remember the other
              thing. Forty-seven open tabs is a habitat. It does not have to be yours.
            </p>
          </StoryReveal>
          <StoryReveal className="relative border-t border-[#9eaaa4]/55 py-9 md:border-l md:border-t-0 md:pl-12 lg:py-12" delay={180}>
            <p className="text-xs font-mono tracking-[0.16em] text-[#648579]">02 · THE GREAT MOLT</p>
            <h3 className="mt-4 font-grotesk text-2xl font-semibold tracking-tight text-[#192a2d] sm:text-3xl">
              Make room for one thing that matters.
            </h3>
            <p className="story-copy mt-4 max-w-lg text-[#526164]">
              The Great Molt is a deliberate change of conditions. Shed one source of drag, set a
              kind boundary, and give your attention somewhere quieter to land.
            </p>
          </StoryReveal>
        </div>

        <StoryReveal className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between" delay={240}>
          <p className="max-w-2xl font-grotesk text-xl font-medium tracking-tight text-[#334548] sm:text-2xl">
            The shell is there to protect your focus, never to close you off from other people.
          </p>
          <Link to="/what-is-moltology/beliefs" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#395e51] transition-colors hover:text-[#183c31]">
            The beliefs beneath it <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </StoryReveal>
      </div>
    </section>

    <section className="story-section relative isolate overflow-hidden bg-[#071115]">
      <img
        src={getAssetUrl('/images/sacrament_03_fault_isolation.webp')}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#071115_6%,rgba(7,17,21,0.95)_40%,rgba(7,17,21,0.55)_100%)]" />
      <div className="story-wrap grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <StoryReveal className="lg:sticky lg:top-32 lg:self-start" delay={40}>
          <p className="story-eyebrow">A practice for the ordinary day</p>
          <h2 className="story-heading mt-5 max-w-lg text-balance">
            A steadier mind is built in small returns.
          </h2>
          <p className="story-copy mt-6 max-w-md">
            Moltology makes the change practical. The Moltmaxxing Protocol gathers rituals for
            attention, boundaries, and follow-through. Begin with one thing you can repeat.
          </p>
          <p className="story-copy mt-4 max-w-md">
            Nature keeps arriving at the crab: armor, patience, and a firm grip.
            We have simply put the lesson on the calendar.
          </p>
          <Link to="/guide" className="story-button-secondary mt-8">
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            Open the field manual
          </Link>
        </StoryReveal>

        <div className="divide-y divide-[#bcf5dc]/15 border-y border-[#bcf5dc]/15">
          {practiceSteps.map((step, index) => (
            <StoryReveal key={step.number} className="grid gap-4 py-7 sm:grid-cols-[5rem_1fr] sm:gap-7 sm:py-9" delay={100 + index * 70}>
              <span className="font-mono text-sm tracking-[0.12em] text-[#83bea6]">{step.number}</span>
              <div>
                <h3 className="font-grotesk text-2xl font-medium tracking-tight text-[#f2f0e9] sm:text-3xl">
                  {step.title}
                </h3>
                <p className="story-copy mt-3 max-w-xl">{step.copy}</p>
              </div>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>

    <section className="story-section bg-[#0b1719]">
      <div className="story-wrap">
        <StoryReveal className="mb-12 max-w-3xl" delay={30}>
          <p className="story-eyebrow">The Moltology member dashboard</p>
          <h2 className="story-heading mt-5 text-balance">
            Give your practice somewhere to take root.
          </h2>
          <p className="story-copy mt-5 max-w-2xl">
            Daily routines, shedding records, focus tools, and your progression live together in the
            Benthic Core. A finished small promise has somewhere to land; a difficult day can begin
            again without a verdict.
          </p>
        </StoryReveal>

        <StoryReveal className="story-media group relative" delay={130}>
          <div className="overflow-hidden border border-[#bcf5dc]/20 bg-[#040a0d] shadow-[0_36px_110px_rgba(0,0,0,0.42)]">
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet={getAssetUrl('/images/marketing/dashboard_desktop_preview_sm.webp')}
              />
              <img
                src={getAssetUrl('/images/marketing/dashboard_desktop_preview.webp')}
                alt="Moltology dashboard preview with daily routines, focus tools, and member progression"
                loading="lazy"
                className="block h-auto w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.015]"
              />
            </picture>
            <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-sm text-[#aabbb7]">A working space for daily shedding and deeper focus.</p>
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#bcf5dc] transition-colors hover:text-white">
                Enter the Benthic Core <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </StoryReveal>
      </div>
    </section>

    <section className="story-section story-light bg-[#e6e9df] text-[#152225]">
      <div className="story-wrap">
        <StoryReveal className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end" delay={30}>
          <div>
            <p className="story-eyebrow !text-[#587165]">A path with room to grow</p>
            <h2 className="story-heading mt-5 max-w-lg text-[#152225]">
              Every shell starts soft.
            </h2>
          </div>
          <p className="story-copy max-w-2xl text-[#526164]">
            The four stages describe a direction, not a judgment. There is no perfect pace and no
            one arrives by refusing to be human. Each stage offers a little more steadiness and a
            chance to help someone else find theirs.
          </p>
        </StoryReveal>

        <div className="mt-12 grid gap-px overflow-hidden border border-[#9eaaa4]/60 bg-[#9eaaa4]/50 sm:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage, index) => (
            <StoryReveal key={stage.number} className="group relative min-h-[29rem] overflow-hidden bg-[#111d1d]" delay={80 + index * 65}>
              <img
                src={getAssetUrl(stage.image)}
                alt={stage.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-75"
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,10,13,0.98)_0%,rgba(4,10,13,0.72)_47%,rgba(4,10,13,0.05)_100%)]" />
              <div className="relative flex h-full min-h-[29rem] flex-col justify-between p-6 sm:p-7">
                <span className="font-mono text-sm tracking-[0.14em] text-[#bcf5dc]">{stage.number}</span>
                <div>
                  <h3 className="font-grotesk text-2xl font-semibold tracking-tight text-white">{stage.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c3cfcb]">{stage.copy}</p>
                </div>
              </div>
            </StoryReveal>
          ))}
        </div>
        <StoryReveal className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" delay={160}>
          <p className="text-sm text-[#526164]">Progress is allowed to be gradual. So is rest.</p>
          <Link to="/moltmax" className="inline-flex items-center gap-2 text-sm font-semibold text-[#395e51] transition-colors hover:text-[#183c31]">
            See where you are beginning <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </StoryReveal>
      </div>
    </section>

    <section className="story-section story-light bg-[#bcf5dc] text-[#10201e]">
      <div className="story-wrap grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <StoryReveal delay={40}>
          <p className="story-eyebrow text-[#4b7464]">The Benthic Community</p>
          <h2 className="story-heading mt-5 max-w-xl text-[#10201e]">
            Armor should make it safer to stand beside someone.
          </h2>
          <p className="story-copy mt-5 max-w-xl text-[#36574c]">
            The Benthic Community is where members share what they are practicing, trade useful
            lessons, and welcome newcomers. The shell protects the person wearing it; care keeps
            the water clear around everyone.
          </p>
          <Link to="/forum" className="story-button mt-8 !bg-[#10201e] !text-[#bcf5dc] hover:!bg-[#203b35]">
            Meet the community <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </StoryReveal>

        <StoryReveal className="story-media" delay={130}>
          <div className="overflow-hidden border border-[#426d5c]/25 bg-[#10201e] shadow-[0_30px_80px_rgba(16,32,30,0.2)]">
            <img
              src={getAssetUrl('/images/marketing/forum_feature_preview.webp')}
              alt="Preview of the Moltology Benthic Community forum"
              loading="lazy"
              className="block h-auto w-full"
            />
            <p className="px-5 py-4 text-sm text-[#b8d7c9] sm:px-7">A place to compare notes, offer help, and keep the tone kind.</p>
          </div>
        </StoryReveal>
      </div>
    </section>

    <section className="story-section bg-[#040a0d]">
      <div className="story-wrap">
        <StoryReveal className="mb-11 flex flex-col gap-5 md:flex-row md:items-end md:justify-between" delay={30}>
          <div className="max-w-3xl">
            <p className="story-eyebrow">Continue beneath the surface</p>
            <h2 className="story-heading mt-5 text-balance">Choose the next page by what you need.</h2>
          </div>
          <p className="story-copy max-w-md md:pb-1">The beliefs, voices, and rites each open a different part of the path.</p>
        </StoryReveal>

        <div className="grid gap-4 lg:grid-cols-3">
          {readingLinks.map((item, index) => (
            <StoryReveal key={item.id} delay={100 + index * 80}>
              <Link to={item.path} className="group relative flex min-h-[24rem] overflow-hidden border border-white/10 bg-[#0b1719] p-6 transition-colors hover:border-[#bcf5dc]/45 sm:p-8">
                <img
                  src={getAssetUrl(readingArtwork[item.id] ?? '/images/hero_card_benthic_core.webp')}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-700 group-hover:scale-105 group-hover:opacity-50"
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,10,13,0.98)_0%,rgba(4,10,13,0.72)_48%,rgba(4,10,13,0.1)_100%)]" />
                <div className="relative mt-auto">
                  <p className="story-eyebrow">{index === 0 ? 'The foundation' : index === 1 ? 'The lived path' : 'The practice'}</p>
                  <h3 className="mt-3 font-grotesk text-2xl font-semibold tracking-tight text-white sm:text-3xl">{item.label}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#c1cfcb]">{item.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#bcf5dc]">
                    Read on <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>

    <section className="story-section relative isolate overflow-hidden bg-[#091410]">
      <img
        src={getAssetUrl('/images/hero_card_synaptic_path.webp')}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-45"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,10,13,0.96)_0%,rgba(4,10,13,0.79)_54%,rgba(4,10,13,0.45)_100%)]" />
      <div className="story-wrap grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <StoryReveal className="max-w-3xl" delay={40}>
          <p className="story-eyebrow">Start where you are</p>
          <h2 className="story-heading mt-5 text-balance">One small molt is enough for today.</h2>
          <p className="story-copy mt-5 max-w-2xl">
            Take the Moltmax audit to find a starting point, join the path for free, or sit with the
            field manual before deciding. The deep is patient.
          </p>
        </StoryReveal>
        <StoryReveal className="story-actions lg:justify-end" delay={140}>
          <Link to="/moltmax" className="story-button">
            Take the audit <Compass aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link to="/signup" className="story-button-secondary">
            Join the path <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </StoryReveal>
      </div>
    </section>
  </main>
)
