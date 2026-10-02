import React from 'react'
import { HUDPageLoader } from '@moltology/hud'

export const FullScreen = () => (
  <div className="relative bg-[#030708]" style={{ height: 360, transform: 'translateZ(0)' }}>
    <div className="p-6 text-[#839493] text-xs font-sans">Page content behind the loader</div>
    <HUDPageLoader />
  </div>
)
