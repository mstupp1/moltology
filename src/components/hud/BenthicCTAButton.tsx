import React from 'react'
import { HudButton } from '@/components/ui'
import { cn } from '@/lib/utils'

interface BenthicCTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  price?: string
  variant?: 'red' | 'cyan' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  containerClassName?: string
}

export const BenthicCTAButton: React.FC<BenthicCTAButtonProps> = ({
  children,
  price,
  variant = 'red',
  size = 'md',
  fullWidth = false,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const hudVariant = variant === 'red' ? 'crimson' : variant

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', fullWidth && 'w-full', containerClassName)}>
      {price && (
        <span className="font-sans font-bold text-xs text-[#00c3ff] tracking-tight drop-shadow-[0_0_6px_rgba(0,195,255,0.4)] mb-0.5">
          {price}
        </span>
      )}
      <HudButton
        variant={hudVariant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        {...props}
      >
        {children}
      </HudButton>
    </div>
  )
}
