import React from 'react'
import { Link } from '@tanstack/react-router'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'
import '@/styles/editorial-fonts.css'
import './retreat.css'

/** The retreat lockup: the name in an easy script over a small spaced line, emblem as a seal. */
function RetreatLockup() {
  return (
    <span className="rt-lockup">
      <BrandIcon aria-hidden="true" tone="inherit" className="rt-lockup-icon" />
      <span className="rt-lockup-text">
        <span className="rt-lockup-word">Moltology</span>
        <span className="rt-lockup-sub">Retreat &amp; practice</span>
      </span>
    </span>
  )
}

/** Retreat: mindfulness and wellness retreats. Linen and sage, slow pacing, a script lockup. */
export default function RetreatKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'retreat') return null
  const { hero, intention, rhythm, itinerary, carry } = page.content

  return (
    <div className="rt">
      <BenefitHeader
        lockup={<RetreatLockup />}
        links={[
          { label: 'The practice', href: '#practice' },
          { label: 'Your first week', href: '#week' },
          { label: 'Questions', href: '#faq' },
        ]}
        cta="Begin"
        onJoin={onJoin}
      />

      <main>
        <section className="rt-hero">
          <img
            src={getAssetUrl(hero.image.src)}
            alt={hero.image.alt}
            width={hero.image.width}
            height={hero.image.height}
            fetchPriority="high"
            className="rt-hero-img"
          />
          <div className="rt-hero-shade" aria-hidden="true" />
          <div className="rt-hero-copy">
            <p className="rt-kicker">{hero.kicker}</p>
            <h1 className="rt-h1">{hero.headline}</h1>
            <p className="rt-lede">{hero.sub}</p>
            <div className="rt-actions">
              <button type="button" className="rt-btn" onClick={onJoin}>
                {hero.cta}
              </button>
              <Link to={BENEFIT_LINKS.quiz} className="rt-btn-quiet">
                Or take the three minute quiz
              </Link>
            </div>
          </div>
        </section>

        <section className="rt-intention" aria-label="Intention">
          <figure className="rt-wrap-narrow">
            <span className="rt-ornament" aria-hidden="true" />
            <blockquote className="rt-quote">“{intention.quote}”</blockquote>
            <figcaption className="rt-source">
              From <a href={intention.source.href}>{intention.source.label}</a>
            </figcaption>
          </figure>
        </section>

        <section className="rt-section" id="practice" aria-labelledby="rt-practice">
          <div className="rt-wrap rt-practice">
            <div className="rt-practice-head">
              <p className="rt-kicker rt-kicker-dark">The practice</p>
              <h2 id="rt-practice" className="rt-h2">
                {rhythm.title}
              </h2>
              <p className="rt-body">{rhythm.intro}</p>
            </div>
            <ol className="rt-rhythm">
              {rhythm.items.map((item) => (
                <li key={item.title}>
                  <span className="rt-time">{item.time}</span>
                  <div>
                    <h3 className="rt-h3">{item.title}</h3>
                    <p className="rt-body">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rt-section rt-sand" id="week" aria-labelledby="rt-week">
          <div className="rt-wrap">
            <p className="rt-kicker rt-kicker-dark rt-center">Itinerary</p>
            <h2 id="rt-week" className="rt-h2 rt-center">
              {itinerary.title}
            </h2>
            <ol className="rt-days">
              {itinerary.items.map((item) => (
                <li key={item.day} className="rt-day">
                  <span className="rt-day-n">{item.day}</span>
                  <h3 className="rt-h3">{item.title}</h3>
                  <p className="rt-body">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rt-section" aria-labelledby="rt-carry">
          <div className="rt-wrap rt-carry">
            <img
              src={getAssetUrl(carry.image.src)}
              alt={carry.image.alt}
              width={carry.image.width}
              height={carry.image.height}
              loading="lazy"
              decoding="async"
              className="rt-carry-img"
            />
            <div>
              <h2 id="rt-carry" className="rt-h2">
                {carry.title}
              </h2>
              <ul className="rt-carry-list">
                {carry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button type="button" className="rt-btn rt-btn-dark" onClick={onJoin}>
                Reserve your place, free
              </button>
            </div>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Questions before you begin" />
        {children}
      </main>
    </div>
  )
}
