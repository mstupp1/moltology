import React, { useEffect, useRef } from 'react'
import { BrandIcon } from '@/components/ui/BrandMark'
import { getAssetUrl } from '@/lib/assets'
import { COMPOSITE_DIMENSIONS, type CompositeAspectRatio } from './CompositeContainer'
import { getMascotUrl, type MascotKey } from './MascotOverlay'
import {
  BRAND_COLORS,
  boxToStyle,
  defaultFitMin,
  splitHighlights,
  type LayoutLayer,
  type LayoutSpec,
  type LayoutTextLayer,
} from './layout-spec'
import { themeColor, themeFor, type LayoutTheme } from './layout-theme'
import '@/components/benefits/benefits.css'

export interface LayoutSlideProps {
  spec: LayoutSpec
  aspectRatio?: CompositeAspectRatio
  mascot?: MascotKey
  /** Draw the safe-area and box outlines. Studio and debugging only. */
  showGuides?: boolean
}

/** Works for hex, rgb() and named colors alike. */
const withAlpha = (color: string, alpha: number) => `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`

/** Named shadows, or a costume's own text-shadow string passed straight through. */
const textShadow = (name: string) => (name in TEXT_SHADOWS ? TEXT_SHADOWS[name] : name)

const TEXT_SHADOWS: Record<string, string | undefined> = {
  none: undefined,
  soft: '0 2px 12px rgba(0,0,0,0.65)',
  strong: '0 4px 24px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)',
  glow: '0 0 28px rgba(0,195,255,0.55), 0 2px 10px rgba(0,0,0,0.8)',
}

/**
 * Shrinks a text box's font until it fits, after web fonts load. Marks itself with
 * data-fit so the headless capture waits for the final size instead of shooting mid-fit.
 */
function FitText({ layer, theme }: { layer: LayoutTextLayer; theme: LayoutTheme }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const shouldFit = layer.box.h !== undefined && layer.fit !== false

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!shouldFit) {
      el.dataset.fit = 'done'
      return
    }
    let cancelled = false
    const fit = () => {
      if (cancelled) return
      const max = layer.size
      const min = Math.min(layer.minSize ?? defaultFitMin(layer.size), max)
      const fits = (px: number) => {
        el.style.fontSize = `${px}px`
        return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1
      }
      if (!fits(max)) {
        let lo = min
        let hi = max
        while (hi - lo > 0.5) {
          const mid = (lo + hi) / 2
          if (fits(mid)) lo = mid
          else hi = mid
        }
        // At the floor and still too long: flag it so the capture warns instead of clipping silently.
        if (!fits(Math.floor(lo * 2) / 2)) el.dataset.overflow = layer.id || 'text'
      }
      el.dataset.fit = 'done'
    }
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (fonts?.ready) fonts.ready.then(fit, fit)
    else fit()
    return () => {
      cancelled = true
    }
  }, [layer.text, layer.size, layer.minSize, shouldFit, layer.box.w, layer.box.h])

  const valign = layer.valign ?? 'top'
  const runs = splitHighlights(layer.text, layer.highlight)
  const font = layer.font ?? 'display'
  // Headlines take the costume's type treatment; body copy stays plain.
  const headline = font === 'display'

  return (
    <div
      ref={ref}
      data-fit={shouldFit ? 'pending' : 'done'}
      className="absolute flex flex-col overflow-hidden"
      style={{
        ...boxToStyle(layer.box),
        justifyContent: valign === 'center' ? 'center' : valign === 'bottom' ? 'flex-end' : 'flex-start',
        fontFamily: theme.fonts[font],
        fontSize: `${layer.size}px`,
        fontWeight: layer.weight ?? (headline ? theme.headline.weight : theme.costume ? 500 : 700),
        fontStyle: (layer.italic ?? (headline && theme.headline.italic)) ? 'italic' : undefined,
        color: themeColor(theme, layer.color, headline ? theme.text : theme.body),
        textAlign: layer.align ?? 'left',
        lineHeight: layer.lineHeight ?? (headline ? theme.headline.lineHeight : 1.08),
        letterSpacing: (layer.tracking ?? (headline ? theme.headline.tracking : undefined)) !== undefined ? `${layer.tracking ?? theme.headline.tracking}em` : undefined,
        textTransform: (layer.uppercase ?? (headline && theme.headline.uppercase)) ? 'uppercase' : undefined,
        textShadow: textShadow(layer.shadow ?? theme.textShadow),
        opacity: layer.opacity,
        zIndex: layer.z,
        whiteSpace: 'pre-line',
        overflowWrap: 'break-word',
        textWrap: 'balance',
      } as React.CSSProperties}
    >
      <span>
        {runs.map((run, i) =>
          run.hit ? (
            <span key={i} style={{ color: themeColor(theme, layer.highlightColor, theme.highlight) }}>
              {run.text}
            </span>
          ) : (
            <React.Fragment key={i}>{run.text}</React.Fragment>
          )
        )}
      </span>
    </div>
  )
}

