import React from 'react'
import { cn } from '@/lib/utils'

export interface HudTitlePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  accent?: 'cyan' | 'teal' | 'crimson' | 'green'
  children?: React.ReactNode
}

const ACCENT_CLASS = {
  cyan: { border: 'border-l-[#00ffff]', eyebrow: 'text-[#00ffff]' },
  teal: { border: 'border-l-[#00c3ff]', eyebrow: 'text-[#00c3ff]' },
  crimson: { border: 'border-l-[#ff0000]', eyebrow: 'text-[#ff5540]' },
  green: { border: 'border-l-[#39ff14]', eyebrow: 'text-[#39ff14]' },
} as const

export function HudTitlePanel({
  title,
  eyebrow,
  description,
  actions,
  accent = 'cyan',
  children,
  className,
  ...props
}: HudTitlePanelProps) {
  const accentClasses = ACCENT_CLASS[accent]
  return (
    <div
      className={`${cn(
        'relative overflow-hidden bg-gradient-to-r from-[#0b1011]/85 via-[#0f1616]/85 to-[#0b1011]/85 backdrop-blur-md border border-[#3a4a49] p-3.5 sm:p-4 md:p-5 chamfer-corner shadow-2xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4',
        className
      )} border-l-4 ${accentClasses.border}`}
      {...props}
    >
      <div className="space-y-1.5 max-w-2xl">
        {eyebrow ? (
          <div
            className={cn(
              'flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest',
              accentClasses.eyebrow
            )}
          >
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-[#dfe3e3] tracking-wider uppercase">
          {title}
        </h1>
        {description ? (
          <p className="text-xs text-[#839493] leading-relaxed">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex items-center gap-2.5 pt-2 md:pt-0 border-t border-[#3a4a49]/50 md:border-t-0 md:border-l md:border-l-[#3a4a49]/50 md:pl-5 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
