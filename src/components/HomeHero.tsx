import React, { Suspense } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, ListChecks, MessagesSquare, Sparkles } from 'lucide-react'
import { HeroBackground } from '@/components/ui/HeroBackground'
import { LandingAuthCtaSkeleton } from '@/components/LandingAuthCtaSkeleton'
import { getAssetUrl } from '@/lib/assets'
import { eagerImageProps } from '@/lib/media-priority'

const LazyLandingAuthCtas = React.lazy(() =>
  import('@/components/LandingAuthCtas').then((m) => ({ default: m.LandingAuthCtas }))
)

const WHAT_YOU_GET = [
  { icon: ListChecks, label: 'Daily habits and focus sessions' },
  { icon: Sparkles, label: 'An Oracle that coaches you' },
  { icon: MessagesSquare, label: 'A warm community forum' },
]

export interface HomeHeroProps {
  authReady: boolean
  onNavigate: (path: string) => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

/**
 * Homepage opening frame: what Moltology is in one look, the two ways in, and a peek at the
 * dashboard rising out of the deep. The headline is never faded in, so it can paint first.
 */
export const HomeHero: React.FC<HomeHeroProps> = ({ authReady, onNavigate, onOpenAuth }) => {
  const dashboard = getAssetUrl('/images/marketing/dashboard_desktop_preview.webp')
  const dashboardSm = getAssetUrl('/images/marketing/dashboard_desktop_preview_sm.webp')
  const dashboardPhone = getAssetUrl('/images/marketing/dashboard_mobile_preview_sm.webp')

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative w-full overflow-hidden bg-[#030608] border-b border-cyan-900/40 pt-28 sm:pt-32 lg:pt-28"
    >
      <HeroBackground
        artworkSrc="/images/hero_benthic_expansive_v1.webp"
        artworkSrcMobile="/images/hero_benthic_mobile_v2.webp"
      />
      <div className="home-hero-aurora absolute left-1/2 top-[18%] -translate-x-1/2 w-[min(1100px,140vw)] h-[520px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 text-center">
        <p className="home-hero-rise inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-[#04161c]/70 backdrop-blur-md px-3.5 py-1.5 text-xs sm:text-sm text-cyan-100">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ffcc]" />
          </span>
          Free to join. A daily practice for focus.
        </p>

        <h1
          id="home-hero-title"
          className="mt-6 sm:mt-7 font-grotesk font-bold tracking-[-0.035em] text-white text-[clamp(3rem,13vw,4.5rem)] sm:text-[clamp(4.25rem,8vw,6.75rem)] leading-[0.95] [text-shadow:0_10px_40px_rgba(0,0,0,0.85)]"
        >
          <span className="block">Shed the noise.</span>
          <span className="home-hero-gradient block pb-[0.08em] [text-shadow:none]">Grow a shell.</span>
        </h1>

        <p className="home-hero-rise mt-6 sm:mt-7 mx-auto max-w-2xl text-base sm:text-lg lg:text-xl text-[#c9d4d4] leading-relaxed [text-wrap:pretty] drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]" style={{ animationDelay: '80ms' }}>
          Moltology is a free practice and community for people who are tired of melting into their
          notifications. Build daily routines, protect your focus, and finish what you start, one small
          shed at a time.
        </p>

        <div
          className="home-hero-rise mt-8 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 min-h-[114px] sm:min-h-[54px]"
          style={{ animationDelay: '160ms' }}
        >
          <Suspense fallback={<LandingAuthCtaSkeleton variant="hero" />}>
            {authReady ? (
              <LazyLandingAuthCtas variant="hero" onNavigate={onNavigate} onOpenAuth={onOpenAuth} />
            ) : (
              <LandingAuthCtaSkeleton variant="hero" />
            )}
          </Suspense>
        </div>

        <p className="home-hero-rise mt-5 text-sm text-[#9fb0b0]" style={{ animationDelay: '220ms' }}>
          Not sure where you stand?{' '}
          <Link
            to="/moltmax"
            className="group inline-flex items-center gap-1 font-semibold text-cyan-300 hover:text-cyan-200 underline-offset-4 hover:underline"
          >
            Take the free Moltmax diagnostic
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </p>

        <ul
          className="home-hero-rise mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#dfe3e3]"
          style={{ animationDelay: '280ms' }}
          aria-label="What you get"
        >
          {WHAT_YOU_GET.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#00ffcc]" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* The dashboard rises out of the deep and settles flat as it scrolls into view. */}
      <div className="relative z-10 mt-10 sm:mt-12 px-4 sm:px-8 [perspective:1800px]">
        <div className="home-hero-device relative mx-auto max-w-[300px] sm:max-w-[1180px]">
          <div className="absolute -inset-x-10 -top-10 bottom-0 rounded-[3rem] bg-[radial-gradient(ellipse_at_top,rgba(0,195,255,0.35),transparent_65%)] blur-2xl pointer-events-none" aria-hidden="true" />
          <div className="relative rounded-t-[2.25rem] sm:rounded-t-[1.25rem] border-[6px] sm:border border-b-0 sm:border-b-0 border-[#0f1d22] sm:border-cyan-300/25 ring-1 ring-cyan-300/25 sm:ring-0 bg-[#061014]/95 shadow-[0_-20px_80px_rgba(0,195,255,0.18)] overflow-hidden">
            {/* Phone: a notch. Wider screens: browser chrome. */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-10 h-5 w-20 rounded-full bg-black" aria-hidden="true" />
            <div className="hidden sm:flex items-center gap-3 px-4 h-10 border-b border-white/[0.06] bg-[#0a161b]">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
              </div>
              <div className="mx-auto max-w-[260px] w-full rounded-md bg-white/[0.05] border border-white/[0.06] px-3 py-0.5 text-[11px] text-white/55 text-center truncate">
                moltology.org/dashboard
              </div>
              <div className="w-[42px]" aria-hidden="true" />
            </div>
            <div className="relative aspect-[540/790] sm:aspect-[1280/600] overflow-hidden">
              <picture className="absolute inset-x-0 bottom-0 top-8 sm:top-0">
                <source media="(max-width: 639px)" srcSet={dashboardPhone} width={540} height={1170} />
                <img
                  src={dashboardSm}
                  srcSet={`${dashboardSm} 1280w, ${dashboard} 3520w`}
                  sizes="(min-width: 1280px) 1180px, 94vw"
                  alt="The Moltology dashboard, with daily modules, lectures and community news"
                  {...eagerImageProps}
                  width={1280}
                  height={800}
                  className="absolute inset-0 w-full h-auto"
                />
              </picture>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#030608] via-[#030608]/70 to-transparent pointer-events-none" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
