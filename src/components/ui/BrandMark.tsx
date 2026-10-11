import type { CSSProperties, ImgHTMLAttributes, SVGProps } from 'react'
import geometry from './brand-geometry.json'

export const BRAND_ASSET_VERSION = geometry.version
type PartName = keyof typeof geometry.parts
type PartProps = SVGProps<SVGSVGElement> & { part: PartName }

function VectorPart({ part, ...props }: PartProps) {
  const artwork = geometry.parts[part]
  const [, , width, height] = artwork.viewBox.split(' ').map(Number)
  return (
    <svg width={width} height={height} {...props} viewBox={artwork.viewBox} focusable="false">
      <g transform={artwork.transform} fill="currentColor">
        <path fillRule="evenodd" d={artwork.d} />
      </g>
    </svg>
  )
}

export interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, 'part'> {
  label?: string
  tone?: 'app' | 'reference' | 'black' | 'white' | 'inherit'
}

const ICON_TONES = {
  app: 'text-crimson-aggro',
  reference: 'text-[#ef174c]',
  black: 'text-black',
  white: 'text-white',
  inherit: '',
}

/** Inline vector, using the HUD token by default. CSS color can override it. */
export function BrandIcon({ label = 'Order Emblem', tone = 'app', className = '', ...props }: BrandIconProps) {
  const decorative = props['aria-hidden'] === true || props['aria-hidden'] === 'true'
  return (
    <VectorPart
      part="icon"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      className={`${ICON_TONES[tone]} ${className}`}
      {...props}
    />
  )
}

/** Stored avatar/product URLs may still name a raster export. Render the current vector locally. */
type BrandAwareImageProps = ImgHTMLAttributes<HTMLImageElement> & { 'data-testid'?: string }

export function BrandAwareImage({ src, alt, className, style, width, height, ...props }: BrandAwareImageProps) {
  const isEmblem = typeof src === 'string' && /^(?:https?:\/\/(?:www\.)?moltology\.org)?\/?images\/order_emblem\.(?:png|webp|svg)(?:[?#].*)?$/i.test(src)
  if (isEmblem) {
    return (
      <BrandIcon
        label={props['aria-label'] ?? alt}
        aria-hidden={alt === '' ? true : props['aria-hidden']}
        className={className}
        style={style}
        width={width ?? 512}
        height={height ?? 512}
        data-testid={props['data-testid']}
      />
    )
  }
  return <img src={src} alt={alt} className={className} style={style} width={width} height={height} {...props} />
}

const WORDMARK_PARTS: Record<string, PartName> = {
  'THE SYNAPTIC PATH': 'primary',
  'BENTHIC CORE': 'secondary-benthic',
  'MOLTOLOGY.ORG FOUNDATION': 'secondary-foundation',
}

/** Canonical copy is outlined; custom footer/subtitle copy stays live text. */
export function BrandWordmark({ text, className = '', style }: { text: string; className?: string; style?: CSSProperties }) {
  const part = WORDMARK_PARTS[text.trim().toUpperCase()]
  if (!part) return <span>{text}</span>
  return (
    <span className="block">
      <span className="sr-only">{text}</span>
      <VectorPart part={part} aria-hidden="true" className={`block w-auto max-w-full ${className}`} style={style} />
    </span>
  )
}
