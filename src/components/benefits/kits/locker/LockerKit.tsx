import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'
import './locker.css'

/** The sportswear lockup: slanted condensed capitals with the emblem riding a speed bar. */
function LockerLockup() {
  return (
    <span className="lk-lockup">
      <BrandIcon aria-hidden="true" tone="inherit" className="lk-lockup-icon" />
      <span className="lk-lockup-word">Moltology</span>
      <span className="lk-lockup-bar" aria-hidden="true" />
    </span>
  )
}

/** Locker room: sportswear and training brands. Black, volt, condensed italic capitals, grit. */
export default function LockerKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'locker') return null
  const { hero, stats, program, gear, creed } = page.content

  return (
    <div className="lk">
      <BenefitHeader
        lockup={<LockerLockup />}
        links={[
          { label: 'Program', href: '#program' },
          { label: 'Gear', href: '#gear' },
          { label: 'FAQ', href: '#faq' },
        ]}
        cta="Join free"
        onJoin={onJoin}
      />

      <main>
        <section className="lk-hero">
          <img
            src={getAssetUrl(hero.image.src)}
            alt={hero.image.alt}
            width={hero.image.width}
            height={hero.image.height}
            fetchPriority="high"
            className="lk-hero-img"
          />
          <div className="lk-hero-shade" aria-hidden="true" />
          <div className="lk-wrap lk-hero-copy">
            <p className="lk-tag">{hero.tag}</p>
            <h1 className="lk-h1">{hero.headline}</h1>
            <p className="lk-lede">{hero.sub}</p>
            <div className="lk-actions">
              <button type="button" className="lk-btn" onClick={onJoin}>
                {hero.cta}
                <ArrowRight aria-hidden="true" />
              </button>
              <Link to={BENEFIT_LINKS.quiz} className="lk-btn-line">
                Test yourself: 3 minute quiz
              </Link>
            </div>
          </div>
        </section>

        <ul className="lk-stats" aria-label="The program in numbers">
          {stats.map((stat) => (
            <li key={stat.label} className="lk-stat">
              <span className="lk-stat-value">{stat.value}</span>
              <span className="lk-stat-label">{stat.label}</span>
            </li>
          ))}
        </ul>

        <section className="lk-section" id="program" aria-labelledby="lk-program">
          <div className="lk-wrap">
            <h2 id="lk-program" className="lk-h2">
              {program.title}
            </h2>
            <p className="lk-body lk-intro">{program.intro}</p>
            <ol className="lk-program">
              {program.items.map((item) => (
                <li key={item.title} className="lk-set">
                  <span className="lk-set-label">{item.set}</span>
                  <h3 className="lk-h3">{item.title}</h3>
                  <p className="lk-body">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lk-section lk-gear-section" id="gear" aria-labelledby="lk-gear">
          <div className="lk-wrap lk-gear">
            <img
              src={getAssetUrl(gear.image.src)}
              alt={gear.image.alt}
              width={gear.image.width}
              height={gear.image.height}
              loading="lazy"
              decoding="async"
              className="lk-gear-img"
            />
            <div>
              <h2 id="lk-gear" className="lk-h2">
                {gear.title}
              </h2>
              <p className="lk-body lk-intro">{gear.intro}</p>
              <ul className="lk-gear-list">
                {gear.items.map((item) => (
                  <li key={item}>
                    <Plus aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <button type="button" className="lk-btn" onClick={onJoin}>
                Log your first session
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="lk-creed" aria-label="Creed">
          <p className="lk-wrap lk-creed-text">{creed}</p>
        </section>

        <BenefitFaq faqs={page.faqs} title="Questions from the bench" />
        {children}
      </main>
    </div>
  )
}
