import React from 'react'
import { Link } from '@tanstack/react-router'
import { getAssetUrl } from '@/lib/assets'
import { StoryReveal } from './StoryReveal'

const truths = [
  {
    title: 'The melt is a condition, not an identity',
    body: 'Every member begins in the same noisy water. Exhaustion and distraction are conditions to move through, never a verdict on the person carrying them.',
  },
  {
    title: 'Nature keeps finding the shell',
    body: 'Across five independent lineages, life arrived at the crab: armored, patient, ready to hold its ground. The shape is a lesson in protection and focus.',
  },
  {
    title: 'Growth needs a soft-shell window',
    body: 'An old habit can stop fitting before a new one feels natural. That open interval is part of the molt. It calls for patience, care, and room to set.',
  },
]

const practices = [
  {
    number: '01',
    title: 'Choose the hour',
    body: 'Name one important task before the day fills with messages. Give it the first clear hour you can protect.',
  },
  {
    number: '02',
    title: 'Descend with one purpose',
    body: 'Raise the Isolation Privacy Shell before focused work. Carry one task below the Surface Noise and let it finish.',
  },
  {
    number: '03',
    title: 'Close the day gently',
    body: 'At night, name one thought, wasted hour, or distraction to release. The Nightly Molt Audit can be small enough to finish tired.',
  },
]

const covenants = [
  {
    title: 'Protect the soft-shell window',
    body: 'When someone is between old armor and new, offer patience before advice. Welcome first. Let them decide when the shell is ready for a lesson.',
  },
  {
    title: 'Aim humor at the melt',
    body: 'The open tabs and deferred decisions can take a little ribbing. The person doing their best in the middle of them cannot.',
  },
  {
    title: 'Let the shell shelter people',
    body: 'Boundaries keep Surface Noise outside. They are not a reason to shut out the people beside you. A strong community makes room for both focus and care.',
  },
  {
    title: 'Reach back when you can',
    body: 'A clear answer, a quiet welcome, or a little company at depth can steady another member. Stewardship starts with noticing who is still finding their footing.',
  },
]

