import React from 'react'

export interface HeaderBrandProps {
  subtext?: string
  isCollapsed?: boolean
  onClick?: () => void
  className?: string
  logoSize?: 'sm' | 'md'
  variant?: 'benthic' | 'corporate'
}

export const HeaderBrand: React.FC<HeaderBrandProps> = ({
  subtext = 'MOLTOLOGY.ORG FOUNDATION',
  isCollapsed = false,
  onClick,
  className = '',
  logoSize = 'md',
  variant = 'benthic',
}) => {
  const sizeClasses = logoSize === 'sm' ? 'w-7 h-7' : 'w-10 h-10'
  const titleSizeClasses = logoSize === 'sm' ? 'text-xs' : 'text-base sm:text-lg'
  const isCorporate = variant === 'corporate'

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 cursor-pointer group shrink-0 select-none max-w-full overflow-hidden ${className}`}
    >
      {/* Emblem Logo */}
      <div className={`${sizeClasses} flex items-center justify-center shrink-0`}>
        <img
          src="/images/order_emblem.webp"
          alt="Order Emblem"
          width={40}
          height={40}
          className={`w-full h-full object-contain transition-all duration-300 ${
            isCorporate
              ? 'filter drop-shadow-[0_2px_4px_rgba(2,132,199,0.25)] group-hover:drop-shadow-[0_0_8px_rgba(2,132,199,0.45)]'
              : 'filter drop-shadow-[0_2px_5px_rgba(0,195,255,0.35)] group-hover:drop-shadow-[0_0_10px_rgba(0,195,255,0.6)]'
          }`}
        />
      </div>

      {/* Brand Title & Subtext */}
      {!isCollapsed && (
        <div className="overflow-hidden whitespace-nowrap min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
          <div
            className={`font-grotesk font-extrabold ${titleSizeClasses} tracking-widest uppercase flex items-center gap-2 transition-all duration-300 leading-tight ${
              isCorporate
                ? 'text-sky-950 group-hover:text-sky-700'
                : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [text-shadow:0_0_12px_rgba(0,195,255,0.3)] group-hover:[text-shadow:0_0_18px_rgba(0,195,255,0.65)]'
            }`}
          >
            <span>THE SYNAPTIC PATH</span>
          </div>
          <div
            className={`text-[10px] font-bold tracking-widest uppercase truncate mt-0.5 ${
              isCorporate
                ? 'text-sky-600'
                : 'text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_8px_rgba(0,195,255,0.5)]'
            }`}
          >
            <span className="truncate">{subtext}</span>
          </div>
        </div>
      )}
    </div>
  )
}
