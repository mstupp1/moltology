import React from 'react'

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
    sm: 'text-2xl sm:text-3xl',
    md: 'text-3xl sm:text-4xl md:text-5xl',
    lg: 'text-4xl sm:text-6xl md:text-7xl',
  }[size]

  const isLight = theme === 'light'

  return (
    <div
      className={`inline-flex flex-col items-center text-center ${
        align === 'center' ? 'self-center' : 'self-start'
      } max-w-full min-w-0 select-none ${className}`}
    >
      <div className={`whitespace-nowrap font-grotesk font-black uppercase tracking-[-0.065em] leading-none ${sizeClasses}`}>
        <span className="text-crimson-aggro">MOLT</span><span className={isLight ? 'text-gray-900' : 'text-ink'}>NATION</span>
      </div>
      <div aria-hidden="true" className="mt-2 flex h-px w-12 sm:w-16">
        <span className="flex-1 bg-crimson-aggro/60" />
        <span className={`flex-1 ${isLight ? 'bg-gray-400/60' : 'bg-ink/60'}`} />
        <span className="flex-1 bg-blue-400/60" />
      </div>
      <span
        className={`w-full pt-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] sm:tracking-[0.2em] ${
          isLight ? 'text-gray-600' : 'text-ink-muted'
        }`}
      >
        ONE NATION UNDER CHITIN
      </span>
    </div>
  )
}
