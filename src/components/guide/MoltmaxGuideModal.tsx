/**
 * ============================================================================
 * MOLTMAXXING GUIDE LEAD CAPTURE MODAL
 * 2-Step Lead Generation & Conversion Bridge:
 * 1. Capture email against a plain "what you get and why it helps" pitch.
 * 2. Instant PDF download trigger + Free Moltology Account Conversion pitch.
 * Bottom sheet on phones, two-column dialog on desktop; both scroll inside
 * the panel so the form and bot check are never clipped off-screen.
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Download,
  CheckCircle2,
  Check,
  ArrowRight,
  UserPlus,
  Mail,
  Clock,
  RotateCcw,
  Target,
  ListChecks,
} from 'lucide-react'
import { submitLeadFn } from '@/lib/server/api'
import { LEAD_CAPTURE_CHECK_PENDING, LEAD_CAPTURE_TURNSTILE_ACTION } from '@/lib/lead-capture'
import { getAssetUrl } from '@/lib/assets'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'

export interface MoltmaxGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAuthSignup?: (email?: string) => void
  source?: string
}

const GUIDE_PDF_PATH = 'downloads/the-2026-moltmaxxing-protocol-guide.pdf'
const GUIDE_PDF_FILENAME = 'the-2026-moltmaxxing-protocol-guide.pdf'

const GUIDE_BENEFITS = [
  {
    icon: Clock,
    title: 'A day you don’t have to plan.',
    body: 'An hour-by-hour routine, so your energy goes into the work, not into deciding what’s next.',
  },
  {
    icon: RotateCcw,
    title: 'A weekly reset.',
    body: 'A quick audit for dropping three habits or commitments that slow you down.',
  },
  {
    icon: Target,
    title: 'Grip training for decisions.',
    body: 'Short drills for deciding faster and actually finishing what you start.',
  },
  {
    icon: ListChecks,
    title: 'A printable daily checklist.',
    body: 'One page to tick off each day, because progress you can see is progress you keep.',
  },
] as const

const ACCOUNT_PERKS = [
  'A daily routine tracker that keeps your streak going',
  'The Moltmax scan, to see where you’re starting from',
  'A forum of people working on the same habits',
] as const

export const MoltmaxGuideModal: React.FC<MoltmaxGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthSignup,
  source = 'moltmax_guide_modal',
}) => {
  const [email, setEmail] = useState('')
  const [emailOptIn, setEmailOptIn] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetRef>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<'claim' | 'success'>('claim')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState(getAssetUrl(GUIDE_PDF_PATH))

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      panelRef.current?.focus({ preventScroll: true })
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
          source,
          referrer: typeof window !== 'undefined' ? window.location.pathname : undefined,
          turnstileToken,
          emailOptIn,
        },
      })

      if (res?.success) {
        const url = res.downloadUrl || getAssetUrl(GUIDE_PDF_PATH)
        setDownloadUrl(url)
        setStep('success')

        // Trigger automatic instant download / open
        if (typeof window !== 'undefined') {
          const a = document.createElement('a')
          a.href = url
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          a.download = GUIDE_PDF_FILENAME
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      } else {
        setError('Could not submit request. Please try again.')
        setTurnstileToken(null)
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

  const titleId = step === 'claim' ? 'guide-modal-title' : 'guide-modal-success-title'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-[#020408]/85 backdrop-blur-md guide-overlay"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex flex-col w-full max-h-[92dvh] sm:max-h-[calc(100dvh-3rem)] bg-[#040a15] border border-[#00c3ff]/30 border-b-0 sm:border-b rounded-t-2xl sm:rounded-2xl shadow-[0_0_60px_rgba(0,195,255,0.18)] text-[#dfe3e3] overflow-hidden outline-none guide-panel ${
          step === 'claim' ? 'sm:max-w-[840px]' : 'sm:max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Bar */}
        <div className="h-1 shrink-0 bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8]" />

        {/* Close Button: outside the scroll area so it stays reachable */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full text-[#839493] bg-[#040a15]/80 hover:text-white hover:bg-white/10 transition-colors z-10 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto overscroll-contain">
          {/* Grab handle hint for the phone bottom sheet */}
          <div className="sm:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/15" aria-hidden="true" />

          {step === 'claim' ? (
            <div className="md:grid md:grid-cols-[280px_minmax(0,1fr)]">
              {/* Cover column (desktop) */}
              <div className="hidden md:flex flex-col items-center justify-center gap-6 px-8 py-10 border-r border-white/10 bg-[radial-gradient(ellipse_at_50%_45%,rgba(0,195,255,0.22),transparent_65%),linear-gradient(to_bottom,#06101f,#030812)]">
                <img
                  src={getAssetUrl('/images/moltmax_guide_3d_mockup.webp')}
                  alt="Cover of the 2026 Moltmaxxing Field Manual"
                  width={208}
                  height={208}
                  decoding="async"
                  className="w-48 rounded-xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(0,195,255,0.2)] -rotate-3"
                />
                <p className="text-xs text-[#839493] font-sans text-center">
                  4-page PDF · Printable · Free
                </p>
              </div>

              {/* Pitch + form */}
              <div className="px-5 pt-4 pb-6 sm:px-8 sm:pt-7 sm:pb-7 space-y-5">
                <div className="flex items-start gap-4 pr-8">
                  <img
                    src={getAssetUrl('/images/moltmax_guide_3d_mockup_sm.webp')}
                    alt=""
                    width={64}
                    height={72}
                    decoding="async"
                    className="md:hidden shrink-0 w-16 h-[72px] object-cover rounded-lg border border-white/15 shadow-lg -rotate-3"
                  />
                  <div className="space-y-2 min-w-0">
                    <p className="text-[11px] font-sans font-bold text-[#00ffcc] uppercase tracking-wider">
                      Free field manual
                    </p>
                    <h2
                      id="guide-modal-title"
                      className="text-[22px] sm:text-3xl font-black font-grotesk text-white tracking-tight leading-[1.15]"
                    >
                      Shed the clutter. Finish what you start.
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-[#a9b6b5] leading-relaxed">
                  The Moltmaxxing Field Manual is a short, printable plan for a calmer, more focused day. Read it
                  tonight, use it tomorrow morning.
                </p>

                <div className="space-y-3">
                  <h3 className="text-xs font-sans font-bold text-[#dfe3e3] uppercase tracking-wider">
                    What’s inside, and why it helps
                  </h3>
                  <ul className="space-y-3">
                    {GUIDE_BENEFITS.map(({ icon: Icon, title, body }) => (
                      <li key={title} className="flex gap-3">
                        <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#00c3ff]/10 border border-[#00c3ff]/20 text-[#00c3ff]">
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <p className="min-w-0 text-[13px] leading-snug text-[#839493] pt-0.5">
                          <strong className="font-semibold text-white">{title}</strong> {body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Email Submission Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <label htmlFor="lead-email" className="block text-xs font-sans font-semibold text-[#dfe3e3]">
                    Your email
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#839493]" aria-hidden="true" />
                      <input
                        id="lead-email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? 'lead-email-error' : undefined}
                        className="w-full pl-10 pr-4 py-3 bg-[#020408] border border-white/20 rounded-lg text-white font-sans text-base sm:text-sm placeholder:text-[#839493]/60 focus:outline-none focus:border-[#00c3ff] focus:ring-1 focus:ring-[#00c3ff] transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="shrink-0 py-3 px-5 rounded-lg font-grotesk font-bold text-sm bg-gradient-to-r from-[#00c3ff] to-[#00ffcc] hover:brightness-110 text-[#020408] transition-all shadow-[0_0_24px_rgba(0,195,255,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                    >
                      {loading ? (
                        <span>Preparing your download…</span>
                      ) : (
                        <>
                          <Download className="w-4 h-4" aria-hidden="true" />
                          <span>Get the free PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p id="lead-email-error" role="alert" className="text-xs text-[#ff6b61] font-sans">
                      {error}
                    </p>
                  )}

                  {/* Explicit Opt-In Checkbox Below CTA */}
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none pt-1">
                    <input
                      type="checkbox"
                      checked={emailOptIn}
                      onChange={(e) => setEmailOptIn(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded border-white/20 bg-[#020408] text-[#00c3ff] focus:ring-[#00c3ff] focus:ring-offset-0 cursor-pointer accent-[#00c3ff]"
                    />
                    <span className="text-xs text-[#839493] group-hover:text-[#dfe3e3] transition-colors font-sans leading-snug">
                      Send me occasional updates, new field manuals, and articles.
                    </span>
                  </label>

                  <TurnstileWidget
                    ref={turnstileRef}
                    action={LEAD_CAPTURE_TURNSTILE_ACTION}
                    size="flexible"
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                  />

                  <p className="text-[11px] text-[#839493] font-sans">
                    The download starts right away. We only email you if you tick the box.
                  </p>
                </form>
              </div>
            </div>
          ) : (
            /* Step 2: Download confirmation + Free Account Upsell Bridge */
            <div className="px-5 pt-6 pb-6 sm:p-8 space-y-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-[#00ffcc]/10 border border-[#00ffcc]/40 text-[#00ffcc]">
                <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <h2
                  id="guide-modal-success-title"
                  className="text-2xl sm:text-[28px] font-black font-grotesk text-white tracking-tight leading-tight"
                >
                  Your manual is downloading
                </h2>
                <p className="text-sm text-[#a9b6b5] max-w-sm mx-auto leading-relaxed">
                  If it didn’t start, use the download link at the bottom of this window.
                </p>
              </div>

              {/* Free Account Bridge Box */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-[#00c3ff]/30 text-left space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-grotesk text-white">
                    Next: turn the checklist into a habit
                  </h3>
                  <p className="text-xs text-[#839493] leading-relaxed">
                    A free Moltology account gives the manual somewhere to live.
                  </p>
                </div>
                <ul className="space-y-2">
                  {ACCOUNT_PERKS.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-[13px] text-[#dfe3e3]">
                      <Check className="w-4 h-4 text-[#00ffcc] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleCreateAccount}
                  className="w-full py-3 px-4 rounded-lg font-grotesk font-bold text-sm bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,195,255,0.35)]"
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Create my free account</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-sans">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={GUIDE_PDF_FILENAME}
                  className="inline-flex items-center gap-1.5 text-[#00c3ff] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download again</span>
                </a>
                <span className="text-white/20" aria-hidden="true">|</span>
                <button
                  onClick={onClose}
                  className="text-[#839493] hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
