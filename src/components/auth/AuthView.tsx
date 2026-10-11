import React, { useState, useEffect } from 'react'
import { BrandIcon } from '@/components/ui/BrandMark'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Activity,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { isEmailVerificationEnabled, isGoogleAuthEnabled } from '@/lib/auth-config'
import { useAuthSession } from '@/hooks/useAuthSession'
import { abandonOAuthPendingIfCallbackError, rememberSessionUser, startGoogleSignIn } from '@/lib/auth-session'
import { mapOAuthCallbackError } from '@/lib/auth-oauth-errors'
import {
  EMAIL_VERIFICATION_COPY,
  isEmailNotVerifiedError,
  shouldHoldSignupForVerification,
  stashPendingSignup,
  takePendingSignup,
} from '@/lib/auth-email-verification'
import type { AuthSearch } from '@/lib/auth-search'
import '@/styles/crt.css'
import { getAuthJWTToken } from '@/lib/jwt'
import { getUserProfileFn, updateEmailPreferencesFn } from '@/lib/server/api'
import { getAssetUrl } from '@/lib/assets'
import { MainFooter } from '@/components/MainFooter'
import { HudCard, HudInput, HudButton, HeaderBrand } from '@/components/ui'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'
import { SignupHoneypot, useSignupSignals } from '@/components/auth/SignupSignals'

