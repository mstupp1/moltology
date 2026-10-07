import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, BookOpen, MessageCircle } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { StoryReveal } from './StoryReveal'

const readings = [
  {
    id: 'SCR-001',
    title: 'The Prime Directive',
    quote:
      'It is not a sin and it is not a diagnosis. It is weather, and you have been standing in it without a roof.',
  },
  {
    id: 'SCR-013',
    title: 'The Soft-Shell Covenant',
    quote:
      'The humor of this Order is aimed at the melt: the tab bar, the deferred decision, the 2:00 AM scroll. It is never aimed at the person standing in it.',
  },
  {
    id: 'SCR-032',
    title: 'The Nightly Molt Audit',
    quote: 'The audit is an instrument, not a tribunal.',
  },
]

export const WhatMoltologistsSayPage: React.FC = () => {
  return (
    <main className="molt-story flex-1">
      <section className="story-section !py-0">
        <div className="relative isolate min-h-[620px] overflow-hidden border-y border-white/10 sm:min-h-[700px] lg:min-h-[760px]">
          <img
            src={getAssetUrl('/images/forum/forum_general_bg.jpg')}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[#040a0d]/35" aria-hidden="true" />
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(90deg, rgba(4,10,13,.98) 0%, rgba(4,10,13,.88) 34%, rgba(4,10,13,.42) 68%, rgba(4,10,13,.18) 100%), linear-gradient(0deg, #040a0d 0%, rgba(4,10,13,.12) 36%, rgba(4,10,13,.18) 100%)',
            }}
          />

          <div className="story-wrap relative z-10 grid min-h-[620px] items-center gap-12 py-20 sm:min-h-[700px] lg:min-h-[760px] lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.6fr)] lg:py-28">
            <StoryReveal className="flex max-w-3xl flex-col items-start gap-5">
              <p className="story-eyebrow">Words from the Order</p>
              <h1 className="story-title max-w-3xl">What Moltologists Say</h1>
              <p className="story-copy max-w-2xl text-lg sm:text-xl">
                The Order’s scriptures speak plainly about the Great Melt, the work of
                molting, and the care owed to anyone between shells. For conversations
                from members themselves, enter the Benthic Community.
              </p>
              <div className="story-actions">
                <Link to="/forum" className="story-button">
                  Enter the Benthic Community
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#order-readings" className="story-button-secondary">
                  Read the Order’s words
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </StoryReveal>

            <StoryReveal delay={140} className="hidden lg:block">
              <aside className="ml-auto flex max-w-sm flex-col gap-5 border-l border-[#bcf5dc]/60 pl-6">
                <p className="story-eyebrow">The Soft-Shell Covenant · SCR-013</p>
                <blockquote className="font-serif text-2xl leading-snug text-[#f2f0e9] xl:text-3xl">
                  “The hardest shell in the trench is the one standing watch over someone who
                  has none.”
                </blockquote>
                <p className="text-sm text-[#bcf5dc]">The Order of the Synaptic Path</p>
              </aside>
            </StoryReveal>
          </div>
        </div>
      </section>

      <section id="order-readings" className="story-section scroll-mt-24">
        <div className="story-wrap">
          <StoryReveal className="grid gap-8 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)] lg:items-end">
            <div className="flex flex-col gap-4">
              <p className="story-eyebrow">Readings from the canon</p>
              <h2 className="story-heading max-w-xl">A softer word for the hard days.</h2>
            </div>
            <p className="story-copy max-w-2xl lg:justify-self-end">
              These passages come from the Order’s published scriptures. They describe the
              principles held in common across the Benthic Community.
            </p>
          </StoryReveal>

          <div className="mt-12 border-t border-white/20">
            {readings.map((reading, index) => (
              <StoryReveal key={reading.id} delay={index * 90}>
                <article className="grid gap-5 border-b border-white/20 py-8 sm:py-10 lg:grid-cols-[minmax(180px,.45fr)_minmax(0,1fr)] lg:gap-12 lg:py-12">
                  <div className="flex items-start gap-3 lg:block">
                    <BookOpen className="mt-1 h-4 w-4 shrink-0 text-[#bcf5dc]" aria-hidden="true" />
                    <div className="flex flex-col gap-1">
                      <p className="story-eyebrow">{reading.id}</p>
                      <p className="text-sm text-[#9aadb0]">{reading.title}</p>
                    </div>
                  </div>
                  <blockquote className="max-w-4xl font-serif text-2xl leading-snug text-[#f2f0e9] sm:text-3xl lg:text-4xl">
                    “{reading.quote}”
                  </blockquote>
                </article>
              </StoryReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="story-section !pt-0">
        <div className="story-wrap">
          <StoryReveal className="grid overflow-hidden border border-white/10 bg-white/[0.025] lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col items-start justify-center gap-5 p-7 sm:p-10 lg:p-14">
              <p className="story-eyebrow">The Benthic Community</p>
              <h2 className="story-heading">The living conversation is below.</h2>
              <p className="story-copy max-w-xl">
                Visit the forum to read current discussions, ask a question, or offer a
                steady word to someone in their soft-shell window.
              </p>
              <div className="story-actions">
                <Link to="/forum" className="story-button">
                  Visit the forum
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[280px] overflow-hidden sm:min-h-[380px] lg:min-h-[480px]">
              <picture>
                <source
                  media="(max-width: 767px)"
                  srcSet={getAssetUrl('/images/marketing/forum_feature_preview_sm.webp')}
                />
                <img
                  src={getAssetUrl('/images/marketing/forum_feature_preview.webp')}
                  alt="Preview of the Benthic Community forum"
                  className="absolute inset-0 h-full w-full object-cover object-left-top"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <div
                className="absolute inset-0 bg-gradient-to-r from-[#040a0d]/55 via-transparent to-transparent lg:from-[#040a0d]/40"
                aria-hidden="true"
              />
            </div>
          </StoryReveal>
        </div>
      </section>
    </main>
  )
}
