import React, { useState } from 'react'
import { Lock, UserPlus, LogIn } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { AuthModal } from '@/components/AuthModal'

export interface GuestLockGuardProps {
  children: React.ReactNode
  featureName?: string
  title?: string
  message?: string
  bypass?: boolean
}

export const GuestLockGuard: React.FC<GuestLockGuardProps> = ({
  children,
  featureName = 'THIS TERMINAL',
  title,
  message,
  bypass = false,
}) => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null
  const isGuest = !userId && !bypass

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')

  const handleOpenAuth = (mode: 'signup' | 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  if (!isGuest) {
    return <>{children}</>
  }

  const displayTitle = title || `${featureName.toUpperCase()} LOCKED`
  const displayMessage =
    message ||
    `Access to ${featureName} is restricted in guest mode. Create your free initiate account in seconds to unlock full access.`

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-center font-mono">
      {/* Dimmed Background Content Preview (constrained to viewport bounds so it does not overflow) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none filter blur-[4px] opacity-20 brightness-50 transition-all duration-300"
        aria-hidden="true"
        tabIndex={-1}
      >
        {children}
      </div>

      {/* Main Workspace Dimming Overlay & Centered Lock Modal Card */}
      <div className="absolute inset-0 -m-4 md:-m-6 z-20 flex items-center justify-center p-4 sm:p-6 bg-[#030708]/85 backdrop-blur-[2px] animate-fadeIn">
        <div className="w-full max-w-md bg-[#090f12]/95 border border-[#3a4a49] shadow-[0_0_60px_rgba(0,0,0,0.9)] chamfer-corner p-6 sm:p-8 text-center space-y-5 relative overflow-hidden my-auto">
          {/* Top Subtle Crimson Edge Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff453a] to-transparent" />

          {/* Centered Glowing Lock Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-[#04080a] border border-[#ff453a]/60 text-[#ff5540] flex items-center justify-center shadow-[0_0_25px_rgba(255,69,58,0.35)]">
            <Lock className="w-8 h-8" />
          </div>

          {/* Status Badge */}
          <div className="inline-block px-3 py-1 bg-[#ff453a]/10 border border-[#ff453a]/40 text-[#ff5540] text-[10px] font-bold tracking-widest uppercase chamfer-corner">
            RESTRICTED ACCESS
          </div>

          {/* Header Title & Concise Message */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-grotesk font-extrabold text-[#dfe3e3] uppercase tracking-wider">
              {displayTitle}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#839493] leading-relaxed max-w-sm mx-auto font-mono">
              {displayMessage}
            </p>
          </div>

          {/* CTAs: Sign Up Button & Sign In Link */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => handleOpenAuth('signup')}
              className="w-full py-3 px-6 bg-[#ff453a] hover:bg-[#ff5540] text-white font-grotesk font-bold text-xs sm:text-sm uppercase tracking-wider chamfer-corner shadow-[0_0_20px_rgba(255,69,58,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>SIGN UP TO UNLOCK</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="text-xs text-[#00c3ff] hover:text-white underline underline-offset-4 tracking-wider uppercase font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Already have an account? Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  )
}
