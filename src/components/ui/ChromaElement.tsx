import React from 'react'

import '@/styles/crt.css'

export interface ChromaElementProps {
  src: string
  alt: string
  blendMode?: 'screen' | 'lighten' | 'color-dodge' | 'normal'
  glowColor?: 'cyan' | 'crimson' | 'gold' | 'none'
  className?: string
  containerClassName?: string
  pulse?: boolean
  hoverScale?: boolean
  maskRadial?: boolean
  terminalEffects?: boolean
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
  maskRadial = false,
  terminalEffects = true,
}) => {
  const glowStyles = {
    cyan: 'drop-shadow-[0_0_8px_rgba(0,195,255,0.45)]',
    crimson: 'drop-shadow-[0_0_8px_rgba(255,69,58,0.45)]',
    gold: 'drop-shadow-[0_0_8px_rgba(255,215,0,0.45)]',
    none: '',
  }[glowColor]

  const blendStyle: React.CSSProperties = {
    ...(blendMode === 'screen' ? { mixBlendMode: 'screen' } : {}),
    ...(blendMode === 'lighten' ? { mixBlendMode: 'lighten' } : {}),
    ...(blendMode === 'color-dodge' ? { mixBlendMode: 'color-dodge' } : {}),
    ...(maskRadial
      ? {
          WebkitMaskImage:
            'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 75%)',
          maskImage:
            'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 75%)',
        }
      : {}),
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden ${
        pulse ? 'animate-pulse' : ''
      } ${containerClassName}`}
    >
      {/* Background Glow */}
      {glowColor !== 'none' && (
        <div
          className={`absolute inset-0 rounded-2xl blur-md opacity-15 pointer-events-none ${
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

      {/* CRT Terminal Overlays: Static Scanlines */}
      {terminalEffects && (
        <div className="absolute inset-0 rounded-2xl crt-scanlines opacity-35 pointer-events-none z-20" />
      )}
    </div>
  )
}
