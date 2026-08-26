import React from 'react'

export interface LobsterAvatarDisplayProps {
  src: string
  alt?: string
  containerClassName?: string
  className?: string
  maskRadial?: boolean
  pixelated?: boolean
}

/** Clean character avatar display — renders transparent SVG with character-masked pixel grid & drop shadow */
export const LobsterAvatarDisplay: React.FC<LobsterAvatarDisplayProps> = ({
  src,
  alt = 'Your avatar',
  containerClassName = '',
  className = 'w-full h-full object-contain',
  pixelated = true,
}) => {
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url("${src}")`,
    maskImage: `url("${src}")`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }

  return (
    <div className={`relative flex items-center justify-center ${containerClassName}`}>
      {/* 1. Base transparent mascot image with crisp pixelated rendering */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,195,255,0.25)] transition-transform duration-300 [image-rendering:pixelated] ${className}`}
      />

      {/* 2. Cyber Pixel Grid masked strictly to the character silhouette */}
      {pixelated && (
        <div
          className="absolute inset-0 crt-pixel-grid opacity-45 pointer-events-none z-20"
          style={maskStyle}
        />
      )}
    </div>
  )
}
