import React, { Suspense, lazy } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, ListChecks } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { LandingAuthCtaSkeleton } from '@/components/LandingAuthCtaSkeleton'
import { BENEFIT_KITS, findBenefitSummary } from '@/lib/benefits/registry'
import type { BenefitPage } from '@/lib/benefits/types'
import { BENEFIT_LINKS } from './kit-props'
import { WearTheLook } from './WearTheLook'

const LazyLandingAuthCtas = lazy(() =>
  import('@/components/LandingAuthCtas').then((m) => ({ default: m.LandingAuthCtas })),
)

const SCREENSHOTS: Record<BenefitPage['reveal']['screenshot'], { src: string; srcSm: string; alt: string }> = {
  dashboard: {
    src: '/images/marketing/dashboard_feature_preview.webp',
    srcSm: '/images/marketing/dashboard_feature_preview_sm.webp',
    alt: 'The Moltology dashboard with the day’s tasks, streak and progress',
  },
  oracle: {
    src: '/images/marketing/oracle_feature_preview.webp',
    srcSm: '/images/marketing/oracle_feature_preview_sm.webp',
    alt: 'A conversation with the Oracle, Moltology’s AI guide',
  },
  forum: {
    src: '/images/marketing/forum_feature_preview.webp',
    srcSm: '/images/marketing/forum_feature_preview_sm.webp',
    alt: 'The Moltology forum with member posts and replies',
  },
}

interface MoltRevealProps {
  page: BenefitPage
  authReady: boolean
  onOpenAuth: (mode: 'login' | 'signup') => void
  onNavigate: (path: string) => void
}

/**
 * Where every costume ends: the page sheds its industry skin and lands in the normal
 * Moltology look with the real product and the real way in.
 */
/** The same plain line on every page, so page files only add what is specific to them. */
const REVEAL_INTRO =
  'Moltology is a free daily practice: eight small tasks, readings from the Codex, an AI guide called the Oracle and a forum of people doing the same.'

export function MoltReveal({ page, authReady, onOpenAuth, onNavigate }: MoltRevealProps) {
  const shot = SCREENSHOTS[page.reveal.screenshot]
  const related = page.related.map(findBenefitSummary).filter((item) => item !== undefined)

  return (
    <section aria-labelledby="molt-reveal-title" className="benefit-reveal relative bg-abyss text-ink-body font-sans font-normal">
      <svg
        className="benefit-shed-edge"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 64V30l60 14 52-26 70 22 64-30 58 24 80-18 46 26 74-34 62 28 58-12 66 22 54-30 72 20 60-16 58 26 70-28 64 18 56-22 62 26 70-14 184 20V64Z" />
      </svg>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
          <div>
            <p className="eyebrow">Under the shell</p>
            <h2 id="molt-reveal-title" className="mt-4 font-grotesk text-2xl sm:text-4xl font-semibold tracking-tight text-ink">
              {page.reveal.headline}
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink-body max-w-xl">
              {REVEAL_INTRO} {page.reveal.body}
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
            <Link
              to={BENEFIT_LINKS.quiz}
              className="mt-6 inline-flex items-center gap-2 rounded-control text-sm text-ink-muted hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <ListChecks className="w-4 h-4 text-cyan-glow" aria-hidden="true" />
              Not ready yet? Take the free three minute quiz.
            </Link>
          </div>
          <figure className="rounded-panel border border-line-subtle bg-surface-1 overflow-hidden">
            <picture>
              <source media="(max-width: 767px)" srcSet={getAssetUrl(shot.srcSm)} />
              <img
                src={getAssetUrl(shot.src)}
                alt={shot.alt}
                width={2240}
                height={1400}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto"
              />
            </picture>
          </figure>
        </div>

        <WearTheLook kit={page.kit} />

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-card border border-line-subtle bg-surface-1 p-5 sm:p-6">
            <p className="eyebrow">Where this comes from</p>
            <a
              href={page.hook.href}
              className="mt-3 inline-flex items-center gap-2 text-md font-medium text-ink hover:text-cyan-glow transition-colors"
            >
              {page.hook.href.startsWith('/codex') ? (
                <BookOpen className="w-4 h-4 text-crimson-aggro" aria-hidden="true" />
              ) : (
                <ArrowRight className="w-4 h-4 text-crimson-aggro" aria-hidden="true" />
              )}
              {page.hook.label}
            </a>
            <p className="mt-2 text-sm leading-relaxed text-ink-body">{page.hook.text}</p>
          </div>
          <nav aria-label="More benefits" className="rounded-card border border-line-subtle bg-surface-1 p-5 sm:p-6">
            <p className="eyebrow">More benefits</p>
            <ul className="mt-3 divide-y divide-line-subtle">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    to="/benefits/$slug"
                    params={{ slug: item.slug }}
                    className="group flex items-center justify-between gap-3 py-2.5 text-sm text-ink hover:text-cyan-glow transition-colors"
                  >
                    <span>
                      {item.topic}
                      <span className="ml-2 text-xs text-ink-muted">{BENEFIT_KITS[item.kit].industry}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-ink-muted group-hover:text-cyan-glow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={BENEFIT_LINKS.hub}
                  className="group flex items-center justify-between gap-3 py-2.5 text-sm text-ink-muted hover:text-cyan-glow transition-colors"
                >
                  All benefits
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {page.disclaimer ? <p className="mt-8 text-xs leading-relaxed text-ink-muted max-w-3xl">{page.disclaimer}</p> : null}
      </div>
    </section>
  )
}
