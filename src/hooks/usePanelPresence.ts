import { useEffect, useState } from 'react'

/** Retain closing panels, and cancel pending exits when they reopen. */
export function usePanelPresence(open: boolean, duration = 200) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let timer: ReturnType<typeof setTimeout>
    if (open) {
      setMounted(true)
      timer = setTimeout(() => setVisible(true), reduced ? 0 : 20)
    } else {
      setVisible(false)
      timer = setTimeout(() => setMounted(false), reduced ? 0 : duration)
    }
    return () => clearTimeout(timer)
  }, [open, duration])
  return { mounted, visible: open && visible }
}
