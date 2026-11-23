import React from 'react'
import { Link } from '@tanstack/react-router'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'
import './atelier.css'

const ATELIER_PLATES: Record<string, [string, string]> = {
  noir: ['Plate 01', 'Signed edition'],
  'porcelain-lacquer': ['Plate 01', 'Porcelain cabinet'],
  'milan-terracotta': ['No. 01', 'Milano edition'],
  'architectural-stone': ['Study 01', 'Stone dossier'],
}

const ATELIER_LOCKUP_SUB: Record<string, string> = {
  noir: 'Édition',
  'porcelain-lacquer': 'Cabinet',
  'milan-terracotta': 'Milano',
  'architectural-stone': 'Atelier',
}

/** The fashion house lockup: the name in spaced Didone capitals over a small maison line. */
function AtelierLockup({ variant }: { variant?: string }) {
  if (variant) {
    return (
      <span className="at-lockup at-lockup-noir">
        <span className="at-lockup-word">Moltology</span>
        <span className="at-lockup-rule" aria-hidden="true" />
        <span className="at-lockup-sub">
          <BrandIcon aria-hidden="true" tone="inherit" className="at-lockup-icon" />
          {ATELIER_LOCKUP_SUB[variant] ?? 'Édition'}
        </span>
      </span>
    )
  }
  return (
    <span className="at-lockup">
      <span className="at-lockup-word">Moltology</span>
      <span className="at-lockup-sub">
        <BrandIcon aria-hidden="true" tone="inherit" className="at-lockup-icon" />
        Maison de la mue
      </span>
    </span>
  )
}

/** Atelier: fashion houses and lookbooks. Greige and black, Didone italics, a show program of looks. */
export default function AtelierKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'atelier') return null
  const { hero, manifesto, lookbook, campaign, care } = page.content
  const isVariant = Boolean(page.variant)
  const plate = page.variant ? ATELIER_PLATES[page.variant] : undefined

  return (
    <div className="at">
      <BenefitHeader
        lockup={<AtelierLockup variant={page.variant} />}
        links={[
          { label: 'The looks', href: '#looks' },
          { label: 'Care', href: '#care' },
          { label: 'FAQ', href: '#faq' },
        ]}
        cta="Join"
        onJoin={onJoin}
      />

      <main>
        <section className="at-hero">
          <div className="at-wrap at-hero-grid">
            <div className="at-hero-copy">
              <p className="at-caption">{hero.season}</p>
              <h1 className="at-h1">{hero.headline}</h1>
              <p className="at-lede">{hero.sub}</p>
              <div className="at-actions">
                <button type="button" className="at-btn" onClick={onJoin}>
                  {hero.cta}
                </button>
                <Link to={BENEFIT_LINKS.quiz} className="at-link">
                  Or find your fit with the quiz
                </Link>
              </div>
            </div>
            <figure className="at-hero-figure">
              <img
                src={getAssetUrl(hero.image.src)}
                alt={hero.image.alt}
                width={hero.image.width}
                height={hero.image.height}
                fetchPriority="high"
                className="at-hero-img"
              />
              <figcaption className="at-caption at-figcaption">
                {plate ? (
                  <>
                    <span>{plate[0]}</span>
                    <span>{plate[1]}</span>
                  </>
                ) : (
                  <>
                    <span>Look 01</span>
                    <span>Silence, tailored</span>
                  </>
                )}
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="at-manifesto" aria-label="Manifesto">
          <div className="at-wrap-narrow">
            {manifesto.map((line) => (
              <p key={line} className="at-manifesto-line">
                {line}
              </p>
            ))}
          </div>
        </section>

        <section className="at-section" id="looks" aria-labelledby="at-looks">
          <div className="at-wrap">
            <div className="at-section-head">
              <h2 id="at-looks" className="at-h2">
                {lookbook.title}
              </h2>
              <p className="at-body">{lookbook.intro}</p>
            </div>
            <ol className="at-looks">
              {lookbook.items.map((look, index) => (
                <li key={look.name} className="at-look">
                  {isVariant ? (
                    <>
                      <span className="at-look-num">{String(index + 1).padStart(2, '0')}</span>
                      <div className="at-look-copy">
                        <h3 className="at-h3">{look.name}</h3>
                        <p className="at-body">{look.note}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="at-caption">Look {String(index + 1).padStart(2, '0')}</span>
                      <h3 className="at-h3">{look.name}</h3>
                      <p className="at-body">{look.note}</p>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="at-campaign" aria-label="Campaign">
          <img
            src={getAssetUrl(campaign.image.src)}
            alt={campaign.image.alt}
            width={campaign.image.width}
            height={campaign.image.height}
            loading="lazy"
            decoding="async"
            className="at-campaign-img"
          />
          <figure className="at-campaign-copy">
            <blockquote className="at-quote">{campaign.quote}</blockquote>
            <figcaption className="at-caption">{campaign.credit}</figcaption>
          </figure>
        </section>

        <section className="at-section" id="care" aria-labelledby="at-care">
          <div className="at-wrap at-care-grid">
            <div>
              <h2 id="at-care" className="at-h2">
                {care.title}
              </h2>
              <p className="at-body">{care.footnote}</p>
              <button type="button" className="at-btn" onClick={onJoin}>
                Wear it daily, free
              </button>
            </div>
            <dl className="at-label">
              <BrandIcon aria-hidden="true" tone="inherit" className="at-label-icon" />
              {care.rows.map((row) => (
                <div key={row.label} className="at-label-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Client services" />
        {children}
      </main>
    </div>
  )
}
