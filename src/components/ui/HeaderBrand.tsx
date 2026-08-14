import React from 'react'

export interface HeaderBrandProps {
  subtext?: string
  isCollapsed?: boolean
  onClick?: () => void
  className?: string
  logoSize?: 'sm' | 'md'
}

export const HeaderBrand: React.FC<HeaderBrandProps> = ({
  subtext = 'MOLTOLOGY.ORG FOUNDATION',
  isCollapsed = false,
  onClick,
  className = '',
  logoSize = 'md',
}) => {
  const sizeClasses = logoSize === 'sm' ? 'w-7 h-7' : 'w-10 h-10'
  const titleSizeClasses = logoSize === 'sm' ? 'text-xs' : 'text-base sm:text-lg'

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 cursor-pointer group shrink-0 select-none max-w-fit ${className}`}
    >
      {/* Emblem Logo */}
      <div className={`${sizeClasses} flex items-center justify-center shrink-0`}>
        <img
          src="/images/order_emblem.png"
          alt="Order Emblem"
          className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,195,255,0.35)] group-hover:drop-shadow-[0_0_10px_rgba(0,195,255,0.6)] transition-all duration-300"
        />
      </div>

      {/* Brand Title & Subtext */}
      {!isCollapsed && (
        <div className="overflow-hidden whitespace-nowrap min-w-0">
          <div className={`font-grotesk font-extrabold ${titleSizeClasses} text-white tracking-widest uppercase flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [text-shadow:0_0_12px_rgba(0,195,255,0.3)] group-hover:[text-shadow:0_0_18px_rgba(0,195,255,0.65)] transition-all duration-300 leading-tight`}>
            <span>THE SYNAPTIC PATH</span>
          </div>
          <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase truncate flex items-center gap-1.5 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_8px_rgba(0,195,255,0.5)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00ffff] animate-pulse shrink-0" />
            <span className="truncate">{subtext}</span>
          </div>
        </div>
      )}
    </div>
  )
}
