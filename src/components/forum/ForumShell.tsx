import React, { useState, useMemo, useCallback, createContext, useContext } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { authClient } from '@/lib/auth-client'

interface ForumAuthContextValue {
  openAuth: (mode?: 'login' | 'signup') => void
  isAuthenticated: boolean
  userId: string | null
}

const ForumAuthContext = createContext<ForumAuthContextValue>({
  openAuth: () => {},
  isAuthenticated: false,
  userId: null,
})

export const useForumAuth = () => useContext(ForumAuthContext)

interface ForumShellProps {
  children: React.ReactNode
}

export function ForumShell({ children }: ForumShellProps) {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  const openAuth = useCallback((mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])

  const value = useMemo<ForumAuthContextValue>(
    () => ({
      openAuth,
      isAuthenticated: !!user,
      userId: user?.id ?? null,
    }),
    [openAuth, user]
  )

  return (
    <ForumAuthContext.Provider value={value}>
      <div className="min-h-screen bg-[#05080a] text-gray-200 font-sans relative flex flex-col justify-between">
        {/* Background Overlays */}
        <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.08)_0%,transparent_70%)] pointer-events-none z-0" />
        <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-20" />
        <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-25" />

        <AuthModal
          isOpen={authOpen}
          initialMode={authMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => navigate({ to: '/forum' })}
        />

        <PublicHeader activePage="forum" onOpenAuth={openAuth} />

        <main className="flex-1 w-full relative z-10">{children}</main>

        <MoltNationFooter />
      </div>
    </ForumAuthContext.Provider>
  )
}