import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  pixelateImage,
  getCachedPixelatedImage,
  type PixelateOptions,
} from '@/lib/pixelate-avatar'
import {
  computeLobsterEyeOffset,
  decodeSvgDataUri,
  resolveIdleAnimationPhase,
  stepLobsterEyeOffset,
} from '@/lib/lobster-avatar-idle'

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
}

/**
 * Authentic Pixel-Art Character Avatar Display with Overhead Spotlight & Cinematic Vignette
 * Groups the character sprite and all silhouette-masked overlay layers inside a synchronized wrapper
 * so any scale, translation, or zoom transform applies uniformly to both the sprite and its overlays,
 * preventing ghosting/misalignment.
 */
export const LobsterAvatarDisplay: React.FC<LobsterAvatarDisplayProps> = ({
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
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const animatedRef = useRef<HTMLDivElement>(null)
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

  const idlePhase = useMemo(
    () => resolveIdleAnimationPhase(src, animationSeed),
    [src, animationSeed]
  )

  const idleStyle = useAnimatedSvg
    ? ({ '--lobster-idle-phase': idlePhase } as React.CSSProperties)
    : undefined

  const applyEyeOffset = useCallback((x: number, y: number) => {
    const layer = animatedRef.current?.querySelector('#lobster-eyes-layer')
    if (!(layer instanceof SVGGraphicsElement)) return
    layer.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
  }, [])

  const resetEyeOffset = useCallback(() => {
    const layer = animatedRef.current?.querySelector('#lobster-eyes-layer')
    if (layer instanceof SVGGraphicsElement) {
      layer.style.removeProperty('transform')
    }
  }, [])

  useEffect(() => {
    if (!eyeTracking || !useAnimatedSvg || reducedMotion) {
      resetEyeOffset()
      return
    }

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let raf = 0
    let running = true

    const tick = () => {
      if (!running) return
      const next = stepLobsterEyeOffset(current, target)
      current.x = next.x
      current.y = next.y
      applyEyeOffset(current.x, current.y)
      raf = requestAnimationFrame(tick)
    }

    const onMove = (event: MouseEvent) => {
      const anchor = rootRef.current
      if (!anchor) return
      const offset = computeLobsterEyeOffset(
        event.clientX,
        event.clientY,
        anchor.getBoundingClientRect()
      )
      target.x = offset.x
      target.y = offset.y
    }

    raf = requestAnimationFrame(tick)
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      resetEyeOffset()
    }
  }, [eyeTracking, useAnimatedSvg, reducedMotion, animatedSvgMarkup, applyEyeOffset, resetEyeOffset])

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

  const glowStyles = {
    cyan: 'drop-shadow-[0_0_14px_rgba(0,195,255,0.4)]',
    crimson: 'drop-shadow-[0_0_14px_rgba(255,69,58,0.4)]',
    gold: 'drop-shadow-[0_0_14px_rgba(255,215,0,0.4)]',
    none: '',
  }[glowColor]

  const glowBgColor = {
    cyan: 'bg-[#00c3ff]',
    crimson: 'bg-[#ff453a]',
    gold: 'bg-[#ffd700]',
    none: '',
  }[glowColor]

  const maskSrc = src

  const characterMaskStyle: React.CSSProperties = {
    WebkitMaskImage: `url("${maskSrc}")`,
    maskImage: `url("${maskSrc}")`,
    WebkitMaskSize: 'cover',
    maskSize: 'cover',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }

  const radialMaskStyle: React.CSSProperties = maskRadial
    ? {
        WebkitMaskImage:
          'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 80%)',
        maskImage:
          'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 80%)',
      }
    : {}

  const spriteClasses = `w-full h-full brightness-[0.94] contrast-[1.08] ${glowStyles} ${imgClassName}`

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex items-center justify-center overflow-hidden ${containerClassName}`}
      style={radialMaskStyle}
    >
      {/* 1. Background CRT Scanlines & Cyber Grain across entire card */}
      {terminalEffects && (
        <>
          <div
            data-testid="crt-bg-scanlines"
            className="absolute inset-0 crt-scanlines opacity-30 pointer-events-none z-0"
          />
          <div
            data-testid="crt-bg-grain"
            className="absolute inset-0 crt-grain opacity-20 mix-blend-overlay pointer-events-none z-0"
          />
        </>
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

        {/* CRT Cyber Grain Overlay masked to the character silhouette */}
        {terminalEffects && (
          <div
            data-testid="crt-avatar-grain"
            className="absolute inset-0 crt-grain opacity-25 mix-blend-overlay pointer-events-none z-20"
            style={characterMaskStyle}
          />
        )}
      </div>
    </div>
  )
}