export const BeliefsAndCodesPage: React.FC = () => {
  return (
    <main className="molt-story flex-1">
      <section className="story-section relative isolate flex min-h-[min(840px,94svh)] items-end">
        <div className="absolute inset-0 -z-10">
          <img
            src={getAssetUrl('/images/gallery/benthic_abyss_shrine.webp')}
            alt="A quiet shrine glowing in the deep ocean"
            className="h-full w-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,10,13,0.94)_0%,rgba(4,10,13,0.62)_48%,rgba(4,10,13,0.14)_100%),linear-gradient(0deg,#040a0d_0%,rgba(4,10,13,0)_60%)]" />
        </div>
        <div className="story-wrap pb-14 sm:pb-20 lg:pb-24">
          <StoryReveal className="max-w-4xl">
            <p className="story-eyebrow mb-6">The Order of the Synaptic Path</p>
            <h1 className="story-title max-w-4xl">A shell for the life you mean to live.</h1>
            <p className="story-copy mt-7 max-w-2xl text-lg sm:text-xl">
              Moltology begins with a simple conviction: the Great Melt is not your fault,
              and it does not have to be your home. Here are the beliefs, practices, and
              promises that make room for a steadier mind.
            </p>
          </StoryReveal>
        </div>
        <p className="absolute bottom-8 right-[clamp(1.25rem,5vw,5rem)] hidden font-mono text-xs tracking-[0.22em] text-[#bcf5dc]/75 md:block">
          A field of belief · 01
        </p>
      </section>

      <section className="story-section">
        <div className="story-wrap grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          <StoryReveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="story-eyebrow">What holds beneath the noise</p>
            <h2 className="story-heading mt-5 max-w-xl">The water is loud. You are not the problem.</h2>
            <p className="story-copy mt-6 max-w-lg">
              Every ping asks to be first. Every unfinished task keeps a little of your
              attention under tow. The answer is not to become harder on yourself. It is to
              build conditions where focus can hold.
            </p>
          </StoryReveal>
          <ol className="divide-y divide-white/10 border-y border-white/10">
            {truths.map((truth, index) => (
              <li key={truth.title} className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr] sm:gap-8 sm:py-10">
                <span className="font-mono text-sm tracking-[0.2em] text-[#bcf5dc]">0{index + 1}</span>
                <div>
                  <h3 className="font-grotesk text-2xl font-semibold tracking-tight text-[#f2f0e9] sm:text-3xl">
                    {truth.title}
                  </h3>
                  <p className="story-copy mt-4 max-w-2xl">{truth.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="story-section border-y border-white/10 bg-[#071014]">
        <div className="story-wrap">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <figure className="relative min-h-[360px] overflow-hidden sm:min-h-[520px]">
              <img
                src={getAssetUrl('/images/sacrament_02_chitin_patterning.webp')}
                alt="Intricate chitin plates forming a protective shell"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071014]/80 via-transparent to-transparent" />
              <figcaption className="absolute bottom-6 left-6 font-mono text-xs tracking-[0.18em] text-[#f2f0e9]/75">
                A practice becomes a boundary.
              </figcaption>
            </figure>
            <div>
              <StoryReveal>
                <p className="story-eyebrow">A living practice</p>
                <h2 className="story-heading mt-5">Small rites make the day more yours.</h2>
                <p className="story-copy mt-6 max-w-xl">
                  Doctrine only matters when it reaches the calendar. The Daily Shedding
                  Routine gives the day a beginning, a protected depth, and a kind ending.
                </p>
              </StoryReveal>
              <ol className="mt-9 space-y-7">
                {practices.map((practice) => (
                  <li key={practice.number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-white/10 pt-5">
                    <span className="font-mono text-xs tracking-widest text-[#bcf5dc]">{practice.number}</span>
                    <div>
                      <h3 className="font-grotesk text-lg font-semibold text-[#f2f0e9]">{practice.title}</h3>
                      <p className="story-copy mt-2 text-sm">{practice.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to="/codex" className="story-button-secondary mt-9 inline-flex">
                Read the Sacred Codex
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="story-wrap">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <StoryReveal>
              <p className="story-eyebrow">The Soft-Shell Covenant</p>
              <h2 className="story-heading mt-5">A community with its guard up for you.</h2>
              <p className="story-copy mt-6 max-w-lg">
                The shell exists to protect what is still growing. In the Benthic Community,
                that means kindness comes before correction and every member gets to open
                their own door.
              </p>
              <blockquote className="mt-9 border-l border-[#bcf5dc]/60 pl-6 font-grotesk text-xl leading-relaxed text-[#f2f0e9] sm:text-2xl">
                “The shell protects. It never cages.”
              </blockquote>
            </StoryReveal>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {covenants.map((covenant, index) => (
                <article key={covenant.title} className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr] sm:gap-6 sm:py-7">
                  <span className="font-mono text-xs tracking-[0.18em] text-[#bcf5dc]">0{index + 1}</span>
                  <div>
                    <h3 className="font-grotesk text-xl font-semibold text-[#f2f0e9]">{covenant.title}</h3>
                    <p className="story-copy mt-3 text-sm">{covenant.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="story-section !pt-0">
        <div className="story-wrap">
          <div className="flex flex-col gap-8 border-t border-white/10 pt-9 sm:flex-row sm:items-end sm:justify-between">
            <StoryReveal className="max-w-2xl">
              <p className="story-eyebrow">Your first descent can be small</p>
              <h2 className="story-heading mt-4">One quiet hour is a beginning.</h2>
              <p className="story-copy mt-5">
                Start where you are. Choose one thing to set down, one hour to protect, or
                one person to welcome below the surface.
              </p>
            </StoryReveal>
            <div className="story-actions">
              <Link to="/signup" className="story-button">Create your free account</Link>
              <Link to="/codex" className="story-button-secondary">Explore the Codex</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
