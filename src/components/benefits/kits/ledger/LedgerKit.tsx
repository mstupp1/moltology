import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Check } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'
import './ledger.css'

const LEDGER_PILLS: Record<string, string> = {
  'swiss-private': 'private',
  'heritage-treasury': 'treasury',
  'executive-navy': 'brief',
  'amber-desk': 'ledger',
}

/** The fintech lockup: a lowercase serif wordmark and a small product pill. */
function LedgerLockup({ variant }: { variant?: string }) {
  return (
    <span className="lg-lockup">
      <span className="lg-lockup-tile">
        <BrandIcon aria-hidden="true" tone="inherit" className="lg-lockup-icon" />
      </span>
      <span className="lg-lockup-word">moltology</span>
      <span className="lg-lockup-pill">{(variant && LEDGER_PILLS[variant]) ?? 'invest'}</span>
    </span>
  )
}

/** A smooth line through the points, scaled into a 300 by 100 box. */
function chartPath(points: number[]) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const step = 300 / (points.length - 1)
  const xy = points.map((value, index) => [index * step, 92 - ((value - min) / span) * 84] as const)
  return xy.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
}

/** Ledger: fintech and investing apps. Mint and deep green, a serif headline, a balance card. */
export default function LedgerKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'ledger') return null
  const { hero, compound, features, statement } = page.content
  const line = chartPath(hero.card.points)

  return (
    <div className="lg">
      <BenefitHeader
        lockup={<LedgerLockup variant={page.variant} />}
        links={[
          { label: 'How it compounds', href: '#compound' },
          { label: 'Features', href: '#features' },
          { label: 'FAQ', href: '#faq' },
        ]}
        cta="Get started"
        onJoin={onJoin}
      />

      <main>
        <section className="lg-hero">
          <div className="lg-wrap lg-hero-grid">
            <div className="lg-hero-copy">
              <p className="lg-eyebrow">{hero.eyebrow}</p>
              <h1 className="lg-h1">{hero.headline}</h1>
              <p className="lg-lede">{hero.sub}</p>
              <div className="lg-actions">
                <button type="button" className="lg-btn" onClick={onJoin}>
                  {hero.cta}
                </button>
                <Link to={BENEFIT_LINKS.quiz} className="lg-btn-ghost">
                  Take the 3 minute quiz
                </Link>
              </div>
              {page.disclaimer ? <p className="lg-fine">{page.disclaimer}</p> : null}
            </div>
            <div className="lg-hero-art">
              <img
                src={getAssetUrl(hero.image.src)}
                alt={hero.image.alt}
                width={hero.image.width}
                height={hero.image.height}
                fetchPriority="high"
                className="lg-hero-img"
              />
              <figure className="lg-card">
                <figcaption className="sr-only">A sample practice balance</figcaption>
                <p className="lg-card-label">{hero.card.label}</p>
                <p className="lg-card-value">{hero.card.value}</p>
                <p className="lg-card-change">
                  <ArrowUpRight aria-hidden="true" />
                  {hero.card.change}
                </p>
                <svg viewBox="0 0 300 100" className="lg-chart" aria-hidden="true" preserveAspectRatio="none">
                  <path d={`${line} L300 100 L0 100 Z`} className="lg-chart-fill" />
                  <path d={line} className="lg-chart-line" />
                </svg>
              </figure>
            </div>
          </div>
        </section>

        <section className="lg-section" id="compound" aria-labelledby="lg-compound">
          <div className="lg-wrap lg-compound">
            <div>
              <h2 id="lg-compound" className="lg-h2">
                {compound.title}
              </h2>
              <p className="lg-body">{compound.intro}</p>
            </div>
            <div className="lg-table" role="table" aria-label="Daily deposits">
              <div className="lg-table-head" role="row">
                <span role="columnheader">Deposit</span>
                <span role="columnheader">Amount</span>
              </div>
              {compound.rows.map((row) => (
                <div key={row.label} className="lg-table-row" role="row">
                  <span role="cell">
                    <span className="lg-table-label">{row.label}</span>
                    <span className="lg-table-note">{row.note}</span>
                  </span>
                  <span role="cell" className="lg-table-value">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg-section lg-deep" id="features" aria-labelledby="lg-features">
          <div className="lg-wrap">
            <h2 id="lg-features" className="lg-h2">
              {features.title}
            </h2>
            <ul className="lg-features">
              {features.items.map((item) => (
                <li key={item.title} className="lg-feature">
                  <span className="lg-feature-check">
                    <Check aria-hidden="true" />
                  </span>
                  <h3 className="lg-h3">{item.title}</h3>
                  <p className="lg-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lg-section" aria-labelledby="lg-statement">
          <div className="lg-wrap lg-statement-grid">
            <div>
              <h2 id="lg-statement" className="lg-h2">
                {statement.title}
              </h2>
              <p className="lg-body">{statement.intro}</p>
              <button type="button" className="lg-btn" onClick={onJoin}>
                Make your first deposit
              </button>
            </div>
            <ol className="lg-statement">
              {statement.rows.map((row) => (
                <li key={`${row.when}-${row.label}`} className="lg-statement-row">
                  <span className="lg-statement-when">{row.when}</span>
                  <span className="lg-statement-label">{row.label}</span>
                  <span className="lg-statement-amount">{row.amount}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Common questions" />
        {children}
      </main>
    </div>
  )
}
