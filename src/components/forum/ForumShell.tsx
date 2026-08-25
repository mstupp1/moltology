import React, { useState, useMemo, useCallback, createContext, useContext } from 'react'
import { AuthModal } from '@/components/AuthModal'
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
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

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
      userId: user?.id ?? user?.sub ?? null,
    }),
    [openAuth, user]
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
