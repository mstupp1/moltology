import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, CircleCheck, Clock, HeartPulse, Pill, Sparkles } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'
import './clinic.css'

const TRUST_ICONS = [Sparkles, Pill, CircleCheck, Clock]

/** The telehealth lockup: lowercase serif word, emblem in a soft disc, a small plus. */
function ClinicLockup() {
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
  const { hero, trust, signs, steps, plans, compare } = page.content

  return (
    <div className="ck">
      <BenefitHeader
        lockup={<ClinicLockup />}
        links={[
          { label: 'How it works', href: '#how' },
          { label: 'Plans', href: '#plans' },
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
                <HeartPulse aria-hidden="true" />
                {hero.eyebrow}
              </p>
              <h1 className="ck-h1">{hero.headline}</h1>
              <p className="ck-lede">{hero.sub}</p>
              <ul className="ck-checks">
                {hero.checks.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="ck-actions">
                <button type="button" className="ck-btn" onClick={onJoin}>
                  {hero.cta}
                  <ArrowRight aria-hidden="true" />
                </button>
                <Link to={BENEFIT_LINKS.quiz} className="ck-btn-ghost">
                  Take the 3 minute assessment
                </Link>
              </div>
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
              <div className="ck-plan-card" aria-hidden="true">
                <p className="ck-plan-card-label">Your plan</p>
                <p className="ck-plan-card-title">8 daily tasks</p>
                <ul>
                  <li>
                    <CircleCheck /> Sit in silence
                  </li>
                  <li>
                    <CircleCheck /> Pick your one thing
                  </li>
                  <li className="is-next">
                    <span className="ck-dot" /> Do deep work
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="ck-trust" aria-label="At a glance">
          <ul className="ck-wrap ck-trust-row">
            {trust.map((item, index) => {
              const Icon = TRUST_ICONS[index % TRUST_ICONS.length]
              return (
                <li key={item}>
                  <Icon aria-hidden="true" />
                  {item}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="ck-section" aria-labelledby="ck-signs">
          <div className="ck-wrap ck-signs">
            <div>
              <h2 id="ck-signs" className="ck-h2">
                {signs.title}
              </h2>
              <p className="ck-body">{signs.intro}</p>
            </div>
            <ul className="ck-signs-list">
              {signs.items.map((item) => (
                <li key={item}>
                  <span className="ck-box" aria-hidden="true">
                    <Check />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
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
                  <span className="ck-step-n">{String(index + 1).padStart(2, '0')}</span>
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
                  <span className="ck-tag">{plan.tag}</span>
                  <h3 className="ck-h3">{plan.name}</h3>
                  <p className="ck-body">{plan.body}</p>
                  <p className="ck-price">
                    <strong>$0</strong> / month
                  </p>
                  <a href={plan.href} className="ck-link">
                    Read the passage <ArrowRight aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ck-section ck-tint" aria-labelledby="ck-compare">
          <div className="ck-wrap">
            <h2 id="ck-compare" className="ck-h2 ck-center">
              {compare.title}
            </h2>
            <div className="ck-table-wrap">
              <table className="ck-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Compared on</span>
                    </th>
                    <th scope="col" className="is-us">
                      {compare.us}
                    </th>
                    <th scope="col">{compare.them}</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td className="is-us">{row.us}</td>
                      <td>{row.them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Questions, answered" />
        {children}
      </main>
    </div>
  )
}
