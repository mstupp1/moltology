import React, { useState } from 'react'
import { HudPagination } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Default = () => {
  const [p, setP] = useState(1)
  return <Deep><HudPagination currentPage={p} totalItems={86} pageSize={10} onPageChange={setP} itemName="threads" /></Deep>
}
export const MiddlePage = () => {
  const [p, setP] = useState(7)
  return <Deep><HudPagination currentPage={p} totalItems={240} pageSize={20} onPageChange={setP} itemName="dispatches" /></Deep>
}
export const WithoutCount = () => {
  const [p, setP] = useState(2)
  return <Deep><HudPagination currentPage={p} totalItems={45} pageSize={15} onPageChange={setP} showItemCount={false} /></Deep>
}
