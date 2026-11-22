import React from 'react'
import { Link } from '@tanstack/react-router'
import { BENEFIT_LINKS } from './kit-props'

export interface BenefitHeaderLink {
  label: string
  /** An in-page anchor such as "#how", or a site path. */
  href: string
}

interface BenefitHeaderProps {
  /** The costume's own take on the Moltology lockup. */
  lockup: React.ReactNode
  links: BenefitHeaderLink[]
  cta: string
  onJoin: () => void
}

/**
 * The costume header. Each kit styles it (`.bh-*` in the kit CSS) and brings its own lockup;
 * the structure, links to the demo and the sign-up button stay the same everywhere.
 */
export function BenefitHeader({ lockup, links, cta, onJoin }: BenefitHeaderProps) {
  return (
    <header className="bh">
      <div className="bh-inner">
        <Link to="/" className="bh-lockup" aria-label="Moltology home">
          {lockup}
        </Link>
        <nav className="bh-nav" aria-label="On this page">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="bh-link">
              {link.label}
            </a>
          ))}
          <Link to={BENEFIT_LINKS.demo} className="bh-link">
            Demo
          </Link>
        </nav>
        <button type="button" className="bh-cta" onClick={onJoin}>
          {cta}
        </button>
      </div>
    </header>
  )
}
