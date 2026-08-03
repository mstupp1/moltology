import React from 'react'
import { X, BrainCircuit, Maximize2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { AIChatPanel } from '../ai/AIChatPanel'

export interface AISidebarDrawerProps {
  isOpen: boolean
  onClose: () => void
  userId?: string | null
}

export const AISidebarDrawer: React.FC<AISidebarDrawerProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  if (!isOpen) return null

  return (
    <aside className="w-80 lg:w-96 bg-[#060a0a] border-l border-cyan-900/60 flex flex-col h-full z-30 shrink-0 animate-in slide-in-from-right duration-200 shadow-2xl shadow-cyan-950">
      <div className="bg-[#0b1010] p-2 border-b border-cyan-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          <span>ORACLE DOCK</span>
        </div>
        <div className="flex items-center space-x-1">
          <Link
            to="/oracle"
            className="p-1 text-gray-400 hover:text-cyan-300 transition-colors"
            title="Expand to Full Page"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            title="Close Drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChatPanel
          userId={userId}
          isCompact={false}
          onClose={onClose}
          personaName="SYNAPTIC ORACLE v4.0"
          modelName="deepseek/deepseek-v4-flash-0731"
          className="h-full border-none shadow-none"
        />
      </div>
    </aside>
  )
}
