import React from 'react'
import { Link } from '@tanstack/react-router'
import { getAssetUrl } from '@/lib/assets'
import { StoryReveal } from './StoryReveal'

const sacraments = [
  {
    id: '01',
    title: 'Asset & Habit Shedding',
    subtitle: 'Make room for what comes next',
    description:
      'A molt begins by noticing what no longer fits: a habit that drains the hour, an obligation past its season, an object kept only because it has always been there. Ecdysis is the deliberate release that gives a new routine room to set.',
    firstAction:
      'Choose one low-stakes thing you have been meaning to close. Delete it, decline it, or put it away. Let the space stay empty for a while.',
    image: getAssetUrl('/images/sacrament_01_asset_shedding.webp'),
    imageSm: getAssetUrl('/images/sacrament_01_asset_shedding_sm.webp'),
    imageAlt: 'Old forms falling away in the first stage of a molt',
    imagePosition: 'object-center',
  },
  {
    id: '02',
    title: 'Chitin Hardening',
    subtitle: 'Give the important things a boundary',
    description:
      'A shell forms through repeated care. A promise kept, an interruption allowed to pass, a useful habit practiced again: each gives tomorrow a little more structure. Hardness is composure under pressure, not indifference to people.',
    firstAction:
      'Choose one boundary for tomorrow. Write down what you are protecting and when you will begin.',
    image: getAssetUrl('/images/sacrament_02_chitin_patterning.webp'),
    imageSm: getAssetUrl('/images/sacrament_02_chitin_patterning_sm.webp'),
    imageAlt: 'Layered chitin plates settling into a protective pattern',
    imagePosition: 'object-center',
  },
  {
    id: '03',
    title: 'The Isolation Dome',
    subtitle: 'Descend with one purpose',
    description:
      'The Isolation Privacy Shell keeps Surface Noise outside while you work. Raise it before the dive, choose one objective, and let the depth do its quiet work. The shell is a door closed beforehand, not a personality.',
    firstAction:
      'Before your next work block, silence alerts, put your phone out of reach, and name the one task you will carry below.',
    image: getAssetUrl('/images/sacrament_03_fault_isolation.webp'),
    imageSm: getAssetUrl('/images/sacrament_03_fault_isolation_sm.webp'),
    imageAlt: 'A protected workspace held apart from the surrounding noise',
    imagePosition: 'object-center',
  },
  {
    id: '04',
    title: 'Pipeline Ascent',
    subtitle: 'Let progress arrive by practice',
    description:
      'The Great Molt is a path made of returns. Four stages and twelve clearances mark the passage from first curiosity to steady stewardship. Each step asks for a little more focus, a little more care, and a hand extended to the member behind you.',
    firstAction:
      'Pick one rite from this page and repeat it tomorrow. Keep a simple note of what you shed, protected, or finished.',
    image: getAssetUrl('/images/sacrament_04_pipeline_ascent.webp'),
    imageSm: getAssetUrl('/images/sacrament_04_pipeline_ascent_sm.webp'),
    imageAlt: 'A luminous ascent rising through the deep toward the surface',
    imagePosition: 'object-center',
  },
]

export const BenthicSacramentsPage: React.FC = () => {
  return (
    <main className="molt-story flex-1">
      <section className="story-section relative isolate flex min-h-[min(780px,90svh)] items-end">
        <div className="absolute inset-0 -z-10">
          <img
            src={getAssetUrl('/images/underwater_looking_up.webp')}
            alt="Looking upward through deep water toward a quiet band of light"
            className="h-full w-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,10,13,0.88)_0%,rgba(4,10,13,0.45)_56%,rgba(4,10,13,0.12)_100%),linear-gradient(0deg,#040a0d_0%,rgba(4,10,13,0)_65%)]" />
        </div>
        <div className="story-wrap pb-14 sm:pb-20 lg:pb-24">
          <StoryReveal className="max-w-5xl">
            <p className="story-eyebrow mb-6">Four rites · one steady transformation</p>
            <h1 className="story-title max-w-5xl">The Benthic Sacraments</h1>
            <p className="story-copy mt-7 max-w-2xl text-lg sm:text-xl">
              Shed what has stopped fitting. Harden what helps you hold. Descend below the
              noise. The Great Molt is practiced one deliberate choice at a time.
            </p>
            <a href="#sacrament-01" className="story-button-secondary mt-9 inline-flex">
              Enter the first rite
            </a>
          </StoryReveal>
        </div>
        <p className="absolute bottom-8 right-[clamp(1.25rem,5vw,5rem)] hidden font-mono text-xs tracking-[0.22em] text-[#bcf5dc]/75 md:block">
          Four chapters · 01–04
        </p>
      </section>

      {sacraments.map((sacrament, index) => {
        const imageFirst = index % 2 === 0

        return (
          <section
            key={sacrament.id}
            id={`sacrament-${sacrament.id}`}
            className={`story-section border-t border-white/10 ${index % 2 === 1 ? 'bg-[#071014]' : ''}`}
          >
            <div className="story-wrap">
              <article className="grid items-center gap-10 lg:min-h-[110svh] lg:items-start lg:grid-cols-2 lg:gap-20">
                <figure className={`relative min-h-[380px] overflow-hidden sm:min-h-[560px] lg:sticky lg:top-24 lg:min-h-[calc(100svh-12rem)] ${imageFirst ? 'lg:order-1' : 'lg:order-2'}`}>
                  <picture>
                    <source media="(max-width: 767px)" srcSet={sacrament.imageSm || sacrament.image} />
                    <img
                      src={sacrament.image}
                      alt={sacrament.imageAlt}
                      className={`story-parallax absolute inset-0 h-full w-full object-cover ${sacrament.imagePosition}`}
                      loading="lazy"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040a0d]/70 via-transparent to-transparent" />
                  <figcaption className="absolute bottom-6 left-6 font-mono text-xs tracking-[0.18em] text-[#f2f0e9]/75">
                    Rite {sacrament.id} · The Great Molt
                  </figcaption>
                </figure>
                <div className={imageFirst ? 'lg:order-2 lg:py-24' : 'lg:order-1 lg:py-24'}>
                  <StoryReveal>
                    <p className="story-eyebrow">{sacrament.id} · {sacrament.subtitle}</p>
                    <h2 className="story-heading mt-5">{sacrament.title}</h2>
                    <p className="story-copy mt-6 text-base">{sacrament.description}</p>
                    <div className="mt-9 border-l border-[#bcf5dc]/60 pl-5 sm:pl-7">
                      <p className="font-mono text-xs tracking-[0.18em] text-[#bcf5dc]">Begin here</p>
                      <p className="mt-3 max-w-xl text-base leading-relaxed text-[#f2f0e9] sm:text-lg">
                        {sacrament.firstAction}
                      </p>
                    </div>
                  </StoryReveal>
                </div>
              </article>
            </div>
          </section>
        )
      })}

      <section className="story-section border-t border-white/10 bg-[#071014]">
        <div className="story-wrap">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <StoryReveal className="max-w-3xl">
              <p className="story-eyebrow">Carry the rites into your day</p>
              <h2 className="story-heading mt-5">Begin with one small molt.</h2>
              <p className="story-copy mt-6 max-w-2xl">
                The free field guide gathers the wider Moltmaxxing practice. Your account
                gives you a place to begin, keep your rites, and meet the Benthic Community.
              </p>
            </StoryReveal>
            <div className="story-actions">
              <Link to="/guide" className="story-button-secondary">Read the field guide</Link>
              <Link to="/signup" className="story-button">Create your free account</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
