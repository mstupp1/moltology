import React, { useState, useMemo, useCallback, createContext, useContext } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => navigate({ to: '/forum' })}
      />
      <div className="w-full relative">{children}</div>
    </ForumAuthContext.Provider>
  )
}