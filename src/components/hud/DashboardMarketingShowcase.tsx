import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Laptop,
  Smartphone,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { Safari } from '@/components/ui/magicui/safari'
import { Iphone15Pro } from '@/components/ui/magicui/iphone-15-pro'
import { BenthicCTAButton } from './BenthicCTAButton'
import { getAssetUrl } from '@/lib/assets'

export function DashboardMarketingShowcase() {
  const navigate = useNavigate()
  const [deviceTab, setDeviceTab] = useState<'both' | 'desktop' | 'mobile'>('both')

  const handleLaunchDemo = () => {
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="w-full relative z-20 my-8 sm:my-14" aria-label="Interactive System Showcase">
      {/* Centered Segmented Device Switcher */}
      <div className="flex items-center justify-center mb-6 sm:mb-8 px-2 font-sans">
        <div className="inline-flex items-center bg-[#070b0b] border border-[#3a4a49] p-1 rounded-full shadow-inner">
          {/* Dual View Option (Desktop/Tablet only) */}
          <button
            onClick={() => setDeviceTab('both')}
            className={`hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all rounded-full ${
              deviceTab === 'both'
                ? 'bg-[#00c3ff]/20 text-[#00ffff] border border-[#00c3ff]/50 shadow-hud-cyan-sm'
                : 'text-[#839493] hover:text-white'
            }`}
            title="Dual Device Layout"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>

          {/* Desktop Option */}
          <button
            onClick={() => setDeviceTab('desktop')}
            className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold transition-all rounded-full ${
              deviceTab === 'desktop'
                ? 'bg-[#00c3ff]/20 text-[#00ffff] border border-[#00c3ff]/50 shadow-hud-cyan-sm'
                : 'text-[#839493] hover:text-white'
            }`}
            title="Desktop HUD View"
            aria-label="Desktop"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          {/* Mobile Option */}
          <button
            onClick={() => setDeviceTab('mobile')}
            className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold transition-all rounded-full ${
              deviceTab === 'mobile'
                ? 'bg-[#00c3ff]/20 text-[#00ffff] border border-[#00c3ff]/50 shadow-hud-cyan-sm'
                : 'text-[#839493] hover:text-white'
            }`}
            title="Mobile App View"
            aria-label="Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Device Stage Container */}
      <div className="relative w-full mx-auto flex items-center justify-center">
        {/* Ambient Backlight Glow Layers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[380px] h-[380px] rounded-full bg-red-500/10 blur-[110px] pointer-events-none -z-10" />

        {/* ── 1. OPEN-SOURCE SAFARI / MACBOOK PRO MOCKUP (DESKTOP ANCHOR) ── */}
        <div
          className={`w-full transition-all duration-500 ${
            deviceTab === 'mobile' ? 'hidden' : 'block'
          } max-w-6xl`}
        >
          {/* Open-Source Magic UI Safari Window Frame with 100% True High-DPI Desktop Screenshot */}
          <Safari
            url="moltology.org/dashboard"
            src={getAssetUrl('/images/marketing/dashboard_desktop_preview.png')}
          />
        </div>

        {/* ── 2. OPEN-SOURCE IPHONE 15 PRO MOCKUP (MOBILE COMPANION) ── */}
        <div
          className={`transition-all duration-500 ${
            deviceTab === 'desktop'
              ? 'hidden'
              : deviceTab === 'mobile'
              ? 'w-full max-w-sm mx-auto flex justify-center'
              : 'hidden lg:block absolute -bottom-10 right-2 xl:-right-4 z-30 transform -rotate-2 hover:rotate-0 hover:scale-[1.03] transition-all duration-300 drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]'
          }`}
        >
          {/* Open-Source Magic UI iPhone 15 Pro Frame with 100% True High-DPI Mobile Screenshot */}
          <Iphone15Pro
            width={320}
            src={getAssetUrl('/images/marketing/dashboard_mobile_preview.png')}
          />
        </div>
      </div>

      {/* Big Centered Launch Demo CTA Button at the Bottom */}
      <div className="flex items-center justify-center mt-8 sm:mt-12 relative z-20">
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
