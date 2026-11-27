import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { MainFooter } from '@/components/MainFooter'
import { AuthModal } from '@/components/AuthModal'
import { PublicHeaderChromeProvider } from '@/components/public-header-chrome'
import { getAssetUrl } from '@/lib/assets'
import { BENEFIT_PAGES, benefitHeroSrc } from '@/lib/benefits/registry'

/** The index of every benefit page, in the normal Moltology look, each card tinted like its costume. */
export function BenefitsHubPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  return (
    <PublicHeaderChromeProvider>
      <div className="min-h-screen bg-abyss text-ink-body font-sans flex flex-col">
        <PublicHeader
          activePage="about"
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setAuthOpen(true)
          }}
        />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 pt-28 sm:pt-36 pb-20">
          <h1 className="font-grotesk text-3xl sm:text-5xl font-semibold tracking-tight text-ink max-w-3xl">
            What do you want to work on?
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-ink-body">
            Pick a place to start with Moltology’s free daily practice.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFIT_PAGES.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/benefits/$slug"
                  params={{ slug: item.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-card border border-line-subtle bg-surface-1 hover:border-line-strong transition-colors"
                >
                  <span className="benefit-swatch" data-kit={item.kit} data-variant={item.variant} aria-hidden="true">
                    <img
                      src={getAssetUrl(benefitHeroSrc(item.slug, item.heroSrc))}
                      alt=""
                      width={640}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="benefit-swatch-img"
                    />
                  </span>
                  <span className="flex flex-1 flex-col p-4 sm:p-5">
                    <span className="flex items-center justify-between gap-3 font-grotesk text-lg font-semibold text-ink">
                      {item.topic}
                      <ArrowRight className="w-4 h-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-glow" aria-hidden="true" />
                    </span>
                    <span className="mt-1 text-sm leading-relaxed text-ink-body">{item.blurb}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </main>
        <MainFooter />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
      </div>
    </PublicHeaderChromeProvider>
  )
}
