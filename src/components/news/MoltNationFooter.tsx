import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Rss,
  ExternalLink,
  ShoppingBag,
  Newspaper,
  Compass,
  Building2,
  Instagram,
  Youtube,
  Flame,
  BookOpen,
  Activity,
  Scroll,
  MessageSquare,
} from 'lucide-react'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
import { useStoreDestination } from '@/components/store/useStoreDestination'

export interface MoltNationFooterProps {
  className?: string
}

/**
 * Clean, streamlined HUD footer for MoltNation News & Dispatches.
 * Mobile-first layout with tactile HUD chips, balanced brand alignment,
 * high-value SEO pathways, and safe clearance for floating controls.
 */
export const MoltNationFooter: React.FC<MoltNationFooterProps> = ({ className = '' }) => {
  const storeDestination = useStoreDestination()
  return (
    <footer
      className={`w-full bg-abyss border-t border-line-subtle text-xs text-ink-muted font-sans relative z-20 overflow-hidden pb-28 sm:pb-12 ${className}`}
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
            <p className="text-[11px] sm:text-xs text-ink-muted font-sans text-center md:text-left leading-relaxed">
              Stories about AI, work, and the long road to becoming a crab.
            </p>
          </div>

          {/* Essential Quick Navigation HUD Chips */}
          <nav
            aria-label="Footer Navigation"
            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-2.5 w-full md:w-auto max-w-2xl md:max-w-none mx-auto md:mx-0"
          >
            <Link
              to="/news"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Newspaper className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>DISPATCHES</span>
            </Link>

            <Link
              to="/moltmaxxing"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Flame className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>MOLTMAXXING</span>
            </Link>

            <Link
              to="/guide"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>FIELD MANUAL</span>
            </Link>

            <Link
              to="/moltmax"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>MOLTMAX QUIZ</span>
            </Link>

            <Link
              to="/forum"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>FORUMS</span>
            </Link>

            <Link
              to="/codex"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Scroll className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>SACRED CODEX</span>
            </Link>

            <Link
              to="/"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>MOLTOLOGY HOME</span>
            </Link>

            <Link
              to="/org"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>ORGANIZATION</span>
            </Link>

            {storeDestination.external ? (
              <a
                href={storeDestination.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-amber-500/40 hover:border-amber-500/70 text-amber-300 hover:text-amber-200 text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>STORE</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
              </a>
            ) : (
              <Link
                to="/store"
                className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-amber-500/40 hover:border-amber-500/70 text-amber-300 hover:text-amber-200 text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>STORE</span>
              </Link>
            )}

            <a
              href="https://www.instagram.com/moltology_org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Instagram className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>INSTAGRAM</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            <a
              href="https://www.youtube.com/@Moltology"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Youtube className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>YOUTUBE</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>

            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 sm:col-span-1 px-3.5 py-2.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-cyan-glow text-[11px] sm:text-xs font-grotesk font-bold uppercase tracking-[0.08em] rounded-control flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Rss className="w-3.5 h-3.5 shrink-0" />
              <span>RSS FEED</span>
            </a>
          </nav>
        </div>

        {/* Bottom Legal & Status Strip */}
        <div className="pt-6 border-t border-line-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-muted font-sans text-center sm:text-left">
          <div>
            © 2026 MOLTNATION MEDIA GROUP. ALL RIGHTS RESERVED.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/privacy"
              className="hover:text-cyan-glow transition-colors uppercase tracking-[0.08em] text-[11px] rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Privacy Policy
            </Link>
            <span className="text-ink-muted/50">·</span>
            <Link
              to="/terms"
              className="hover:text-cyan-glow transition-colors uppercase tracking-[0.08em] text-[11px] rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
