import React from 'react'

export interface IphoneSource {
  type?: string
  media?: string
  srcSet: string
}

export interface Iphone15ProProps {
  className?: string
  children?: React.ReactNode
  src?: string
  sources?: IphoneSource[]
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  width?: number | string
  height?: number | string
  imageWidth?: number
  imageHeight?: number
  sizes?: string
}

export const Iphone15Pro: React.FC<Iphone15ProProps> = ({
  className = '',
  children,
  src,
  sources,
  loading = 'lazy',
  fetchPriority = 'low',
  width,
  height,
  imageWidth,
  imageHeight,
  sizes,
}) => {
  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{
        aspectRatio: '393 / 852',
        ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
        maxWidth: '100%',
      }}
    >
      {/* Outer Titanium Chassis Frame */}
      <div className="relative w-full h-full rounded-[20px] sm:rounded-[36px] lg:rounded-[48px] p-1 sm:p-1.5 lg:p-[10px] bg-gradient-to-b from-[#323d42] via-[#1a2327] to-[#12181a] border-[1.5px] sm:border-[2px] border-[#3e4c52] shadow-[0_25px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,195,255,0.2)] flex flex-col overflow-hidden">
        
        {/* Inner Bezel Frame */}
        <div className="relative w-full h-full rounded-[16px] sm:rounded-[28px] lg:rounded-[38px] bg-[#060a0b] overflow-hidden border border-[#1b262a]">
          
          {/* Screen Content Viewport (Seamless top offset on tablet/desktop) */}
          <div className="relative w-full h-full overflow-hidden bg-[#060a0b] pt-0 sm:pt-3.5 lg:pt-5 flex flex-col">
            {children ? (
              children
            ) : src ? (
              <picture>
                {(sources ?? []).map((source) => (
                  <source
                    key={`${source.media ?? ''}:${source.srcSet}`}
                    type={source.type}
                    media={source.media}
                    srcSet={source.srcSet}
                  />
                ))}
                <img
                  src={src}
                  alt="iPhone 15 Pro preview"
                  className="w-full flex-1 object-fill object-top block"
                  loading={loading}
                  fetchPriority={fetchPriority}
                  decoding="async"
                  width={imageWidth}
                  height={imageHeight}
                  sizes={sizes}
                />
              </picture>
            ) : null}

            {/* Centered Floating Dynamic Island Pill (Hidden on mobile for ultra-clean screen visibility, scaled on tablet/desktop) */}
            <div className="hidden sm:flex absolute top-0 left-0 right-0 z-40 h-5 lg:h-6 items-center justify-center pointer-events-none select-none pt-1">
              <div className="scale-75 lg:scale-100 origin-top w-[72px] h-[16px] bg-black rounded-full border border-[#222a2e] flex items-center justify-between px-2 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a1215] border border-[#1b252a] flex items-center justify-center">
                  <span className="w-0.5 h-0.5 rounded-full bg-cyan-400/80 animate-pulse" />
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d1417] border border-[#1b252a]" />
              </div>
            </div>

            {/* Floating iOS Home Indicator Bar */}
            <div className="hidden sm:flex absolute bottom-1 left-0 right-0 h-3 items-center justify-center pointer-events-none z-40">
              <div className="w-16 lg:w-24 h-0.5 bg-gray-400/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Hardware Button Accents on Outer Chassis */}
        <div className="hidden sm:block absolute -left-[3px] top-28 w-[3px] h-10 bg-[#323d42] rounded-l-sm" />
        <div className="hidden sm:block absolute -left-[3px] top-42 w-[3px] h-12 bg-[#323d42] rounded-l-sm" />
        <div className="hidden sm:block absolute -left-[3px] top-58 w-[3px] h-12 bg-[#323d42] rounded-l-sm" />
        <div className="hidden sm:block absolute -right-[3px] top-36 w-[3px] h-16 bg-[#323d42] rounded-r-sm" />
      </div>
    </div>
  )
}
