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
  Info,
} from 'lucide-react'
import { useStoreDestination } from '@/components/store/useStoreDestination'

export interface MainFooterProps {
  className?: string
  brandTitle?: string
  brandSubtext?: string
  brandTagline?: string
  copyrightText?: string
  variant?: 'benthic' | 'corporate'
}

/**
 * Canonical Main HUD / Corporate Footer for Moltology.
 * Features HeaderBrand styling, rounded nav chips,
 * high-value SEO targets, balanced responsive layout, and safe clearance.
 */
export const MainFooter: React.FC<MainFooterProps> = ({
  className = '',
  brandTitle = 'THE SYNAPTIC PATH',
  brandSubtext = 'MOLTOLOGY.ORG FOUNDATION',
  brandTagline = '"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."',
  copyrightText = '© 2026 MOLTOLOGY SYSTEM INC. ALL RIGHTS RESERVED.',
  variant = 'benthic',
}) => {
  const isCorporate = variant === 'corporate'
  const storeDestination = useStoreDestination()

  return (
    <footer
      className={`w-full border-t text-xs relative z-20 overflow-hidden pb-28 sm:pb-12 transition-colors ${
        isCorporate
          ? 'bg-white border-sky-100 text-slate-500 font-sans'
          : 'bg-abyss border-line-subtle text-ink-muted font-sans'
      } ${className}`}
      aria-label="Main Navigation Footer"
    >
      {/* Background Ambience Overlays */}
      {!isCorporate && (
        <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />
      )}

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
                  src="/images/order_emblem.webp"
                  alt="Order Emblem"
                  width={40}
                  height={40}
                  className={`w-full h-full object-contain transition-all duration-300 ${
                    isCorporate
                      ? 'filter drop-shadow-[0_1px_2px_rgba(15,23,42,0.18)]'
                      : 'filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'
                  }`}
                />
              </div>

              {/* Brand Title & Subtext */}
              <div className="overflow-hidden whitespace-nowrap min-w-0 text-left">
                <div
                  className={`font-grotesk font-extrabold text-base sm:text-lg tracking-widest uppercase flex items-center gap-2 transition-all duration-300 leading-tight ${
                    isCorporate
                      ? 'text-sky-950 group-hover:text-sky-700'
                      : 'text-ink drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-white'
                  }`}
                >
                  <span>{brandTitle}</span>
                </div>
                <div
                  className={`text-[11px] font-bold tracking-widest uppercase truncate mt-0.5 ${
                    isCorporate
                      ? 'text-sky-600'
                      : 'text-cyan-glow drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  <span className="truncate">{brandSubtext}</span>
                </div>
              </div>
            </Link>

            {brandTagline && (
              <p
                className={`text-[11px] sm:text-xs text-center md:text-left leading-relaxed ${
                  isCorporate ? 'text-slate-500 font-sans' : 'text-ink-muted font-sans'
                }`}
              >
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
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>MOLTMAXXING</span>
            </Link>

            {/* Tactical Guide / Lead Magnet */}
            <Link
              to="/guide"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>FIELD MANUAL</span>
            </Link>

            {/* Interactive Index Quiz */}
            <Link
              to="/moltmax"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>MOLTMAX QUIZ</span>
            </Link>

            {/* MoltNation Dispatches */}
            <Link
              to="/news"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Newspaper className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>DISPATCHES</span>
            </Link>

            {/* Sacred Scriptures & Doctrine */}
            <Link
              to="/codex"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Scroll className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>SACRED CODEX</span>
            </Link>

            {/* About / What is Moltology */}
            <Link
              to="/what-is-moltology"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Info className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>ABOUT</span>
            </Link>

            {/* Foundation Entity */}
            <Link
              to="/org"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>ORGANIZATION</span>
            </Link>

            {/* Merch Store (Amber Highlight) */}
            {storeDestination.external ? (
              <a
                href={storeDestination.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  isCorporate
                    ? 'bg-amber-50 hover:bg-amber-100/80 border border-amber-200 hover:border-amber-300 text-amber-700 hover:text-amber-800 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                    : 'rounded-control border border-amber-500/30 bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>STORE</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
              </a>
            ) : (
              <Link
                to="/store"
                className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  isCorporate
                    ? 'bg-amber-50 hover:bg-amber-100/80 border border-amber-200 hover:border-amber-300 text-amber-700 hover:text-amber-800 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                    : 'rounded-control border border-amber-500/30 bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>STORE</span>
              </Link>
            )}

            {/* Instagram */}
            <a
              href="https://www.instagram.com/moltology_org/"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Instagram className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>INSTAGRAM</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@Moltology"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-slate-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Youtube className={`w-3.5 h-3.5 shrink-0 ${isCorporate ? 'text-sky-600' : 'text-ink-muted'}`} />
              <span>YOUTUBE</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            {/* RSS Feed */}
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className={`col-span-2 sm:col-span-1 px-3.5 py-2.5 text-[11px] sm:text-xs font-grotesk font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isCorporate
                  ? 'bg-[#f8fbff] hover:bg-sky-50 border border-sky-200/70 hover:border-sky-300 text-sky-600 hover:text-sky-700 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
                  : 'rounded-control border border-line bg-surface-1 hud-sheen text-cyan-glow hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              <Rss className="w-3.5 h-3.5 shrink-0" />
              <span>RSS FEED</span>
            </a>
          </nav>
        </div>

        {/* Bottom Legal & Status Strip */}
        <div
          className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-center sm:text-left ${
            isCorporate
              ? 'border-sky-100 text-slate-400 font-sans'
              : 'border-line-subtle text-ink-muted font-sans'
          }`}
        >
          <div>{copyrightText}</div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/privacy"
              className={`transition-colors uppercase tracking-wider text-[11px] ${
                isCorporate ? 'hover:text-sky-600 text-slate-500' : 'hover:text-cyan-glow text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              Privacy Policy
            </Link>
            <span className={isCorporate ? 'text-slate-300' : 'text-line'}>·</span>
            <Link
              to="/terms"
              className={`transition-colors uppercase tracking-wider text-[11px] ${
                isCorporate ? 'hover:text-sky-600 text-slate-500' : 'hover:text-cyan-glow text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
              }`}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

