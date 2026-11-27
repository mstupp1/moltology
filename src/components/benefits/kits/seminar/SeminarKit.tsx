import React from 'react'
import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenefitHeader } from '../../BenefitHeader'
import { BenefitFaq } from '../../BenefitFaq'
import { BENEFIT_LINKS, type BenefitKitProps } from '../../kit-props'

const SEMINAR_LABELS: Record<string, string> = {
  publisher: 'Press',
  'keynote-stage': 'Keynote',
  'cobalt-summit': 'Summit',
  'olive-monograph': 'Monograph',
  'midnight-folio': 'Folio',
  'plum-journal': 'Journal',
}

/** The seminar lockup: a small italic "the", the name in tall capitals and "method" in gold. */
function SeminarLockup({ variant }: { variant?: string }) {
  if (variant) {
    return (
      <span className="sm-lockup sm-lockup-press">
        <span className="sm-lockup-seal">
          <BrandIcon aria-hidden="true" tone="inherit" className="sm-lockup-icon" />
        </span>
        <span className="sm-lockup-text">
          <span className="sm-lockup-word">Moltology</span>
          <span className="sm-lockup-method">{SEMINAR_LABELS[variant] ?? 'Press'}</span>
        </span>
      </span>
    )
  }
  return (
    <span className="sm-lockup">
      <span className="sm-lockup-seal">
        <BrandIcon aria-hidden="true" tone="inherit" className="sm-lockup-icon" />
      </span>
      <span className="sm-lockup-text">
        <span className="sm-lockup-the">the</span>
        <span className="sm-lockup-word">Moltology</span>
        <span className="sm-lockup-method">Method</span>
      </span>
    </span>
  )
}

/** Seminar: self-help books and live events, with a cover and a short table of contents. */
export default function SeminarKit({ page, onJoin, children }: BenefitKitProps) {
  if (page.kit !== 'seminar') return null
  const { hero, chapters, passage } = page.content
  const isVariant = Boolean(page.variant)

  return (
    <div className="sm">
      <BenefitHeader
        lockup={<SeminarLockup variant={page.variant} />}
        links={[
          { label: 'Chapters', href: '#chapters' },
          { label: 'FAQ', href: '#faq' },
        ]}
        cta="Join free"
        onJoin={onJoin}
      />

      <main>
        <section className="sm-hero">
          <div className="sm-wrap sm-hero-grid">
            <div className="sm-hero-copy">
              <p className="sm-kicker">{hero.kicker}</p>
              <h1 className="sm-h1">{hero.headline}</h1>
              <p className="sm-lede">{hero.sub}</p>
              <div className="sm-actions">
                <button type="button" className="sm-btn" onClick={onJoin}>
                  <BookOpen aria-hidden="true" />
                  {hero.cta}
                </button>
                <Link to={BENEFIT_LINKS.quiz} className="sm-link">
                  Take the habit quiz
                </Link>
              </div>
            </div>
            <div className="sm-hero-art">
              <img
                src={getAssetUrl(hero.image.src)}
                alt={hero.image.alt}
                width={hero.image.width}
                height={hero.image.height}
                fetchPriority="high"
                className="sm-hero-img"
              />
              <div className="sm-book" aria-hidden="true">
                <span className="sm-book-author">{hero.book.author}</span>
                <span className="sm-book-title">{hero.book.title}</span>
                <span className="sm-book-sub">{hero.book.subtitle}</span>
                <BrandIcon tone="inherit" className="sm-book-icon" />
              </div>
            </div>
          </div>
        </section>

        <section className="sm-section" id="chapters" aria-labelledby="sm-chapters">
          <div className="sm-wrap-narrow">
            <h2 id="sm-chapters" className="sm-h2 sm-center">
              {chapters.title}
            </h2>
            <ol className="sm-toc">
              {chapters.items.map((chapter, index) => (
                <li key={chapter.title} className="sm-toc-item">
                  <span className="sm-toc-n">
                    {isVariant ? `Chapter ${String(index + 1).padStart(2, '0')}` : `Chapter ${index + 1}`}
                  </span>
                  <h3 className="sm-h3">{chapter.title}</h3>
                  <p className="sm-body">{chapter.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="sm-passage" aria-label="From the Codex">
          <figure className="sm-wrap-narrow">
            <blockquote className="sm-quote">“{passage.quote}”</blockquote>
            <figcaption className="sm-source">
              From <a href={passage.source.href}>{passage.source.label}</a>
            </figcaption>
          </figure>
        </section>

        <BenefitFaq faqs={page.faqs} title="Questions from the reader" />
        {children}
      </main>
    </div>
  )
}
