import React, { useState, useMemo, useCallback, createContext, useContext } from 'react'
import { AuthModal } from '@/components/AuthModal'
import { useAuthSession } from '@/hooks/useAuthSession'

interface ForumAuthContextValue {
  openAuth: (mode?: 'login' | 'signup') => void
  isAuthenticated: boolean
  isPending: boolean
  userId: string | null
}

const ForumAuthContext = createContext<ForumAuthContextValue>({
  openAuth: () => {},
  isAuthenticated: false,
  isPending: true,
  userId: null,
})

export const useForumAuth = () => useContext(ForumAuthContext)

interface ForumShellProps {
  children: React.ReactNode
}

export function ForumShell({ children }: ForumShellProps) {
  const session = useAuthSession()

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  const openAuth = useCallback((mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])

  const value = useMemo<ForumAuthContextValue>(
    () => ({
      openAuth,
      isAuthenticated: session.isAuthenticated,
      isPending: session.isPending,
      userId: session.userId,
    }),
    [openAuth, session.isAuthenticated, session.isPending, session.userId]
  )

  return (
    <ForumAuthContext.Provider value={value}>
      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
      <div className="w-full relative">{children}</div>
    </ForumAuthContext.Provider>
  )
}
