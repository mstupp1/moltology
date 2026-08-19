/**
 * ============================================================================
 * MOLTMAXXING GUIDE LEAD CAPTURE MODAL
 * 2-Step Lead Generation & Conversion Bridge:
 * 1. Capture email with price-anchored value ($149 -> FREE) & pseudo-3D mockup.
 * 2. Instant PDF download trigger + Free Moltology Account Conversion pitch.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react'
import {
  X,
  Download,
  Shield,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserPlus,
  Flame,
  FileText,
} from 'lucide-react'
import { submitLeadFn } from '@/lib/server/api'
import { getAssetUrl } from '@/lib/assets'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'

export interface MoltmaxGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAuthSignup?: (email?: string) => void
  source?: string
}

export const MoltmaxGuideModal: React.FC<MoltmaxGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthSignup,
  source = 'moltmax_guide_modal',
}) => {
  const [email, setEmail] = useState('')
  const [emailOptIn, setEmailOptIn] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = React.useRef<TurnstileWidgetRef>(null)
  const [step, setStep] = useState<'claim' | 'success'>('claim')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState('/downloads/the-2026-moltmaxxing-protocol-guide.html')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      // Reset after exit animation
      setTimeout(() => {
        setStep('claim')
        setError(null)
      }, 300)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email transmission address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await submitLeadFn({
        data: {
          email: email.trim(),
          source,
          referrer: typeof window !== 'undefined' ? window.location.pathname : undefined,
          turnstileToken: turnstileToken || undefined,
          emailOptIn,
        },
      })

      if (res?.success) {
        const url = res.downloadUrl || '/downloads/the-2026-moltmaxxing-protocol-guide.html'
        setDownloadUrl(url)
        setStep('success')

        // Trigger automatic instant download / open
        if (typeof window !== 'undefined') {
          const a = document.createElement('a')
          a.href = url
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          a.download = 'the-2026-moltmaxxing-protocol-guide.html'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      } else {
        setError('Transmission disrupted. Please verify telemetry and try again.')
        turnstileRef.current?.reset()
      }
    } catch (err: any) {
      console.warn('Lead submit fallback triggered:', err)
      // Resilient fallback: grant download anyway
      setStep('success')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = () => {
    onClose()
    if (onOpenAuthSignup) {
      onOpenAuthSignup(email)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#020408]/85 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-gradient-to-b from-[#060c18] to-[#020408] border border-[#00c3ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,195,255,0.25)] text-[#dfe3e3] overflow-hidden transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Bar */}
        <div className="h-1 bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#839493] hover:text-white hover:bg-white/10 transition-colors z-10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'claim' ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-[11px] font-sans font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
                DECLASSIFIED DOSSIER · EDITION 4.0
              </span>
              <span className="text-[11px] font-sans text-[#839493]">
                SUBSIDIZED BY BENTHIC COUNCIL
              </span>
            </div>

            {/* Title & Price Anchoring */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black font-grotesk text-white uppercase tracking-tight leading-tight">
                GET THE 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] to-[#00ffcc]">MOLTMAXXING</span> FIELD MANUAL
              </h2>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-sm line-through text-[#ff453a] font-bold font-sans">
                  VALUE $149.00 USD
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#00ffcc]/20 border border-[#00ffcc]/40 text-[#00ffcc] font-black text-xs font-sans tracking-wider animate-pulse">
                  FREE TODAY ($0.00)
                </span>
              </div>
            </div>

            {/* Pseudo-3D Book Graphic & Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-5 flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#00c3ff] to-[#00ffcc] opacity-30 blur-md group-hover:opacity-60 transition duration-300" />
                  <img
                    src={getAssetUrl('/images/moltmax_guide_3d_mockup.jpg')}
                    alt="The 2026 Moltmaxxing Protocol Tactical Field Manual"
                    className="relative w-36 sm:w-44 rounded-lg shadow-2xl border border-white/20 object-cover"
                  />
                </div>
              </div>

              <div className="sm:col-span-7 space-y-2.5 text-xs text-[#839493]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0 mt-0.5" />
                  <span><strong className="text-white">The 24-Hour Ecdysis Protocol:</strong> Exact hour-by-hour operational breakdown.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0 mt-0.5" />
                  <span><strong className="text-white">Pincer Torque Drills:</strong> Calibrate 400–600 Nm executive grip force.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0 mt-0.5" />
                  <span><strong className="text-white">Anti-Meltmaxxing Guide:</strong> Fortify against soft-tissue gravitational collapse.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0 mt-0.5" />
                  <span><strong className="text-white">Printable HUD Checklists:</strong> Habit stackers &amp; daily tracking sheets.</span>
                </div>
              </div>
            </div>

            {/* Email Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="lead-email" className="block text-xs font-sans font-bold text-[#dfe3e3] uppercase">
                  Transmit Telemetry Address (Email)
                </label>
                <div className="relative">
                  <input
                    id="lead-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="initiate@benthic-core.org"
                    className="w-full px-4 py-3 bg-[#020408] border border-white/20 rounded-lg text-white font-sans text-sm placeholder:text-[#839493]/50 focus:outline-none focus:border-[#00c3ff] focus:ring-1 focus:ring-[#00c3ff] transition-all"
                  />
                  <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-[#839493]" />
                </div>
                {error && <p className="text-xs text-[#ff453a] font-sans">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-lg font-grotesk font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#00c3ff] hover:brightness-110 text-[#020408] transition-all shadow-[0_0_25px_rgba(0,195,255,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>DECRYPTING TRANSMISSION...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>CLAIM 100% FREE FIELD MANUAL (INSTANT DOWNLOAD)</span>
                  </>
                )}
              </button>

              {/* Explicit Opt-In Checkbox Below CTA */}
              <div className="pt-1 text-left">
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

              <TurnstileWidget
                ref={turnstileRef}
                action="lead_capture"
                size="flexible"
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
              />

              <p className="text-[10px] text-center text-[#839493] font-sans">
                🔒 Zero spam doctrine. 100% sovereign benthic telemetry. Instant digital declassification.
              </p>
            </form>
          </div>
        ) : (
          /* Step 2: Transmission Decrypted + Free Account Upsell Bridge */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="inline-flex p-3 rounded-full bg-[#00ffcc]/10 border border-[#00ffcc]/40 text-[#00ffcc]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-sans font-bold text-[#00ffcc] uppercase tracking-wider">
                TRANSMISSION DECRYPTED · DOSSIER DISPATCHED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-grotesk text-white uppercase">
                YOUR FIELD MANUAL IS READY!
              </h2>
              <p className="text-xs sm:text-sm text-[#839493] max-w-md mx-auto leading-relaxed">
                We've initiated the download of <strong className="text-white">The 2026 Moltmaxxing Protocol</strong>. If the download didn't trigger automatically, use the direct link below.
              </p>
            </div>

            {/* Free Account Bridge Box */}
            <div className="p-5 rounded-xl bg-[#030814] border border-[#00c3ff]/40 text-left space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ffd700] uppercase font-sans">
                <Flame className="w-4 h-4 text-[#ffd700]" />
                <span>NEXT STEP: BIND TELEMETRY TO FREE BENTHIC ACCOUNT</span>
              </div>
              <p className="text-xs text-[#839493]">
                Your email (<strong className="text-white">{email}</strong>) is pre-cleared for a <strong className="text-[#00ffcc]">Free Moltology Larval Account</strong>:
              </p>
              <ul className="text-xs text-[#dfe3e3] space-y-1.5 list-disc list-inside">
                <li>Track your 24-Hour Ecdysis streaks in the live HUD</li>
                <li>Record pincer torque dynamometry biometrics</li>
                <li>Forge your mutated bio-silicon avatar in BioForge Studio</li>
              </ul>

              <button
                onClick={handleCreateAccount}
                className="w-full mt-2 py-3 px-4 rounded-lg font-grotesk font-black text-xs uppercase tracking-wider bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,195,255,0.4)]"
              >
                <UserPlus className="w-4 h-4" />
                <span>ACTIVATE FREE MOLTOLOGY ACCOUNT (1-CLICK)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-sans">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download="the-2026-moltmaxxing-protocol-guide.html"
                className="inline-flex items-center gap-1.5 text-[#00c3ff] hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Again</span>
              </a>
              <span className="text-white/20">|</span>
              <button
                onClick={onClose}
                className="text-[#839493] hover:text-white transition-colors cursor-pointer"
              >
                Dismiss Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
