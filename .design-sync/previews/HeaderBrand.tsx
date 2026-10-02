import React from 'react'
import { HeaderBrand } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Benthic = () => (<Deep><HeaderBrand /></Deep>)
export const SmallCustomSubtext = () => (<Deep><HeaderBrand logoSize="sm" subtext="Benthic Community" /></Deep>)
export const Collapsed = () => (<Deep><HeaderBrand isCollapsed /></Deep>)
export const Corporate = () => (
  <div className="bg-white p-6"><HeaderBrand variant="corporate" subtext="Press and partnerships" /></div>
)
