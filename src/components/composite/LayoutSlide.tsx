import React, { useEffect, useRef } from 'react'
import { getAssetUrl } from '@/lib/assets'
import { COMPOSITE_DIMENSIONS, type CompositeAspectRatio } from './CompositeContainer'
import { getMascotUrl, type MascotKey } from './MascotOverlay'
import {
  BRAND_COLORS,
  FONT_STACKS,
  boxToStyle,
  resolveColor,
  splitHighlights,
  type LayoutLayer,
  type LayoutSpec,
  type LayoutTextLayer,
} from './layout-spec'

export interface LayoutSlideProps {
  spec: LayoutSpec
  aspectRatio?: CompositeAspectRatio
  mascot?: MascotKey
  /** Draw the safe-area and box outlines. Studio and debugging only. */
  showGuides?: boolean
}

/** Works for hex, rgb() and named colors alike. */
const withAlpha = (color: string, alpha: number) => `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`

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
function FitText({ layer }: { layer: LayoutTextLayer }) {
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
      const min = Math.min(layer.minSize ?? Math.max(12, Math.round(layer.size * 0.45)), max)
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
        fits(Math.floor(lo * 2) / 2)
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

  return (
    <div
      ref={ref}
      data-fit={shouldFit ? 'pending' : 'done'}
      className="absolute flex flex-col overflow-hidden"
      style={{
        ...boxToStyle(layer.box),
        justifyContent: valign === 'center' ? 'center' : valign === 'bottom' ? 'flex-end' : 'flex-start',
        fontFamily: FONT_STACKS[layer.font ?? 'display'],
        fontSize: `${layer.size}px`,
        fontWeight: layer.weight ?? 700,
        fontStyle: layer.italic ? 'italic' : undefined,
        color: resolveColor(layer.color, BRAND_COLORS.white),
        textAlign: layer.align ?? 'left',
        lineHeight: layer.lineHeight ?? 1.08,
        letterSpacing: layer.tracking !== undefined ? `${layer.tracking}em` : undefined,
        textTransform: layer.uppercase ? 'uppercase' : undefined,
        textShadow: TEXT_SHADOWS[layer.shadow ?? 'soft'],
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
            <span key={i} style={{ color: resolveColor(layer.highlightColor, BRAND_COLORS.cyan) }}>
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

function renderLayer(layer: LayoutLayer, index: number, fallbackMascot: MascotKey | undefined) {
  const key = layer.id || `${layer.type}-${index}`
  const base: React.CSSProperties = {
    ...boxToStyle(layer.box),
    position: 'absolute',
    opacity: layer.opacity,
    zIndex: layer.z,
  }

  switch (layer.type) {
    case 'text':
      return <FitText key={key} layer={layer} />

    case 'panel': {
      const color = resolveColor(layer.color, BRAND_COLORS.navy)
      const style = layer.style ?? 'glass'
      const background =
        style === 'gradient'
          ? `linear-gradient(160deg, ${color}, ${resolveColor(layer.colorTo, BRAND_COLORS.abyss)})`
          : style === 'outline'
            ? 'transparent'
            : style === 'glass'
              ? `linear-gradient(160deg, ${withAlpha(color, 0.9)}, ${withAlpha(color, 0.7)})`
              : color
      return (
        <div
          key={key}
          style={{
            ...base,
            background,
            borderRadius: layer.radius ?? 28,
            border: `${layer.borderWidth ?? (style === 'solid' ? 0 : 1.5)}px solid ${resolveColor(layer.border, 'rgba(0,195,255,0.35)')}`,
            boxShadow: [
              layer.shadow !== false ? '0 24px 60px rgba(0,0,0,0.55)' : '',
              layer.glow ? `0 0 40px ${withAlpha(resolveColor(layer.glow), 0.35)}` : '',
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
            className="inline-flex items-center rounded-full font-bold"
            style={{
              fontFamily: FONT_STACKS.display,
              fontSize: `${layer.size ?? 26}px`,
              lineHeight: 1,
              padding: '0.55em 1.1em',
              letterSpacing: layer.uppercase ? '0.12em' : '0.01em',
              textTransform: layer.uppercase ? 'uppercase' : undefined,
              color: resolveColor(layer.color, BRAND_COLORS.white),
              background: resolveColor(layer.background, 'rgba(0,195,255,0.16)'),
              border: `1.5px solid ${resolveColor(layer.border, 'rgba(0,195,255,0.5)')}`,
            }}
          >
            {layer.text}
          </span>
        </div>
      )
    }

    case 'button': {
      const color = resolveColor(layer.color, BRAND_COLORS.cyan)
      const style = layer.style ?? 'solid'
      return (
        <div
          key={key}
          className="flex items-center justify-center font-bold"
          style={{
            ...base,
            fontFamily: FONT_STACKS.display,
            fontSize: `${layer.size ?? 40}px`,
            minHeight: layer.box.h === undefined ? '2.4em' : undefined,
            borderRadius: layer.radius ?? 999,
            color: resolveColor(layer.textColor, style === 'outline' ? color : BRAND_COLORS.abyss),
            background:
              style === 'outline' ? 'transparent' : style === 'gradient' ? `linear-gradient(90deg, ${color}, ${BRAND_COLORS.sky})` : color,
            border: `2px solid ${color}`,
            boxShadow: style === 'outline' ? undefined : `0 12px 40px ${withAlpha(color, 0.35)}`,
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
            border: layer.border ? `2px solid ${resolveColor(layer.border)}` : undefined,
            filter: layer.shadow ? 'drop-shadow(0 24px 40px rgba(0,0,0,0.75))' : undefined,
            transform: [base.transform, layer.flip ? 'scaleX(-1)' : ''].filter(Boolean).join(' ') || undefined,
          }}
        />
      )

    case 'brand': {
      const size = layer.size ?? 56
      const variant = layer.variant ?? 'lockup'
      const align = layer.align ?? 'left'
      const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
      return (
        <div key={key} className="flex items-center" style={{ ...base, justifyContent: justify, gap: size * 0.3 }}>
          {variant !== 'wordmark' && (
            <img
              src={getAssetUrl('/images/order_emblem.png')}
              alt=""
              loading="eager"
              decoding="sync"
              style={{ width: size * 1.2, height: size * 1.2, objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(0,195,255,0.35))' }}
            />
          )}
          {variant !== 'emblem' && (
            <div className="flex flex-col" style={{ textAlign: align }}>
              <span
                style={{
                  fontFamily: FONT_STACKS.display,
                  fontWeight: 700,
                  fontSize: size * 0.72,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                  color: resolveColor(layer.color, BRAND_COLORS.white),
                }}
              >
                Moltology
              </span>
              {layer.caption && (
                <span
                  style={{
                    fontFamily: FONT_STACKS.display,
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
      const color = resolveColor(layer.color, BRAND_COLORS.cyan)
      if (layer.shape === 'line') {
        return <div key={key} style={{ ...base, height: layer.thickness ?? 2, background: color, borderRadius: 999 }} />
      }
      if (layer.shape === 'glow') {
        return (
          <div
            key={key}
            style={{
              ...base,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
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
            background: color,
            borderRadius: layer.shape === 'circle' ? '50%' : layer.radius,
            filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
          }}
        />
      )
    }

    case 'list': {
      const markerColor = resolveColor(layer.markerColor, BRAND_COLORS.cyan)
      return (
        <ul
          key={key}
          className="flex flex-col m-0 p-0 list-none"
          style={{
            ...base,
            gap: layer.gap ?? 18,
            fontFamily: FONT_STACKS[layer.font ?? 'body'],
            fontSize: `${layer.size}px`,
            fontWeight: layer.weight ?? 500,
            lineHeight: 1.25,
            color: resolveColor(layer.color, BRAND_COLORS.bone),
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
              fontFamily: FONT_STACKS.display,
              fontWeight: 700,
              fontSize: `${layer.size ?? 120}px`,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: resolveColor(layer.color, BRAND_COLORS.cyan),
              textShadow: TEXT_SHADOWS.soft,
            }}
          >
            {layer.value}
          </span>
          {layer.label && (
            <span
              style={{
                fontFamily: FONT_STACKS.body,
                fontWeight: 500,
                fontSize: `${Math.max(20, Math.round((layer.size ?? 120) * 0.24))}px`,
                marginTop: '0.5em',
                lineHeight: 1.25,
                color: resolveColor(layer.labelColor, BRAND_COLORS.bone),
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

  return (
    <div
      data-composite-root=""
      data-layout-name={spec.name}
      className="relative overflow-hidden select-none box-border"
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        backgroundColor: resolveColor(bg.color, BRAND_COLORS.abyss),
        backgroundImage: bg.gradient,
        color: BRAND_COLORS.bone,
        fontFamily: FONT_STACKS.display,
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
      {bg.vignette !== false && (
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

      {spec.layers.map((layer, i) => renderLayer(layer, i, mascot))}

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
