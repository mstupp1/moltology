import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  Flame,
  Pause,
  Play,
  Sparkles,
  Radio,
} from 'lucide-react'
import { formatNewsTitle } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { HudButton } from '@/components/ui/HudButton'

interface BlogTopSliderProps {
  posts: BlogPostData[]
  onSelectPost: (slug: string) => void
  autoPlayIntervalMs?: number
}

export function BlogTopSlider({
  posts,
  onSelectPost,
  autoPlayIntervalMs = 6000,
}: BlogTopSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next')
  const [progressPercent, setProgressPercent] = useState(0)

  const featuredPosts = posts.slice(0, 5)
  const currentPost = featuredPosts[currentIndex] || featuredPosts[0]

  const goToNext = useCallback(() => {
    if (featuredPosts.length <= 1) return
    setSlideDirection('next')
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % featuredPosts.length)
    setProgressPercent(0)
    setTimeout(() => setIsAnimating(false), 400)
  }, [featuredPosts.length])

  const goToPrev = useCallback(() => {
    if (featuredPosts.length <= 1) return
    setSlideDirection('prev')
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length)
    setProgressPercent(0)
    setTimeout(() => setIsAnimating(false), 400)
  }, [featuredPosts.length])

  const goToIndex = useCallback(
    (index: number) => {
      if (index === currentIndex || featuredPosts.length <= 1) return
      setSlideDirection(index > currentIndex ? 'next' : 'prev')
      setIsAnimating(true)
      setCurrentIndex(index)
      setProgressPercent(0)
      setTimeout(() => setIsAnimating(false), 400)
    },
    [currentIndex, featuredPosts.length]
  )

  // Auto-play progress loop
  useEffect(() => {
    if (isPaused || featuredPosts.length <= 1) {
      return
    }

    const stepMs = 50
    const increment = (stepMs / autoPlayIntervalMs) * 100

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          goToNext()
          return 0
        }
        return prev + increment
      })
    }, stepMs)

    return () => clearInterval(interval)
  }, [isPaused, autoPlayIntervalMs, featuredPosts.length, goToNext])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrev()
    if (e.key === 'ArrowRight') goToNext()
  }

  if (!currentPost) return null

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden chitin-card border border-line-subtle bg-surface-1 hud-sheen rounded-panel shadow-sheen-inset group focus:outline-none focus-visible:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow transition-all duration-300"
    >
      {/* Top Animated Progress Bar */}
      <div className="w-full h-1 bg-surface-3 relative overflow-hidden">
        <div
          className="h-full bg-cyan-glow transition-all duration-75 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Slide Card Container */}
      <div className="relative p-6 sm:p-10 min-h-[440px] flex flex-col justify-between">
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header HUD Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-subtle">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-crimson-soft border border-crimson-aggro/50 text-crimson-text font-sans font-bold text-[11px] tracking-[0.08em] uppercase rounded-chip">
              <Flame className="w-3.5 h-3.5 text-crimson-aggro animate-pulse" />
              <span>LEAD NEWS DISPATCH · BREAKING COVERAGE #{String(currentIndex + 1).padStart(2, '0')}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-soft border border-line-subtle text-cyan-glow font-sans font-bold text-[11px] uppercase tracking-[0.08em] rounded-chip">
              <Radio className="w-3 h-3 text-cyan-glow animate-ping" />
              <span>{currentPost.category}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 font-sans text-xs text-ink-muted">
            <span className="text-cyan-glow font-bold">
              {String(currentIndex + 1).padStart(2, '0')} / {String(featuredPosts.length).padStart(2, '0')}
            </span>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
              className="p-1.5 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink-body hover:text-ink rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Slide Animated Content Body */}
        <div
          className={`relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6 transition-all duration-400 ease-out ${
            isAnimating
              ? slideDirection === 'next'
                ? 'opacity-30 translate-x-4 scale-[0.99]'
                : 'opacity-30 -translate-x-4 scale-[0.99]'
              : 'opacity-100 translate-x-0 scale-100'
          }`}
        >
          {/* Left Column: Text & Meta */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <h2
                onClick={() => onSelectPost(currentPost.slug)}
                className="font-grotesk font-black text-2xl sm:text-4xl lg:text-5xl text-ink uppercase tracking-tight leading-tight hover:text-cyan-glow transition-colors cursor-pointer drop-shadow-md"
              >
                {formatNewsTitle(currentPost.title).headline}
              </h2>

              {formatNewsTitle(currentPost.title).subtitle && (
                <p className="font-sans text-sm sm:text-base text-ink-body font-medium leading-snug">
                  {formatNewsTitle(currentPost.title).subtitle}
                </p>
              )}

              <p className="text-xs sm:text-sm text-ink-body font-sans leading-relaxed line-clamp-3">
                {currentPost.summary}
              </p>
            </div>

            {/* Author & Read Time Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-sans pt-2">
              <div className="flex items-center gap-2.5 bg-surface-2 px-3 py-1.5 border border-line-subtle rounded-control">
                <img
                  src={currentPost.authorAvatar}
                  alt={currentPost.authorName}
                  className="w-6 h-6 rounded-full border border-line object-cover"
                />
                <span className="text-ink font-bold">{currentPost.authorName}</span>
              </div>

              <div className="flex items-center gap-1.5 text-ink-muted">
                <Clock className="w-3.5 h-3.5 text-cyan-glow" />
                <span>{currentPost.readTimeMinutes} MIN READ</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-3">
              <HudButton
                variant="primary"
                size="lg"
                onClick={() => onSelectPost(currentPost.slug)}
                iconPosition="right"
                icon={<ArrowRight className="w-4 h-4 group-hover/hudbtn:translate-x-1.5 transition-transform" />}
              >
                READ DISPATCH
              </HudButton>
            </div>
          </div>

          {/* Right Column: Hero Cover Frame */}
          <div className="lg:col-span-5 relative group/img cursor-pointer" onClick={() => onSelectPost(currentPost.slug)}>
            <div className="relative border border-line-subtle rounded-card overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-abyss transition-all duration-500 group-hover/img:border-line-strong">
              <img
                src={currentPost.coverImageUrl}
                alt={currentPost.title}
                className="w-full h-56 sm:h-72 object-cover transform group-hover/img:scale-105 transition-transform duration-700 filter brightness-95 group-hover/img:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent opacity-70" />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-sans text-cyan-glow bg-abyss/85 backdrop-blur-md px-3 py-1.5 border border-line-subtle rounded-control">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-glow" />
                  <span>SYNAPTIC FRAME</span>
                </span>
                <span className="text-ink-muted">CLICK TO VIEW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Controls */}
        <div className="relative z-10 pt-4 border-t border-line-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Interactive Slide Thumbnail Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {featuredPosts.map((post, idx) => (
              <button
                key={post.slug}
                onClick={() => goToIndex(idx)}
                className={`relative px-3 py-1.5 text-[11px] font-sans font-bold uppercase transition-all duration-300 rounded-control flex items-center gap-2 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  idx === currentIndex
                    ? 'bg-surface-2 text-ink border-cyan-glow/40'
                    : 'bg-surface-1 text-ink-muted hover:text-ink hover:bg-surface-2 border-line-subtle hover:border-line-hover'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" style={{ opacity: idx === currentIndex ? 1 : 0.4 }} />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{formatNewsTitle(post.title).headline}</span>
              </button>
            ))}
          </div>

          {/* Navigation Arrows & Dot Indicators */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {featuredPosts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    idx === currentIndex
                      ? 'w-6 bg-cyan-glow'
                      : 'w-2 bg-surface-3 hover:bg-ink-muted/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Glass Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={goToPrev}
                aria-label="Previous slide"
                className="p-2 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink-body hover:text-ink rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow transition-all transform active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNext}
                aria-label="Next slide"
                className="p-2 bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink-body hover:text-ink rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow transition-all transform active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
