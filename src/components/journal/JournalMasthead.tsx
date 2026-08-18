import React from 'react'
import { Link } from '@tanstack/react-router'
import { JOURNAL_META } from '@/lib/journal-data'
import { cn } from '@/lib/utils'

interface JournalMastheadProps {
  variant?: 'hero' | 'compact'
  className?: string
}

/**
 * Academic-style masthead for The Benthic Compendium. "hero" renders the full
 * edition header used on the journal archive; "compact" renders a slim header
 * used atop individual papers.
 */
export const JournalMasthead: React.FC<JournalMastheadProps> = ({
  variant = 'hero',
  className,
}) => {
  const isHero = variant === 'hero'

  return (
    <div className={cn('relative', className)}>
      <Link to="/journal" className="block">
        {/* Top metric bar */}
        <div
          className={cn(
            'flex items-center justify-between border border-[#3a4a49]/60 bg-[#05090a]/80 font-sans',
            isHero ? 'px-4 py-1.5 text-[9px] sm:text-[10px]' : 'px-3 py-1 text-[9px]'
          )}
        >
          <span className="text-[#839493] tracking-widest uppercase">
            {JOURNAL_META.issn}
          </span>
          <span className="text-[#00c3ff] tracking-widest uppercase font-bold">
            {JOURNAL_META.volume} / {JOURNAL_META.issue}
          </span>
          <span className="hidden sm:inline text-[#839493] tracking-widest uppercase">
            {JOURNAL_META.editionDate}
          </span>
        </div>

        {/* Masthead block */}
        <div
          className={cn(
            'bg-[#070b0b]/90 backdrop-blur-sm text-center border-x border-[#3a4a49]/60',
            isHero ? 'py-5 sm:py-7' : 'py-3'
          )}
        >
          <div className="px-4">
            <div
              className={cn(
                'font-cinzel font-bold tracking-[0.18em] text-[#e8f1f1] leading-none',
                isHero
                  ? 'text-2xl sm:text-4xl lg:text-5xl'
                  : 'text-sm sm:text-lg'
              )}
            >
              {JOURNAL_META.name}
            </div>
            <div
              className={cn(
                'font-sans text-[#00c3ff] tracking-[0.28em] uppercase leading-relaxed',
                isHero ? 'mt-2 text-[10px] sm:text-xs' : 'mt-1 text-[9px]'
              )}
            >
              {JOURNAL_META.subtitle}
            </div>
            {isHero && (
              <p className="hidden sm:block mx-auto mt-3 max-w-2xl text-[10px] font-sans tracking-widest uppercase text-[#839493]">
                {JOURNAL_META.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Double rule */}
        <div className="border-x border-[#3a4a49]/60">
          <div className="h-[3px] w-full bg-[#00c3ff]/80" />
          <div className="h-[1px] w-full bg-[#ff5540]/70" />
        </div>
      </Link>
    </div>
  )
}
