import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'

/** The clinic lockup uses a lowercase wordmark and a variant editorial tag. */
function ClinicLockup({ variant }: { variant?: string }) {
  if (variant === 'botanical-lab') {
    return (
      <span className="ck-lockup ck-lockup-lab">
        <span className="ck-lockup-disc">
          <BrandIcon aria-hidden="true" tone="inherit" className="ck-lockup-icon" />
        </span>
        <span className="ck-lockup-word">moltology</span>
        <span className="ck-lockup-lab-tag">lab</span>
      </span>
    )
  }
  if (variant === 'graphite-protocol') {
    return (
      <span className="ck-lockup ck-lockup-proto">
        <span className="ck-lockup-disc">
          <BrandIcon aria-hidden="true" tone="inherit" className="ck-lockup-icon" />
        </span>
        <span className="ck-lockup-word">moltology</span>
        <span className="ck-lockup-proto-tag">protocol</span>
      </span>
    )
  }
  if (variant === 'cognitive-studio') {
    return (
      <span className="ck-lockup ck-lockup-studio">
        <span className="ck-lockup-disc">
          <BrandIcon aria-hidden="true" tone="inherit" className="ck-lockup-icon" />
        </span>
        <span className="ck-lockup-word">moltology</span>
        <span className="ck-lockup-studio-tag">studio</span>
      </span>
    )
  }
  if (variant === 'clinical-editorial') {
    return (
      <span className="ck-lockup ck-lockup-editorial">
        <span className="ck-lockup-disc">
          <BrandIcon aria-hidden="true" tone="inherit" className="ck-lockup-icon" />
        </span>
        <span className="ck-lockup-word">moltology</span>
        <span className="ck-lockup-ed-tag">ed.</span>
      </span>
    )
  }
  return (
    <span className="ck-lockup">
      <span className="ck-lockup-disc">
        <BrandIcon aria-hidden="true" tone="inherit" className="ck-lockup-icon" />
      </span>
      <span className="ck-lockup-word">moltology</span>
      <span className="ck-lockup-plus" aria-hidden="true">+</span>
    </span>
  )
}

/** Clinic: telehealth and biohacking. Light, calm, rounded, plan pickers and a black pill button. */
export default function ClinicKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'clinic') return null
  const { hero, steps, plans } = page.content
  const isVariant = Boolean(page.variant)

  return (
    <div className="ck">
      <BenefitHeader
        lockup={<ClinicLockup variant={page.variant} />}
        links={[
          { label: 'How it works', href: '#how' },
          { label: 'Readings', href: '#plans' },
          { label: 'FAQ', href: '#faq' },
        ]}
        cta="Get started"
        onJoin={onJoin}
      />

      <main>
        <section className="ck-hero">
          <div className="ck-wrap ck-hero-grid">
            <div className="ck-hero-copy">
              <p className="ck-pill">
                {hero.eyebrow}
              </p>
              <h1 className="ck-h1">{hero.headline}</h1>
              <p className="ck-lede">{hero.sub}</p>
              <div className="ck-actions">
                <button type="button" className="ck-btn" onClick={onJoin}>
                  {hero.cta}
                  <ArrowRight aria-hidden="true" />
                </button>
                <Link to={BENEFIT_LINKS.quiz} className="ck-btn-ghost">
                  Take the habit quiz
                </Link>
              </div>
              {page.disclaimer && <p className="ck-fine">{page.disclaimer}</p>}
            </div>
            <div className="ck-hero-art">
              <img
                src={getAssetUrl(hero.image.src)}
                alt={hero.image.alt}
                width={hero.image.width}
                height={hero.image.height}
                fetchPriority="high"
                className="ck-hero-img"
              />
            </div>
          </div>
        </section>

        <section className="ck-section ck-tint" id="how" aria-labelledby="ck-how">
          <div className="ck-wrap">
            <h2 id="ck-how" className="ck-h2 ck-center">
              {steps.title}
            </h2>
            <ol className="ck-steps">
              {steps.items.map((step, index) => (
                <li key={step.title} className="ck-step">
                  <span className="ck-step-n">
                    {isVariant ? `Step ${String(index + 1).padStart(2, '0')}` : String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="ck-h3">{step.title}</h3>
                  <p className="ck-body">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ck-section" id="plans" aria-labelledby="ck-plans">
          <div className="ck-wrap">
            <h2 id="ck-plans" className="ck-h2">
              {plans.title}
            </h2>
            <p className="ck-body ck-narrow">{plans.intro}</p>
            <ul className="ck-plans">
              {plans.items.map((plan) => (
                <li key={plan.name} className="ck-plan">
                  {isVariant ? (
                    <>
                      <div className="ck-plan-head">
                        <span className="ck-tag">{plan.tag}</span>
                        <h3 className="ck-h3">{plan.name}</h3>
                      </div>
                      <p className="ck-body">{plan.body}</p>
                      <div className="ck-plan-meta">
                        <a href={plan.href} className="ck-link">
                          Read the passage <ArrowRight aria-hidden="true" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="ck-tag">{plan.tag}</span>
                      <h3 className="ck-h3">{plan.name}</h3>
                      <p className="ck-body">{plan.body}</p>
                      <a href={plan.href} className="ck-link">
                        Read the passage <ArrowRight aria-hidden="true" />
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Questions, answered" />
        {children}
      </main>
    </div>
  )
}
