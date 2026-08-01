import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { AuthView } from '@neondatabase/neon-js/auth/react'
import { authClient } from '../lib/auth-client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialMode?: 'login' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session && isOpen) {
      if (onSuccess) onSuccess()
      onClose()
    }
  }, [session, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 text-gray-300 hover:text-white bg-gray-900 border border-gray-700 p-1.5 rounded-full shadow-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pristine Stock AuthView directly without redundant wrapper cards */}
        <div className="w-full">
          <AuthView />
        </div>
      </div>
    </div>
  )
}
