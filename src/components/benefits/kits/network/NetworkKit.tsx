import React from 'react'
import { Link } from '@tanstack/react-router'
import { Hash, Heart, MessageCircle, Sparkles } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { CAST, castStillFilename } from '@/lib/cast'
import { MASCOT_S3_PREFIX } from '@/lib/mascots'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'
import './network.css'

/** The social app lockup: the emblem on a gradient app tile and a rounded lowercase name. */
function NetworkLockup({ variant }: { variant?: string }) {
  return (
    <span className={`nw-lockup${variant ? ` nw-lockup-${variant}` : ''}`}>
      <span className="nw-lockup-tile">
        <BrandIcon aria-hidden="true" tone="inherit" className="nw-lockup-icon" />
      </span>
      <span className="nw-lockup-word">moltology</span>
    </span>
  )
}

/** The cast member's 3D still, or nothing when the key is unknown. */
function castStill(key: string) {
  const member = CAST.find((item) => item.key === key)
  return member ? getAssetUrl(`${MASCOT_S3_PREFIX}/${castStillFilename(member)}`) : null
}

/** Network: social apps. White and violet, a sunset gradient, rounded type, a phone with a feed. */
export default function NetworkKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'network') return null
  const { hero, feed, features, rooms, norms } = page.content

  return (
    <div className="nw">
      <BenefitHeader
        lockup={<NetworkLockup variant={page.variant} />}
        links={[
          { label: 'Features', href: '#features' },
          { label: 'Boards', href: '#boards' },
          { label: 'FAQ', href: '#faq' },
        ]}
        cta="Join free"
        onJoin={onJoin}
      />

      <main>
        <section className="nw-hero">
          <div className="nw-wrap nw-hero-grid">
            <div className="nw-hero-copy">
              <h1 className="nw-h1">{hero.headline}</h1>
              <p className="nw-lede">{hero.sub}</p>
              <ul className="nw-chips" aria-label="At a glance">
                {hero.chips.map((chip) => (
                  <li key={chip} className="nw-chip">
                    {chip}
                  </li>
                ))}
              </ul>
              <div className="nw-actions">
                <button type="button" className="nw-btn" onClick={onJoin}>
                  {hero.cta}
                </button>
                <Link to={BENEFIT_LINKS.quiz} className="nw-btn-soft">
                  Take the 3 minute quiz
                </Link>
              </div>
            </div>

            <figure className="nw-phone">
              <div className="nw-phone-screen">
                <div className="nw-phone-top" aria-hidden="true">
                  <span className="nw-lockup-word">moltology</span>
                  <Sparkles />
                </div>
                <figure className="nw-photo">
                  <img
                    src={getAssetUrl(hero.image.src)}
                    alt={hero.image.alt}
                    width={hero.image.width}
                    height={hero.image.height}
                    fetchPriority="high"
                    className="nw-photo-img"
                  />
                </figure>
                <p className="nw-sample">Sample posts from the cast</p>
                <ul className="nw-feed">
                  {feed.map((post) => (
                    <li key={post.handle} className="nw-post">
                      <img src={castStill(post.cast) ?? ''} alt="" width={34} height={34} loading="lazy" className="nw-avatar" />
                      <div className="nw-post-body">
                        <p className="nw-post-meta">
                          <span className="nw-post-name">{post.name}</span>
                          <span className="nw-post-tag">{post.tag}</span>
                        </p>
                        <p className="nw-post-text">{post.text}</p>
                        <p className="nw-post-actions" aria-hidden="true">
                          <Heart />
                          <MessageCircle />
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <figcaption className="sr-only">Sample posts by Moltology’s cast characters</figcaption>
            </figure>
          </div>
        </section>

        <section className="nw-section" id="features" aria-labelledby="nw-features">
          <div className="nw-wrap">
            <h2 id="nw-features" className="nw-h2 nw-center">
              {features.title}
            </h2>
            <ul className="nw-cards">
              {features.items.map((item, index) => (
                <li key={item.title} className={`nw-card is-${index % 4}`}>
                  <h3 className="nw-h3">{item.title}</h3>
                  <p className="nw-body">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="nw-section nw-tint" id="boards" aria-labelledby="nw-boards">
          <div className="nw-wrap nw-split">
            <div>
              <h2 id="nw-boards" className="nw-h2">
                {rooms.title}
              </h2>
              <p className="nw-body">{rooms.intro}</p>
              <p className="nw-body">
                <a href={page.hook.href} className="nw-text-link">
                  {page.hook.label}
                </a>
                : {page.hook.text}
              </p>
            </div>
            <ul className="nw-rooms">
              {rooms.items.map((room) => (
                <li key={room.name} className="nw-room">
                  <span className="nw-room-icon" aria-hidden="true">
                    <Hash />
                  </span>
                  <div>
                    <h3 className="nw-h3">{room.name}</h3>
                    <p className="nw-room-body">{room.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="nw-section" aria-labelledby="nw-norms">
          <div className="nw-wrap nw-norms">
            <h2 id="nw-norms" className="nw-h2 nw-center">
              {norms.title}
            </h2>
            <ul className="nw-chips nw-norm-chips">
              {norms.items.map((item) => (
                <li key={item} className="nw-chip nw-chip-big">
                  {item}
                </li>
              ))}
            </ul>
            <button type="button" className="nw-btn" onClick={onJoin}>
              Say hello, it’s free
            </button>
          </div>
        </section>

        <BenefitFaq faqs={page.faqs} title="Questions? We got you" />
        {children}
      </main>
    </div>
  )
}
