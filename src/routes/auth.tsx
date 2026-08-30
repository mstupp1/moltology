import React, { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { z } from 'zod'
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  Activity,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getUserProfileFn, updateEmailPreferencesFn } from '@/lib/server/api'
import { getAssetUrl } from '@/lib/assets'
import { MainFooter } from '@/components/MainFooter'
import { HudCard, HudInput, HudButton, HeaderBrand } from '@/components/ui'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'

const authSearchSchema = z.object({
  mode: z.enum(['login', 'signup']).optional().catch('login'),
  redirect: z.string().optional(),
})

function AuthRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const session = useAuthSession()
  const user = session.user

  const initialMode = search.mode === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailOptIn, setEmailOptIn] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = React.useRef<TurnstileWidgetRef>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sync mode if search query changes
  useEffect(() => {
    if (search.mode) {
      setMode(search.mode === 'signup' ? 'signup' : 'login')
    }
  }, [search.mode])

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const destination = search.redirect || '/dashboard'
      navigate({ to: destination as any })
    }
  }, [user, navigate, search.redirect])

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://moltology.org'
      const destination = search.redirect || '/dashboard'
      const callbackURL = `${origin}${destination.startsWith('/') ? destination : `/${destination}`}`

      await authClient.signIn.social({
        provider: 'google',
        callbackURL,
      })
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
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email.split('@')[0],
        })
        if (res?.error) {
          setError(res.error.message || 'Sign up failed. Please check your credentials.')
        } else {
          if (emailOptIn) {
            const createdUser = (res as any)?.data?.user || (res as any)?.user
            const token = await getAuthJWTToken()
            await updateEmailPreferencesFn({
              data: {
                emailOptIn: true,
                source: 'auth_page',
                userId: createdUser?.id,
                token: token ?? undefined,
              },
            }).catch(() => {})
          }
          const token = await getAuthJWTToken()
          await getUserProfileFn({ data: { token: token ?? undefined } }).catch(() => {})
          const destination = search.redirect || '/dashboard'
          navigate({ to: destination as any })
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
          const destination = search.redirect || '/dashboard'
          navigate({ to: destination as any })
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
    <div className="min-h-screen bg-[#070b0b] text-[#dfe3e3] font-sans flex flex-col justify-between selection:bg-[#00ffff] selection:text-[#000a0a]">
      {/* Main Full-Height 50/50 Split Screen */}
      <main className="relative flex-1 flex flex-col lg:flex-row w-full">
        
        {/* Left Half: Mobile-Optimized Full-Bleed Image Panel & HeaderBrand */}
        <div className="relative w-full lg:w-1/2 min-h-0 lg:min-h-screen flex flex-col justify-between p-5 sm:p-8 lg:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-cyan-950/60 bg-[#060b0c]">
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
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-grotesk text-white tracking-tight leading-[1.15]">
                Enter The Synaptic Path. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-white">
                  Shed the Soft. Ascend to Armored Clarity.
                </span>
              </h1>
              <p className="text-xs sm:text-base text-gray-200 leading-relaxed font-sans">
                Sign up for your official Synaptic Path clearance. Join over 14,000 initiates replacing biological hesitation with high-torque execution and unbroken depth.
              </p>
            </div>
          </div>

          {/* Middle: Prominent & Larger Value Propositions */}
          <div className="relative z-10 my-6 sm:my-8 space-y-3 sm:space-y-4 max-w-xl">
            <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl bg-black/50 border border-cyan-900/60 backdrop-blur-md transition-all hover:border-cyan-700/60 hover:bg-black/60 shadow-lg">
              <div className="p-2 sm:p-3 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shrink-0 shadow-[0_0_15px_rgba(0,195,255,0.3)]">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-base font-bold text-white font-grotesk uppercase tracking-wider">
                  Ecdysis Diagnostics & Tracking
                </h2>
                <p className="text-[11px] sm:text-sm text-gray-300 font-sans leading-relaxed">
                  Real-time telemetry measuring shell hardness, pincer torque, and ecdysis velocity across all 12 clearance levels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl bg-black/50 border border-cyan-900/60 backdrop-blur-md transition-all hover:border-cyan-700/60 hover:bg-black/60 shadow-lg">
              <div className="p-2 sm:p-3 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shrink-0 shadow-[0_0_15px_rgba(0,195,255,0.3)]">
                <Cpu className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-base font-bold text-white font-grotesk uppercase tracking-wider">
                  Benthic AI Oracle & Swarm Access
                </h2>
                <p className="text-[11px] sm:text-sm text-gray-300 font-sans leading-relaxed">
                  Direct consultation with the Synaptic Oracle for daily focus calibration, fault isolation, and guidance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl bg-black/50 border border-cyan-900/60 backdrop-blur-md transition-all hover:border-cyan-700/60 hover:bg-black/60 shadow-lg">
              <div className="p-2 sm:p-3 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shrink-0 shadow-[0_0_15px_rgba(0,195,255,0.3)]">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-base font-bold text-white font-grotesk uppercase tracking-wider">
                  Chitin Matrix State Persistence
                </h2>
                <p className="text-[11px] sm:text-sm text-gray-300 font-sans leading-relaxed">
                  Cloud-persisted clearance logs, diagnostic archives, and unlocked field manual materials.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: Social Proof & Testimonial Quote */}
          <div className="relative z-10 pt-3 sm:pt-4 border-t border-cyan-950/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-xl">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex -space-x-2">
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-cyan-400/50 object-cover" src={getAssetUrl('/images/order_emblem.png')} alt="Ascendant 1" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-cyan-400/50 object-cover" src={getAssetUrl('/images/stage2_softshed.png')} alt="Ascendant 2" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-cyan-400/50 object-cover" src={getAssetUrl('/images/stage3_exoshell.png')} alt="Ascendant 3" />
              </div>
              <div className="text-[11px] sm:text-xs">
                <p className="text-white font-bold font-grotesk tracking-wide">14,200+ Units Synchronized</p>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs text-gray-300 italic max-w-xs font-sans">
              "Decisive execution replaced my hesitation in 48 hours." — <span className="text-gray-200 font-sans not-italic text-[10px] sm:text-[11px]">Unit S2</span>
            </div>
          </div>
        </div>

        {/* Right Half: Greenish Scanline Backdrop + Responsive Form Card */}
        <div className="relative w-full lg:w-1/2 min-h-0 lg:min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 lg:p-14 py-8 sm:py-12 bg-[#070b0b] overflow-hidden">
          {/* Ambient Greenish CRT Scanlines & Glow Overlay from Homepage */}
          <div className="absolute inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.14)_0%,transparent_75%)] pointer-events-none z-0" />
          <div className="absolute inset-0 bg-sacred-grid pointer-events-none z-0 opacity-20" />
          <div className="absolute inset-0 crt-scanlines pointer-events-none z-0 opacity-20 sm:opacity-30" />

          {/* Quick Back-to-Home Top Right Control */}
          <div className="w-full max-w-md mb-3 sm:mb-4 flex justify-end items-center z-10">
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-300 transition-colors uppercase tracking-wider font-sans cursor-pointer py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="w-full max-w-md my-auto relative z-10">
            {session.isPending ? (
              <HudCard
                variant="teal"
                className="relative w-full p-5 sm:p-8 shadow-2xl bg-[#0a1012] border border-[#00c3ff]/50 space-y-4"
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
                className="relative w-full p-5 sm:p-8 shadow-2xl bg-[#0a1012] border border-[#00c3ff]/50"
              >
              {/* Header */}
              <div className="text-center mb-5 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white tracking-wider uppercase">
                  {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-[11px] sm:text-xs text-[#00c3ff]/80 mt-1 uppercase tracking-widest font-sans">
                  {mode === 'signup'
                    ? 'Sign up to persist your session'
                    : 'Sign in to access your saved state'}
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-[#3a4a49]/60 mb-5 sm:mb-6" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
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
                  role="tab"
                  aria-selected={mode === 'login'}
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
                <div
                  role="alert"
                  className="mb-4 p-3 bg-[#ff453a]/10 border border-[#ff453a]/60 rounded-none flex items-start gap-2.5 text-[#ff453a] text-xs font-sans"
                >
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
                  <div className="border-t border-[#3a4a49] w-full" />
                  <span className="bg-[#0a1012] px-3 text-xs text-[#839493] font-bold uppercase tracking-widest absolute">
                    OR
                  </span>
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

                {mode === 'signup' && (
                  <div className="pt-2 text-left">
                    <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={emailOptIn}
                        onChange={(e) => setEmailOptIn(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-[#3a4a49] bg-[#070b0b] text-[#00c3ff] focus:ring-[#00c3ff] focus:ring-offset-0 cursor-pointer accent-[#00c3ff]"
                      />
                      <span className="text-xs text-[#839493] group-hover:text-[#dfe3e3] transition-colors font-sans leading-tight">
                        Keep me updated with Moltology news, articles, and product updates.
                      </span>
                    </label>
                    <p className="text-[10px] text-[#839493]/70 mt-1 pl-6 font-sans">
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
              </HudCard>
            )}

            {/* Landing Page Trust Strip */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-gray-400 text-center">
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

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => authSearchSchema.parse(search),
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Authentication Gateway | The Synaptic Path',
        description:
          'Access your Moltology account, persist your session state, and synchronize with the Benthic Core.',
        keywords: 'Moltology sign in, login, sign up, authentication, synaptic path',
        ogImage:
          'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/cyber_lobster_hero.jpg',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
  }),
  component: AuthRoute,
})
