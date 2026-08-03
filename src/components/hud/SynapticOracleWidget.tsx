import React, { useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { AIChatPanel } from '../ai/AIChatPanel'

export interface SynapticOracleWidgetProps {
  userId?: string | null
}

export const SynapticOracleWidget: React.FC<SynapticOracleWidgetProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-3 right-3 sm:right-6 sm:bottom-4 z-40 font-mono max-w-[calc(100vw-1.5rem)]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0f1414]/95 text-cyan-400 border border-cyan-500/60 p-2.5 sm:p-3 shadow-xl shadow-cyan-950/80 hover:border-cyan-400 hover:scale-105 transition-all flex items-center space-x-2 chamfer-corner group"
        >
          <div className="relative">
            <BrainCircuit className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs tracking-wider text-cyan-300 font-bold">
            ORACLE AI
          </span>
        </button>
      ) : (
        <div className="w-[calc(100vw-1.5rem)] sm:w-96 rounded-none overflow-hidden chamfer-corner-lg animate-in slide-in-from-bottom-5 duration-200 shadow-2xl shadow-cyan-950/90">
          <AIChatPanel
            userId={userId}
            isCompact={true}
            onClose={() => setIsOpen(false)}
            personaName="SYNAPTIC ORACLE v4.0"
            modelName="deepseek/deepseek-v4-flash-0731"
          />
        </div>
      )}
    </div>
  )
}
