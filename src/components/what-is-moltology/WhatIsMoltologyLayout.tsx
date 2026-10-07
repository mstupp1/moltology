import React, { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { PublicHeader } from '@/components/PublicHeader'
import { MainFooter } from '@/components/MainFooter'
import { AuthModal } from '@/components/AuthModal'
import { PublicHeaderChromeProvider } from '@/components/public-header-chrome'
import { WhatIsMoltologySubnav } from './WhatIsMoltologySubnav'
import './moltology-story.css'

export const WhatIsMoltologyLayout: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  return (
    <PublicHeaderChromeProvider>
      <div className="molt-story-shell min-h-screen font-sans selection:bg-[#bcf5dc]/30 selection:text-white flex flex-col">
        <PublicHeader
          activePage="about"
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setIsAuthModalOpen(true)
          }}
        />
        <WhatIsMoltologySubnav />
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
        <MainFooter />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
      </div>
    </PublicHeaderChromeProvider>
  )
}
