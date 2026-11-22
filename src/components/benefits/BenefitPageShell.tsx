import React, { Suspense, lazy, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MainFooter } from '@/components/MainFooter'
import { AuthModal } from '@/components/AuthModal'
import type { BenefitPage } from '@/lib/benefits/types'
import { MoltReveal } from './MoltReveal'
import type { BenefitKitProps } from './kit-props'
import './benefits.css'

// Each costume is its own chunk with its own CSS and fonts, so a page only loads the one it wears.
const KITS = {
  clinic: lazy(() => import('./kits/clinic/ClinicKit')),
  can: lazy(() => import('./kits/can/CanKit')),
  retreat: lazy(() => import('./kits/retreat/RetreatKit')),
} satisfies Record<BenefitPage['kit'], React.LazyExoticComponent<React.ComponentType<BenefitKitProps>>>

/**
 * A benefit landing page: the industry costume on top, then the shed into the normal
 * Moltology look (the reveal), then the usual footer.
 */
export function BenefitPageShell({ page }: { page: BenefitPage }) {
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [authReady, setAuthReady] = useState(false)
  useEffect(() => setAuthReady(true), [])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }
  const Kit = KITS[page.kit]

  return (
    <div className="benefit-page min-h-screen flex flex-col bg-abyss" data-kit={page.kit}>
      <Suspense fallback={<div className="benefit-kit-fallback" />}>
        <Kit page={page} onJoin={() => openAuth('signup')}>
          <MoltReveal
            page={page}
            authReady={authReady}
            onOpenAuth={openAuth}
            onNavigate={(path) => void navigate({ to: path })}
          />
        </Kit>
      </Suspense>
      <MainFooter />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  )
}
