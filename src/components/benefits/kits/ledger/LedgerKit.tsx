import React from 'react'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'

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

/** Ledger: fintech-style type, colors, and a daily statement. */
export default function LedgerKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'ledger') return null
  const { hero, features, statement } = page.content

  return (
    <div className="lg">
      <BenefitHeader
        lockup={<LedgerLockup variant={page.variant} />}
        links={[
          { label: 'Daily statement', href: '#statement' },
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
                  Take the habit quiz
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

        <section className="lg-section" id="statement" aria-labelledby="lg-statement">
          <div className="lg-wrap lg-statement-grid">
            <div>
              <h2 id="lg-statement" className="lg-h2">
                {statement.title}
              </h2>
              <p className="lg-body">{statement.intro}</p>
              <button type="button" className="lg-btn" onClick={onJoin}>
                Start free
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
