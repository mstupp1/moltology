import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PublicHeader } from '@/components/PublicHeader'
import { HomeHero } from '@/components/HomeHero'
import { HomeFaq, HomeFinalCta, HomeHowItWorks, HomeIdea, HomeMelt, HomeVoices } from '@/components/home/HomeSections'
import { MoltmaxGuideFloatingPill } from '@/components/guide/MoltmaxGuideFloatingPill'
import { MainFooter } from '@/components/MainFooter'
import { useIdleReady } from '@/hooks/useIdleReady'
import { useDeferredStylesheet } from '@/hooks/useDeferredStylesheet'
import '@/styles/pbr-textures.css'

const AuthModal = React.lazy(() => import('@/components/AuthModal').then((m) => ({ default: m.AuthModal })))
const MoltmaxGuideModal = React.lazy(() => import('@/components/guide/MoltmaxGuideModal').then((m) => ({ default: m.MoltmaxGuideModal })))

function loadLandingCrtStyles() {
  return import('@/styles/crt.css')
}

/**
 * The homepage is a short, guided pitch: what Moltology is, the feeling it fixes, the strange idea
 * behind it, how a first week works, and a way in after every section. The long story lives on
 * the About pages; sections here introduce a topic and link out.
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate({ to: path })
  const authReady = useIdleReady()
  useDeferredStylesheet(loadLandingCrtStyles)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const sectionProps = { authReady, onNavigate, onOpenAuth: openAuth }

  return (
    <div className="min-h-screen bg-[#020408] text-[#dfe3e3] font-sans selection:bg-[#00c3ff]/30 selection:text-white flex flex-col overflow-x-clip">
      {isAuthModalOpen && (
        <React.Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={authMode}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => onNavigate('/dashboard')}
          />
        </React.Suspense>
      )}

      <PublicHeader activePage="home" onOpenAuth={openAuth} />

      <HomeHero {...sectionProps} />

      <main className="flex-1 w-full relative">
        <HomeMelt />
        <HomeIdea />
        <HomeHowItWorks onNavigate={onNavigate} />
        <HomeVoices />
        <HomeFaq />
        <HomeFinalCta {...sectionProps} />
      </main>

      <MainFooter />

      <MoltmaxGuideFloatingPill onOpenGuideModal={() => setIsGuideModalOpen(true)} />

      {isGuideModalOpen && (
        <React.Suspense fallback={null}>
          <MoltmaxGuideModal
            isOpen={isGuideModalOpen}
            onClose={() => setIsGuideModalOpen(false)}
            source="homepage_floating_pill"
            onOpenAuthSignup={() => openAuth('signup')}
          />
        </React.Suspense>
      )}
    </div>
  )
}
