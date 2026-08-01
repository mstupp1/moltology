import React, { useState, useEffect } from 'react'
import { X, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react'
import { authClient } from '../lib/auth-client'
import { BenthicCTAButton } from './hud/BenthicCTAButton'

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

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/dashboard`
      })
    } catch (err: any) {
      console.error('Google OAuth Error:', err)
      setError(err?.message || 'Google OAuth failed. Ensure Google OAuth is enabled in Neon Console.')
    }
  }

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0f1414] text-gray-100 p-6 shadow-2xl overflow-hidden border border-cyan-900/60 chamfer-corner"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-[#172020]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-grotesk text-white tracking-wider uppercase">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-cyan-400/80 mt-1 uppercase tracking-widest font-mono">
            {mode === 'signup'
              ? 'Sign up to persist your session'
              : 'Sign in to access your saved state'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-cyan-900/60 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            className={`flex-1 py-2.5 text-xs font-bold font-grotesk tracking-wider uppercase text-center border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
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
            className={`flex-1 py-2.5 text-xs font-bold font-grotesk tracking-wider uppercase text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/60 rounded flex items-start gap-2.5 text-red-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Option */}
        <div className="mb-5 space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#172020] hover:bg-[#1e2a2a] border border-cyan-900/50 rounded text-xs font-bold text-gray-200 transition-colors shadow-md tracking-wider uppercase"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Standard Centered OR Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-cyan-800 w-full" />
            <span className="bg-[#0f1414] px-3 text-xs text-gray-400 font-bold uppercase tracking-widest absolute">OR</span>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-[#090d0d] border border-cyan-800 rounded px-3 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#090d0d] border border-cyan-800 rounded px-3 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#090d0d] border border-cyan-800 rounded px-3 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <BenthicCTAButton
              type="submit"
              disabled={loading}
              variant={mode === 'signup' ? 'red' : 'cyan'}
              size="lg"
              fullWidth
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : mode === 'signup' ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </BenthicCTAButton>
          </div>
        </form>
      </div>
    </div>
  )
}
