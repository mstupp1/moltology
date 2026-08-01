import React, { useState, useEffect } from 'react'
import { X, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react'
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
  initialMode = 'signup',
}) => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setError(null)
  }, [initialMode, isOpen])

  useEffect(() => {
    if (user && isOpen) {
      if (onSuccess) onSuccess()
      onClose()
    }
  }, [user, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email.split('@')[0],
        })
        if (res?.error) {
          setError(res.error.message || 'Sign up failed. Please check your credentials.')
        } else {
          if (onSuccess) onSuccess()
          onClose()
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        })
        if (res?.error) {
          setError(res.error.message || 'Invalid email or password.')
        } else {
          if (onSuccess) onSuccess()
          onClose()
        }
      }
    } catch (err: any) {
      console.error('Neon Auth Error:', err)
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white text-gray-900 rounded-xl p-6 shadow-2xl overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'signup'
              ? 'Sign up to persist your session and access the network'
              : 'Sign in to access your saved state'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
