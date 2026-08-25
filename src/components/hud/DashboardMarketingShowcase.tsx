import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Cpu, ArrowRight } from 'lucide-react'
import { Safari } from '@/components/ui/magicui/safari'
import { Iphone15Pro } from '@/components/ui/magicui/iphone-15-pro'
import { BenthicCTAButton } from './BenthicCTAButton'
import { getAssetUrl } from '@/lib/assets'

export function DashboardMarketingShowcase() {
  const navigate = useNavigate()

  const handleLaunchDemo = () => {
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="w-full relative z-20 my-8 sm:my-14" aria-label="Interactive System Showcase">
      {/* Main Multi-Device Stage Container */}
      <div className="relative w-full max-w-6xl mx-auto flex items-center justify-center">
        {/* Ambient Backlight Glow Layers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[380px] h-[380px] rounded-full bg-red-500/10 blur-[110px] pointer-events-none -z-10" />

        {/* ── 1. OPEN-SOURCE SAFARI / MACBOOK PRO MOCKUP (DESKTOP ANCHOR) ── */}
        <div className="w-full">
          {/* Open-Source Magic UI Safari Window Frame with 100% True High-DPI Desktop Screenshot */}
          <Safari
            url="moltology.org/dashboard"
            src={getAssetUrl('/images/marketing/dashboard_desktop_preview.webp')}
            sources={[
              {
                type: 'image/webp',
                media: '(max-width: 767px)',
                srcSet: getAssetUrl('/images/marketing/dashboard_desktop_preview_sm.webp'),
              },
              {
                type: 'image/webp',
                media: '(min-width: 768px)',
                srcSet: getAssetUrl('/images/marketing/dashboard_desktop_preview.webp'),
              },
            ]}
            loading="lazy"
            fetchPriority="low"
            width={1760}
            height={1100}
            sizes="(max-width: 767px) 100vw, 1152px"
          />
        </div>

        {/* ── 2. OPEN-SOURCE IPHONE 15 PRO MOCKUP (MOBILE COMPANION - Scaled on both mobile & desktop) ── */}
        <div className="absolute -bottom-3 sm:-bottom-6 lg:-bottom-10 right-1 sm:right-2 md:right-4 xl:-right-4 z-30 transform -rotate-2 hover:rotate-0 hover:scale-[1.03] transition-all duration-300 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] sm:drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]">
          {/* Open-Source Magic UI iPhone 15 Pro Frame with 100% True High-DPI Mobile Screenshot */}
          <Iphone15Pro
            className="w-[88px] min-[370px]:w-[105px] min-[440px]:w-[130px] sm:w-[180px] md:w-[230px] lg:w-[280px] xl:w-[320px]"
            src={getAssetUrl('/images/marketing/dashboard_mobile_preview.webp')}
            sources={[
              {
                type: 'image/webp',
                media: '(max-width: 767px)',
                srcSet: getAssetUrl('/images/marketing/dashboard_mobile_preview_sm.webp'),
              },
              {
                type: 'image/webp',
                media: '(min-width: 768px)',
                srcSet: getAssetUrl('/images/marketing/dashboard_mobile_preview.webp'),
              },
            ]}
            loading="lazy"
            fetchPriority="low"
            imageWidth={540}
            imageHeight={1170}
            sizes="(max-width: 640px) 130px, 320px"
          />
        </div>
      </div>

      {/* Big Centered Launch Demo CTA Button at the Bottom */}
      <div className="flex items-center justify-center mt-8 sm:mt-12 lg:mt-14 relative z-20">
        <BenthicCTAButton
          size="lg"
          variant="cyan"
          className="px-8 sm:px-12 py-4 sm:py-5 min-h-[54px] sm:min-h-[60px] text-sm sm:text-base font-grotesk font-bold tracking-widest shadow-hud-cyan-lg"
          onClick={handleLaunchDemo}
        >
          <span className="flex items-center justify-center gap-3 leading-none">
            <Cpu className="w-5 h-5 shrink-0" />
            <span>LAUNCH GUEST DEMO</span>
            <ArrowRight className="w-5 h-5 shrink-0" />
          </span>
        </BenthicCTAButton>
      </div>
    </div>
  )
}
