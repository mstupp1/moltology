import React from 'react'
import { AIChatPanel } from '../ai/AIChatPanel'
import { useSafeOracle } from './OracleContext'

export interface AISidebarDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  userId?: string | null
}

export const AISidebarDrawer: React.FC<AISidebarDrawerProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  userId,
}) => {
  const oracle = useSafeOracle()

  const isVisible = oracle ? oracle.mode === 'sidebar' : Boolean(propIsOpen)

  if (!isVisible) return null

  const handleClose = () => {
    if (oracle) {
      oracle.setMode('closed')
    }
    if (propOnClose) {
      propOnClose()
    }
  }

  return (
    <aside className="w-80 lg:w-96 bg-[#060a0a]/95 backdrop-blur-md border-l border-cyan-900/60 flex flex-col h-full z-30 shrink-0 animate-in slide-in-from-right duration-200 shadow-2xl shadow-cyan-950/90 font-mono">
      <div className="flex-1 overflow-hidden">
        <AIChatPanel
          userId={userId}
          isCompact={false}
          onClose={handleClose}
          personaName="SYNAPTIC ORACLE"
          className="h-full border-none shadow-none"
        />
      </div>
    </aside>
  )
}
