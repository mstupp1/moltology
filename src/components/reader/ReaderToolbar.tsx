import React from 'react'
import { BookOpen, Feather, FileText, Minus, Moon, Plus } from 'lucide-react'
import { PaperReaderTheme, READER_FONT_SIZE } from '@/lib/paper-palette'
import { cn } from '@/lib/utils'

export const READER_THEME_OPTIONS: {
  key: PaperReaderTheme
  label: string
  icon: React.ElementType
}[] = [
  { key: 'paper', label: 'Paper', icon: FileText },
  { key: 'parchment', label: 'Parchment', icon: Feather },
  { key: 'night', label: 'Night', icon: Moon },
]

interface ReaderToolbarProps {
  label?: string
  theme: PaperReaderTheme
  onThemeChange: (theme: PaperReaderTheme) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  extra?: React.ReactNode
  className?: string
}

/**
 * Shared reader control strip for document readers: sheet theme selector and
 * type scale stepper, with an optional slot for reader-specific actions.
 */
export function ReaderToolbar({
  label = 'Reader',
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  extra,
  className,
}: ReaderToolbarProps) {
  return (
    <div
      data-testid="reader-toolbar"
      className={cn(
        'no-print flex flex-wrap items-center justify-between gap-3 border border-[#3a4a49]/60 bg-[#070b0b]/90 px-3 py-2 chamfer-corner',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#00c3ff] uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          {label}
        </span>

        <div className="flex items-center gap-1" role="group" aria-label="Reading theme">
          {READER_THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = theme === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={active}
                onClick={() => onThemeChange(opt.key)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 text-[9px] font-sans uppercase tracking-widest border transition-colors chamfer-corner',
                  active
                    ? 'bg-[#00c3ff]/20 border-[#00c3ff]/70 text-[#00c3ff]'
                    : 'bg-transparent border-[#3a4a49]/60 text-[#839493] hover:text-[#dfe3e3] hover:border-[#00c3ff]/40'
                )}
              >
                <Icon className="w-3 h-3" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[9px] font-sans uppercase tracking-widest text-[#839493]">Type</span>
          <button
            type="button"
            aria-label="Decrease font size"
            onClick={() => onFontSizeChange(Math.max(READER_FONT_SIZE.min, fontSize - 1))}
            className="w-6 h-6 inline-flex items-center justify-center border border-[#3a4a49]/60 text-[#839493] hover:text-[#00c3ff] hover:border-[#00c3ff]/40 chamfer-corner transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-7 text-center text-[10px] font-sans text-[#dfe3e3]">{fontSize}px</span>
          <button
            type="button"
            aria-label="Increase font size"
            onClick={() => onFontSizeChange(Math.min(READER_FONT_SIZE.max, fontSize + 1))}
            className="w-6 h-6 inline-flex items-center justify-center border border-[#3a4a49]/60 text-[#839493] hover:text-[#00c3ff] hover:border-[#00c3ff]/40 chamfer-corner transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {extra}
      </div>
    </div>
  )
}
