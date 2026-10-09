import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { displayCopy, toSentenceCaseLines } from '@/lib/composite-copy'
import { BrandIcon, BrandWordmark } from '@/components/ui/BrandMark'

/**
 * Shared pieces for composite templates, matching the main site after the UI tightening
 * (docs/design/ui-tokens.md): night-sea ground, quiet surfaces, sentence-case type,
 * one cyan action with the cut corner, and The Synaptic Path lockup.
 */

export type CompositeTone = 'cyan' | 'crimson' | 'neutral'

/** Small dot + sentence-case label, like the homepage hero badge. */
export function CompositePill({
  children,
  tone = 'cyan',
  className,
}: {
  children: React.ReactNode
  tone?: CompositeTone
  className?: string
}) {
  const text = typeof children === 'string' ? displayCopy(children) : children
  return (
    <div
      className={cn(
        'inline-flex w-fit self-start items-center gap-3 rounded-chip border border-line-subtle bg-surface-1/80 px-5 py-2.5 text-[24px] font-medium leading-none text-ink-body',
        className
      )}
    >
      <span
        className={cn(
          'h-2.5 w-2.5 shrink-0 rounded-full',
          tone === 'crimson' ? 'bg-crimson-aggro' : tone === 'neutral' ? 'bg-ink-muted' : 'bg-cyan-glow'
        )}
      />
      <span>{text}</span>
    </div>
  )
}

/** Uppercase tracked label: the one place composites keep capitals. */
export function CompositeLabel({
  children,
  tone = 'cyan',
  className,
}: {
  children: React.ReactNode
  tone?: CompositeTone
  className?: string
}) {
  return (
    <div
      className={cn(
        'text-[18px] font-bold uppercase leading-tight tracking-[0.14em]',
        tone === 'crimson' ? 'text-crimson-text' : tone === 'neutral' ? 'text-ink-muted' : 'text-cyan-glow',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Headline in sentence case: white lines, with the accent line in crimson like the
 * homepage's "Grow a shell." Split props are read as one sentence for casing.
 */
export function CompositeHeadline({
  lines,
  accent,
  accentTone = 'crimson',
  size = 72,
  align = 'left',
  className,
}: {
  lines: Array<string | undefined>
  accent?: string
  accentTone?: 'crimson' | 'cyan'
  size?: number
  align?: 'left' | 'center'
  className?: string
}) {
  const plain = lines.filter((l): l is string => Boolean(l))
  const cased = toSentenceCaseLines(accent ? [...plain, accent] : plain)
  const body = accent ? cased.slice(0, -1) : cased
  const accentLine = accent ? cased[cased.length - 1] : undefined
  return (
    <h1
      className={cn(
        'font-bold tracking-[-0.02em] text-ink [text-wrap:balance]',
        align === 'center' && 'text-center',
        className
      )}
      style={{ fontSize: `${size}px`, lineHeight: 1.04 }}
    >
      {body.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
      {accentLine && (
        <span
          className={cn('block', accentTone === 'cyan' ? 'text-cyan-glow' : 'text-crimson-aggro')}
          style={{
            textShadow:
              accentTone === 'cyan' ? '0 0 32px rgba(0, 195, 255, 0.25)' : '0 0 32px rgba(255, 69, 58, 0.28)',
          }}
        >
          {accentLine}
        </span>
      )}
    </h1>
  )
}

/** Card surface. `featured` adds the cyan corner ticks used on the site's featured panels. */
export function CompositePanel({
  children,
  tone = 'neutral',
  featured = false,
  className,
}: {
  children: React.ReactNode
  tone?: CompositeTone
  featured?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-card border p-7 hud-sheen',
        tone === 'crimson'
          ? 'border-crimson-aggro/35 bg-surface-crimson/95'
          : tone === 'cyan'
            ? 'border-line-strong bg-surface-1/95'
            : 'border-line-subtle bg-surface-1/90',
        featured && 'hud-ticks',
        className
      )}
    >
      {children}
    </div>
  )
}

/** Big number + caption, used in metric panels. */
export function CompositeMetric({
  label,
  value,
  caption,
  description,
  tone = 'cyan',
  valueSize = 60,
  className,
}: {
  label: string
  value: string
  caption?: string
  description?: string
  tone?: CompositeTone
  valueSize?: number
  className?: string
}) {
  return (
    <CompositePanel tone={tone === 'cyan' ? 'cyan' : tone} featured={tone === 'cyan'} className={className}>
      <CompositeLabel tone={tone}>{label}</CompositeLabel>
      <div
        className="mt-4 font-bold tracking-[-0.02em] text-ink"
        style={{ fontSize: `${valueSize}px`, lineHeight: 1 }}
      >
        {displayCopy(value)}
      </div>
      {caption && <div className="mt-3 text-[20px] font-medium text-ink-muted">{displayCopy(caption)}</div>}
      {description && <p className="mt-3 text-[20px] leading-snug text-ink-body">{displayCopy(description)}</p>}
    </CompositePanel>
  )
}

/** Bullet list with small square cyan markers. */
export function CompositeBullets({
  items,
  tone = 'cyan',
  size = 22,
  className,
}: {
  items: string[]
  tone?: CompositeTone
  size?: number
  className?: string
}) {
  return (
    <ul className={cn('space-y-3 text-ink-body', className)} style={{ fontSize: `${size}px` }}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3.5 leading-snug">
          <span
            className={cn(
              'mt-[0.45em] h-2 w-2 shrink-0 rounded-chip',
              tone === 'crimson' ? 'bg-crimson-aggro' : 'bg-cyan-glow'
            )}
          />
          <span>{displayCopy(item)}</span>
        </li>
      ))}
    </ul>
  )
}

