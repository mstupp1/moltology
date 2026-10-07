import React, { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { lcpImageProps, lazyImageProps } from '@/lib/media-priority'
import type { StoryImage, StoryVideo } from './content'
import { useInView, usePrefersReducedMotion, useScrollProgress, useScrollVar } from './motion'

export const StoryImg: React.FC<{
  image: StoryImage
  alt?: string
  className?: string
  eager?: boolean
  style?: React.CSSProperties
}> = ({ image, alt = '', className = '', eager = false, style }) => (
  <picture>
    {image.srcSm && <source media="(max-width: 767px)" srcSet={image.srcSm} />}
    <img
      src={image.src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
      style={style}
      {...(eager ? lcpImageProps : lazyImageProps)}
    />
  </picture>
)

/**
 * Muted ambient loop that only downloads and plays while on screen.
 * Reduced-motion visitors get the poster frame.
 */
export const InViewVideo: React.FC<{ video: StoryVideo; className?: string; eager?: boolean }> = ({
  video,
  className = '',
  eager = false,
}) => {
  const ref = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref, '200px')
  const reduced = usePrefersReducedMotion()
  const [src, setSrc] = useState<string | null>(null)
  const [poster, setPoster] = useState(video.poster)

  useEffect(() => {
    const small = window.matchMedia?.('(max-width: 767px)').matches
    setPoster(small ? video.posterSm : video.poster)
    if ((inView || eager) && !reduced) setSrc(small ? video.srcSm : video.src)
  }, [inView, eager, reduced, video])

  useEffect(() => {
    const el = ref.current
    if (!el || !src) return
    if (inView && !reduced) {
      el.play?.()?.catch?.(() => {})
    } else {
      el.pause?.()
    }
  }, [inView, reduced, src])

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      src={src ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  )
}

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({
  children,
  color = '#00c3ff',
  className = '',
}) => (
  <p
    className={`inline-flex items-center gap-2 text-[11px] sm:text-xs font-grotesk font-bold tracking-[0.22em] uppercase ${className}`}
    style={{ color }}
  >
    <span className="h-px w-6" style={{ background: color }} aria-hidden="true" />
    {children}
  </p>
)

type CtaProps = { to: string; children: React.ReactNode; className?: string }

export const PrimaryCta: React.FC<CtaProps> = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`group inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full font-grotesk font-bold text-sm bg-[#00c3ff] hover:bg-[#5cdcff] text-[#020408] shadow-[0_0_30px_rgba(0,195,255,0.35)] transition-colors ${className}`}
  >
    {children}
    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
  </Link>
)

export const SecondaryCta: React.FC<CtaProps> = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full font-grotesk font-bold text-sm border border-white/25 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/40 transition-colors ${className}`}
  >
    {children}
  </Link>
)

/**
 * Full-bleed opening frame for the About pages. The media drifts slower than the page and the
 * copy fades as you scroll into the story.
 */
export const StoryHero: React.FC<{
  media: { video?: StoryVideo; image?: StoryImage }
  eyebrow: string
  title: React.ReactNode
  lede: React.ReactNode
  actions?: React.ReactNode
  cue?: string
  tall?: boolean
}> = ({ media, eyebrow, title, lede, actions, cue, tall = true }) => {
  const ref = useRef<HTMLElement>(null)
  useScrollVar(ref, 'through')

  return (
    <section
      ref={ref}
      className={`relative isolate overflow-hidden flex items-end ${
        tall ? 'min-h-[calc(100svh-var(--wim-chrome,8rem))]' : 'min-h-[68svh]'
      }`}
      style={{ ['--p' as string]: 0.5 }}
    >
      <div
        className="absolute inset-0 -z-10 will-change-transform"
        style={{ transform: 'translate3d(0, calc((var(--p) - 0.5) * 30%), 0) scale(1.12)' }}
      >
        {media.video ? (
          <InViewVideo video={media.video} eager className="h-full w-full object-cover" />
        ) : media.image ? (
          <StoryImg image={media.image} eager className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#020408] via-[#020408]/55 to-[#020408]/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020408]/80 via-[#020408]/20 to-transparent" />

      <div
        className="relative w-full max-w-6xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24 pt-24"
        style={{ opacity: 'calc(1 - max(0, var(--p) - 0.5) * 2.4)' }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-grotesk font-bold tracking-tight text-white text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        <div className="mt-6 max-w-2xl text-base sm:text-lg text-[#c3cdcd] leading-relaxed [text-wrap:pretty]">{lede}</div>
        {actions && <div className="mt-9 flex flex-wrap gap-3">{actions}</div>}
      </div>

      {cue && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 text-[11px] font-grotesk tracking-[0.2em] uppercase text-white/60">
          {cue}
          <ChevronDown className="w-4 h-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
        </div>
      )}
    </section>
  )
}

const DEPTH_ZONES = [
  { at: 0, label: 'Surface' },
  { at: 0.2, label: 'Twilight zone' },
  { at: 0.45, label: 'Midnight zone' },
  { at: 0.7, label: 'Abyss' },
  { at: 0.92, label: 'Benthic floor' },
]

export const MAX_STORY_DEPTH_M = 4000

export function depthReadout(progress: number) {
  const meters = Math.round((Math.min(1, Math.max(0, progress)) * MAX_STORY_DEPTH_M) / 10) * 10
  const zone = [...DEPTH_ZONES].reverse().find((z) => progress >= z.at) ?? DEPTH_ZONES[0]
  return { meters, zone: zone.label }
}

/**
 * Wide-screen readout of how far down the story the reader has scrolled.
 * The page is the dive: the top is the surface, the end is four thousand meters down.
 */
export const DepthGauge: React.FC<{ targetRef: React.RefObject<HTMLElement | null> }> = ({ targetRef }) => {
  const [progress, setProgress] = useState(0)
  useScrollProgress(
    targetRef,
    (p) => setProgress((prev) => (Math.abs(prev - p) > 0.002 ? p : prev)),
    'pin',
  )
  const { meters, zone } = depthReadout(progress)

  return (
    <div
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-3 pointer-events-none"
      aria-hidden="true"
    >
      <div className="text-right font-grotesk">
        <p className="text-[10px] tracking-[0.25em] uppercase text-white/45">Depth</p>
        <p className="text-lg font-bold text-white tabular-nums">{meters.toLocaleString('en-US')} m</p>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#00c3ff]">{zone}</p>
      </div>
      <div className="relative h-48 w-[3px] rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-[#38bdf8] via-[#00c3ff] to-[#00ffcc]"
          style={{ height: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
