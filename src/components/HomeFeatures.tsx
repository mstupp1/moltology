import React, { Suspense, useState } from 'react'
import { ArrowRight, Check, LayoutDashboard, Maximize2, MessagesSquare, Sparkles, type LucideIcon } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { LandingAuthCtaSkeleton } from '@/components/LandingAuthCtaSkeleton'
import { getAssetUrl } from '@/lib/assets'
import { lazyImageProps } from '@/lib/media-priority'

const LazyLandingAuthCtas = React.lazy(() =>
  import('@/components/LandingAuthCtas').then((m) => ({ default: m.LandingAuthCtas }))
)

interface HomeFeature {
  id: string
  icon: LucideIcon
  label: string
  headline: string
  body: string
  benefits: string[]
  screenshot: string
  screenshotSm: string
  screenshotAlt: string
  url: string
  actionText: string
  actionRoute: string
}

export const HOME_FEATURES: HomeFeature[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'The dashboard',
    headline: 'Know what to do the moment you sit down.',
    body: 'Your day opens on one screen: today’s routine, the lesson you were halfway through, and how your streak is holding. No hunting through apps and no deciding where to start. Just the next small shed.',
    benefits: [
      'A short daily routine, with reminders if you want them',
      'A streak calendar that makes progress easy to see',
      'Lessons that pick up right where you left off',
    ],
    screenshot: getAssetUrl('/images/marketing/dashboard_feature_preview.webp'),
    screenshotSm: getAssetUrl('/images/marketing/dashboard_feature_preview_sm.webp'),
    screenshotAlt: 'Dashboard showing a featured lesson and community news',
    url: 'moltology.org/dashboard',
    actionText: 'Open the dashboard',
    actionRoute: '/dashboard',
  },
  {
    id: 'oracle',
    icon: Sparkles,
    label: 'The Oracle',
    headline: 'Get unstuck in a single conversation.',
    body: 'When a task feels too big or your head is too loud, ask the Oracle. It helps you find the first step, shape a routine around your real week, and answers questions about the practice at any hour.',
    benefits: [
      'Turn a vague goal into one clear next step',
      'Plan routines that fit the time you actually have',
      'Ask anything about the practice, day or night',
    ],
    screenshot: getAssetUrl('/images/marketing/oracle_feature_preview.webp'),
    screenshotSm: getAssetUrl('/images/marketing/oracle_feature_preview_sm.webp'),
    screenshotAlt: 'A new conversation with the Oracle',
    url: 'moltology.org/oracle',
    actionText: 'Ask the Oracle',
    actionRoute: '/oracle',
  },
  {
    id: 'community',
    icon: MessagesSquare,
    label: 'The community',
    headline: 'Keep going with people who get it.',
    body: 'Share what you’re working on, trade the routines that stuck, and get encouragement from members on the same path. The boards are moderated and stay kind, so it never turns into the noise you came here to leave.',
    benefits: [
      'Post your progress and get thoughtful replies',
      'Borrow routines that already worked for others',
      'A moderated space that stays warm and on topic',
    ],
    screenshot: getAssetUrl('/images/marketing/forum_feature_preview.webp'),
    screenshotSm: getAssetUrl('/images/marketing/forum_feature_preview_sm.webp'),
    screenshotAlt: 'The Moltology community boards and latest posts',
    url: 'moltology.org/forum',
    actionText: 'Visit the community',
    actionRoute: '/forum',
  },
]

