/**
 * ============================================================================
 * DEDICATED SQUEEZE LANDING PAGE (/guide)
 * The 2026 Moltmaxxing Protocol Field Manual Lead Generation Page
 * ============================================================================
 */
import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Download,
  Shield,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Zap,
  Activity,
  Flame,
  Award,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { AuthModal } from '@/components/AuthModal'
import { submitLeadFn } from '@/lib/server/api'
import { getAssetUrl } from '@/lib/assets'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'

export const MoltmaxGuidePage: React.FC = () => {
  const navigate = useNavigate()
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

    setLoading(true)
    setError(null)

    try {
      const res = await submitLeadFn({
        data: {
          email: email.trim(),
          source: 'moltmax_guide_page_hero',
          referrer: typeof window !== 'undefined' ? window.location.pathname : undefined,
          turnstileToken: turnstileToken || undefined,
          emailOptIn,
        },
      })

      if (res?.success) {
        setIsSubmitted(true)
        const url = res.downloadUrl || '/downloads/the-2026-moltmaxxing-protocol-guide.pdf'
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

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-20">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-sans tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
              <span>DECLASSIFIED BENTHIC FIELD DOSSIER · EDITION 4.0</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-grotesk font-black tracking-tight text-white uppercase leading-tight">
              THE 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8]">MOLTMAXXING</span> PROTOCOL
            </h1>

            <p className="text-base sm:text-lg text-[#839493] leading-relaxed">
              The definitive 38-page tactical guide to algorithmic ecdysis, carapace hardening, 600 Nm pincer dynamometry, and transcending soft-tissue biological limitations.
            </p>

            {/* Price Anchoring Badge */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-[#040c1c] border border-white/10 w-fit">
              <span className="text-xs font-sans text-[#839493]">STANDARD CLEARANCE VALUE:</span>
              <span className="line-through text-[#ff453a] font-bold font-sans text-sm">$149.00 USD</span>
              <span className="px-2.5 py-0.5 rounded bg-[#00ffcc]/20 border border-[#00ffcc]/40 text-[#00ffcc] font-black text-xs font-sans uppercase animate-pulse">
                $0.00 (100% FREE TODAY)
              </span>
            </div>

            {/* Email Form */}
            {isSubmitted ? (
              <div className="p-6 rounded-xl bg-[#00ffcc]/10 border border-[#00ffcc]/40 space-y-3">
                <div className="flex items-center gap-2 text-[#00ffcc] font-bold font-grotesk text-base uppercase">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>TRANSMISSION CONFIRMED &bull; DOWNLOADING NOW</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Your copy of the 2026 Moltmaxxing Field Manual is downloading.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="/downloads/the-2026-moltmaxxing-protocol-guide.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#00c3ff] text-[#020408] font-bold font-grotesk text-xs uppercase hover:bg-[#00e5ff]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Re-Download Manual</span>
                  </a>
                  <button
                    onClick={() => {
                      setAuthMode('signup')
                      setIsAuthModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#00c3ff]/40 text-white font-bold font-grotesk text-xs uppercase hover:bg-white/10"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email for instant access..."
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
                      <span>DECRYPTING...</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>CLAIM FREE MANUAL</span>
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
                  action="lead_capture"
                  size="flexible"
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                />
                <p className="text-[11px] text-[#839493] font-sans">
                  🔒 Zero spam. Instant high-resolution PDF download.
                </p>
              </form>
            )}
          </div>

          {/* Right Column: 3D Product Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group max-w-sm">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] opacity-25 blur-2xl group-hover:opacity-40 transition duration-500" />
              <img
                src={getAssetUrl('/images/moltmax_guide_3d_mockup.jpg')}
                alt="The 2026 Moltmaxxing Protocol Tactical Field Manual 3D Mockup"
                className="relative rounded-2xl shadow-2xl border border-white/20 object-cover w-full"
              />
              <div className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-lg bg-[#020408]/90 border border-[#00ffcc]/40 text-[#00ffcc] text-[10px] font-bold font-sans uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#ffd700]" />
                <span>OFFICIAL FIELD MANUAL</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bundle Kit Preview Banner */}
        <section className="rounded-2xl border border-white/10 bg-[#03070d] p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black font-grotesk text-white uppercase">
              WHAT YOU GET INSIDE THE DIGITAL DOSSIER
            </h2>
            <p className="text-xs sm:text-sm text-[#839493]">
              Everything you need to initiate scheduled algorithmic ecdysis and harden your biological chassis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <img
              src={getAssetUrl('/images/moltmax_guide_interior_spread.jpg')}
              alt="Moltmaxxing Guide Interior Blueprint Spread"
              className="rounded-xl border border-white/15 shadow-xl object-cover w-full"
            />

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#020408] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#00c3ff] font-bold font-grotesk text-sm uppercase">
                  <Clock className="w-4 h-4" />
                  <span>1. The 24-Hour Ecdysis Protocol Timeline</span>
                </div>
                <p className="text-xs text-[#839493]">
                  05:00 Saline shock immersion, 06:30 pincer dynamometry, and nocturnal calcification chamber specs.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#020408] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#ffd700] font-bold font-grotesk text-sm uppercase">
                  <Zap className="w-4 h-4" />
                  <span>2. Hydraulic Pincer Torque Calibration</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Isometric grip drills (400–600 Nm) designed to eliminate executive latency and hesitation.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#020408] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#00ffcc] font-bold font-grotesk text-sm uppercase">
                  <Shield className="w-4 h-4" />
                  <span>3. Anti-Meltmaxxing Fortification</span>
                </div>
                <p className="text-xs text-[#839493]">
                  The scientific framework explaining why soft tissues collapse under gravity and how chitin prevents melt.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#020408] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#38bdf8] font-bold font-grotesk text-sm uppercase">
                  <Activity className="w-4 h-4" />
                  <span>4. Printable Daily Habit &amp; Telemetry Sheets</span>
                </div>
                <p className="text-xs text-[#839493]">
                  Offline tracking templates for recording grip strength, ecdysis cycles, and Shell Hardness Scores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Card */}
        <section className="rounded-2xl border-2 border-[#00c3ff]/40 bg-gradient-to-br from-[#03060c] via-[#02050a] to-[#030a14] p-8 sm:p-12 text-center space-y-6 shadow-[0_0_30px_rgba(0,195,255,0.2)]">
          <div className="inline-flex p-3 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff]">
            <Download className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black font-grotesk text-white uppercase tracking-wide">
              CLAIM YOUR DECLASSIFIED FIELD MANUAL TODAY
            </h2>
            <p className="text-xs sm:text-sm text-[#839493]">
              Join thousands of calibrated initiates. Get instant offline access to the complete 38-page protocol.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="py-3.5 px-8 rounded font-bold font-grotesk text-xs bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(0,195,255,0.4)] uppercase"
            >
              <span>GET FREE ACCESS NOW (~~$149~~ $0)</span>
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
