import React from 'react'

export interface ChromaElementProps {
  src: string
  alt: string
  blendMode?: 'screen' | 'lighten' | 'color-dodge' | 'normal'
  glowColor?: 'cyan' | 'crimson' | 'gold' | 'none'
  className?: string
  containerClassName?: string
  pulse?: boolean
  hoverScale?: boolean
}

export const ChromaElement: React.FC<ChromaElementProps> = ({
  src,
  alt,
  blendMode = 'screen',
  glowColor = 'cyan',
  className = '',
  containerClassName = '',
  pulse = false,
  hoverScale = true,
}) => {
  const glowStyles = {
    cyan: 'drop-shadow-[0_0_12px_rgba(0,195,255,0.7)]',
    crimson: 'drop-shadow-[0_0_12px_rgba(255,69,58,0.7)]',
    gold: 'drop-shadow-[0_0_12px_rgba(255,215,0,0.7)]',
    none: '',
  }[glowColor]

  const blendStyle = {
    screen: { mixBlendMode: 'screen' as const },
    lighten: { mixBlendMode: 'lighten' as const },
    'color-dodge': { mixBlendMode: 'color-dodge' as const },
    normal: {},
  }[blendMode]

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden ${
        pulse ? 'animate-pulse' : ''
      } ${containerClassName}`}
    >
      {/* Background Radial Glow */}
      {glowColor !== 'none' && (
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none ${
            glowColor === 'cyan'
              ? 'bg-[#00c3ff]'
              : glowColor === 'crimson'
              ? 'bg-[#ff453a]'
              : 'bg-[#ffd700]'
          }`}
        />
      )}

      {/* Chroma Keyed 3D Image */}
      <img
        src={src}
        alt={alt}
        style={blendStyle}
        className={`w-full h-full object-contain relative z-10 transition-transform duration-300 ${
          hoverScale ? 'hover:scale-105' : ''
        } ${glowStyles} ${className}`}
      />
    </div>
  )
}
