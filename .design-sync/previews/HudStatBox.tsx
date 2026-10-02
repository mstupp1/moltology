import React from 'react'
import { HudStatBox } from '@moltology/hud'
import { Gem, Shield, Waves } from 'lucide-react'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Default = () => (
  <Deep>
    <HudStatBox className="w-64" label="Shell Hardness" value="61%" subtext="Stage 3 · Exoshell Born" trend="up" trendValue="+4% this week" icon={<Shield size={14} />} />
  </Deep>
)

export const Variants = () => (
  <Deep>
    <div className="grid grid-cols-3 gap-3 w-[640px]">
      <HudStatBox variant="cyan" label="Chitin Gems" value="1,240" icon={<Gem size={14} />} trend="up" trendValue="+120" />
      <HudStatBox variant="crimson" label="Streak at risk" value="2 days" trend="down" trendValue="-1" />
      <HudStatBox variant="neutral" label="Abyssal Depth" value="42m" icon={<Waves size={14} />} trend="neutral" trendValue="steady" />
    </div>
  </Deep>
)

export const CornerBracketsTextured = () => (
  <Deep>
    <HudStatBox className="w-64" label="Pincer Torque" value="850 Nm" texture="carbon" showCornerBrackets subtext="Clearance E2 · Hydraulic Grip" />
  </Deep>
)
