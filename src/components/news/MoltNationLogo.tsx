import React from 'react'
import { BrandIcon } from '../ui/BrandMark'

export interface MoltNationLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  theme?: 'light' | 'dark'
  align?: 'left' | 'center'
}

export const MoltNationLogo: React.FC<MoltNationLogoProps> = ({
  className = '',
  size = 'md',
  theme = 'dark',
  align = 'left',
}) => {
  const sizeClasses = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl sm:text-2xl md:text-3xl',
    lg: 'text-2xl sm:text-4xl md:text-5xl',
  }[size]

  const isLight = theme === 'light'
  const isCenter = align === 'center'

  return (
    <div
      className={`inline-flex items-center ${
        isCenter ? 'justify-center text-center sm:text-left' : 'text-left'
      } gap-2.5 sm:gap-3.5 font-grotesk font-black uppercase tracking-tight select-none max-w-full min-w-0 ${className}`}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <BrandIcon
          aria-hidden="true"
          className={
            size === 'sm'
              ? 'w-7 h-7 sm:w-8 sm:h-8'
              : size === 'lg'
              ? 'w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16'
              : 'w-8 h-8 sm:w-11 sm:h-11'
          }
        />
      </div>

      {/* Brand Text Block */}
      <div className={`flex flex-col ${isCenter ? 'items-center sm:items-start text-center sm:text-left' : 'items-start text-left'} min-w-0`}>
        <div className={`flex items-center gap-1.5 leading-none ${sizeClasses}`}>
          <span className="text-crimson-aggro font-black tracking-tight">MOLT</span>
          <span className={isLight ? 'text-gray-900 font-black tracking-tight' : 'text-gray-100 font-black tracking-tight'}>
            NATION
          </span>
          <span className="text-cyan-400 text-[10px] sm:text-xs font-sans px-1.5 sm:px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/60 rounded font-bold tracking-widest self-center ml-1 shadow-hud-cyan shrink-0">
            NEWS ★
          </span>
        </div>
        <span
          className={`text-[9px] sm:text-[10px] font-sans tracking-wider sm:tracking-[0.2em] font-medium pt-1 ${
            isLight ? 'text-gray-600' : 'text-gray-400'
          }`}
        >
          ONE NATION UNDER CHITIN
        </span>
      </div>
    </div>
  )
}
