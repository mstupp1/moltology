import React, { Component, ErrorInfo, ReactNode, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronRight, RefreshCw, ShieldAlert, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class HUDErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[HUD Error Boundary caught error]:', error, errorInfo)
  }

  public resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <HUDErrorFallback error={this.state.error} reset={this.resetErrorBoundary} />
    }

    return this.props.children
  }
}

export function HUDErrorFallback({
  error,
  reset,
}: {
  error?: Error | unknown
  reset?: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const errorMessage = error instanceof Error ? error.message : String(error || 'An unexpected quantum anomaly occurred in the benthic core.')
  const errorStack = error instanceof Error ? error.stack : undefined

  const handleReset = () => {
    if (reset) {
      reset()
    } else if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[450px] w-full flex items-center justify-center p-4 sm:p-8 bg-[#030708] font-mono text-[#dfe3e3] relative overflow-hidden select-none">
      {/* Sacred Grid Overlay */}
      <div className="absolute inset-0 bg-sacred-grid opacity-30 z-0 pointer-events-none" />
      {/* Ambient Red Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,69,58,0.15),transparent_70%)] z-0 pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full chitin-card p-6 sm:p-8 border-[#ff453a]/50 shadow-[0_0_40px_rgba(255,69,58,0.2)] rounded-lg bg-[#070c0e]/90 backdrop-blur-md">
        {/* Header HUD Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ff453a]/30 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff453a] animate-ping" />
            <span className="text-xs font-mono tracking-widest text-[#ff453a] uppercase font-bold">
              [CRITICAL ANOMALOUS OVERFLOW]
            </span>
          </div>
          <span className="text-[10px] text-[#607070] font-mono tracking-wider">
            ERR_CODE: 0x88F9A
          </span>
        </div>

        {/* Hero Alert Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/30 shrink-0">
            <ShieldAlert className="w-8 h-8 text-[#ff453a]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#ffffff] tracking-wide mb-1 font-sans">
              SYNAPTIC LINK CORRUPTED
            </h2>
            <p className="text-xs text-[#90a0a0] leading-relaxed">
              The execution thread encountered an unhandled exception. Benthic containment active.
            </p>
          </div>
        </div>

        {/* Error Message Box */}
        <div className="p-4 mb-6 rounded bg-[#030606] border border-[#ff453a]/30 text-xs text-[#ff6b61] font-mono leading-relaxed break-words flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ff453a]" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[#ff453a]">EXCEPTION DETAILS: </span>
            {errorMessage}
          </div>
        </div>

        {/* Collapsible Telemetry / Stack Trace */}
        {errorStack && (
          <div className="mb-6 border border-[#3a4a49]/40 rounded overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 bg-[#0a1214] text-xs text-[#90a0a0] hover:text-[#00c3ff] transition-colors"
            >
              <span className="flex items-center gap-2 font-mono uppercase tracking-wider">
                {showDetails ? <ChevronDown className="w-4 h-4 text-[#00c3ff]" /> : <ChevronRight className="w-4 h-4" />}
                INSPECT TELEMETRY DUMP
              </span>
              <span className="text-[10px] text-[#506060]">STACK TRACE</span>
            </button>
            {showDetails && (
              <pre className="p-4 bg-[#020405] text-[11px] text-[#00c3ff]/80 font-mono overflow-x-auto max-h-48 border-t border-[#3a4a49]/40 whitespace-pre-wrap leading-relaxed select-text">
                {errorStack}
              </pre>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#ff453a]/15 hover:bg-[#ff453a]/25 text-[#ff453a] border border-[#ff453a]/40 hover:border-[#ff453a] transition-all text-xs font-mono tracking-wider font-semibold shadow-lg hover:shadow-[0_0_15px_rgba(255,69,58,0.3)]"
          >
            <RefreshCw className="w-4 h-4" />
            REINITIALIZE CORE
          </button>
          <a
            href="/"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#00c3ff]/10 hover:bg-[#00c3ff]/20 text-[#00c3ff] border border-[#00c3ff]/30 hover:border-[#00c3ff] transition-all text-xs font-mono tracking-wider font-semibold"
          >
            <Home className="w-4 h-4" />
            RETURN TO NEURAL HUB
          </a>
        </div>
      </div>
    </div>
  )
}