/**
 * A costume's take on the lockup, after the landing page headers: the emblem bare or in a disc,
 * tile or seal, the name in the costume's face, and its small extras ("+", "/ai", "the ... Method").
 */
function CostumeLockupLayer({
  layer,
  theme,
  style,
}: {
  layer: Extract<LayoutLayer, { type: 'brand' }>
  theme: LayoutTheme
  style: React.CSSProperties
}) {
  const lockup = theme.lockup!
  const size = layer.size ?? 56
  const variant = layer.variant ?? 'lockup'
  const align = layer.align ?? 'left'
  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  const ink = themeColor(theme, layer.color, theme.text)
  const iconInk = themeColor(theme, lockup.iconColor, lockup.icon === 'bare' ? ink : theme.accentText)
  const framed = lockup.icon === 'disc' || lockup.icon === 'tile' || lockup.icon === 'seal'
  const showIcon = variant !== 'wordmark' && (lockup.icon !== 'none' || variant === 'emblem')
  const iconBox = size * (framed ? 1.05 : 0.9)
  const wordFont = theme.fonts[lockup.font]
  const scriptScale = lockup.font === 'script' ? 1.25 : 1

  return (
    <div className="flex items-center" style={{ ...style, justifyContent: justify, gap: size * 0.26, color: ink }}>
      {showIcon && (
        <span
          className="grid place-items-center shrink-0"
          style={{
            width: iconBox,
            height: iconBox,
            borderRadius: lockup.icon === 'tile' ? iconBox * 0.28 : 999,
            background: framed ? themeColor(theme, lockup.iconBackground, theme.accent) : undefined,
            color: iconInk,
          }}
        >
          <BrandIcon aria-hidden="true" tone="inherit" style={{ width: framed ? iconBox * 0.6 : iconBox, height: framed ? iconBox * 0.6 : iconBox }} />
        </span>
      )}
      {variant !== 'emblem' && (
        <span className="flex flex-col" style={{ textAlign: align }}>
          <span className="flex items-baseline" style={{ gap: size * 0.16, justifyContent: justify }}>
            {lockup.prefix && (
              <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontSize: size * 0.42, lineHeight: 1, textTransform: 'none' }}>
                {lockup.prefix}
              </span>
            )}
            <span
              style={{
                fontFamily: wordFont,
                fontWeight: lockup.weight,
                fontStyle: lockup.italic ? 'italic' : undefined,
                fontSize: size * 0.72 * scriptScale,
                lineHeight: 1,
                letterSpacing: lockup.uppercase ? '0.01em' : '-0.01em',
                textTransform: lockup.uppercase ? 'uppercase' : undefined,
                textShadow: lockup.uppercase && theme.textShadow !== 'none' ? textShadow(theme.textShadow) : undefined,
              }}
            >
              {lockup.word}
            </span>
            {lockup.suffix && lockup.suffixStyle === 'pill' && (
              <span
                style={{
                  alignSelf: 'center',
                  fontFamily: theme.fonts.body,
                  fontWeight: 600,
                  fontSize: size * 0.3,
                  lineHeight: 1,
                  padding: '0.3em 0.7em',
                  borderRadius: 999,
                  background: theme.accent,
                  color: theme.accentText,
                }}
              >
                {lockup.suffix}
              </span>
            )}
            {lockup.suffix && lockup.suffixStyle === 'mark' && (
              <span style={{ fontFamily: theme.fonts.mono, fontWeight: 600, fontSize: size * 0.4, lineHeight: 1, color: themeColor(theme, 'highlight', ink) }}>
                {lockup.suffix}
              </span>
            )}
            {lockup.suffix && lockup.suffixStyle === 'word' && (
              <span style={{ fontFamily: wordFont, fontWeight: lockup.weight, fontSize: size * 0.72, lineHeight: 1, textTransform: lockup.uppercase ? 'uppercase' : undefined, color: theme.highlight }}>
                {lockup.suffix}
              </span>
            )}
          </span>
          {(layer.caption || lockup.sub) && (
            <span
              style={{
                fontFamily: theme.fonts.body,
                fontWeight: 600,
                fontSize: Math.max(16, size * 0.28),
                marginTop: size * 0.14,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: themeColor(theme, 'muted', ink),
              }}
            >
              {layer.caption ?? lockup.sub}
            </span>
          )}
        </span>
      )}
    </div>
  )
}

