import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react'
import { authClient } from '../lib/auth-client'
import { getUserProfileFn } from '../lib/server/api'
import { HudCard, HudInput, HudButton } from '@/components/ui'

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
      getUserProfileFn().catch(() => {})
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
          await getUserProfileFn().catch(() => {})
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
          await getUserProfileFn().catch(() => {})
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

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans overflow-y-auto"
      onClick={onClose}
    >
      <HudCard
        variant="teal"
        className="relative w-full max-w-md my-auto p-6 sm:p-8 shadow-2xl bg-[#0a1012] border border-[#00c3ff]/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-[#839493] hover:text-[#00c3ff] transition-colors p-1 rounded-none hover:bg-[#172020] cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-grotesk text-white tracking-wider uppercase">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#00c3ff]/80 mt-1 uppercase tracking-widest font-sans">
            {mode === 'signup'
              ? 'Sign up to persist your session'
              : 'Sign in to access your saved state'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#3a4a49]/60 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            className={`flex-1 py-2.5 text-xs font-bold font-grotesk tracking-wider uppercase text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'border-[#ff453a] text-[#ff453a]'
                : 'border-transparent text-[#839493] hover:text-[#dfe3e3]'
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
            className={`flex-1 py-2.5 text-xs font-bold font-grotesk tracking-wider uppercase text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-[#00c3ff] text-[#00c3ff]'
                : 'border-transparent text-[#839493] hover:text-[#dfe3e3]'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-[#ff453a]/10 border border-[#ff453a]/60 rounded-none flex items-start gap-2.5 text-[#ff453a] text-xs font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ff453a] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Option */}
        <div className="mb-5 space-y-4">
          <HudButton
            variant="dark"
            fullWidth
            onClick={handleGoogleSignIn}
            icon={
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            }
          >
            Continue with Google
          </HudButton>

          {/* Standard Centered OR Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#3a4a49] w-full" />
            <span className="bg-[#0a1012] px-3 text-xs text-[#839493] font-bold uppercase tracking-widest absolute">OR</span>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <HudInput
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              startIcon={<User className="w-4 h-4 text-[#00c3ff]" />}
            />
          )}

          <HudInput
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            startIcon={<Mail className="w-4 h-4 text-[#00c3ff]" />}
          />

          <HudInput
            label="Password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            startIcon={<Lock className="w-4 h-4 text-[#00c3ff]" />}
          />

          <div className="mt-6 flex justify-center">
            <HudButton
              type="submit"
              disabled={loading}
              variant={mode === 'signup' ? 'crimson' : 'cyan'}
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
            </HudButton>
          </div>
        </form>
      </HudCard>
    </div>
  )

  return createPortal(modalContent, document.body)
}