/** The one primary action: solid cyan, dark text, cut top-right corner. */
export function CompositeCta({
  children,
  size = 'md',
  arrow = true,
  className,
}: {
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
  arrow?: boolean
  className?: string
}) {
  const sizes = {
    md: 'px-8 py-4 text-[24px] [--hud-cut:14px]',
    lg: 'px-10 py-5 text-[30px] [--hud-cut:18px]',
    xl: 'px-12 py-7 text-[44px] [--hud-cut:24px]',
  }[size]
  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'hud-cut inline-flex w-full items-center justify-center gap-4 rounded-control bg-cyan-glow font-bold tracking-[-0.01em] text-abyss',
          sizes
        )}
        style={{ boxShadow: '0 0 40px rgba(0, 195, 255, 0.25)' }}
      >
        <span>{children}</span>
        {arrow && <ArrowRight className="h-[1em] w-[1em] shrink-0 stroke-[2.5]" />}
      </div>
    </div>
  )
}

/** Quiet secondary line: text with a cyan arrow, like "Ask the Oracle →". */
export function CompositeLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const text = typeof children === 'string' ? displayCopy(children) : children
  return (
    <div className={cn('inline-flex items-center gap-3 text-[24px] font-semibold text-cyan-glow', className)}>
      <span>{text}</span>
      <ArrowRight className="h-6 w-6 stroke-[2.5]" />
    </div>
  )
}

/** The Synaptic Path lockup (emblem + outlined wordmark + subtitle), as in the site header. */
export function CompositeBrand({
  size = 'md',
  subtitle = 'MOLTOLOGY.ORG FOUNDATION',
  stacked = false,
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string | null
  stacked?: boolean
  className?: string
}) {
  const s = {
    sm: { icon: 'h-12 w-12', word: 'h-[18px]', sub: 'h-[11px]', gap: 'gap-3' },
    md: { icon: 'h-16 w-16', word: 'h-6', sub: 'h-[13px]', gap: 'gap-4' },
    lg: { icon: 'h-40 w-40', word: 'h-12', sub: 'h-6', gap: 'gap-6' },
  }[size]
  return (
    <div className={cn('inline-flex items-center', stacked ? 'flex-col text-center' : '', s.gap, className)}>
      <BrandIcon aria-hidden="true" className={cn(s.icon, 'shrink-0')} />
      <div className={cn('flex flex-col', stacked ? 'items-center gap-3' : 'gap-1.5')}>
        <span className="text-ink">
          <BrandWordmark text="THE SYNAPTIC PATH" className={s.word} />
        </span>
        {subtitle && (
          <span className="text-cyan-glow">
            <BrandWordmark text={subtitle} className={s.sub} />
          </span>
        )}
      </div>
    </div>
  )
}

/** Bottom rule with a swipe cue on the left and the lockup on the right. */
export function CompositeFooter({
  cue,
  right,
  className,
}: {
  cue?: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between border-t border-line-subtle pt-6', className)}>
      {cue ? <CompositeLink className="text-[22px] text-ink-body [&_svg]:text-cyan-glow">{cue}</CompositeLink> : <span />}
      {right === undefined ? <CompositeBrand size="sm" /> : right}
    </div>
  )
}
