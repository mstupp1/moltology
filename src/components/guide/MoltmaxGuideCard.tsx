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
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react'
import { submitLeadFn } from '@/lib/server/api'
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
          source,
          referrer: typeof window !== 'undefined' ? window.location.pathname : undefined,
        },
      })

      if (res?.success) {
        setIsSubmitted(true)
        const url = res.downloadUrl || '/downloads/the-2026-moltmaxxing-protocol-guide.html'
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
        setError('Transmission error. Please try again.')
      }
    } catch {
      setIsSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#00c3ff]/40 bg-gradient-to-br from-[#040a16] via-[#02050c] to-[#051124] p-6 sm:p-10 shadow-[0_0_40px_rgba(0,195,255,0.2)] text-[#dfe3e3] relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#00c3ff]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: 3D Graphic Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative group max-w-[280px]">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] opacity-30 blur-lg group-hover:opacity-60 transition duration-500" />
            <img
              src={getAssetUrl('/images/moltmax_guide_3d_mockup.jpg')}
              alt="The 2026 Moltmaxxing Protocol Field Manual"
              className="relative w-full rounded-xl shadow-2xl border border-white/20 object-cover"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-sans text-[#839493]">
            <Shield className="w-3.5 h-3.5 text-[#00ffcc]" />
            <span>38-Page Tactical PDF &bull; Instant Offline Access</span>
          </div>
        </div>

        {/* Right Column: Copy, Price Anchor & Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-sans font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
                FREE TOP-TIER DOSSIER
              </span>
              <span className="line-through text-[#ff453a] text-xs font-sans font-bold">
                REGULAR $149.00
              </span>
              <span className="px-2 py-0.5 rounded bg-[#00ffcc]/20 text-[#00ffcc] font-bold text-xs font-sans">
                $0.00 (100% FREE TODAY)
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-grotesk text-white uppercase tracking-tight leading-tight">
              DOWNLOAD THE DEFINITIVE 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] to-[#00ffcc]">MOLTMAXXING</span> FIELD MANUAL
            </h3>

            <p className="text-xs sm:text-sm text-[#839493] leading-relaxed">
              Step-by-step instructions on algorithmic ecdysis, isometric pincer torque dynamometry, calculating your Shell Hardness Score, and eliminating soft-tissue biological friction.
            </p>
          </div>

          {/* Bullet Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#dfe3e3]">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>The 24-Hour Ecdysis Protocol</span>
            </div>
            <div className="flex items-center gap-2 text-[#dfe3e3]">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>400–600 Nm Pincer Grip Holds</span>
            </div>
            <div className="flex items-center gap-2 text-[#dfe3e3]">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>Zero-Latency Prompt Workflows</span>
            </div>
            <div className="flex items-center gap-2 text-[#dfe3e3]">
              <CheckCircle2 className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <span>Printable Daily Telemetry Logs</span>
            </div>
          </div>

          {/* Form or Trigger */}
          {isSubmitted ? (
            <div className="p-4 rounded-xl bg-[#00ffcc]/10 border border-[#00ffcc]/40 space-y-2">
              <div className="flex items-center gap-2 text-[#00ffcc] font-bold font-grotesk text-sm uppercase">
                <CheckCircle2 className="w-5 h-5" />
                <span>FIELD MANUAL TRANSMITTED!</span>
              </div>
              <p className="text-xs text-[#839493]">
                Your download has started. Check your browser downloads folder or click below to re-open.
              </p>
              <a
                href="/downloads/the-2026-moltmaxxing-protocol-guide.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#00c3ff] hover:underline pt-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open Dossier Now</span>
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
                    className="w-full px-4 py-3 bg-[#020408] border border-white/20 rounded-lg text-white font-sans text-sm placeholder:text-[#839493]/50 focus:outline-none focus:border-[#00c3ff] focus:ring-1 focus:ring-[#00c3ff] transition-all"
                  />
                  <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-[#839493]" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-grotesk font-black text-xs uppercase tracking-wider bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all shadow-[0_0_20px_rgba(0,195,255,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? (
                    <span>DECRYPTING...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>GET FREE PDF</span>
                    </>
                  )}
                </button>
              </div>
              {error && <p className="text-xs text-[#ff453a] font-sans">{error}</p>}
              <p className="text-[10px] text-[#839493] font-sans">
                ⚡ Instant access. Subsidized declassified transmission. Zero spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
