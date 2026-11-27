import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'

const PLATFORM_PILLS: Record<string, string> = {
  'split-prism': 'stack',
  'cyan-console': 'console',
  'light-shield': 'shield',
  'crimson-grid': 'adaptive',
}

/** The AI startup lockup: the emblem in a gradient tile, a tight sans name and a mono suffix. */
function PlatformLockup({ variant }: { variant?: string }) {
  if (variant) {
    return (
      <span className="pf-lockup">
        <span className="pf-lockup-tile">
          <BrandIcon aria-hidden="true" tone="inherit" className="pf-lockup-icon" />
        </span>
        <span className="pf-lockup-word">Moltology</span>
        <span className="pf-lockup-pill">{PLATFORM_PILLS[variant] ?? 'stack'}</span>
      </span>
    )
  }
  return (
    <span className="pf-lockup">
      <span className="pf-lockup-tile">
        <BrandIcon aria-hidden="true" tone="inherit" className="pf-lockup-icon" />
      </span>
      <span className="pf-lockup-word">Moltology</span>
      <span className="pf-lockup-suffix">/ai</span>
    </span>
  )
}

/** Platform: AI software launch styling with workflows and plan details. */
export default function PlatformKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'platform') return null
  const { hero, features, workflow, plans } = page.content
  const isVariant = Boolean(page.variant)

  return (
    <div className="pf">
      <BenefitHeader
        lockup={<PlatformLockup variant={page.variant} />}
        links={[
          { label: 'Product', href: '#features' },
          { label: 'Workflow', href: '#workflow' },
          { label: 'Pricing', href: '#pricing' },
        ]}
        cta="Sign up"
        onJoin={onJoin}
      />

      <main>
        <section className="pf-hero">
          <div className="pf-glow" aria-hidden="true" />
          {isVariant ? (
            <div className="pf-wrap pf-hero-split">
              <div className="pf-hero-copy">
                <a href="#features" className="pf-badge">
                  <Sparkles aria-hidden="true" />
                  {hero.badge}
                  <ArrowRight aria-hidden="true" />
                </a>
                <h1 className="pf-h1">{hero.headline}</h1>
                <p className="pf-lede">{hero.sub}</p>
                <div className="pf-actions">
                  {page.slug === 'ai-swarms' ? (
                    <Link to="/oracle" className="pf-btn">
                      {hero.cta}
                    </Link>
                  ) : (
                    <button type="button" className="pf-btn" onClick={onJoin}>
                      {hero.cta}
                    </button>
                  )}
                  <Link to={BENEFIT_LINKS.demo} className="pf-btn-ghost">
                    Open the demo
                  </Link>
                </div>
              </div>
              <div className="pf-frame">
                <img
                  src={getAssetUrl(hero.image.src)}
                  alt={hero.image.alt}
                  width={hero.image.width}
                  height={hero.image.height}
                  fetchPriority="high"
                  className="pf-hero-img"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="pf-wrap pf-hero-copy">
                <a href="#features" className="pf-badge">
                  <Sparkles aria-hidden="true" />
                  {hero.badge}
                  <ArrowRight aria-hidden="true" />
                </a>
                <h1 className="pf-h1">{hero.headline}</h1>
                <p className="pf-lede">{hero.sub}</p>
                <div className="pf-actions">
                  <button type="button" className="pf-btn" onClick={onJoin}>
                    {hero.cta}
                  </button>
                  <Link to={BENEFIT_LINKS.demo} className="pf-btn-ghost">
                    Open the demo
                  </Link>
                </div>
              </div>
              <div className="pf-wrap">
                <div className="pf-frame">
                  <img
                    src={getAssetUrl(hero.image.src)}
                    alt={hero.image.alt}
                    width={hero.image.width}
                    height={hero.image.height}
                    fetchPriority="high"
                    className="pf-hero-img"
                  />
                </div>
              </div>
            </>
          )}
        </section>

        <section className="pf-section" id="features" aria-labelledby="pf-features">
          <div className="pf-wrap">
            <h2 id="pf-features" className="pf-h2">
              {features.title}
            </h2>
            <p className="pf-body pf-intro">{features.intro}</p>
            <ul className="pf-grid">
              {features.items.map((item, index) => (
                <li key={item.title} className="pf-cell">
                  {isVariant ? <span className="pf-cell-n">{String(index + 1).padStart(2, '0')}</span> : null}
                  <h3 className="pf-h3">{item.title}</h3>
                  <p className="pf-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="pf-section" id="workflow" aria-labelledby="pf-workflow">
          <div className="pf-wrap pf-split">
            <div>
              <h2 id="pf-workflow" className="pf-h2">
                {workflow.title}
              </h2>
              <p className="pf-body pf-intro">{workflow.intro}</p>
            </div>
            <ol className="pf-flow">
              {workflow.steps.map((step) => (
                <li key={step.when} className="pf-node">
                  <span className="pf-node-when">
                    <span className="pf-mono">when</span> {step.when}
                  </span>
                  <span className="pf-node-then">
                    <span className="pf-mono">then</span> {step.then}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="pf-section" id="pricing" aria-labelledby="pf-pricing">
          <div className="pf-wrap">
            <h2 id="pf-pricing" className="pf-h2 pf-center">
              {plans.title}
            </h2>
            <ul className="pf-plans">
              {plans.items.map((plan, index) => (
                <li key={plan.name} className={`pf-plan${index === 0 ? ' is-main' : ''}`}>
                  <h3 className="pf-h3">{plan.name}</h3>
                  <p className="pf-price">{plan.price}</p>
                  <p className="pf-body">{plan.body}</p>
                  <ul className="pf-plan-list">
                    {plan.items.map((item) => (
                      <li key={item}>
                        <Check aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {plan.href ? (
                    <a href={plan.href} className="pf-btn-ghost pf-plan-btn">
                      See Oracle MAX
                    </a>
                  ) : (
                    <button type="button" className="pf-btn pf-plan-btn" onClick={onJoin}>
                      Start free
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Frequently asked questions" />
        {children}
      </main>
    </div>
  )
}
