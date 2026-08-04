import React from 'react'

export const MoltNationBannerBg: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      {/* Rippling Waves SVG for Silk Flag Texture */}
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Red & Blue Flag Gradients */}
          <linearGradient id="flagRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#991B1B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7F1D1D" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#450A0A" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="flagBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#1E40AF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="flagWhite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.05" />
          </linearGradient>

          {/* Ripple Wave Mask */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Flag Rippling Stripes Layer */}
        <g opacity="0.65">
          {/* Stripe 1 (Red) */}
          <path
            d="M 0,20 Q 300,5 600,30 T 1200,10 L 1200,50 Q 900,35 600,60 T 0,40 Z"
            fill="url(#flagRed)"
          />
          {/* Stripe 2 (White) */}
          <path
            d="M 0,40 Q 300,25 600,50 T 1200,30 L 1200,70 Q 900,55 600,80 T 0,60 Z"
            fill="url(#flagWhite)"
          />
          {/* Stripe 3 (Red) */}
          <path
            d="M 0,60 Q 300,45 600,70 T 1200,50 L 1200,90 Q 900,75 600,100 T 0,80 Z"
            fill="url(#flagRed)"
          />
          {/* Stripe 4 (White) */}
          <path
            d="M 0,80 Q 300,65 600,90 T 1200,70 L 1200,110 Q 900,95 600,120 T 0,100 Z"
            fill="url(#flagWhite)"
          />
          {/* Stripe 5 (Red) */}
          <path
            d="M 0,100 Q 300,85 600,110 T 1200,90 L 1200,130 Q 900,115 600,140 T 0,120 Z"
            fill="url(#flagRed)"
          />
          {/* Stripe 6 (White) */}
          <path
            d="M 0,120 Q 300,105 600,130 T 1200,110 L 1200,150 Q 900,135 600,160 T 0,140 Z"
            fill="url(#flagWhite)"
          />
          {/* Stripe 7 (Red) */}
          <path
            d="M 0,140 Q 300,125 600,150 T 1200,130 L 1200,170 Q 900,155 600,180 T 0,160 Z"
            fill="url(#flagRed)"
          />
          {/* Stripe 8 (White) */}
          <path
            d="M 0,160 Q 300,145 600,170 T 1200,150 L 1200,190 Q 900,175 600,200 T 0,180 Z"
            fill="url(#flagWhite)"
          />
          {/* Stripe 9 (Red) */}
          <path
            d="M 0,180 Q 300,165 600,190 T 1200,170 L 1200,210 Q 900,195 600,220 T 0,200 Z"
            fill="url(#flagRed)"
          />
        </g>

        {/* Flag Canton Star Field (Left Side Fade) */}
        <path
          d="M 0,0 L 450,0 C 420,60 400,120 380,180 L 0,170 Z"
          fill="url(#flagBlue)"
        />

        {/* Star Grid in Canton */}
        <g fill="#FFFFFF" opacity="0.6" filter="url(#glow)">
          <circle cx="50" cy="30" r="3" />
          <circle cx="110" cy="30" r="3" />
          <circle cx="170" cy="30" r="3" />
          <circle cx="230" cy="30" r="3" />
          <circle cx="290" cy="30" r="3" />

          <circle cx="80" cy="65" r="3" />
          <circle cx="140" cy="65" r="3" />
          <circle cx="200" cy="65" r="3" />
          <circle cx="260" cy="65" r="3" />

          <circle cx="50" cy="100" r="3" />
          <circle cx="110" cy="100" r="3" />
          <circle cx="170" cy="100" r="3" />
          <circle cx="230" cy="100" r="3" />

          <circle cx="80" cy="135" r="3" />
          <circle cx="140" cy="135" r="3" />
          <circle cx="200" cy="135" r="3" />
        </g>
      </svg>

      {/* Dark Vignette Overlay for Center Contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,#030608_85%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030608] via-transparent to-[#030608] opacity-80" />
    </div>
  )
}
