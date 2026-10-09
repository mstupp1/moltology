import React, { useState } from 'react'
import { Lock, UserPlus, LogIn } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { useAuthSession } from '@/hooks/useAuthSession'
import { HudButton } from '@/components/ui/HudButton'

export interface GuestLockGuardProps {
  children: React.ReactNode
  featureName?: string
  title?: string
  message?: string
  bypass?: boolean
  skeleton?: React.ReactNode
}

export const GuestLockGuard: React.FC<GuestLockGuardProps> = ({
  children,
  featureName = 'THIS TERMINAL',
  title,
  message,
  bypass = false,
  skeleton,
}) => {
  const session = useAuthSession()
  const userId = session.userId
  const isPending = session.isPending
  const isGuest = session.isGuest && !bypass

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')

  const handleOpenAuth = (mode: 'signup' | 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  // Smoothly render skeleton while auth state is resolving
  if (!bypass && isPending) {
    return <>{skeleton || <HudWorkspaceGhost />}</>
  }

  if (!isGuest) {
    return <>{children}</>
  }

  const displayTitle = title || `${featureName.toUpperCase()} LOCKED`
  const displayMessage =
    message ||
    `Access to ${featureName} is restricted in guest mode. Create your free initiate account in seconds to unlock full access.`

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-140px)] flex flex-col font-sans">
      {/* Dimmed Background Content Preview (constrained to viewport bounds so it does not overflow) */}
      <div
        className="w-full h-full overflow-hidden pointer-events-none select-none filter blur-[4px] opacity-20 brightness-50 transition-all duration-300"
        aria-hidden="true"
        tabIndex={-1}
      >
        {children}
      </div>

      {/* Main Workspace Dimming Overlay & Centered Lock Modal Card (Fixed to Viewport) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-abyss/80 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-md rounded-card border border-line bg-surface-1 hud-sheen shadow-menu p-6 sm:p-8 text-center space-y-5 relative overflow-hidden my-auto">
          {/* Top Subtle Crimson Edge Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-crimson-aggro to-transparent" />

          {/* Centered Lock Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-abyss border border-crimson-aggro/60 text-crimson-text flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          {/* Status Badge */}
          <div className="inline-block px-3 py-1 rounded-chip bg-crimson-soft border border-crimson-aggro/40 text-crimson-text text-[11px] font-bold tracking-[0.08em] uppercase">
            RESTRICTED ACCESS
          </div>

          {/* Header Title & Concise Message */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-grotesk font-extrabold text-ink uppercase tracking-wider">
              {displayTitle}
            </h2>
            <p className="text-xs sm:text-[13px] text-ink-body leading-relaxed max-w-sm mx-auto font-sans">
              {displayMessage}
            </p>
          </div>

          {/* CTAs: Sign Up Button & Sign In Link */}
          <div className="pt-2 space-y-3">
            <HudButton
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => handleOpenAuth('signup')}
              icon={<UserPlus className="w-4 h-4" />}
            >
              SIGN UP TO UNLOCK
            </HudButton>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="rounded-control text-xs text-cyan-glow hover:text-ink underline underline-offset-4 tracking-wider uppercase font-sans transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