function renderLayer(layer: LayoutLayer, index: number, fallbackMascot: MascotKey | undefined, theme: LayoutTheme) {
  const color = (value: string | undefined, fallback: string) => themeColor(theme, value, fallback)
  // Labels on pills and buttons: loud costumes letter them in their display face.
  const labelFont = theme.costume && theme.headline.uppercase ? theme.fonts.display : theme.costume ? theme.fonts.body : theme.fonts.display
  const labelWeight = theme.costume && theme.headline.uppercase ? theme.headline.weight : 700
  const key = layer.id || `${layer.type}-${index}`
  const base: React.CSSProperties = {
    ...boxToStyle(layer.box),
    position: 'absolute',
    opacity: layer.opacity,
    zIndex: layer.z,
  }

  switch (layer.type) {
    case 'text':
      return <FitText key={key} layer={layer} theme={theme} />

    case 'panel': {
      const fill = color(layer.color, theme.panel)
      const style = layer.style ?? (theme.costume ? 'solid' : 'glass')
      const background =
        style === 'gradient'
          ? `linear-gradient(160deg, ${fill}, ${color(layer.colorTo, theme.panelTo)})`
          : style === 'outline'
            ? 'transparent'
            : style === 'glass'
              ? `linear-gradient(160deg, ${withAlpha(fill, 0.9)}, ${withAlpha(fill, 0.7)})`
              : fill
      return (
        <div
          key={key}
          style={{
            ...base,
            background,
            borderRadius: layer.radius ?? theme.radius.panel,
            border: `${layer.borderWidth ?? (style === 'solid' ? 0 : 1.5)}px solid ${color(layer.border, theme.line)}`,
            boxShadow: [
              layer.shadow !== false ? (theme.panelShadow ?? '') : '',
              layer.glow ? `0 0 40px ${withAlpha(color(layer.glow, BRAND_COLORS.white), 0.35)}` : '',
              style === 'glass' ? 'inset 0 1px 0 rgba(255,255,255,0.12)' : '',
            ]
              .filter(Boolean)
              .join(', ') || undefined,
            backdropFilter: style === 'glass' ? 'blur(14px)' : undefined,
          }}
        />
      )
    }

    case 'pill': {
      const align = layer.align ?? 'left'
      return (
        <div
          key={key}
          className="flex"
          style={{ ...base, justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}
        >
          <span
            className="inline-flex items-center"
            style={{
              fontFamily: labelFont,
              fontWeight: labelWeight,
              fontSize: `${layer.size ?? 26}px`,
              lineHeight: 1,
              padding: '0.55em 1.1em',
              borderRadius: theme.radius.pill,
              letterSpacing: layer.uppercase ? '0.12em' : '0.01em',
              textTransform: layer.uppercase ? 'uppercase' : undefined,
              color: color(layer.color, theme.pillText),
              background: color(layer.background, theme.pillBackground),
              border: `1.5px solid ${color(layer.border, theme.pillBorder)}`,
              boxShadow: theme.costume ? theme.buttonShadow?.(theme.accent) : undefined,
            }}
          >
            {layer.text}
          </span>
        </div>
      )
    }

    case 'button': {
      const fill = color(layer.color, theme.accent)
      const style = layer.style ?? 'solid'
      return (
        <div
          key={key}
          className="flex items-center justify-center"
          style={{
            ...base,
            fontFamily: labelFont,
            fontWeight: labelWeight,
            fontSize: `${layer.size ?? 40}px`,
            minHeight: layer.box.h === undefined ? '2.4em' : undefined,
            borderRadius: layer.radius ?? theme.radius.button,
            color: color(layer.textColor, style === 'outline' ? fill : theme.accentText),
            background:
              style === 'outline' ? 'transparent' : style === 'gradient' ? `linear-gradient(90deg, ${fill}, ${color('highlight', BRAND_COLORS.sky)})` : fill,
            border: `2px solid ${fill}`,
            boxShadow: style === 'outline' ? undefined : theme.buttonShadow?.(fill),
            gap: '0.4em',
          }}
        >
          <span>{layer.text}</span>
          {layer.arrow && <span aria-hidden>→</span>}
        </div>
      )
    }

    case 'image':
      return (
        <img
          key={key}
          src={getAssetUrl(layer.src)}
          alt=""
          loading="eager"
          decoding="sync"
          style={{
            ...base,
            objectFit: layer.fit ?? 'cover',
            objectPosition: layer.position ?? 'center',
            borderRadius: layer.radius,
            border: layer.border ? `2px solid ${color(layer.border, BRAND_COLORS.white)}` : undefined,
            filter: layer.shadow ? 'drop-shadow(0 24px 40px rgba(0,0,0,0.75))' : undefined,
            transform: [base.transform, layer.flip ? 'scaleX(-1)' : ''].filter(Boolean).join(' ') || undefined,
          }}
        />
      )

    case 'brand': {
      if (theme.lockup) return <CostumeLockupLayer key={key} layer={layer} theme={theme} style={base} />
      const size = layer.size ?? 56
      const variant = layer.variant ?? 'lockup'
      const align = layer.align ?? 'left'
      const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
      return (
        <div key={key} className="flex items-center" style={{ ...base, justifyContent: justify, gap: size * 0.3 }}>
          {variant !== 'wordmark' && (
            <BrandIcon
              aria-hidden="true"
              style={{ width: size * 1.2, height: size * 1.2, objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(0,195,255,0.35))' }}
            />
          )}
          {variant !== 'emblem' && (
            <div className="flex flex-col" style={{ textAlign: align }}>
              <span
                style={{
                  fontFamily: theme.fonts.display,
                  fontWeight: 700,
                  fontSize: size * 0.72,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                  color: color(layer.color, BRAND_COLORS.white),
                }}
              >
                Moltology
              </span>
              {layer.caption && (
                <span
                  style={{
                    fontFamily: theme.fonts.display,
                    fontWeight: 600,
                    fontSize: Math.max(16, size * 0.3),
                    marginTop: size * 0.12,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: BRAND_COLORS.sky,
                  }}
                >
                  {layer.caption}
                </span>
              )}
            </div>
          )}
        </div>
      )
    }

    case 'mascot': {
      const mascotKey = layer.key ?? fallbackMascot
      if (!mascotKey || mascotKey === 'none' || mascotKey === 'random') return null
      return (
        <img
          key={key}
          src={getMascotUrl(mascotKey)}
          alt=""
          loading="eager"
          decoding="sync"
          data-mascot-key={mascotKey}
          style={{
            ...base,
            objectFit: 'contain',
            objectPosition: 'bottom',
            filter: layer.shadow === false ? undefined : 'drop-shadow(0 22px 34px rgba(0,0,0,0.9))',
            transform: [base.transform, layer.flip ? 'scaleX(-1)' : ''].filter(Boolean).join(' ') || undefined,
          }}
        />
      )
    }

    case 'shape': {
      const fill = color(layer.color, theme.accent)
      if (layer.shape === 'line') {
        return <div key={key} style={{ ...base, height: layer.thickness ?? 2, background: fill, borderRadius: 999 }} />
      }
      if (layer.shape === 'glow') {
        return (
          <div
            key={key}
            style={{
              ...base,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${fill} 0%, transparent 70%)`,
              filter: `blur(${layer.blur ?? 40}px)`,
              opacity: layer.opacity ?? 0.35,
            }}
          />
        )
      }
      return (
        <div
          key={key}
          style={{
            ...base,
            background: fill,
            borderRadius: layer.shape === 'circle' ? '50%' : layer.radius,
            filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
          }}
        />
      )
    }

    case 'list': {
      const markerColor = color(layer.markerColor, theme.accent === theme.text ? theme.highlight : theme.accent)
      return (
        <ul
          key={key}
          className="flex flex-col m-0 p-0 list-none"
          style={{
            ...base,
            gap: layer.gap ?? 18,
            fontFamily: theme.fonts[layer.font ?? 'body'],
            fontSize: `${layer.size}px`,
            fontWeight: layer.weight ?? 500,
            lineHeight: 1.25,
            color: color(layer.color, theme.body),
          }}
        >
          {layer.items.map((item, i) => (
            <li key={i} className="flex items-start" style={{ gap: '0.6em' }}>
              {layer.marker !== 'none' && (
                <span aria-hidden style={{ color: markerColor, fontWeight: 700, minWidth: '1em' }}>
                  {layer.marker === 'check' ? '✓' : layer.marker === 'number' ? `${i + 1}.` : layer.marker === 'dash' ? '–' : '•'}
                </span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    }

    case 'stat': {
      const align = layer.align ?? 'left'
      return (
        <div key={key} className="flex flex-col" style={{ ...base, textAlign: align }}>
          <span
            style={{
              fontFamily: theme.fonts.display,
              fontWeight: theme.headline.weight,
              fontStyle: theme.headline.italic ? 'italic' : undefined,
              fontSize: `${layer.size ?? 120}px`,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: color(layer.color, theme.costume ? theme.highlight : theme.accent),
              textShadow: textShadow(theme.textShadow),
            }}
          >
            {layer.value}
          </span>
          {layer.label && (
            <span
              style={{
                fontFamily: theme.fonts.body,
                fontWeight: 500,
                fontSize: `${Math.max(20, Math.round((layer.size ?? 120) * 0.24))}px`,
                marginTop: '0.5em',
                lineHeight: 1.25,
                color: color(layer.labelColor, theme.body),
              }}
            >
              {layer.label}
            </span>
          )}
        </div>
      )
    }
  }
}

/**
 * Renders a LayoutSpec at the native composite size. Unlike the hand-built templates, every
 * pixel here comes from the spec, so recreating a reference ad is a JSON edit.
 */
export const LayoutSlide: React.FC<LayoutSlideProps> = ({ spec, aspectRatio, mascot, showGuides = false }) => {
  const aspect = aspectRatio ?? spec.aspect ?? '4:5'
  const { width, height } = COMPOSITE_DIMENSIONS[aspect] ?? COMPOSITE_DIMENSIONS['4:5']
  const bg = spec.background ?? {}
  const safe = spec.safeArea ?? 4
  const theme = themeFor(spec.costume)

  return (
    <div
      data-composite-root=""
      data-layout-name={spec.name}
      data-costume={spec.costume}
      className="relative overflow-hidden select-none box-border"
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        backgroundColor: themeColor(theme, bg.color, theme.ground),
        backgroundImage: bg.gradient,
        color: theme.body,
        fontFamily: theme.fonts.display,
      }}
    >
      {bg.image && (
        <img
          src={getAssetUrl(bg.image)}
          alt=""
          loading="eager"
          decoding="sync"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: bg.imageOpacity ?? 1, objectPosition: bg.imagePosition ?? 'center' }}
        />
      )}
      {(bg.vignette ?? theme.vignette) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(1,6,14,0.85) 100%)' }}
        />
      )}
      {bg.spotlight && (
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: '55%', background: 'radial-gradient(ellipse at top, rgba(0,195,255,0.2), transparent 70%)' }}
        />
      )}
      {bg.scanlines && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,255,255,0.04) 0px, rgba(0,255,255,0.04) 2px, transparent 2px, transparent 6px)',
          }}
        />
      )}
      {bg.grain && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07] mix-blend-overlay" aria-hidden>
          <filter id="layout-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#layout-grain)" />
        </svg>
      )}

      {spec.layers.map((layer, i) => renderLayer(layer, i, mascot, theme))}

      {showGuides && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
          <div
            className="absolute border-2 border-dashed border-amber-400/70"
            style={{ left: `${safe}%`, top: `${safe}%`, right: `${safe}%`, bottom: `${safe}%` }}
          />
          {spec.layers.map((layer, i) => (
            <div
              key={i}
              className="absolute border border-fuchsia-400/80"
              style={{ ...boxToStyle(layer.box), height: layer.box.h !== undefined ? `${layer.box.h}%` : 24 }}
            >
              <span className="absolute -top-5 left-0 text-[14px] font-mono text-fuchsia-300 bg-black/70 px-1">
                {layer.id || `${layer.type}#${i}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
