import React, { useState } from 'react'
import { HudBottomSheet, HudButton, HudInput } from '@moltology/hud'

export const Open = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-[#030708] p-6" style={{ height: 520 }}>
      <HudButton onClick={() => setOpen(true)}>Log a shed</HudButton>
      <HudBottomSheet isOpen={open} onClose={() => setOpen(false)} title="Log a shed">
        <div className="flex flex-col gap-4 p-5">
          <p className="text-xs text-[#b7c2c1]">What did you let go of today? One line is enough.</p>
          <HudInput label="What you shed" placeholder="Unsubscribed from three newsletters" fullWidth />
          <HudButton fullWidth onClick={() => setOpen(false)}>Save shed</HudButton>
        </div>
      </HudBottomSheet>
    </div>
  )
}
