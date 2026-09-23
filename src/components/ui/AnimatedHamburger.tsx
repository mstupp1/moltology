import React from 'react'

export interface AnimatedHamburgerProps {
  /** Whether the menu is currently open (X state) or closed (hamburger state) */
  isOpen: boolean
  /** Optional container class name for sizing or color overrides */
  className?: string
  /** Optional class name applied to each of the three bars */
  barClassName?: string
  /** Size preset for the icon: sm (16px), md (20px, default), lg (24px) */
  size?: 'sm' | 'md' | 'lg'
  /** Accessible label or test id */
  'aria-hidden'?: boolean | 'true' | 'false'
}

/**
 * AnimatedHamburger
 *
 * Smooth morphing hamburger icon that transforms into an 'X' icon and vice-versa.
 * Uses GPU-accelerated transforms (translate-y, rotate, scale-x) and opacity transitions
 * calibrated to the Moltology cubic-bezier signature curve.
 */
export const AnimatedHamburger: React.FC<AnimatedHamburgerProps> = ({
  isOpen,
  className = '',
  barClassName = '',
  size = 'md',
  'aria-hidden': ariaHidden = true,
}) => {
  const sizeConfig = {
    sm: {
      container: 'w-4 h-4',
      bar: 'w-4 h-0.5 top-[7px]',
      openTop: 'translate-y-0 rotate-45',
      closedTop: '-translate-y-[5px] rotate-0',
      openBottom: 'translate-y-0 -rotate-45',
      closedBottom: 'translate-y-[5px] rotate-0',
    },
    md: {
      container: 'w-5 h-5',
      bar: 'w-5 h-0.5 top-[9px]',
      openTop: 'translate-y-0 rotate-45',
      closedTop: '-translate-y-[6px] rotate-0',
      openBottom: 'translate-y-0 -rotate-45',
      closedBottom: 'translate-y-[6px] rotate-0',
    },
    lg: {
      container: 'w-6 h-6',
      bar: 'w-6 h-0.5 top-[11px]',
      openTop: 'translate-y-0 rotate-45',
      closedTop: '-translate-y-[7px] rotate-0',
      openBottom: 'translate-y-0 -rotate-45',
      closedBottom: 'translate-y-[7px] rotate-0',
    },
  }[size]

  return (
    <div
      aria-hidden={ariaHidden}
      data-testid="animated-hamburger"
      className={`relative flex items-center justify-center shrink-0 pointer-events-none select-none transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] ${sizeConfig.container} ${className}`}
    >
      {/* Top Bar: slides down to center and rotates 45deg */}
      <span
        data-testid="hamburger-bar-top"
        className={`absolute left-0 rounded-full bg-current origin-center transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] motion-reduce:transition-none ${sizeConfig.bar} ${barClassName} ${
          isOpen ? sizeConfig.openTop : sizeConfig.closedTop
        }`}
      />

      {/* Middle Bar: smoothly scales to 0 and fades out */}
      <span
        data-testid="hamburger-bar-middle"
        className={`absolute left-0 rounded-full bg-current origin-center transition-all duration-200 ease-[cubic-bezier(0.2,1,0.3,1)] motion-reduce:transition-none ${sizeConfig.bar} ${barClassName} ${
          isOpen ? 'opacity-0 scale-x-0 pointer-events-none' : 'opacity-100 scale-x-100'
        }`}
      />

      {/* Bottom Bar: slides up to center and rotates -45deg */}
      <span
        data-testid="hamburger-bar-bottom"
        className={`absolute left-0 rounded-full bg-current origin-center transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] motion-reduce:transition-none ${sizeConfig.bar} ${barClassName} ${
          isOpen ? sizeConfig.openBottom : sizeConfig.closedBottom
        }`}
      />
    </div>
  )
}
