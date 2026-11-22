import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { MainFooter } from '@/components/MainFooter'
import { AuthModal } from '@/components/AuthModal'
import { PublicHeaderChromeProvider } from '@/components/public-header-chrome'
import { BENEFIT_KITS, BENEFIT_PAGES } from '@/lib/benefits/registry'
import './benefits.css'

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
          <p className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-muted">Benefits</p>
          <h1 className="mt-4 font-grotesk text-3xl sm:text-5xl font-semibold tracking-tight text-ink max-w-3xl">
            What a daily practice can do for you
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-ink-body">
            Moltology is one free practice: eight small tasks a day, readings, an AI guide and a community. Each page below
            looks at it from a different angle, dressed like the industry that usually sells that benefit.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFIT_PAGES.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/benefits/$slug"
                  params={{ slug: item.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-card border border-line-subtle bg-surface-1 hover:border-line-strong transition-colors"
                >
                  <span className="benefit-swatch" data-kit={item.kit} aria-hidden="true">
                    <span>{item.topic}</span>
                  </span>
                  <span className="flex flex-1 flex-col p-5">
                    <span className="text-xs text-ink-muted">{BENEFIT_KITS[item.kit].industry}</span>
                    <span className="mt-1 text-md font-medium text-ink">{item.topic}</span>
                    <span className="mt-2 text-sm leading-relaxed text-ink-body">{item.blurb}</span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-cyan-glow">
                      Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
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
