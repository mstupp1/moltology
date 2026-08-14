import React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Rss,
  ExternalLink,
  ShoppingBag,
  Shield,
  Newspaper,
  Compass,
  Building2,
  Instagram,
} from 'lucide-react'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'

export interface MoltNationFooterProps {
  className?: string
}

/**
 * Clean, streamlined HUD footer for MoltNation News & Dispatches.
 * Mobile-first layout with tactile HUD chips, balanced brand alignment,
 * and safe clearance for floating controls.
 */
export const MoltNationFooter: React.FC<MoltNationFooterProps> = ({ className = '' }) => {
  const navigate = useNavigate()

  return (
    <footer
      className={`w-full bg-[#030607] border-t border-cyan-900/40 text-xs text-gray-400 font-mono relative z-20 overflow-hidden pb-28 sm:pb-12 ${className}`}
      aria-label="MoltNation News Footer"
    >
      {/* Background Ambience Overlays */}
      <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

      {/* Main Streamlined Navigation Area */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-10 relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
          {/* Brand & Tagline */}
          <div className="space-y-2 flex flex-col items-center md:items-start max-w-md">
            <MoltNationLogo size="sm" theme="dark" align="center" className="md:!items-start" />
            <p className="text-[11px] sm:text-xs text-gray-400 font-mono text-center md:text-left leading-relaxed">
              Official patriot telemetry &amp; autonomous intelligence network.
            </p>
          </div>

          {/* Essential Quick Navigation HUD Chips */}
          <nav
            aria-label="Footer Navigation"
            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-2.5 w-full md:w-auto max-w-lg md:max-w-none mx-auto md:mx-0"
          >
            <Link
              to="/news"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Newspaper className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>DISPATCHES</span>
            </Link>

            <button
              onClick={() => navigate({ to: '/' })}
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>SYNAPTIC PATH</span>
            </button>

            <button
              onClick={() => navigate({ to: '/org' })}
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>ORGANIZATION</span>
            </button>

            <a
              href="https://www.etsy.com/shop/SaasTrash"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-[#0e0d08] hover:bg-amber-950/50 border border-amber-900/60 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>STORE</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            <a
              href="https://www.instagram.com/silas.trench"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Instagram className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>INSTAGRAM</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 sm:col-span-1 px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Rss className="w-3.5 h-3.5 shrink-0" />
              <span>RSS FEED</span>
            </a>
          </nav>
        </div>

        {/* Bottom Legal & Status Strip */}
        <div className="pt-6 border-t border-cyan-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500 font-mono text-center sm:text-left">
          <div>
            © 2026 MOLTNATION MEDIA GROUP. ALL RIGHTS RESERVED.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/privacy"
              className="hover:text-cyan-300 transition-colors uppercase tracking-wider text-[11px]"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-700">·</span>
            <Link
              to="/terms"
              className="hover:text-cyan-300 transition-colors uppercase tracking-wider text-[11px]"
            >
              Terms of Service
            </Link>
            <span className="text-gray-700">·</span>
            <div className="flex items-center gap-1.5 text-cyan-400/90 font-bold text-[11px]">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>CHITIN MATRIX ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
