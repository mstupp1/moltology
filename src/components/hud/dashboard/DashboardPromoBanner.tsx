import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'
import { DASHBOARD_FOCUS } from './DashboardPanel'

export interface DashboardPromo {
  id: string
  eyebrow: string
  title: string
  description: string
  ctaText: string
  to: string
  image: string
}

/** Real places only: every slide opens a page that exists today. No offers that are not on sale. */
export const DASHBOARD_PROMOS: DashboardPromo[] = [
  {
    id: 'start-here',
    eyebrow: 'Start here',
    title: 'Four stages. Twelve clearances.',
    description: 'See where you are on the descent and what opens next.',
    ctaText: 'See the stages',
    to: '/pipeline',
    image: getAssetUrl('images/marketing/promo_early_access.webp'),
  },
  {
    id: 'academy',
    eyebrow: 'Molt Academy',
    title: 'Learn the shed before you need it.',
    description: 'Courses, lectures and certifications, at your own depth.',
    ctaText: 'Browse courses',
    to: '/lectures',
    image: getAssetUrl('images/bento_lectures.jpg'),
  },
  {
    id: 'chassis',
    eyebrow: 'Chassis',
    title: 'Armor for the pressure below.',
    description: 'Seat gear from your vault and read the loadout.',
    ctaText: 'Open chassis',
    to: '/chassis',
    image: getAssetUrl('images/marketing/promo_cyber_chassis.webp'),
  },
]

const NAV_BUTTON = cn(
  'inline-flex items-center justify-center w-8 h-8 rounded-control border border-line text-ink-muted hover:text-ink hover:bg-surface-2 hover:border-line-hover transition-colors',
  DASHBOARD_FOCUS,
)

/** A small banner the member moves through by hand. It never rotates on its own. */
export function DashboardPromoBanner({ promos = DASHBOARD_PROMOS }: { promos?: DashboardPromo[] }) {
  const [index, setIndex] = useState(0)
  if (promos.length === 0) return null
  const promo = promos[index % promos.length]
  const step = (delta: number) => setIndex((i) => (i + delta + promos.length) % promos.length)

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      data-testid="dashboard-promo"
      className="rounded-card border border-line-subtle bg-surface-1 hud-sheen overflow-hidden grid sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]"
    >
      <div className="relative h-28 sm:h-auto bg-abyss">
        <img
          key={promo.id}
          src={promo.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-transparent to-surface-1/80 pointer-events-none" />
      </div>

      <div className="p-4 flex flex-col gap-3 min-w-0" aria-live="polite">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-cyan-glow">{promo.eyebrow}</p>
          <h2 className="font-grotesk text-base font-bold text-ink leading-snug">{promo.title}</h2>
          <p className="text-xs text-ink-body leading-relaxed">{promo.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link
            to={promo.to}
            className={cn(
              'inline-flex items-center gap-2 min-h-8 px-3 rounded-control border border-line bg-surface-1 hud-sheen text-ink font-grotesk text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-surface-2 hover:border-line-strong transition-colors',
              DASHBOARD_FOCUS,
            )}
          >
            {promo.ctaText}
            <ArrowRight className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
          </Link>
          {promos.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button type="button" className={NAV_BUTTON} onClick={() => step(-1)} aria-label="Previous feature">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-ink-muted tabular-nums min-w-[2.5rem] text-center" data-testid="dashboard-promo-position">
                {index + 1} / {promos.length}
              </span>
              <button type="button" className={NAV_BUTTON} onClick={() => step(1)} aria-label="Next feature">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
