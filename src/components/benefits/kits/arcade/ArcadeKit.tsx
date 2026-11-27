import React from 'react'
import { Link } from '@tanstack/react-router'
import { Gamepad2, Play } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'

/** The game studio lockup: the name in pixel type with a split colour shadow. */
function ArcadeLockup({ variant }: { variant?: string }) {
  if (variant) {
    return (
      <span className="ar-lockup ar-lockup-variant">
        <span className="ar-lockup-badge">
          <BrandIcon aria-hidden="true" tone="inherit" className="ar-lockup-icon" />
        </span>
        <span className="ar-lockup-word">Moltology</span>
      </span>
    )
  }
  return (
    <span className="ar-lockup">
      <BrandIcon aria-hidden="true" tone="inherit" className="ar-lockup-icon" />
      <span className="ar-lockup-word">Moltology</span>
    </span>
  )
}

/** Arcade: video game launches. Night purple, neon cyan and magenta, pixel labels, HUD frames. */
export default function ArcadeKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'arcade') return null
  const { hero, quests, modes } = page.content

  return (
    <div className="ar">
      <BenefitHeader
        lockup={<ArcadeLockup variant={page.variant} />}
        links={[
          { label: 'Quests', href: '#quests' },
          { label: 'Modes', href: '#modes' },
        ]}
        cta="Play free"
        onJoin={onJoin}
      />

      <main>
        <section className="ar-hero">
          <img
            src={getAssetUrl(hero.image.src)}
            alt={hero.image.alt}
            width={hero.image.width}
            height={hero.image.height}
            fetchPriority="high"
            className="ar-hero-img"
          />
          <div className="ar-hero-shade" aria-hidden="true" />
          <div className="ar-wrap ar-hero-copy">
            <p className="ar-pixel ar-tag">{hero.tag}</p>
            <h1 className="ar-h1">{hero.headline}</h1>
            <p className="ar-lede">{hero.sub}</p>
            <div className="ar-actions">
              <button type="button" className="ar-btn" onClick={onJoin}>
                <Play aria-hidden="true" />
                {hero.cta}
              </button>
              <Link to={BENEFIT_LINKS.demo} className="ar-btn-alt">
                <Gamepad2 aria-hidden="true" />
                Try the demo
              </Link>
            </div>
          </div>
        </section>

        <section className="ar-section ar-dark" id="quests" aria-labelledby="ar-quests">
          <div className="ar-wrap">
            <p className="ar-pixel ar-label">Daily</p>
            <h2 id="ar-quests" className="ar-h2">
              {quests.title}
            </h2>
            <p className="ar-body">{quests.intro}</p>
            <ol className="ar-quests">
              {quests.items.map((quest, index) => (
                <li key={quest.title} className="ar-quest">
                  <span className="ar-quest-copy">
                    <span className="ar-pixel ar-quest-n">Q{index + 1}</span>
                    <h3 className="ar-h3">{quest.title}</h3>
                    <span className="ar-quest-body">{quest.body}</span>
                  </span>
                  <span className="ar-pixel ar-reward">{quest.reward}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ar-section" id="modes" aria-labelledby="ar-modes">
          <div className="ar-wrap ar-split ar-modes">
            <img
              src={getAssetUrl(modes.image.src)}
              alt={modes.image.alt}
              width={modes.image.width}
              height={modes.image.height}
              loading="lazy"
              decoding="async"
              className="ar-modes-img"
            />
            <div>
              <h2 id="ar-modes" className="ar-h2">
                {modes.title}
              </h2>
              <ul className="ar-mode-list">
                {modes.items.map((mode) => (
                  <li key={mode.name} className="ar-mode">
                    <h3 className="ar-h3">{mode.name}</h3>
                    <p className="ar-body">{mode.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="FAQ" />
        {children}
      </main>
    </div>
  )
}
