import React from 'react'
import { BrandIcon, BrandWordmark } from './BrandMark'

export interface HeaderBrandProps {
  brandTitle?: string
  subtext?: string
  isCollapsed?: boolean
  onClick?: () => void
  className?: string
  logoSize?: 'sm' | 'md'
  variant?: 'benthic' | 'corporate'
}

export const HeaderBrand: React.FC<HeaderBrandProps> = ({
  brandTitle = 'THE SYNAPTIC PATH',
  subtext = 'MOLTOLOGY.ORG FOUNDATION',
  isCollapsed = false,
  onClick,
  className = '',
  logoSize = 'md',
  variant = 'benthic',
}) => {
  const sizeClasses = logoSize === 'sm' ? 'w-7 h-7' : 'w-8 h-8 sm:w-10 sm:h-10'
  const titleSizeClasses = logoSize === 'sm' ? 'text-xs' : 'text-base sm:text-lg'
  const isCorporate = variant === 'corporate'
  const Container = onClick ? 'button' : 'div'

  return (
    <Container
      {...(onClick ? { type: 'button' as const } : {})}
      onClick={onClick}
      className={`inline-flex items-center gap-3 group shrink-0 select-none max-w-full overflow-hidden text-left ${onClick ? 'cursor-pointer rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow' : ''} ${className}`}
    >
      {/* Emblem Logo */}
      <div className={`${sizeClasses} flex items-center justify-center shrink-0`}>
        <BrandIcon className="w-full h-full shrink-0" />
      </div>

      {/* Brand Title & Subtext */}
      {!isCollapsed && (
        <div className="overflow-hidden whitespace-nowrap min-w-0 animate-in fade-in slide-in-from-left-2 duration-300 motion-reduce:animate-none">
          <div
            className={`font-grotesk font-extrabold ${titleSizeClasses} tracking-widest uppercase flex items-center gap-2 transition-all duration-300 leading-tight ${
              isCorporate
                ? 'text-sky-950 group-hover:text-sky-700'
                : 'text-ink group-hover:text-white'
            }`}
          >
            <BrandWordmark text={brandTitle} className={logoSize === 'sm' ? 'h-4' : 'h-[18px] sm:h-5'} />
          </div>
          <div
            className={`text-[11px] font-bold tracking-widest uppercase truncate mt-0.5 ${
              isCorporate
                ? 'text-sky-600'
                : 'text-cyan-glow'
            }`}
          >
            <BrandWordmark text={subtext} className="h-[11px]" />
          </div>
        </div>
      )}
    </Container>
  )
}
