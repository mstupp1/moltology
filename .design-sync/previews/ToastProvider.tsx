import React, { useEffect } from 'react'
import { ToastProvider, useToast, HudButton } from '@moltology/hud'

const Fire = () => {
  const { toast } = useToast()
  useEffect(() => {
    toast.success('Profile saved.', { duration: 0 })
    toast.info('Link copied to clipboard.', { duration: 0 })
    toast.warning('You have 2 drafts that are not posted yet.', { duration: 0 })
    toast.error('Could not save username. Please try again.', { duration: 0 })
    toast.hud('Clearance S2 reached: Privacy Shield.', { title: 'Clearance unlocked', duration: 0 })
  }, [])
  return <HudButton variant="dark" onClick={() => toast.success('Profile saved.')}>Show a toast</HudButton>
}

export const AllTypes = () => (
  <div className="bg-[#030708] p-6 flex items-end" style={{ height: 460, transform: 'translateZ(0)' }}>
    <ToastProvider><Fire /></ToastProvider>
  </div>
)
