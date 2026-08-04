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
import type { BlogPostData } from '@/lib/blog-data'

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
      className="relative w-full overflow-hidden chitin-card border-2 border-cyan-500/40 bg-[#04080a]/90 chamfer-corner-lg shadow-[0_0_50px_rgba(0,195,255,0.08)] group focus:outline-none focus:border-cyan-400/80 transition-all duration-300"
    >
      {/* Top Animated Progress Bar */}
      <div className="w-full h-1 bg-cyan-950/80 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-teal-300 to-cyan-400 transition-all duration-75 ease-linear shadow-[0_0_12px_rgba(0,240,255,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Slide Card Container */}
      <div className="relative p-6 sm:p-10 min-h-[440px] flex flex-col justify-between">
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header HUD Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-900/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/90 border border-red-500/80 text-red-400 font-mono font-bold text-[11px] tracking-wider uppercase chamfer-corner shadow-hud-red">
              <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>LEAD NEWS DISPATCH // BREAKING COVERAGE #{String(currentIndex + 1).padStart(2, '0')}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[10px] uppercase chamfer-corner">
              <Radio className="w-3 h-3 text-cyan-400 animate-ping" />
              <span>{currentPost.category}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-gray-400">
            <span className="text-cyan-400 font-bold">
              {String(currentIndex + 1).padStart(2, '0')} / {String(featuredPosts.length).padStart(2, '0')}
            </span>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
              className="p-1.5 bg-[#080d0e] hover:bg-cyan-950 border border-cyan-900/60 text-gray-300 hover:text-cyan-300 rounded transition-colors"
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
            <div className="space-y-3">
              <h2
                onClick={() => onSelectPost(currentPost.slug)}
                className="font-grotesk font-black text-2xl sm:text-4xl lg:text-5xl text-gray-100 uppercase tracking-tight leading-tight hover:text-cyan-300 transition-colors cursor-pointer drop-shadow-md"
              >
                {currentPost.title}
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed line-clamp-3">
                {currentPost.summary}
              </p>
            </div>

            {/* Author & Read Time Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2">
              <div className="flex items-center gap-2.5 bg-[#090e10] px-3 py-1.5 border border-cyan-900/50 rounded-full">
                <img
                  src={currentPost.authorAvatar}
                  alt={currentPost.authorName}
                  className="w-6 h-6 rounded-full border border-cyan-400/60 object-cover"
                />
                <span className="text-gray-200 font-bold">{currentPost.authorName}</span>
              </div>

              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentPost.readTimeMinutes} MIN READ</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-3">
              <button
                onClick={() => onSelectPost(currentPost.slug)}
                className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-grotesk font-black text-xs uppercase tracking-wider chamfer-corner shadow-[0_0_20px_rgba(0,195,255,0.4)] transition-all transform hover:scale-[1.03] active:scale-95"
              >
                <span>READ DISPATCH</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Hero Cover Frame */}
          <div className="lg:col-span-5 relative group/img cursor-pointer" onClick={() => onSelectPost(currentPost.slug)}>
            <div className="relative border-2 border-cyan-500/50 chamfer-corner-lg overflow-hidden shadow-hud-cyan bg-[#030607] transition-all duration-500 group-hover/img:border-cyan-400 group-hover/img:shadow-[0_0_35px_rgba(0,195,255,0.3)]">
              <img
                src={currentPost.coverImageUrl}
                alt={currentPost.title}
                className="w-full h-56 sm:h-72 object-cover transform group-hover/img:scale-105 transition-transform duration-700 filter brightness-95 group-hover/img:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04080a] via-transparent to-transparent opacity-70" />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-cyan-300 bg-black/85 backdrop-blur-md px-3 py-1.5 border border-cyan-900/60 rounded">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>SYNAPTIC FRAME</span>
                </span>
                <span className="text-gray-400">CLICK TO VIEW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Controls */}
        <div className="relative z-10 pt-4 border-t border-cyan-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Interactive Slide Thumbnail Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {featuredPosts.map((post, idx) => (
              <button
                key={post.slug}
                onClick={() => goToIndex(idx)}
                className={`relative px-3 py-1.5 text-[11px] font-mono font-bold uppercase transition-all duration-300 rounded flex items-center gap-2 border ${
                  idx === currentIndex
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,195,255,0.2)]'
                    : 'bg-[#080d0e]/80 text-gray-400 hover:text-white border-cyan-900/40 hover:border-cyan-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ opacity: idx === currentIndex ? 1 : 0.4 }} />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{post.title}</span>
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
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(0,195,255,0.8)]'
                      : 'w-2 bg-cyan-900/80 hover:bg-cyan-700'
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
                className="p-2 bg-[#080e10] hover:bg-cyan-950 border border-cyan-900/60 hover:border-cyan-400 text-gray-300 hover:text-cyan-300 rounded transition-all transform active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNext}
                aria-label="Next slide"
                className="p-2 bg-[#080e10] hover:bg-cyan-950 border border-cyan-900/60 hover:border-cyan-400 text-gray-300 hover:text-cyan-300 rounded transition-all transform active:scale-90"
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
