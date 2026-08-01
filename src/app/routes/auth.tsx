import React, { useEffect } from 'react'
import { AuthView } from '@neondatabase/neon-js/auth/react'
import { authClient } from '../../lib/auth-client'

interface AuthRouteProps {
  onNavigate: (path: string) => void
}

export const AuthRoute: React.FC<AuthRouteProps> = ({ onNavigate }) => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  useEffect(() => {
    if (user) {
      onNavigate('/dashboard')
    }
  }, [user, onNavigate])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 100% Pristine Default Stock AuthView from Neon Auth SDK */}
        <AuthView />
      </div>
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="mt-6 text-xs text-gray-500 hover:text-gray-900 underline font-sans"
      >
        ← Return to Landing Page
      </button>
    </div>
  )
}
