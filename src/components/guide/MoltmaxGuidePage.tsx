/**
 * ============================================================================
 * DEDICATED SQUEEZE LANDING PAGE (/guide)
 * The 2026 Moltmaxxing Protocol Field Manual Lead Generation Page
 * ============================================================================
 */
import React, { useState } from 'react'
import {
  Download,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Zap,
  Activity,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { AuthModal } from '@/components/AuthModal'
import { submitLeadFn } from '@/lib/server/api'
import { LEAD_CAPTURE_CHECK_PENDING, LEAD_CAPTURE_TURNSTILE_ACTION } from '@/lib/lead-capture'
import { getAssetUrl } from '@/lib/assets'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'

export const MoltmaxGuidePage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [emailOptIn, setEmailOptIn] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = React.useRef<TurnstileWidgetRef>(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!turnstileToken) {
      setError(LEAD_CAPTURE_CHECK_PENDING)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await submitLeadFn({
        data: {
          email: email.trim(),
          source: 'moltmax_guide_page_hero',
          referrer: typeof window !== 'undefined' ? window.location.pathname : undefined,
          turnstileToken,
          emailOptIn,
        },
      })

      if (res?.success) {
        setIsSubmitted(true)
        const url = res.downloadUrl ? `${res.downloadUrl}${res.downloadUrl.includes('?') ? '&' : '?'}v=20261008-artwork` : getAssetUrl('downloads/the-2026-moltmaxxing-protocol-guide.pdf?v=20261008-artwork')
        if (typeof window !== 'undefined') {
          const a = document.createElement('a')
          a.href = url
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          a.download = 'the-2026-moltmaxxing-protocol-guide.pdf'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      } else {
        setError('Could not submit request. Please try again.')
        setTurnstileToken(null)
        turnstileRef.current?.reset()
      }
    } catch {
      setIsSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020408] text-[#dfe3e3] font-sans selection:bg-[#00c3ff]/30 selection:text-white flex flex-col justify-between">
      {/* Header */}
      <PublicHeader
        onOpenAuth={(mode) => {
          setAuthMode(mode)
          setIsAuthModalOpen(true)
        }}
      />

      <main className="flex-1 pt-20 pb-20 w-full space-y-20">
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <img
            src={getAssetUrl('images/guide/moltmaxxing-hero-v2.webp')}
            alt="Moltmaxxing Field Manual with a cyan crab diagram on its charcoal cover"
            width={1536}
            height={1024}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] opacity-40 lg:opacity-100"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020408] via-[#020408]/95 to-[#020408]/10 lg:via-[#020408]/75" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="max-w-xl space-y-6 guide-panel">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#00c3ff]">Moltology · Free field manual</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-grotesk font-black tracking-tight text-white leading-[1.05]">
              The Moltmaxxing<br />Field Manual.
            </h1>
            <p className="text-base sm:text-lg text-[#a9b6b5] leading-relaxed max-w-md">
              Shed the clutter. Protect an hour. Finish what you start. A printable plan for your next molt.
            </p>
            <p className="text-xs text-[#839493]">4-page PDF · Daily checklist · Free download</p>

            {/* Email Form */}
            {isSubmitted ? (
              <div className="p-6 rounded-xl bg-[#00ffcc]/10 border border-[#00ffcc]/40 space-y-3">
                <div className="flex items-center gap-2 text-[#00ffcc] font-bold font-grotesk text-base uppercase">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Your manual is downloading</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Your copy of the 2026 Moltmaxxing Field Manual is downloading.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href={getAssetUrl('downloads/the-2026-moltmaxxing-protocol-guide.pdf?v=20261008-artwork')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#00c3ff] text-[#020408] font-bold font-grotesk text-xs uppercase hover:bg-[#00e5ff]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download again</span>
                  </a>
                  <button
                    onClick={() => {
                      setAuthMode('signup')
                      setIsAuthModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#00c3ff]/40 text-white font-bold font-grotesk text-xs uppercase hover:bg-white/10"
                  >
                    <span>Create free account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
                <label htmlFor="guide-email" className="block text-sm text-[#dfe3e3]">Your email</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      id="guide-email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3.5 bg-[#020408] border border-white/20 rounded-lg text-white font-sans text-sm placeholder:text-[#839493]/50 focus:outline-none focus:border-[#00c3ff] focus:ring-1 focus:ring-[#00c3ff] transition-all"
                    />
                    <Lock className="absolute right-3.5 top-4 w-4 h-4 text-[#839493]" />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3.5 rounded-lg font-grotesk font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#00c3ff] hover:brightness-110 text-[#020408] transition-all shadow-[0_0_25px_rgba(0,195,255,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? (
                      <span>Preparing download…</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Get the free PDF</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Explicit Opt-In Checkbox Below CTA */}
                <div className="pt-0.5 text-left">
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={emailOptIn}
                      onChange={(e) => setEmailOptIn(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#020408] text-[#00c3ff] focus:ring-[#00c3ff] focus:ring-offset-0 cursor-pointer accent-[#00c3ff]"
                    />
                    <span className="text-xs text-[#839493] group-hover:text-[#dfe3e3] transition-colors font-sans leading-tight">
                      Send me occasional updates, new field manuals, and articles.
                    </span>
                  </label>
                </div>

                {error && <p className="text-xs text-[#ff453a] font-sans">{error}</p>}
                <TurnstileWidget
                  ref={turnstileRef}
                  action={LEAD_CAPTURE_TURNSTILE_ACTION}
                  size="flexible"
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                />
                <p className="text-[11px] text-[#839493] font-sans">
                  Download starts after you submit. Email updates are optional.
                </p>
              </form>
            )}
          </div>

          </div>
        </section>

        {/* Bundle Kit Preview Banner */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black font-grotesk text-white">
              A small manual. A useful next step.
            </h2>
            <p className="text-xs sm:text-sm text-[#839493]">
              A daily routine, a little room to focus, and a checklist you can keep beside you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img
              src={getAssetUrl('images/guide/moltmaxxing-interior-v2.webp')}
              alt="Preview of the Moltmaxxing Field Manual’s daily protocol page"
              width={1224}
              height={1584}
              loading="lazy"
              decoding="async"
              className="rounded-sm border border-white/15 shadow-xl object-cover w-full motion-safe:hover:-translate-y-1 transition-transform duration-500"
            />

            <div className="space-y-4">
              <div className="py-4 border-b border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#00c3ff] font-bold font-grotesk text-sm uppercase">
                  <Clock className="w-4 h-4" />
                  <span>A daily rhythm</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Give the day a beginning, a focused middle, and a quiet close.
                </p>
              </div>

              <div className="py-4 border-b border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#ffd700] font-bold font-grotesk text-sm uppercase">
                  <Zap className="w-4 h-4" />
                  <span>Finish one thing</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Practice your grip by choosing one task and keeping it in reach.
                </p>
              </div>

              <div className="py-4 border-b border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#00ffcc] font-bold font-grotesk text-sm uppercase">
                  <Shield className="w-4 h-4" />
                  <span>Protect your focus</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Build a shell around the hour you want to keep for yourself.
                </p>
              </div>

              <div className="py-4 border-b border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#38bdf8] font-bold font-grotesk text-sm uppercase">
                  <Activity className="w-4 h-4" />
                  <span>A printable checklist</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Put your routine on paper. Mark what you did, then begin again tomorrow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Card */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10 text-center space-y-6">
          <div className="inline-flex p-3 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff]">
            <Download className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black font-grotesk text-white uppercase tracking-wide">
              Your next molt starts small.
            </h2>
            <p className="text-xs sm:text-sm text-[#839493]">
              Read it tonight. Try one step tomorrow morning.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="py-3.5 px-8 rounded font-bold font-grotesk text-xs bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(0,195,255,0.4)] uppercase"
            >
              <span>Get the free manual</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <MoltNationFooter />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  )
}
