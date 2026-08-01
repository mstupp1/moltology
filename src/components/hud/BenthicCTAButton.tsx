import React from 'react'

interface BenthicCTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  price?: string
  variant?: 'red' | 'cyan' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const BenthicCTAButton: React.FC<BenthicCTAButtonProps> = ({
  children,
  price,
  variant = 'red',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-1.5 text-[11px]',
    md: 'px-6 py-2 text-xs',
    lg: 'px-8 py-3 text-sm',
  }[size]

  const variantClasses = {
    red: 'border-2 border-[#ff453a] bg-gradient-to-r from-[#4d1014] via-[#7a1820] to-[#591217] text-white shadow-[0_0_12px_rgba(255,69,58,0.5),inset_0_0_8px_rgba(255,69,58,0.3)] hover:shadow-[0_0_18px_rgba(255,69,58,0.8),inset_0_0_12px_rgba(255,69,58,0.5)] hover:border-[#ff6658]',
    cyan: 'border-2 border-[#00c3ff] bg-gradient-to-r from-[#05222b] via-[#093d4a] to-[#062833] text-white shadow-[0_0_12px_rgba(0,195,255,0.5),inset_0_0_8px_rgba(0,195,255,0.3)] hover:shadow-[0_0_18px_rgba(0,195,255,0.8),inset_0_0_12px_rgba(0,195,255,0.5)] hover:border-[#33d1ff]',
    dark: 'border border-[#3a4a49] bg-gradient-to-r from-[#0d1414] via-[#162020] to-[#0f1717] text-[#dfe3e3] hover:text-white hover:border-[#00c3ff]/70 shadow-[0_0_8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_12px_rgba(0,195,255,0.3)]',
  }[variant]

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {price && (
        <span className="font-mono font-bold text-xs text-[#00c3ff] tracking-tight drop-shadow-[0_0_6px_rgba(0,195,255,0.4)] mb-0.5">
          {price}
        </span>
      )}
      <button
        className={`relative group inline-flex items-center justify-center font-grotesk font-bold uppercase tracking-wider rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer ${variantClasses} ${sizeClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{children}</span>
      </button>
    </div>
  )
}
