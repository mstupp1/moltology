import React from 'react'
import { RollingNumber, HudStatBox } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Default = () => (
  <Deep>
    <RollingNumber value={1240} triggerOnView={false} duration={1} className="font-grotesk text-4xl font-bold text-[#00c3ff]" />
  </Deep>
)

export const PrefixSuffixDecimals = () => (
  <Deep>
    <div className="flex flex-col gap-2 font-grotesk text-2xl font-bold">
      <RollingNumber value={61.5} decimals={1} suffix="%" triggerOnView={false} duration={1} className="text-[#dfe3e3]" />
      <RollingNumber value={850} suffix=" Nm" triggerOnView={false} duration={1} className="text-[#ff453a]" />
      <RollingNumber value={500} prefix="+" suffix=" MC" triggerOnView={false} duration={1} className="text-[#10b981]" />
    </div>
  </Deep>
)

export const InStatBox = () => (
  <Deep>
    <HudStatBox className="w-64" label="Chitin Gems" value={<RollingNumber value={1240} triggerOnView={false} duration={1} />} trend="up" trendValue="+120" />
  </Deep>
)
