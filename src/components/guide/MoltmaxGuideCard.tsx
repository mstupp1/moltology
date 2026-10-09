/**
 * ============================================================================
 * MOLTMAXXING GUIDE EMBEDDED SHOWCASE CARD
 * Reusable high-converting in-page feature card for /moltmaxxing, blog dispatches,
 * and landing pages.
 * ============================================================================
 */
import React, { useState } from 'react'
import {
  Download,
  CheckCircle2,
  Lock,
  ArrowRight,
  Shield,
} from 'lucide-react'
import { submitLeadFn } from '@/lib/server/api'
import { LEAD_CAPTURE_CHECK_PENDING, LEAD_CAPTURE_TURNSTILE_ACTION } from '@/lib/lead-capture'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'
import { getAssetUrl } from '@/lib/assets'

export interface MoltmaxGuideCardProps {
  onOpenGuideModal?: () => void
  source?: string
  variant?: 'full' | 'compact'
}

export const MoltmaxGuideCard: React.FC<MoltmaxGuideCardProps> = ({
  onOpenGuideModal,
  source = 'moltmax_guide_embedded_card',
  variant = 'full',
}) => {
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
          source,
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
    <div className="rounded-panel border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-6 sm:p-10 text-ink-body relative overflow-hidden">
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: 3D Graphic Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative group max-w-[240px]">
            <div className="absolute -inset-2 rounded-card bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] opacity-0 blur-lg group-hover:opacity-40 transition duration-500" aria-hidden="true" />
            <img
              src={getAssetUrl('images/guide/moltmaxxing-cover-v2.webp')}
              alt="The 2026 Moltmaxxing Protocol Field Manual"
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
              className="relative w-full aspect-[2/3] rounded-control shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-line object-cover motion-safe:group-hover:-translate-y-1 transition-transform duration-500"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-sans text-ink-muted">
            <Shield className="w-3.5 h-3.5 text-[#00ffcc]" />
            <span>4-page PDF · Printable · Free</span>
          </div>
        </div>

        {/* Right Column: Copy, Price Anchor & Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-cyan-glow">Free field manual</p>

            <h3 className="text-2xl sm:text-3xl font-black font-grotesk text-ink tracking-tight leading-tight">
              Your next molt starts here. The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] to-[#00ffcc]">MOLTMAXXING</span> Field Manual
            </h3>

            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Shed the clutter, protect your focus, and finish one thing. Keep a practical daily plan beside you.
            </p>
          </div>

          {/* Bullet Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-ink-body">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>A daily routine</span>
            </div>
            <div className="flex items-center gap-2 text-ink-body">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>One task to finish</span>
            </div>
            <div className="flex items-center gap-2 text-ink-body">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>Room to focus</span>
            </div>
            <div className="flex items-center gap-2 text-ink-body">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>A printable checklist</span>
            </div>
          </div>

          {/* Form or Trigger */}
          {isSubmitted ? (
            <div className="p-4 rounded-card bg-[#00ffcc]/10 border border-[#00ffcc]/40 space-y-2">
              <div className="flex items-center gap-2 text-[#00ffcc] font-bold font-grotesk text-sm uppercase">
                <CheckCircle2 className="w-5 h-5" />
                <span>Your manual is downloading</span>
              </div>
              <p className="text-xs text-ink-muted">
                Your download has started. Check your browser downloads folder or click below to re-open.
              </p>
              <a
                href={getAssetUrl('downloads/the-2026-moltmaxxing-protocol-guide.pdf?v=20261008-artwork')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-control text-xs font-bold text-cyan-glow hover:underline pt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open the manual</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to claim free copy..."
                    className="w-full px-4 py-3 bg-surface-2 border border-line rounded-control text-ink font-sans text-sm placeholder:text-ink-muted/70 hover:border-line-hover focus:outline-none focus:border-cyan-glow focus:shadow-field-focus transition-all"
                  />
                  <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-ink-muted" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-control font-grotesk font-black text-xs uppercase tracking-[0.08em] bg-cyan-glow hover:bg-cyan-hover text-abyss transition-all hover:drop-shadow-[0_0_10px_rgba(0,195,255,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
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
                    className="mt-0.5 w-4 h-4 rounded-chip border-line bg-surface-2 text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow cursor-pointer accent-[#00c3ff]"
                  />
                  <span className="text-xs text-ink-muted group-hover:text-ink-body transition-colors font-sans leading-tight">
                    Send me occasional updates, new field manuals, and articles.
                  </span>
                </label>
              </div>

              <TurnstileWidget
                ref={turnstileRef}
                action={LEAD_CAPTURE_TURNSTILE_ACTION}
                size="flexible"
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
              />

              {error && <p className="text-xs text-crimson-text font-sans">{error}</p>}
              <p className="text-[11px] text-ink-muted font-sans">
                Download starts after you submit. Email updates are optional.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
