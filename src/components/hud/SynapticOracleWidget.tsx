import React from 'react'
import { BrainCircuit } from 'lucide-react'
import { AIChatPanel } from '../ai/AIChatPanel'
import { useSafeOracle } from './OracleContext'

export interface SynapticOracleWidgetProps {
  userId?: string | null
}

export const SynapticOracleWidget: React.FC<SynapticOracleWidgetProps> = ({ userId }) => {
  const oracle = useSafeOracle()

  // Local state fallback if used without provider
  const [localIsOpen, setLocalIsOpen] = React.useState(false)

  const isPopoutActive = oracle ? oracle.mode === 'popout' : localIsOpen

  const handleToggle = () => {
    if (oracle) {
      oracle.toggleMode('popout')
    } else {
      setLocalIsOpen((prev) => !prev)
    }
  }

  const handleClose = () => {
    if (oracle) {
      oracle.setMode('closed')
    } else {
      setLocalIsOpen(false)
    }
  }

  // Hide the floating button completely when sidebar drawer or dedicated page is active
  if (oracle?.mode === 'sidebar' || oracle?.mode === 'page') {
    return null
  }


  return (
    <div className="fixed bottom-3 right-3 sm:right-6 sm:bottom-4 z-40 font-mono max-w-[calc(100vw-1.5rem)]">
      {!isPopoutActive ? (
        <button
          onClick={handleToggle}
          className={`bg-[#0f1414]/95 text-cyan-400 border border-cyan-500/60 p-2.5 sm:p-3 shadow-xl shadow-cyan-950/80 hover:border-cyan-400 hover:scale-105 transition-all flex items-center space-x-2 chamfer-corner group ${
            isOtherModeActive ? 'opacity-80 border-cyan-700/40' : ''
          }`}
          title={isOtherModeActive ? `Oracle currently active in ${oracle.mode} mode` : 'Open Oracle AI Popout'}
        >
          <div className="relative">
            <BrainCircuit className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs tracking-wider text-cyan-300 font-bold">
            ORACLE AI
          </span>
          {isOtherModeActive && (
            <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1 py-0.2 uppercase">
              {oracle.mode}
            </span>
          )}
        </button>
      ) : (
        <div className="w-[calc(100vw-1.5rem)] sm:w-96 rounded-none overflow-hidden chamfer-corner-lg animate-in slide-in-from-bottom-5 duration-200 shadow-2xl shadow-cyan-950/90 border border-cyan-500/70">
          <AIChatPanel
            userId={userId}
            isCompact={true}
            onClose={handleClose}
            personaName="SYNAPTIC ORACLE v4.0"
            modelName="deepseek/deepseek-v4-flash-0731"
          />
        </div>
      )}
    </div>
  )
}
