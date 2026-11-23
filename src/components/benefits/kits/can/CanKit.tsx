import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, X, Zap } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'
import './can.css'

const CAN_STAMPS: Record<string, [string, string]> = {
  'cobalt-shift': ['CLOSE', 'THE DAY'],
  'solar-chili': ['EXTRA', 'BITE'],
  'citrus-burst': ['FULL', 'FLAVOR'],
}

/** The drinks-brand lockup: the word in fat caps on a tilted sticker. */
function CanLockup({ variant }: { variant?: string }) {
  return (
    <span className={`cn-lockup${variant ? ' cn-lockup-square' : ''}`}>
      <BrandIcon aria-hidden="true" tone="inherit" className="cn-lockup-icon" />
      <span className="cn-lockup-word">Moltology</span>
    </span>
  )
}

/** Can: energy drinks and loud snacks. Saturated grounds, fat caps, stickers, a marquee. */
export default function CanKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'can') return null
  const { hero, marquee, flavors, label, crash, story } = page.content
  const marqueeRun = [...marquee, ...marquee]
  const isVariant = Boolean(page.variant)
  const stamp = page.variant ? CAN_STAMPS[page.variant] : undefined

  return (
    <div className="cn">
      <BenefitHeader
        lockup={<CanLockup variant={page.variant} />}
        links={[
          { label: 'Flavors', href: '#flavors' },
          { label: 'Facts', href: '#facts' },
          { label: 'FAQ', href: '#faq' },
        ]}
        cta="Get it free"
        onJoin={onJoin}
      />

      <main>
        <section className="cn-hero">
          <div className="cn-wrap cn-hero-grid">
            <div className="cn-hero-copy">
              <p className="cn-sticker">
                <Zap aria-hidden="true" />
                {hero.sticker}
              </p>
              <h1 className="cn-h1">{hero.headline}</h1>
              <p className="cn-lede">{hero.sub}</p>
              <div className="cn-actions">
                <button type="button" className="cn-btn" onClick={onJoin}>
                  {hero.cta}
                  <ArrowRight aria-hidden="true" />
                </button>
                <Link to={BENEFIT_LINKS.quiz} className="cn-btn-ghost">
                  Take the 3 minute quiz
                </Link>
              </div>
            </div>
            <div className="cn-hero-art">
              {stamp ? (
                <span className="cn-stamp" aria-hidden="true">
                  <span>{stamp[0]}</span>
                  <span>{stamp[1]}</span>
                </span>
              ) : (
                <span className="cn-burst" aria-hidden="true">
                  <span>0 g</span>
                  <span>sugar</span>
                </span>
              )}
              <img
                src={getAssetUrl(hero.image.src)}
                alt={hero.image.alt}
                width={hero.image.width}
                height={hero.image.height}
                fetchPriority="high"
                className="cn-hero-img"
              />
            </div>
          </div>
        </section>

        <div className="cn-marquee" aria-hidden="true">
          <div className="cn-marquee-track">
            {marqueeRun.map((word, index) => (
              <span key={`${word}-${index}`} className="cn-marquee-item">
                {word}
                <BrandIcon aria-hidden="true" tone="inherit" className="cn-marquee-icon" />
              </span>
            ))}
          </div>
        </div>
        <p className="sr-only">{marquee.join(', ')}</p>

        <section className="cn-section cn-cream" id="flavors" aria-labelledby="cn-flavors">
          <div className="cn-wrap">
            <h2 id="cn-flavors" className="cn-h2">
              {flavors.title}
            </h2>
            <ul className="cn-flavors">
              {flavors.items.map((flavor, index) => (
                <li key={flavor.name} className={`cn-flavor is-${flavor.tone}`}>
                  <span className="cn-flavor-n">{isVariant ? String(index + 1).padStart(2, '0') : `No. ${index + 1}`}</span>
                  <h3 className="cn-h3">{flavor.name}</h3>
                  <p className="cn-flavor-note">{flavor.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cn-section cn-cream cn-facts" id="facts" aria-labelledby="cn-label">
          <div className="cn-wrap cn-facts-grid">
            <div className="cn-label">
              <h2 id="cn-label" className="cn-label-title">
                {label.title}
              </h2>
              <p className="cn-label-serving">{label.serving}</p>
              <dl className="cn-label-rows">
                {label.rows.map((row) => (
                  <div key={row.label} className="cn-label-row">
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="cn-label-foot">{label.footnote}</p>
            </div>
            <div className="cn-crash">
              <h2 className="cn-h2">{crash.title}</h2>
              <div className="cn-crash-cols">
                <div className="cn-crash-col is-without">
                  <h3 className="cn-crash-head">The usual can</h3>
                  <ul>
                    {crash.without.map((item) => (
                      <li key={item}>
                        <X aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="cn-crash-col is-with">
                  <h3 className="cn-crash-head">Moltology</h3>
                  <ul>
                    {crash.with.map((item) => (
                      <li key={item}>
                        <Zap aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cn-section cn-lime" aria-labelledby="cn-story">
          <div className="cn-wrap cn-story">
            <img
              src={getAssetUrl(story.image.src)}
              alt={story.image.alt}
              width={story.image.width}
              height={story.image.height}
              loading="lazy"
              decoding="async"
              className="cn-story-img"
            />
            <div>
              <h2 id="cn-story" className="cn-h2">
                {story.title}
              </h2>
              {story.body.map((paragraph) => (
                <p key={paragraph} className="cn-body">
                  {paragraph}
                </p>
              ))}
              <button type="button" className="cn-btn cn-btn-dark" onClick={onJoin}>
                Start your first day
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Got questions?" />
        {children}
      </main>
    </div>
  )
}