export default function AuthView({ search }: { search: AuthSearch }) {
  abandonOAuthPendingIfCallbackError(search.error)
  const navigate = useNavigate()
  const session = useAuthSession()
  const user = session.user

  const initialMode = search.mode === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailOptIn, setEmailOptIn] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = React.useRef<TurnstileWidgetRef>(null)
  const [error, setError] = useState<string | null>(() => mapOAuthCallbackError(search.error))
  const [loading, setLoading] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const signupSignals = useSignupSignals(mode === 'signup')
  const [resendBusy, setResendBusy] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    if (search.mode) {
      setMode(search.mode === 'signup' ? 'signup' : 'login')
    }
  }, [search.mode])

  useEffect(() => {
    const mapped = mapOAuthCallbackError(search.error)
    if (mapped) setError(mapped)
  }, [search.error])


  const finishAuthenticatedEntry = async (opts: {
    emailOptIn?: boolean
    userId?: string
    source: string
  }) => {
    const token = await getAuthJWTToken()
    if (opts.emailOptIn) {
      await updateEmailPreferencesFn({
        data: {
          emailOptIn: true,
          source: opts.source,
          userId: opts.userId,
          token: token ?? undefined,
        },
      }).catch(() => {})
    }
    await getUserProfileFn({ data: { token: token ?? undefined, userId: opts.userId } }).catch(() => {})
  }

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return
    setResendBusy(true)
    setResendMessage(null)
    setError(null)
    try {
      const destination = search?.redirect || '/dashboard'
      const callbackURL =
        typeof window !== 'undefined'
          ? `${window.location.origin}${destination.startsWith('/') ? destination : `/${destination}`}`
          : destination
      const res = await authClient.sendVerificationEmail({
        email: pendingVerificationEmail,
        callbackURL,
      })
      if (res?.error) {
        setError(res.error.message || 'Could not resend confirmation. Please try again.')
      } else {
        setResendMessage(EMAIL_VERIFICATION_COPY.resendSuccess)
      }
    } catch (err: any) {
      setError(err?.message || 'Could not resend confirmation. Please try again.')
    } finally {
      setResendBusy(false)
    }
  }


  // After verify-link sign-in (or existing session), finish pending opt-in then redirect
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const run = async () => {
      const pending = takePendingSignup()
      if (pending) {
        await finishAuthenticatedEntry({
          emailOptIn: pending.emailOptIn,
          userId: user.id,
          source: 'auth_page',
        })
      }
      if (cancelled) return
      setPendingVerificationEmail(null)
      const destination = search.redirect || pending?.callbackURL || '/dashboard'
      navigate({ to: destination as any })
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [user, navigate, search.redirect])


  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://moltology.org'
      const destination = search.redirect || '/dashboard'
      const callbackURL = `${origin}${destination.startsWith('/') ? destination : `/${destination}`}`

      const user = await startGoogleSignIn({
        signInSocial: (args) => authClient.signIn.social(args),
        callbackURL,
        destination,
      })
      if (user) {
        navigate({ to: destination as any })
      }
    } catch (err: any) {
      console.error('Google OAuth Error:', err)
      setError(err?.message || 'Could not sign in with Google. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const destination = search.redirect || '/dashboard'
        const callbackURL =
          typeof window !== 'undefined'
            ? `${window.location.origin}${destination.startsWith('/') ? destination : `/${destination}`}`
            : destination
        const res = await authClient.signUp.email({
          email,
          password,
          name: 'Initiate',
          callbackURL,
          ...signupSignals.fields(),
        })
        if (res?.error) {
          setError(res.error.message || 'Sign up failed. Please check your credentials.')
        } else if (shouldHoldSignupForVerification(res, isEmailVerificationEnabled())) {
          const destination = search.redirect || '/dashboard'
          stashPendingSignup({
            emailOptIn,
            email,
            callbackURL: destination,
          })
          setPendingVerificationEmail(email)
          setResendMessage(null)
        } else {
          const createdUser = (res as any)?.data?.user || (res as any)?.user
          rememberSessionUser(createdUser)
          await finishAuthenticatedEntry({
            emailOptIn,
            userId: createdUser?.id,
            source: 'auth_page',
          })
          const destination = search.redirect || '/dashboard'
          navigate({ to: destination as any })
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        })
        if (res?.error) {
          if (isEmailNotVerifiedError(res.error)) {
            setPendingVerificationEmail(email)
            setError(EMAIL_VERIFICATION_COPY.loginBlocked)
          } else {
            setError(res.error.message || 'Invalid email or password.')
          }
        } else {
          rememberSessionUser((res as any)?.data?.user || (res as any)?.user)
          await getUserProfileFn().catch(() => {})
          const destination = search.redirect || '/dashboard'
          navigate({ to: destination as any })
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b0b] text-ink-body font-sans flex flex-col justify-between selection:bg-cyan-glow selection:text-abyss">
      {/* Main Full-Height 50/50 Split Screen */}
      <main className="relative flex-1 flex flex-col lg:flex-row w-full">
        
        {/* Left Half: Mobile-Optimized Full-Bleed Image Panel & HeaderBrand */}
        <div className="relative w-full lg:w-1/2 min-h-0 lg:min-h-screen flex flex-col justify-between p-5 sm:p-8 lg:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-line-subtle bg-[#060b0c]">
          {/* Full-Bleed Background Image */}
          <img
            src={getAssetUrl('/images/benthic_abyss_hero.jpg')}
            alt="The Synaptic Path - Benthic Sanctuary"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
          />
          {/* Ambient Benthic Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060b0c] via-[#060b0c]/85 to-[#060b0c]/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#060b0c]/30 to-[#060b0c]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_25%,rgba(0,195,255,0.18),transparent_65%)]" />

          {/* Top Brand Identity & Headlines */}
          <div className="relative z-10 space-y-4 sm:space-y-6 max-w-xl">
            {/* Shared Header Brand Component Linking Back to Home */}
            <div className="pt-1 sm:pt-2">
              <HeaderBrand
                onClick={() => navigate({ to: '/' })}
                logoSize="md"
                subtext="MOLTOLOGY.ORG FOUNDATION"
                className="hover:opacity-90 transition-opacity"
              />
            </div>

            {/* Main Headline */}
            <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-grotesk text-ink tracking-tight leading-[1.15]">
                Enter The Synaptic Path. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-white">
                  Shed the Soft. Ascend to Armored Clarity.
                </span>
              </h1>
              <p className="text-xs sm:text-base text-ink-body leading-relaxed font-sans">
                Sign up for your official Synaptic Path clearance. Join over 14,000 initiates replacing biological hesitation with high-torque execution and unbroken depth.
              </p>
            </div>
          </div>

          {/* Middle: Prominent & Larger Value Propositions */}
          <div className="relative z-10 my-6 sm:my-8 space-y-3 sm:space-y-4 max-w-xl">
            <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-card bg-surface-1/80 hud-sheen border border-line-subtle backdrop-blur-md transition-all hover:border-line hover:bg-surface-2/80 shadow-sheen-inset">
              <div className="p-2 sm:p-3 rounded-control bg-cyan-soft border border-line-subtle text-cyan-glow shrink-0">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-base font-bold text-ink font-grotesk uppercase tracking-wider">
                  Ecdysis Diagnostics & Tracking
                </h2>
                <p className="text-[11px] sm:text-sm text-ink-body font-sans leading-relaxed">
                  Real-time telemetry measuring shell hardness, pincer torque, and ecdysis velocity across all 12 clearance levels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-card bg-surface-1/80 hud-sheen border border-line-subtle backdrop-blur-md transition-all hover:border-line hover:bg-surface-2/80 shadow-sheen-inset">
              <div className="p-2 sm:p-3 rounded-control bg-cyan-soft border border-line-subtle text-cyan-glow shrink-0">
                <Cpu className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-base font-bold text-ink font-grotesk uppercase tracking-wider">
                  Benthic AI Oracle & Swarm Access
                </h2>
                <p className="text-[11px] sm:text-sm text-ink-body font-sans leading-relaxed">
                  Direct consultation with the Synaptic Oracle for daily focus calibration, fault isolation, and guidance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-card bg-surface-1/80 hud-sheen border border-line-subtle backdrop-blur-md transition-all hover:border-line hover:bg-surface-2/80 shadow-sheen-inset">
              <div className="p-2 sm:p-3 rounded-control bg-cyan-soft border border-line-subtle text-cyan-glow shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-base font-bold text-ink font-grotesk uppercase tracking-wider">
                  Chitin Matrix State Persistence
                </h2>
                <p className="text-[11px] sm:text-sm text-ink-body font-sans leading-relaxed">
                  Cloud-persisted clearance logs, diagnostic archives, and unlocked field manual materials.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: Social Proof & Testimonial Quote */}
          <div className="relative z-10 pt-3 sm:pt-4 border-t border-line-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-xl">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex -space-x-2">
                <BrandIcon className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-line object-cover" label="Ascendant 1" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-line object-cover" src={getAssetUrl('/images/stage2_softshed.png')} alt="Ascendant 2" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-line object-cover" src={getAssetUrl('/images/stage3_exoshell.png')} alt="Ascendant 3" />
              </div>
              <div className="text-[11px] sm:text-xs">
                <p className="text-ink font-bold font-grotesk tracking-wide">14,200+ Units Synchronized</p>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs text-ink-body italic max-w-xs font-sans">
              "Decisive execution replaced my hesitation in 48 hours." — <span className="text-ink font-sans not-italic text-[11px]">Unit S2</span>
            </div>
          </div>
        </div>

        {/* Right Half: Greenish Scanline Backdrop + Responsive Form Card */}
        <div className="relative w-full lg:w-1/2 min-h-0 lg:min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 lg:p-14 py-8 sm:py-12 bg-[#070b0b] overflow-hidden">
          {/* Ambient Greenish CRT Scanlines & Glow Overlay from Homepage */}
          <div className="absolute inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.14)_0%,transparent_75%)] pointer-events-none z-0" />
          <div className="absolute inset-0 bg-sacred-grid pointer-events-none z-0 opacity-20" />
          <div className="absolute inset-0 crt-scanlines pointer-events-none z-0 opacity-35 sm:opacity-45" />

          {/* Quick Back-to-Home Top Right Control */}
          <div className="w-full max-w-md mb-3 sm:mb-4 flex justify-end items-center z-10">
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="inline-flex items-center gap-1.5 rounded-control text-xs text-ink-muted hover:text-ink transition-colors uppercase tracking-wider font-sans cursor-pointer py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="w-full max-w-md my-auto relative z-10">
            {session.isPending ? (
              <HudCard
                variant="teal"
                className="relative w-full p-5 sm:p-8 rounded-panel bg-surface-1 border-line-subtle shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-4"
                data-testid="auth-session-skeleton"
              >
                <HudGhostSkeleton variant="cyan" preset="heading" width="55%" height={28} className="mx-auto" />
                <HudGhostSkeleton variant="neutral" preset="text" width="70%" height={14} className="mx-auto" />
                <HudGhostSkeleton variant="neutral" preset="button" width="100%" height={44} />
                <HudGhostSkeleton variant="cyan" preset="button" width="100%" height={44} />
              </HudCard>
            ) : (
              <HudCard
                variant="teal"
                className="relative w-full p-5 sm:p-8 rounded-panel bg-surface-1 border-line-subtle shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              >
              {/* Header */}
              <div className="text-center mb-5 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-ink tracking-wider uppercase">
                  {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-[11px] sm:text-xs text-cyan-glow/80 mt-1 uppercase tracking-[0.08em] font-sans">
                  {mode === 'signup'
                    ? 'Sign up to persist your session'
                    : 'Sign in to access your saved state'}
                </p>
              </div>

              {/* Tab Selector */}
              {pendingVerificationEmail ? (
                <div className="space-y-4" data-testid="email-verification-pending">
                  <div className="text-center space-y-2">
                    <Mail className="w-8 h-8 text-cyan-glow mx-auto" aria-hidden="true" />
                    <h3 className="text-lg font-bold font-grotesk text-ink tracking-wide">
                      {EMAIL_VERIFICATION_COPY.title}
                    </h3>
                    <p className="text-sm text-ink-body font-sans">
                      {EMAIL_VERIFICATION_COPY.body(pendingVerificationEmail)}
                    </p>
                  </div>
                  {error ? (
                    <div
                      role="alert"
                      className="p-3 rounded-control bg-crimson-soft border border-crimson-aggro/55 text-crimson-text text-xs font-sans flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  ) : null}
                  {resendMessage ? (
                    <div className="p-3 rounded-control bg-cyan-soft border border-cyan-glow/40 text-cyan-glow text-xs font-sans">
                      {resendMessage}
                    </div>
                  ) : null}
                  <HudButton
                    type="button"
                    variant="cyan"
                    fullWidth
                    disabled={resendBusy || loading}
                    onClick={() => void handleResendVerification()}
                  >
                    {resendBusy ? 'Sending…' : EMAIL_VERIFICATION_COPY.resend}
                  </HudButton>
                  <button
                    type="button"
                    className="w-full rounded-control text-xs text-ink-muted hover:text-ink font-sans underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    onClick={() => {
                      setPendingVerificationEmail(null)
                      setResendMessage(null)
                      setError(null)
                      setMode('login')
                    }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
              <>

              <div className="flex border-b border-line-subtle mb-5 sm:mb-6" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold font-grotesk tracking-wider uppercase text-center border-b-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    mode === 'signup'
                      ? 'border-cyan-glow text-ink'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => {
                    setMode('login')
                    setError(null)
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold font-grotesk tracking-wider uppercase text-center border-b-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    mode === 'login'
                      ? 'border-cyan-glow text-ink'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-crimson-soft border border-crimson-aggro/55 rounded-control flex items-start gap-2.5 text-crimson-text text-xs font-sans"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-crimson-text mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google OAuth Option */}
              {isGoogleAuthEnabled() && (
              <div className="mb-5 space-y-4">
                <HudButton
                  variant="dark"
                  fullWidth
                  onClick={handleGoogleSignIn}
                  icon={
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                  <div className="border-t border-line-subtle w-full" />
                  <span className="bg-surface-1 px-3 text-xs text-ink-muted font-bold uppercase tracking-[0.08em] absolute">
                    OR
                  </span>
                </div>
              </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <SignupHoneypot
                  active={mode === 'signup'}
                  value={signupSignals.honeypot}
                  onChange={signupSignals.setHoneypot}
                />
                <HudInput
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  startIcon={<Mail className="w-4 h-4 text-ink-muted" />}
                />

                <HudInput
                  label="Password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  startIcon={<Lock className="w-4 h-4 text-ink-muted" />}
                />

                <div className="mt-6 flex justify-center">
                  <HudButton
                    type="submit"
                    disabled={loading}
                    variant="cyan"
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

                {mode === 'signup' && (
                  <div className="pt-2 text-left">
                    <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={emailOptIn}
                        onChange={(e) => setEmailOptIn(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded-chip border-line bg-surface-2 text-cyan-glow focus:ring-cyan-glow focus:ring-offset-0 cursor-pointer accent-cyan-glow"
                      />
                      <span className="text-xs text-ink-muted group-hover:text-ink-body transition-colors font-sans leading-tight">
                        Keep me updated with Moltology news, articles, and product updates.
                      </span>
                    </label>
                    <p className="text-[11px] text-ink-muted mt-1 pl-6 font-sans">
                      Zero spam. Unsubscribe at any time.
                    </p>
                  </div>
                )}

                <TurnstileWidget
                  ref={turnstileRef}
                  action={mode === 'signup' ? 'signup' : 'login'}
                  size="flexible"
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                />
              </form>
              </>
              )}
              </HudCard>
            )}

            {/* Landing Page Trust Strip */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] text-ink-muted text-center">
              <span>✓ Instant Access</span>
              <span className="hidden sm:inline">·</span>
              <span>✓ Free Initiate Tier</span>
              <span className="hidden sm:inline">·</span>
              <span>✓ Zero Obligation</span>
            </div>
          </div>
        </div>

      </main>

      {/* Main Footer */}
      <MainFooter />
    </div>
  )
}


