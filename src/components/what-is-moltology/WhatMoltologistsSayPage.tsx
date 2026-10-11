import React, { useMemo, useState } from 'react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import {
  MEMBER_VOICES,
  STORY_MEDIA,
  VOICE_STAGE_ACCENTS,
  VOICE_STAGE_LABELS,
  type MemberVoice,
  type VoiceStage,
} from './story/content'
import { Eyebrow, PrimaryCta, SecondaryCta, StoryHero, StoryImg } from './story/StoryPrimitives'

type Filter = 'all' | VoiceStage

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All voices' },
  ...(Object.keys(VOICE_STAGE_LABELS) as VoiceStage[]).map((id) => ({ id, label: VOICE_STAGE_LABELS[id] })),
]

export function filterVoices(voices: MemberVoice[], filter: Filter): MemberVoice[] {
  return filter === 'all' ? voices : voices.filter((voice) => voice.stage === filter)
}

const featured = MEMBER_VOICES.find((voice) => voice.name === 'Ash Pincer') ?? MEMBER_VOICES[0]

export const WhatMoltologistsSayPage: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all')
  // The featured voice already headlines the page, so the grid skips it.
  const visible = useMemo(
    () => filterVoices(MEMBER_VOICES, filter).filter((voice) => voice !== featured),
    [filter],
  )

  return (
    <main className="flex-1 w-full overflow-x-clip">
      <StoryHero
        tall={false}
        media={{ image: STORY_MEDIA.archive }}
        eyebrow="What Moltologists say"
        title="Voices from the trench."
        lede={
          <p>
            Members at every depth, on the first shed, the soft middle, and the quiet work of standing guard. These
            are composite voices from the Benthic Community, shared by designation rather than by name.
          </p>
        }
      />

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <ScrollReveal>
            <figure className="relative isolate overflow-hidden rounded-panel border border-line-subtle grid lg:grid-cols-[1.3fr_0.7fr]">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#00c3ff]/10 via-[#05090c] to-[#020408]" />
              <div className="p-8 sm:p-14">
                <span className="block font-grotesk font-bold text-7xl leading-none text-cyan-glow/40" aria-hidden="true">
                  &ldquo;
                </span>
                <blockquote className="mt-2 font-grotesk font-medium text-2xl sm:text-3xl lg:text-[2.2rem] leading-snug text-ink [text-wrap:pretty]">
                  {featured.quote}
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: VOICE_STAGE_ACCENTS[featured.stage] }} aria-hidden="true" />
                  <span className="font-grotesk font-bold text-ink">{featured.name}</span>
                  <span className="text-sm text-ink-muted">
                    {VOICE_STAGE_LABELS[featured.stage]} · {featured.clearance}
                  </span>
                </figcaption>
              </div>
              <div className="relative min-h-[16rem]">
                <StoryImg image={STORY_MEDIA.shrine} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#05090c] to-transparent" />
              </div>
            </figure>
          </ScrollReveal>

          <div className="mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <Eyebrow>Every depth</Eyebrow>
              <h2 className="mt-3 font-grotesk font-bold tracking-tight text-ink text-3xl sm:text-4xl">
                Hear from someone at your stage.
              </h2>
            </div>
            <p className="text-sm text-ink-muted" aria-live="polite">
              {visible.length} {visible.length === 1 ? 'voice' : 'voices'}
            </p>
          </div>

          <div className="mt-6 -mx-5 px-5 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filter voices by stage">
            {FILTERS.map((option) => {
              const active = filter === option.id
              const accent = option.id === 'all' ? '#dfe3e3' : VOICE_STAGE_ACCENTS[option.id]
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                  className={`shrink-0 inline-flex items-center gap-2 min-h-11 px-4 rounded-control border text-sm font-grotesk font-bold transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    active ? 'bg-surface-2 text-ink border-cyan-glow/40' : 'border-line bg-surface-1 text-ink-muted hover:bg-surface-2 hover:border-line-strong hover:text-ink'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: accent }} aria-hidden="true" />
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="mt-10 columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
            {visible.map((voice) => (
              <figure
                key={voice.name}
                className="mb-5 break-inside-avoid rounded-card border border-line-subtle bg-surface-1 hud-sheen p-6 sm:p-7 hover:border-line-strong transition-colors"
                style={{ boxShadow: `inset 3px 0 0 ${VOICE_STAGE_ACCENTS[voice.stage]}` }}
              >
                <blockquote className="text-[15px] sm:text-base text-ink-body leading-relaxed">&ldquo;{voice.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 border-t border-line-subtle pt-4">
                  <span className="block font-grotesk font-bold text-ink">{voice.name}</span>
                  <span className="text-xs tracking-wide text-ink-muted">
                    {VOICE_STAGE_LABELS[voice.stage]} · {voice.clearance}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="relative isolate overflow-hidden rounded-panel border border-line-subtle px-6 py-14 sm:px-14 sm:py-20 text-center">
            <StoryImg image={STORY_MEDIA.lookingUp} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 -z-10 bg-abyss/70" />
            <h2 className="font-grotesk font-bold tracking-tight text-ink text-3xl sm:text-5xl leading-[1.05]">
              Your first shed can be small.
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-ink-body">
              Most of these voices started with one closed tab. The forum will notice. Signup is free.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryCta to="/signup">Join free</PrimaryCta>
              <SecondaryCta to="/forum">Visit the forum</SecondaryCta>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
