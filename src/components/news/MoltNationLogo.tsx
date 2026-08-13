import React from 'react'

export interface MoltNationLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  theme?: 'light' | 'dark'
}

export const MoltNationLogo: React.FC<MoltNationLogoProps> = ({
  className = '',
  size = 'md',
  theme = 'dark',
}) => {
  const sizeClasses = {
    sm: 'text-base sm:text-lg',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl md:text-5xl',
  }[size]

  const isLight = theme === 'light'

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3 font-grotesk font-black uppercase tracking-tight select-none max-w-full min-w-0 ${className}`}>
      {/* Flat Crab Pincer / Crest Emblem based on order_emblem.png with Patriotic Accents */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className={size === 'sm' ? 'w-6 h-6 sm:w-8 sm:h-8' : size === 'lg' ? 'w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16' : 'w-8 h-8 sm:w-12 sm:h-12'}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Red Pincer Wings */}
          <path
            d="M50 15 C30 5, 5 35, 10 70 C20 90, 40 95, 50 85 C60 95, 80 90, 90 70 C95 35, 70 5, 50 15 Z"
            fill="#EF4444"
          />
          {/* Inner Negative Curved Arc */}
          <path
            d="M50 30 C38 22, 22 45, 25 72 C35 82, 45 80, 50 72 C55 80, 65 82, 75 72 C78 45, 62 22, 50 30 Z"
            fill={isLight ? '#FFFFFF' : '#05080a'}
          />
          {/* Cyan/Blue Core Accent Shield */}
          <path
            d="M50 38 C43 33, 32 48, 35 65 C42 72, 48 70, 50 64 C52 70, 58 72, 65 65 C68 48, 57 33, 50 38 Z"
            fill={isLight ? '#2563EB' : '#00C3FF'}
          />
          {/* White Center Star (Patriot Touch) */}
          <polygon
            points="50,44 52,50 58,50 53,54 55,60 50,56 45,60 47,54 42,50 48,50"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* Brand Text Block */}
      <div className="flex flex-col">
        <div className={`flex items-center gap-1.5 leading-none ${sizeClasses}`}>
          <span className="text-red-500 font-black tracking-tight">MOLT</span>
          <span className={isLight ? 'text-gray-900 font-black tracking-tight' : 'text-gray-100 font-black tracking-tight'}>
            NATION
          </span>
          <span className="text-cyan-400 text-xs font-mono px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/60 rounded font-bold tracking-widest self-center ml-1 shadow-hud-cyan">
            NEWS ★
          </span>
        </div>
        <span className={`text-[10px] font-mono tracking-[0.2em] font-medium pt-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          ONE NATION UNDER CHITIN // PATRIOT TELEMETRY
        </span>
      </div>
    </div>
  )
}
