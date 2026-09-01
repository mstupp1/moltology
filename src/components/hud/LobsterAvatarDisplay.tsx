import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  pixelateImage,
  getCachedPixelatedImage,
  type PixelateOptions,
} from '@/lib/pixelate-avatar'
import {
  computeLobsterPupilOffset,
  decodeSvgDataUri,
  LOBSTER_EYE_TRACK_FOLLOW_LEFT,
  LOBSTER_EYE_TRACK_FOLLOW_RIGHT,
  resolveIdleAnimationPhase,
  stepLobsterEyeOffset,
  type LobsterPupilSide,
} from '@/lib/lobster-avatar-idle'
import './avatar-animations.css'
import '@/styles/pbr-textures.css'

const PUPIL_SIDES: LobsterPupilSide[] = ['left', 'right']

export interface LobsterAvatarDisplayProps extends PixelateOptions {
  src: string
  alt?: string
  containerClassName?: string
  className?: string
  /** Additional classes applied directly to the inner sprite (img or inline SVG wrapper) */
  imgClassName?: string
  maskRadial?: boolean
  pixelated?: boolean
  crt?: boolean
  glowColor?: 'cyan' | 'crimson' | 'gold' | 'none'
  terminalEffects?: boolean
  lightingSource?: 'overhead' | 'none'
  vignette?: boolean
  /** Enable layered idle breathing/sway animation (default true) */
  animated?: boolean
  /** Optional seed for deterministic animation phase offset */
  animationSeed?: string
  /** Subtle cursor-following eye shift with eased resistance (default on) */
  eyeTracking?: boolean
  /** Contextual Homepage PBR Surface Texture Underlay */
  texture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none' | string
}

/**
 * Authentic Pixel-Art Character Avatar Display with Overhead Spotlight & Cinematic Vignette
 * Groups the character sprite and all silhouette-masked overlay layers inside a synchronized wrapper
 * so any scale, translation, or zoom transform applies uniformly to both the sprite and its overlays,
 * preventing ghosting/misalignment.
 */
