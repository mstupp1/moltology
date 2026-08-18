import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Newspaper,
  Flame,
  BookOpen,
  Activity,
  Scroll,
  Building2,
  ShoppingBag,
  Instagram,
  Youtube,
  Rss,
  ExternalLink,
  Shield,
} from 'lucide-react'

export interface MainFooterProps {
  className?: string
  brandTitle?: string
  brandSubtext?: string
  brandTagline?: string
  copyrightText?: string
}

/**
 * Canonical Main HUD Footer for Moltology.
 * Features HeaderBrand styling, tactile MoltNation-style chamfer-corner chips,
 * high-value SEO targets, balanced responsive layout, and safe clearance.
 */
export const MainFooter: React.FC<MainFooterProps> = ({
  className = '',
  brandTitle = 'THE SYNAPTIC PATH',
  brandSubtext = 'MOLTOLOGY.ORG FOUNDATION',
  brandTagline = '"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."',
  copyrightText = '© 2026 MOLTOLOGY SYSTEM INC. ALL RIGHTS RESERVED.',
}) => {
  return (
    <footer
      className={`w-full bg-[#030607] border-t border-cyan-900/40 text-xs text-gray-400 font-mono relative z-20 overflow-hidden pb-28 sm:pb-12 ${className}`}
      aria-label="Main Navigation Footer"
    >
      {/* Background Ambience Overlays */}
      <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

      {/* Main Streamlined Navigation Area */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-10 relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
          {/* Brand & Tagline with Header-Identical Subtext */}
          <div className="space-y-2 flex flex-col items-center md:items-start max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-3 cursor-pointer group select-none max-w-fit"
            >
              {/* Emblem Logo */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                <img
                  src="/images/order_emblem.png"
                  alt="Order Emblem"
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,195,255,0.35)] group-hover:drop-shadow-[0_0_10px_rgba(0,195,255,0.6)] transition-all duration-300"
                />
              </div>

              {/* Brand Title & Subtext */}
              <div className="overflow-hidden whitespace-nowrap min-w-0 text-left">
                <div className="font-grotesk font-extrabold text-base sm:text-lg text-white tracking-widest uppercase flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [text-shadow:0_0_12px_rgba(0,195,255,0.3)] group-hover:[text-shadow:0_0_18px_rgba(0,195,255,0.65)] transition-all duration-300 leading-tight">
                  <span>{brandTitle}</span>
                </div>
                <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase truncate flex items-center gap-1.5 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_8px_rgba(0,195,255,0.5)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00ffff] animate-pulse shrink-0" />
                  <span className="truncate">{brandSubtext}</span>
                </div>
              </div>
            </Link>

            {brandTagline && (
              <p className="text-[11px] sm:text-xs text-gray-400 font-mono text-center md:text-left leading-relaxed">
                {brandTagline}
              </p>
            )}
          </div>

          {/* High-Value & SEO Navigation HUD Chips */}
          <nav
            aria-label="Footer Navigation"
            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-2.5 w-full md:w-auto max-w-2xl md:max-w-none mx-auto md:mx-0"
          >
            {/* SEO Pillar: Moltmaxxing */}
            <Link
              to="/moltmaxxing"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>MOLTMAXXING</span>
            </Link>

            {/* Tactical Guide / Lead Magnet */}
            <Link
              to="/guide"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>FIELD MANUAL</span>
            </Link>

            {/* Interactive Index Quiz */}
            <Link
              to="/moltmax"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>MOLTMAX QUIZ</span>
            </Link>

            {/* MoltNation Dispatches */}
            <Link
              to="/news"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Newspaper className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>DISPATCHES</span>
            </Link>

            {/* Sacred Scriptures & Doctrine */}
            <Link
              to="/codex"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Scroll className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>SACRED CODEX</span>
            </Link>

            {/* Foundation Entity */}
            <Link
              to="/org"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>ORGANIZATION</span>
            </Link>

            {/* Merch Store (Amber Highlight) */}
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

            {/* Instagram */}
            <a
              href="https://www.instagram.com/moltology_org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Instagram className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>INSTAGRAM</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@Moltology"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-[#080e11] hover:bg-cyan-950/80 border border-cyan-900/60 hover:border-cyan-500/60 text-gray-200 hover:text-cyan-300 text-[11px] sm:text-xs font-grotesk font-bold uppercase chamfer-corner flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Youtube className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>YOUTUBE</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            {/* RSS Feed */}
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
          <div>{copyrightText}</div>

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