export interface HomeFeaturesProps {
  authReady: boolean
  onNavigate: (path: string) => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

/**
 * The three things a member actually gets, each as a real screenshot beside what it does for them.
 * Screenshots open a full-size gallery. No backdrop artwork: the product carries the section.
 */
export const HomeFeatures: React.FC<HomeFeaturesProps> = ({ authReady, onNavigate, onOpenAuth }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <section id="core-pillars" aria-labelledby="home-features-title" className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
      <ScrollReveal animation="fade-up" durationMs={700}>
        <div className="text-center max-w-2xl mx-auto">
          <p className="inline-flex items-center rounded-full border border-cyan-400/30 bg-[#04161c]/70 px-3.5 py-1.5 text-xs sm:text-sm text-cyan-100">
            What you get
          </p>
          <h2
            id="home-features-title"
            className="mt-5 font-grotesk font-bold tracking-[-0.03em] text-white text-[clamp(2rem,8vw,2.5rem)] sm:text-5xl lg:text-[3.5rem] leading-[1.05] [text-wrap:balance]"
          >
            Everything you need to finish what you start.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#c9d4d4] leading-relaxed [text-wrap:pretty]">
            A clear plan for every day, a coach for the moments you stall, and a community that keeps you
            coming back. All three are free to use.
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-14 sm:mt-24 space-y-20 sm:space-y-28">
        {HOME_FEATURES.map((feature, idx) => {
          const Icon = feature.icon
          const flipped = idx % 2 === 1
          return (
            <ScrollReveal key={feature.id} animation="fade-up" durationMs={700}>
              <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                <div className={`lg:col-span-7 ${flipped ? 'lg:order-2' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Expand ${feature.label.toLowerCase()} screenshot`}
                    className="group relative block w-full text-left cursor-zoom-in rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#070b0b]"
                  >
                    <div
                      className="absolute -inset-6 sm:-inset-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(0,195,255,0.22),transparent_70%)] blur-2xl pointer-events-none"
                      aria-hidden="true"
                    />
                    <div className="relative overflow-hidden rounded-xl border border-cyan-300/20 bg-[#061014] shadow-[0_30px_80px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-cyan-300/45 group-hover:shadow-[0_30px_90px_rgba(0,195,255,0.18)]">
                      <div className="flex items-center gap-3 px-3 sm:px-4 h-8 sm:h-9 border-b border-white/[0.06] bg-[#0a161b]" aria-hidden="true">
                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#ff5f57]/80" />
                          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#febc2e]/80" />
                          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#28c840]/80" />
                        </div>
                        <div className="mx-auto max-w-[220px] w-full rounded-md bg-white/[0.05] border border-white/[0.06] px-3 py-0.5 text-[10px] sm:text-[11px] text-white/55 text-center truncate">
                          {feature.url}
                        </div>
                        <div className="w-[34px] sm:w-[42px]" />
                      </div>
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <picture>
                          <source type="image/webp" media="(max-width: 767px)" srcSet={feature.screenshotSm} />
                          <img
                            src={feature.screenshot}
                            alt={feature.screenshotAlt}
                            {...lazyImageProps}
                            width={1280}
                            height={800}
                            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                          />
                        </picture>
                        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#03080a]/85 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white/90 shadow-lg transition-colors group-hover:border-cyan-300/50 group-hover:text-cyan-100">
                          <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Click to expand
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className={`lg:col-span-5 ${flipped ? 'lg:order-1' : ''}`}>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#00ffcc]">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {feature.label}
                  </p>
                  <h3 className="mt-3 font-grotesk font-bold tracking-[-0.02em] text-white text-2xl sm:text-[2rem] leading-tight [text-wrap:balance]">
                    {feature.headline}
                  </h3>
                  <p className="mt-4 text-base text-[#c9d4d4] leading-relaxed [text-wrap:pretty]">{feature.body}</p>
                  <ul className="mt-6 space-y-3">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3 text-sm sm:text-[15px] text-[#dfe3e3]">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00ffcc]/10 border border-[#00ffcc]/30">
                          <Check className="w-3 h-3 text-[#00ffcc]" aria-hidden="true" />
                        </span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => onNavigate(feature.actionRoute)}
                    className="group/cta mt-7 inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-400/[0.06] px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-300/60 hover:bg-cyan-400/[0.12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    {feature.actionText}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </ScrollReveal>
          )
        })}
      </div>

      <ImageLightbox
        isOpen={activeIndex !== null}
        onClose={() => setActiveIndex(null)}
        currentIndex={activeIndex ?? 0}
        onIndexChange={setActiveIndex}
        onNavigate={onNavigate}
        images={HOME_FEATURES.map((f) => ({
          src: f.screenshot,
          alt: f.screenshotAlt,
          title: f.label,
          description: f.body,
          specs: f.benefits,
          actionRoute: f.actionRoute,
          actionText: f.actionText,
        }))}
      />

      <ScrollReveal animation="fade-up" durationMs={700}>
        <div className="mt-20 sm:mt-28 rounded-2xl border border-cyan-300/20 bg-[#061014]/80 px-5 py-6 sm:px-8 sm:py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="font-grotesk font-bold text-white text-xl sm:text-2xl tracking-[-0.01em]">
              Free to join. No card needed.
            </h3>
            <p className="mt-2 text-sm sm:text-base text-[#c9d4d4] leading-relaxed">
              Try the full demo as a guest first, then make an account when you’re ready to keep your
              progress.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 shrink-0">
            <Suspense fallback={<LandingAuthCtaSkeleton variant="pillars" />}>
              {authReady ? (
                <LazyLandingAuthCtas variant="pillars" onNavigate={onNavigate} onOpenAuth={onOpenAuth} />
              ) : (
                <LandingAuthCtaSkeleton variant="pillars" />
              )}
            </Suspense>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