export const LobsterAvatarDisplay: React.FC<LobsterAvatarDisplayProps> = React.memo(({
  src,
  alt = 'Your avatar',
  containerClassName = '',
  className = 'w-full h-full object-cover',
  imgClassName = '',
  pixelated = true,
  pixelResolution = 64,
  outputSize = 256,
  crt = true,
  glowColor = 'cyan',
  maskRadial = false,
  terminalEffects = true,
  lightingSource = 'overhead',
  vignette = true,
  animated = true,
  animationSeed,
  eyeTracking = true,
  texture,
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const animatedRef = useRef<HTMLDivElement>(null)
  const leftPupilRef = useRef<SVGGraphicsElement | null>(null)
  const rightPupilRef = useRef<SVGGraphicsElement | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  const useAnimatedSvg = animated && !reducedMotion && src.startsWith('data:image/svg+xml')

  const animatedSvgMarkup = useMemo(() => {
    if (!useAnimatedSvg) return null
    return decodeSvgDataUri(src)
  }, [useAnimatedSvg, src])

  // Cache pupil DOM element references when SVG markup updates
  useEffect(() => {
    if (animatedRef.current) {
      leftPupilRef.current = animatedRef.current.querySelector('#lobster-pupil-left')
      rightPupilRef.current = animatedRef.current.querySelector('#lobster-pupil-right')
    } else {
      leftPupilRef.current = null
      rightPupilRef.current = null
    }
  }, [animatedSvgMarkup])

  const idlePhase = useMemo(
    () => resolveIdleAnimationPhase(src, animationSeed),
    [src, animationSeed]
  )

  const resolvedTexture = useMemo(() => {
    if (texture) return texture
    const match = src.match(/data-texture="([^"]+)"/) || (animatedSvgMarkup ? animatedSvgMarkup.match(/data-texture="([^"]+)"/) : null)
    return match?.[1] ?? null
  }, [texture, src, animatedSvgMarkup])

  const idleStyle = useMemo(
    () => (useAnimatedSvg ? ({ '--lobster-idle-phase': idlePhase } as React.CSSProperties) : undefined),
    [useAnimatedSvg, idlePhase]
  )

  const applyPupilOffsets = useCallback((offsets: Record<LobsterPupilSide, { x: number; y: number }>) => {
    const leftEl = leftPupilRef.current ?? animatedRef.current?.querySelector('#lobster-pupil-left')
    const rightEl = rightPupilRef.current ?? animatedRef.current?.querySelector('#lobster-pupil-right')

    if (leftEl instanceof SVGGraphicsElement) {
      leftEl.style.transform = `translate(${offsets.left.x.toFixed(2)}px, ${offsets.left.y.toFixed(2)}px)`
    }
    if (rightEl instanceof SVGGraphicsElement) {
      rightEl.style.transform = `translate(${offsets.right.x.toFixed(2)}px, ${offsets.right.y.toFixed(2)}px)`
    }
  }, [])

  const resetPupilOffsets = useCallback(() => {
    for (const side of PUPIL_SIDES) {
      const layer = (side === 'left' ? leftPupilRef.current : rightPupilRef.current) ?? animatedRef.current?.querySelector(`#lobster-pupil-${side}`)
      if (layer instanceof SVGGraphicsElement) {
        layer.style.removeProperty('transform')
      }
    }
  }, [])

  // Optimized Eye Tracking: Sleeping rAF loop, throttled bounding rect, IntersectionObserver
  useEffect(() => {
    if (!eyeTracking || !useAnimatedSvg || reducedMotion) {
      resetPupilOffsets()
      return
    }

    const target = {
      left: { x: 0, y: 0 },
      right: { x: 0, y: 0 },
    }
    const current = {
      left: { x: 0, y: 0 },
      right: { x: 0, y: 0 },
    }

    const EPSILON = 0.005
    let rafId = 0
    let isRafRunning = false
    let isVisible = true
    let cachedRect: DOMRect | null = null
    let lastRectTime = 0

    const getAnchorRect = () => {
      const now = performance.now()
      if (!cachedRect || now - lastRectTime > 150) {
        if (rootRef.current) {
          cachedRect = rootRef.current.getBoundingClientRect()
          lastRectTime = now
        }
      }
      return cachedRect
    }

    const tick = () => {
      if (!isRafRunning || !isVisible) return

      current.left = stepLobsterEyeOffset(current.left, target.left, LOBSTER_EYE_TRACK_FOLLOW_LEFT)
      current.right = stepLobsterEyeOffset(current.right, target.right, LOBSTER_EYE_TRACK_FOLLOW_RIGHT)
      applyPupilOffsets(current)

      const dl = Math.hypot(target.left.x - current.left.x, target.left.y - current.left.y)
      const dr = Math.hypot(target.right.x - current.right.x, target.right.y - current.right.y)

      if (dl < EPSILON && dr < EPSILON) {
        // Converged: snap to target once and sleep rAF loop (0% idle CPU)
        current.left.x = target.left.x
        current.left.y = target.left.y
        current.right.x = target.right.x
        current.right.y = target.right.y
        applyPupilOffsets(current)
        isRafRunning = false
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    const startRaf = () => {
      if (!isRafRunning && isVisible) {
        isRafRunning = true
        rafId = requestAnimationFrame(tick)
      }
    }

    const onMove = (event: MouseEvent) => {
      if (!isVisible) return
      const rect = getAnchorRect()
      if (!rect) return
      target.left = computeLobsterPupilOffset(event.clientX, event.clientY, rect, 'left')
      target.right = computeLobsterPupilOffset(event.clientX, event.clientY, rect, 'right')
      startRaf()
    }

    const onScrollOrResize = () => {
      cachedRect = null
    }

    // IntersectionObserver: pause eye tracking when scrolled offscreen
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined' && rootRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          isVisible = entry ? entry.isIntersecting : true
          if (isVisible) {
            startRaf()
          } else if (isRafRunning) {
            isRafRunning = false
            cancelAnimationFrame(rafId)
          }
        },
        { threshold: 0.05 }
      )
      observer.observe(rootRef.current)
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false
        if (isRafRunning) {
          isRafRunning = false
          cancelAnimationFrame(rafId)
        }
      } else {
        isVisible = true
        startRaf()
      }
    }

    // Start initial frame to align resting pupils
    startRaf()
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      isRafRunning = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (observer) observer.disconnect()
      resetPupilOffsets()
    }
  }, [eyeTracking, useAnimatedSvg, reducedMotion, animatedSvgMarkup, applyPupilOffsets, resetPupilOffsets])

  const shouldPixelate = pixelated && !useAnimatedSvg

  const cachedSrc = shouldPixelate
    ? getCachedPixelatedImage(src, { pixelResolution, outputSize })
    : null

  const [displaySrc, setDisplaySrc] = useState<string>(cachedSrc ?? src)

  useEffect(() => {
    if (!shouldPixelate || !src) {
      setDisplaySrc(src)
      return
    }

    const cached = getCachedPixelatedImage(src, { pixelResolution, outputSize })
    if (cached) {
      setDisplaySrc(cached)
      return
    }

    let isMounted = true
    pixelateImage(src, { pixelResolution, outputSize }).then((pixelatedUri) => {
      if (isMounted) {
        setDisplaySrc(pixelatedUri)
      }
    })

    return () => {
      isMounted = false
    }
  }, [src, shouldPixelate, pixelResolution, outputSize])

  const glowStyles = useMemo(() => {
    switch (glowColor) {
      case 'cyan':
        return 'drop-shadow-[0_0_14px_rgba(0,195,255,0.4)]'
      case 'crimson':
        return 'drop-shadow-[0_0_14px_rgba(255,69,58,0.4)]'
      case 'gold':
        return 'drop-shadow-[0_0_14px_rgba(255,215,0,0.4)]'
      default:
        return ''
    }
  }, [glowColor])

  const glowBgColor = useMemo(() => {
    switch (glowColor) {
      case 'cyan':
        return 'bg-[#00c3ff]'
      case 'crimson':
        return 'bg-[#ff453a]'
      case 'gold':
        return 'bg-[#ffd700]'
      default:
        return ''
    }
  }, [glowColor])

  const characterMaskStyle = useMemo((): React.CSSProperties => ({
    WebkitMaskImage: `url("${src}")`,
    maskImage: `url("${src}")`,
    WebkitMaskSize: 'cover',
    maskSize: 'cover',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }), [src])

  const radialMaskStyle = useMemo((): React.CSSProperties => (
    maskRadial
      ? {
          WebkitMaskImage:
            'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 80%)',
          maskImage:
            'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 80%)',
        }
      : {}
  ), [maskRadial])

  const spriteClasses = useMemo(
    () => `w-full h-full brightness-[0.94] contrast-[1.08] ${glowStyles} ${imgClassName}`,
    [glowStyles, imgClassName]
  )

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex items-center justify-center overflow-hidden [contain:paint] ${containerClassName}`}
      style={radialMaskStyle}
    >
      {/* 1. Background CRT Scanlines across entire card */}
      {terminalEffects && (
        <div
          data-testid="crt-bg-scanlines"
          className="absolute inset-0 crt-scanlines opacity-30 pointer-events-none z-0"
        />
      )}

      {/* 2. Overhead Spotlight Cone Light Source */}
      {lightingSource === 'overhead' && (
        <>
          <div
            data-testid="avatar-light-source"
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,195,255,0.24)_0%,rgba(0,195,255,0.05)_55%,transparent_85%)] pointer-events-none z-0"
          />
          <div className="absolute top-0 inset-x-0 h-1/4 bg-gradient-to-b from-[#00c3ff]/18 via-transparent to-transparent pointer-events-none z-0" />
        </>
      )}

      {/* 3. Ambient Background Phosphor Aura */}
      {glowColor !== 'none' && (
        <div
          data-testid="avatar-glow-aura"
          className={`absolute inset-0 rounded-2xl blur-md opacity-20 pointer-events-none z-0 ${glowBgColor}`}
        />
      )}

      {/* 4. Cinematic Background Edge Vignette */}
      {vignette && (
        <div
          data-testid="avatar-vignette"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.45)_65%,rgba(1,4,7,0.85)_100%)] pointer-events-none z-0"
        />
      )}

      {/* 4.5. PBR Surface Texture Underlay (from Homepage) */}
      {resolvedTexture && resolvedTexture !== 'none' && (
        <div
          data-testid="avatar-pbr-texture"
          className={`pbr-underlay pbr-underlay-${resolvedTexture} opacity-40 pointer-events-none z-0`}
        />
      )}

      {/* 5. Synchronized Character Layer (Wraps sprite + all silhouette-masked overlays together so all transforms/scales stay 1:1) */}
      <div className={`relative z-10 w-full h-full flex items-center justify-center ${className}`}>
        {useAnimatedSvg && animatedSvgMarkup ? (
          <div
            ref={animatedRef}
            data-testid="lobster-avatar-inline-svg"
            className={`lobster-avatar-animated ${spriteClasses} [&>svg]:w-full [&>svg]:h-full [image-rendering:pixelated] [image-rendering:crisp-edges]`}
            style={idleStyle}
            dangerouslySetInnerHTML={{ __html: animatedSvgMarkup }}
            role="img"
            aria-label={alt}
          />
        ) : (
          <img
            src={displaySrc}
            alt={alt}
            className={`${spriteClasses} object-cover [image-rendering:pixelated] [image-rendering:crisp-edges]`}
          />
        )}

        {/* Directional Top Illumination Gradient masked to character */}
        {lightingSource === 'overhead' && (
          <div
            data-testid="avatar-character-light"
            className="absolute inset-0 bg-gradient-to-b from-cyan-300/35 via-transparent to-black/40 pointer-events-none z-20 mix-blend-overlay"
            style={characterMaskStyle}
          />
        )}

        {/* CRT Scanline Layer masked strictly to the character silhouette */}
        {crt && (
          <div
            data-testid="crt-avatar-scanlines"
            className="absolute inset-0 crt-avatar-scanlines opacity-50 pointer-events-none z-20"
            style={characterMaskStyle}
          />
        )}

      </div>
    </div>
  )
})

LobsterAvatarDisplay.displayName = 'LobsterAvatarDisplay'
